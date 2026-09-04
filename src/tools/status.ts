import type { MeridianConfig } from "../config.js";
import { hasApiConfig } from "../config.js";

/**
 * Client-agnostic connectivity/status tool. Kept in the MCP server (not a
 * pi-only extension) so it works identically in Claude Code, Codex, Claude
 * Desktop, pi, or any other MCP client — no host-specific code required.
 */
export const statusTools = [
  {
    name: "meridian_status",
    description: "Check Meridian API connectivity (MERIDIAN_API_URL + MERIDIAN_API_KEY) and list available tools/resources. No params.",
    inputSchema: { type: "object" as const, properties: {} },
    handler: async (_args: Record<string, unknown>, config: MeridianConfig) => {
      const key = config.MERIDIAN_API_KEY ?? "";
      const masked = key ? `${key.slice(0, 6)}…${key.slice(-4)}` : "(not set)";
      const configured = hasApiConfig(config);
      const lines = [
        `Meridian API: ${config.MERIDIAN_API_URL}`,
        `API key: ${masked}${key ? (key.startsWith("mrd_") ? " (mrd_ ✓)" : " (unexpected prefix — expected mrd_...)") : " — set MERIDIAN_API_KEY to enable live calls"}`,
        `Mode: ${configured ? "live" : "dry-run (tools return placeholder hints)"}`,
        "",
        "Tools: list_services, get_service, list_categories, list_service_requests, get_service_request,",
        "  create_service_request, update_request_status, get_workflow_status, advance_step, list_request_steps,",
        "  get_payment_status, verify_payment, list_meetings, create_meeting, respond_to_meeting.",
        "Resources: meridian://services, meridian://workflow.",
      ];
      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    },
  },
];
