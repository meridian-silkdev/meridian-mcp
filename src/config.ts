import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  MERIDIAN_API_URL: z.string().url().optional().default("http://localhost:3000"),
  MERIDIAN_API_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  MERIDIAN_MCP_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional().default("info"),
});

export type MeridianConfig = z.infer<typeof envSchema>;

export function loadConfig(): MeridianConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid Meridian MCP config: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function hasApiConfig(config: MeridianConfig): boolean {
  return Boolean(config.MERIDIAN_API_KEY && config.MERIDIAN_API_URL);
}

export function apiHeaders(config: MeridianConfig): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.MERIDIAN_API_KEY) headers["Authorization"] = `Bearer ${config.MERIDIAN_API_KEY}`;
  return headers;
}
