import type { MeridianConfig } from "../config.js";
import { apiHeaders, hasApiConfig } from "../config.js";

export const workflowTools = [
  {
    name: "get_workflow_status",
    description: "Get the workflow state for a request: current phase, current step, and all requestSteps with status (PENDING/IN_PROGRESS/COMPLETED). Status is derived from currentStepId → phase.",
    inputSchema: {
      type: "object" as const,
      properties: { requestId: { type: "string", description: "ServiceRequest id" } },
      required: ["requestId"],
    },
    handler: async (args: Record<string, unknown>, config: MeridianConfig) => {
      if (!hasApiConfig(config)) return placeholder("get_workflow_status", "GET /api/requests/:id/steps");
      const res = await fetch(`${config.MERIDIAN_API_URL}/api/requests/${encodeURIComponent(String(args.requestId))}/steps`, { headers: apiHeaders(config) });
      return dump(res);
    },
  },
  {
    name: "advance_step",
    description: "Advance the current step for a request to the next step (completes current step and moves currentStepId). Validates phase transitions.",
    inputSchema: {
      type: "object" as const,
      properties: {
        requestId: { type: "string" },
        stepId: { type: "string", description: "Optional: specific step id to complete (defaults to current step)" },
      },
      required: ["requestId"],
    },
    handler: async (args: Record<string, unknown>, config: MeridianConfig) => {
      if (!hasApiConfig(config)) return placeholder("advance_step", "POST /api/requests/:id/steps/advance");
      const res = await fetch(`${config.MERIDIAN_API_URL}/api/requests/${encodeURIComponent(String(args.requestId))}/steps/advance`, {
        method: "POST",
        headers: apiHeaders(config),
        body: JSON.stringify({ stepId: args.stepId }),
      });
      return dump(res);
    },
  },
  {
    name: "list_request_steps",
    description: "List all RequestSteps for a request in order, including key, phase, assignedTo, stepType, status, startedAt, completedAt.",
    inputSchema: {
      type: "object" as const,
      properties: { requestId: { type: "string" } },
      required: ["requestId"],
    },
    handler: async (args: Record<string, unknown>, config: MeridianConfig) => {
      if (!hasApiConfig(config)) return placeholder("list_request_steps", "GET /api/requests/:id/steps");
      const res = await fetch(`${config.MERIDIAN_API_URL}/api/requests/${encodeURIComponent(String(args.requestId))}/steps`, { headers: apiHeaders(config) });
      return dump(res);
    },
  },
];

async function dump(res: Response) {
  const text = await res.text();
  try { return { content: [{ type: "text" as const, text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
  catch { return { content: [{ type: "text" as const, text: `HTTP ${res.status}: ${text}` }] }; }
}
function placeholder(t: string, h: string) {
  return { content: [{ type: "text" as const, text: `[${t}] No live API configured. ${h}. Set MERIDIAN_API_URL + MERIDIAN_API_KEY.` }] };
}
