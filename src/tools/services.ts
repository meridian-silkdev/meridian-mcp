import type { MeridianConfig } from "../config.js";
import { apiHeaders, hasApiConfig } from "../config.js";

export const serviceTools = [
  {
    name: "list_services",
    description: "List Meridian services. Filter by category slug, active flag, or country code (e.g. TN, FR, PT).",
    inputSchema: {
      type: "object" as const,
      properties: {
        categorySlug: { type: "string", description: "Filter by category slug" },
        isActive: { type: "boolean", description: "Only active services" },
        countryCode: { type: "string", description: "ISO 3166-1 alpha-2, e.g. TN" },
      },
    },
    handler: async (args: Record<string, unknown>, config: MeridianConfig) => {
      if (!hasApiConfig(config)) {
        return placeholder("list_services", "Set MERIDIAN_API_URL + MERIDIAN_API_KEY to query live services. Expected endpoint: GET /api/services");
      }
      const params = new URLSearchParams();
      if (args.categorySlug) params.set("category", String(args.categorySlug));
      if (args.countryCode) params.set("country", String(args.countryCode));
      if (args.isActive !== undefined) params.set("isActive", String(args.isActive));
      const url = `${config.MERIDIAN_API_URL}/api/services?${params}`;
      const res = await fetch(url, { headers: apiHeaders(config) });
      return jsonOrText(res);
    },
  },
  {
    name: "get_service",
    description: "Get a single Meridian service by id or slug, including formConfig and delivery steps.",
    inputSchema: {
      type: "object" as const,
      properties: {
        idOrSlug: { type: "string", description: "Service id or slug" },
      },
      required: ["idOrSlug"],
    },
    handler: async (args: Record<string, unknown>, config: MeridianConfig) => {
      if (!hasApiConfig(config)) return placeholder("get_service", "GET /api/services/:idOrSlug");
      const url = `${config.MERIDIAN_API_URL}/api/services/${encodeURIComponent(String(args.idOrSlug))}`;
      const res = await fetch(url, { headers: apiHeaders(config) });
      return jsonOrText(res);
    },
  },
  {
    name: "list_categories",
    description: "List Meridian service categories (name, slug, icon, isActive, sortOrder, countryCode).",
    inputSchema: { type: "object" as const, properties: {} },
    handler: async (_args: Record<string, unknown>, config: MeridianConfig) => {
      if (!hasApiConfig(config)) return placeholder("list_categories", "GET /api/categories");
      const res = await fetch(`${config.MERIDIAN_API_URL}/api/categories`, { headers: apiHeaders(config) });
      return jsonOrText(res);
    },
  },
];

async function jsonOrText(res: Response) {
  const text = await res.text();
  try { return { content: [{ type: "text" as const, text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
  catch { return { content: [{ type: "text" as const, text: `HTTP ${res.status}: ${text}` }] }; }
}

function placeholder(tool: string, hint: string) {
  return { content: [{ type: "text" as const, text: `[${tool}] No live API configured. ${hint}. Configure MERIDIAN_API_URL and MERIDIAN_API_KEY in .env to enable live calls.` }] };
}
