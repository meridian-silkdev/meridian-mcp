#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { loadConfig } from "./config.js";
import { allTools } from "./tools/index.js";
import { resourceDefinitions } from "./resources/index.js";

const config = loadConfig();

const server = new Server(
  { name: "meridian-mcp", version: "0.1.0" },
  { capabilities: { tools: {}, resources: {} } }
);

// --- Tools ---
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = allTools.find((t) => t.name === request.params.name);
  if (!tool) throw new Error(`Unknown tool: ${request.params.name}`);
  const args = (request.params.arguments ?? {}) as Record<string, unknown>;
  return (await tool.handler(args, config)) as { content: { type: "text"; text: string }[] };
});

// --- Resources ---
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: resourceDefinitions.map((r) => ({
    uri: r.uri,
    name: r.name,
    description: r.description,
    mimeType: r.mimeType,
  })),
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const def = resourceDefinitions.find((r) => r.uri === request.params.uri);
  if (!def) throw new Error(`Unknown resource: ${request.params.uri}`);
  const text = await def.handler(config);
  return { contents: [{ uri: def.uri, mimeType: def.mimeType, text }] };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Keep process alive; handle graceful shutdown
  const shutdown = () => server.close().then(() => process.exit(0));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[meridian-mcp] fatal:", err);
  process.exit(1);
});
