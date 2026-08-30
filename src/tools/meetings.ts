import type { MeridianConfig } from "../config.js";
import { apiHeaders, hasApiConfig } from "../config.js";

export const meetingTools = [
  {
    name: "list_meetings",
    description: "List meetings. Filter by serviceRequestId, status, or participant userId. Meetings are created with a fixed title/time/duration and explicit invites (customer/provider/both).",
    inputSchema: {
      type: "object" as const,
      properties: {
        serviceRequestId: { type: "string" },
        status: { type: "string", description: "SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED" },
      },
    },
    handler: async (args: Record<string, unknown>, config: MeridianConfig) => {
      if (!hasApiConfig(config)) return placeholder("list_meetings", "GET /api/meetings");
      const p = new URLSearchParams();
      if (args.serviceRequestId) p.set("serviceRequestId", String(args.serviceRequestId));
      if (args.status) p.set("status", String(args.status));
      const res = await fetch(`${config.MERIDIAN_API_URL}/api/meetings?${p}`, { headers: apiHeaders(config) });
      return dump(res);
    },
  },
  {
    name: "create_meeting",
    description: "Create a meeting with title, scheduledAt (ISO), duration minutes, optional serviceRequestId, and invite selection (customer/provider). Creates Teams meeting via Graph and sends invites immediately.",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: { type: "string" },
        scheduledAt: { type: "string", description: "ISO 8601 datetime" },
        duration: { type: "number", description: "Minutes" },
        serviceRequestId: { type: "string" },
        inviteCustomer: { type: "boolean" },
        inviteProvider: { type: "boolean" },
        description: { type: "string" },
      },
      required: ["title", "scheduledAt", "duration"],
    },
    handler: async (args: Record<string, unknown>, config: MeridianConfig) => {
      if (!hasApiConfig(config)) return placeholder("create_meeting", "POST /api/meetings");
      const res = await fetch(`${config.MERIDIAN_API_URL}/api/meetings`, {
        method: "POST",
        headers: apiHeaders(config),
        body: JSON.stringify(args),
      });
      return dump(res);
    },
  },
  {
    name: "respond_to_meeting",
    description: "Record RSVP for a meeting (ACCEPTED/DECLINED/PENDING). Declining records your answer but does NOT cancel the meeting.",
    inputSchema: {
      type: "object" as const,
      properties: {
        meetingId: { type: "string" },
        response: { type: "string", enum: ["ACCEPTED", "DECLINED", "PENDING"] },
      },
      required: ["meetingId", "response"],
    },
    handler: async (args: Record<string, unknown>, config: MeridianConfig) => {
      if (!hasApiConfig(config)) return placeholder("respond_to_meeting", "PATCH /api/meetings/:id/response");
      const res = await fetch(`${config.MERIDIAN_API_URL}/api/meetings/${encodeURIComponent(String(args.meetingId))}/response`, {
        method: "PATCH",
        headers: apiHeaders(config),
        body: JSON.stringify({ response: args.response }),
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
function placeholder(t: string, h: string) {
  return { content: [{ type: "text" as const, text: `[${t}] No live API configured. ${h}. Set MERIDIAN_API_URL + MERIDIAN_API_KEY.` }] };
}
