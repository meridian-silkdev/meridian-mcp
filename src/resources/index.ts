import type { MeridianConfig } from "../config.js";
import { apiHeaders, hasApiConfig } from "../config.js";

/**
 * MCP Resources: expose Meridian catalog as readable resources.
 * Clients can list/read these without calling a tool.
 */
export const resourceDefinitions = [
  {
    uri: "meridian://services",
    name: "Service catalog",
    description: "All Meridian services and their form configs",
    mimeType: "application/json",
    handler: async (config: MeridianConfig) => {
      if (!hasApiConfig(config)) return JSON.stringify({ note: "Set MERIDIAN_API_URL + MERIDIAN_API_KEY for live data" }, null, 2);
      const res = await fetch(`${config.MERIDIAN_API_URL}/api/services`, { headers: apiHeaders(config) });
      return await res.text();
    },
  },
  {
    uri: "meridian://workflow",
    name: "Workflow definition",
    description: "Meridian's DEFAULT_WORKFLOW_STEPS backbone and phase diagram",
    mimeType: "application/json",
    handler: async () => JSON.stringify(
      {
        phases: ["DRAFT", "REQUIREMENTS", "ADMIN_VALIDATION", "PROVIDER_ACCEPTANCE", "QUOTE", "PAYMENT", "DELIVERY", "FULFILLMENT", "COMPLETED", "DISPUTED", "CANCELLED"],
        backbone: ["requirements (REQUIREMENTS/CUSTOMER)", "admin_validation (ADMIN_VALIDATION/ADMIN)", "provider_acceptance (PROVIDER_ACCEPTANCE/PROVIDER)", "quote (QUOTE/ADMIN)", "payment (PAYMENT/CUSTOMER)", "delivery:* (DELIVERY/PROVIDER varying per service)", "fulfillment", "completed"],
        note: "Status is derived from currentStepId → RequestStep.phase. Steps after provider_acceptance are engagement-scoped and must be reset on cancellation/quote-rejection — see workflow.ts reset helpers.",
      },
      null, 2
    ),
  },
];
