import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverEntry = path.resolve(__dirname, "../dist/index.js");

async function withClient(fn: (client: Client) => Promise<void>) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverEntry],
    env: { ...process.env, MERIDIAN_MCP_LOG_LEVEL: "error" },
  });
  const client = new Client({ name: "meridian-mcp-smoke-test", version: "0.0.0" }, { capabilities: {} });
  await client.connect(transport);
  try {
    await fn(client);
  } finally {
    await client.close();
  }
}

test("server starts and lists all 16 tools", async () => {
  await withClient(async (client) => {
    const { tools } = await client.listTools();
    assert.equal(tools.length, 16);
    const names = tools.map((t) => t.name).sort();
    assert.ok(names.includes("meridian_status"));
    assert.ok(names.includes("list_services"));
    assert.ok(names.includes("create_service_request"));
    assert.ok(names.includes("verify_payment"));
  });
});

test("lists both resources", async () => {
  await withClient(async (client) => {
    const { resources } = await client.listResources();
    const uris = resources.map((r) => r.uri).sort();
    assert.deepEqual(uris, ["meridian://services", "meridian://workflow"]);
  });
});

test("meridian_status responds in dry-run mode without an API key", async () => {
  await withClient(async (client) => {
    const result = await client.callTool({ name: "meridian_status", arguments: {} });
    const content = result.content as { type: string; text: string }[];
    assert.equal(content[0].type, "text");
    assert.match(content[0].text, /Meridian API:/);
    assert.match(content[0].text, /dry-run/);
  });
});

test("list_services returns a placeholder hint without live config", async () => {
  await withClient(async (client) => {
    const result = await client.callTool({ name: "list_services", arguments: {} });
    const content = result.content as { type: string; text: string }[];
    assert.match(content[0].text, /No live API configured/);
    assert.match(content[0].text, /GET \/api\/services/);
  });
});

test("get_workflow_status without requestId returns the placeholder hint, not a crash", async () => {
  await withClient(async (client) => {
    const result = await client.callTool({ name: "get_workflow_status", arguments: { requestId: "req_123" } });
    const content = result.content as { type: string; text: string }[];
    assert.match(content[0].text, /No live API configured/);
  });
});

test("unknown tool call throws a clean error, not a crash", async () => {
  await withClient(async (client) => {
    await assert.rejects(() => client.callTool({ name: "not_a_real_tool", arguments: {} }));
  });
});

test("reading meridian://workflow resource returns the phase list", async () => {
  await withClient(async (client) => {
    const result = await client.readResource({ uri: "meridian://workflow" });
    const text = result.contents[0].text as string;
    const parsed = JSON.parse(text);
    assert.ok(Array.isArray(parsed.phases));
    assert.ok(parsed.phases.includes("COMPLETED"));
  });
});
