import type { MeridianConfig } from "../config.js";
import { apiHeaders, hasApiConfig } from "../config.js";

export const serviceRequestTools = [
  {
    name: "list_service_requests",
    description: "List service requests. Filter by status (DRAFT, REQUIREMENTS, ADMIN_VALIDATION, PROVIDER_ACCEPTANCE, QUOTE, PAYMENT, DELIVERY, FULFILLMENT, COMPLETED, DISPUTED, CANCELLED), customerId, providerId.",
    inputSchema: {
      type: "object" as const,
      properties: {
        status: { type: "string", description: "ServiceRequestStatus filter" },
        customerId: { type: "string" },
        providerId: { type: "string" },
        limit: { type: "number", description: "Max results (default 20)" },
      },
    },
    handler: async (args: Record<string, unknown>, config: MeridianConfig) => {
      if (!hasApiConfig(config)) return placeholder("list_service_requests", "GET /api/requests");
      const p = new URLSearchParams();
      if (args.status) p.set("status", String(args.status));
      if (args.customerId) p.set("customerId", String(args.customerId));
      if (args.providerId) p.set("providerId", String(args.providerId));
      if (args.limit) p.set("limit", String(args.limit));
      const res = await fetch(`${config.MERIDIAN_API_URL}/api/requests?${p}`, { headers: apiHeaders(config) });
      return dump(res);
    },
  },
  {
    name: "get_service_request",
    description: "Get a single service request by id, including current step, phase, and requestSteps.",
    inputSchema: {
      type: "object" as const,
      properties: { id: { type: "string", description: "ServiceRequest id" } },
      required: ["id"],
    },
    handler: async (args: Record<string, unknown>, config: MeridianConfig) => {
      if (!hasApiConfig(config)) return placeholder("get_service_request", "GET /api/requests/:id");
      const res = await fetch(`${config.MERIDIAN_API_URL}/api/requests/${encodeURIComponent(String(args.id))}`, { headers: apiHeaders(config) });
      return dump(res);
    },
  },
  {
    name: "create_service_request",
    description: "Create a new service request. Needs serviceId (or slug) and answers matching the service formConfig.",
    inputSchema: {
      type: "object" as const,
      properties: {
        serviceId: { type: "string", description: "Service id or slug" },
        answers: { type: "object", description: "Form answers keyed by field name" },
        customTitle: { type: "string", description: "Optional custom title for ad-hoc requests" },
      },
      required: ["serviceId"],
    },
    handler: async (args: Record<string, unknown>, config: MeridianConfig) => {
      if (!hasApiConfig(config)) return placeholder("create_service_request", "POST /api/requests");
      const res = await fetch(`${config.MERIDIAN_API_URL}/api/requests`, {
        method: "POST",
        headers: apiHeaders(config),
        body: JSON.stringify({ serviceId: args.serviceId, answers: args.answers ?? {}, customTitle: args.customTitle }),
      });
      return dump(res);
    },
  },
  {
    name: "update_request_status",
    description: "Advance or set a request's status. Prefer advance_step for workflow transitions. Use only when you know the target phase is valid.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "ServiceRequest id" },
        status: { type: "string", description: "Target ServiceRequestStatus" },
        reason: { type: "string", description: "Optional reason/note" },
      },
      required: ["id", "status"],
    },
    handler: async (args: Record<string, unknown>, config: MeridianConfig) => {
      if (!hasApiConfig(config)) return placeholder("update_request_status", "PATCH /api/requests/:id/status");
      const res = await fetch(`${config.MERIDIAN_API_URL}/api/requests/${encodeURIComponent(String(args.id))}/status`, {
        method: "PATCH",
        headers: apiHeaders(config),
        body: JSON.stringify({ status: args.status, reason: args.reason }),
      });
      return dump(res);
    },
  },
];

async function dump(res: Response) {
  const text = await res.text();
  try { return { content: [{ type: "text" as const, text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
  catch { return { content: [{ type: "text" as const, text: `HTTP ${res.status}: ${text}` }] }; }
}
function placeholder(tool: string, hint: string) {
  return { content: [{ type: "text" as const, text: `[${tool}] No live API configured. ${hint}. Set MERIDIAN_API_URL + MERIDIAN_API_KEY.` }] };
}
