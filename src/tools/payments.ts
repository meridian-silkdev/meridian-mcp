import type { MeridianConfig } from "../config.js";
import { apiHeaders, hasApiConfig } from "../config.js";

export const paymentTools = [
  {
    name: "get_payment_status",
    description: "Get payment state for a service request (Payment row: amount, status, provider, serviceRequestId unique). Returns verification status — never trust redirect alone.",
    inputSchema: {
      type: "object" as const,
      properties: { requestId: { type: "string", description: "ServiceRequest id" } },
      required: ["requestId"],
    },
    handler: async (args: Record<string, unknown>, config: MeridianConfig) => {
      if (!hasApiConfig(config)) return placeholder("get_payment_status", "GET /api/requests/:id/payment");
      const res = await fetch(`${config.MERIDIAN_API_URL}/api/requests/${encodeURIComponent(String(args.requestId))}/payment`, { headers: apiHeaders(config) });
      return dump(res);
    },
  },
  {
    name: "verify_payment",
    description: "Verify a payment with the provider (Flouci for Tunisia — local wallet/card — or Stripe for international cards). Triggers server-side verification — redirect back to the portal alone is never proof of payment.",
    inputSchema: {
      type: "object" as const,
      properties: {
        requestId: { type: "string" },
        paymentId: { type: "string", description: "Payment id or provider transaction id" },
      },
      required: ["requestId"],
    },
    handler: async (args: Record<string, unknown>, config: MeridianConfig) => {
      if (!hasApiConfig(config)) return placeholder("verify_payment", "POST /api/requests/:id/payment/verify");
      const res = await fetch(`${config.MERIDIAN_API_URL}/api/requests/${encodeURIComponent(String(args.requestId))}/payment/verify`, {
        method: "POST",
        headers: apiHeaders(config),
        body: JSON.stringify({ paymentId: args.paymentId }),
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
