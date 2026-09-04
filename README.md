# @meridiantoolkit/mcp

MCP server for the **Meridian** business-services platform. Exposes services, service requests, workflow steps, payments and meetings as [Model Context Protocol](https://modelcontextprotocol.io) tools and resources. MCP is a protocol, not a host-specific plugin format — this server runs unchanged in **Claude Code, Codex CLI, Claude Desktop, pi**, or any other MCP-compatible client.

Listed on the [official MCP Registry](https://registry.modelcontextprotocol.io) as `io.github.meridian-silkdev/meridian-mcp`.

## Install

```bash
cd meridian-mcp
npm install
npm run build
```

Or once published:

```bash
npx @meridiantoolkit/mcp
```

## Configure

Copy `.env.example` or set env vars directly:

| Var | Description | Default |
|-----|-------------|---------|
| `MERIDIAN_API_URL` | Meridian app base URL | `http://localhost:3000` |
| `MERIDIAN_API_KEY` | `mrd_` API key (Better Auth) for REST calls | *(none — tools return placeholder hint until set)* |
| `DATABASE_URL` | Optional direct DB access fallback | |
| `MERIDIAN_MCP_LOG_LEVEL` | debug/info/warn/error | info |

More: `/.well-known/agent-configuration` exposes **Agent Auth** discovery (capability-based, short-lived JWTs, device-auth/CIBA approval). Agents can use either a long-lived `mrd_` key or scoped Agent Auth grants — see `meridian-skills` `meridian-api` skill.

Without `MERIDIAN_API_KEY` every tool still responds — it explains what endpoint would be called and what to configure, so the server is safe to run in dry-run / demo mode.

## Run

```bash
npm start            # stdio MCP server
npm run dev          # watch mode via tsx
```

### Claude Code

```bash
claude mcp add meridian -- node /absolute/path/to/meridian-mcp/dist/index.js
# or, once published:
claude mcp add meridian -- npx -y @meridiantoolkit/mcp
```

Or drop a `.mcp.json` in your project root (shareable with a team, checked into git):

```json
{
  "mcpServers": {
    "meridian": {
      "command": "npx",
      "args": ["-y", "@meridiantoolkit/mcp"],
      "env": {
        "MERIDIAN_API_URL": "http://localhost:3000",
        "MERIDIAN_API_KEY": "..."
      }
    }
  }
}
```

### Codex CLI

Codex reads MCP servers from `~/.codex/config.toml` (or a project-scoped `.codex/config.toml` for a trusted project):

```toml
[mcp_servers.meridian]
command = "npx"
args = ["-y", "@meridiantoolkit/mcp"]
env = { MERIDIAN_API_URL = "http://localhost:3000", MERIDIAN_API_KEY = "..." }
```

Or via the CLI: `codex mcp add meridian -- npx -y @meridiantoolkit/mcp`. The same config is shared by Codex CLI, the IDE extension, and the ChatGPT desktop app.

Codex has no plugin/skill system (unlike Claude Code and pi) — its equivalent of `meridian-plugin`/`meridian-skills` is just this MCP server plus project guidance. Copy [`AGENTS.md.example`](./AGENTS.md.example) into your project's `AGENTS.md` for the same tool-usage guidance the skills packages give elsewhere.

### Claude Desktop / pi

Add to your MCP config (Claude Desktop: `claude_desktop_config.json`; pi: `.pi/settings.json` → `mcpServers`, or `pi --mcp`):

```json
{
  "mcpServers": {
    "meridian": {
      "command": "node",
      "args": ["/absolute/path/to/meridian-mcp/dist/index.js"],
      "env": {
        "MERIDIAN_API_URL": "http://localhost:3000",
        "MERIDIAN_API_KEY": "..."
      }
    }
  }
}
```

```bash
pi --mcp meridian-mcp/dist/index.js
# or via npx after publish
npx @meridiantoolkit/mcp
```

## Tools

| Tool | Description |
|------|-------------|
| `meridian_status` | Check API connectivity/config and list available tools/resources. No params. Works the same in every client — this replaces the pi-only `meridian_status` extension tool from `meridian-plugin` so status-checking isn't tied to one host. |
| `list_services` | List services (filter: categorySlug, isActive, countryCode) |
| `get_service` | Get service by id/slug with formConfig |
| `list_categories` | List service categories |
| `list_service_requests` | List requests (filter: status, customerId, providerId, limit) |
| `get_service_request` | Get request by id with steps |
| `create_service_request` | Create request (serviceId, answers, customTitle) |
| `update_request_status` | Patch request status (prefer `advance_step`) |
| `get_workflow_status` | Current phase + all requestSteps |
| `advance_step` | Complete current step → next step |
| `list_request_steps` | All RequestSteps in order |
| `get_payment_status` | Payment row for a request |
| `verify_payment` | Server-side verify with Flouci (Tunisia, local) or Stripe (international) |
| `list_meetings` | List meetings (filter: serviceRequestId, status) |
| `create_meeting` | Create Teams meeting + invites |
| `respond_to_meeting` | RSVP ACCEPTED/DECLINED/PENDING |

## Resources

| URI | Description |
|-----|-------------|
| `meridian://services` | Service catalog JSON |
| `meridian://workflow` | Workflow backbone + phases |

## Development

```bash
npm run typecheck
npm run build
npm test          # spawns the built server over stdio and exercises every tool/resource
```

## Publish

First publish (manual, one-time — a scoped package can't use Trusted Publishing until it exists on the registry):

```bash
npm login                     # once per machine
npm publish --access public
```

## CI/CD

- **`.github/workflows/ci.yml`** — every push to `main` and every PR: `npm ci`, typecheck, build, `npm test` (the real stdio smoke suite).
- **`.github/workflows/publish.yml`** — fires on a **published GitHub Release**, re-runs the full test suite, checks the release tag matches `package.json`'s version, then:
  1. `npm publish --provenance` via npm's **Trusted Publishing (OIDC)** — no `NPM_TOKEN` secret to create or rotate.
  2. Publishes/updates the listing on the **official MCP Registry** via `mcp-publisher login github-oidc` + `mcp-publisher publish` (also OIDC, no secret). `server.json`'s version is synced to the release tag automatically. This step has `continue-on-error: true` — the registry is explicitly in preview, so a hiccup there never blocks the actual npm release.

**mcpName requirement:** `package.json` has an `"mcpName": "io.github.meridian-silkdev/meridian-mcp"` field — the registry's package validator needs this to confirm the npm package and the GitHub-verified server identity are published by the same owner. If you ever rename the server in `server.json`, update this field too or publishes will 400.

**Known upstream bug, worked around:** the *interactive* `mcp-publisher login github` device flow reliably 403s when publishing under a GitHub **organization** namespace (confirmed-public membership, Owner role, doesn't matter — see [modelcontextprotocol/registry#1537](https://github.com/modelcontextprotocol/registry/issues/1537), still open as of this writing). `github-oidc` from inside a GitHub Actions workflow running in the org's own repo sidesteps it entirely, since it verifies the workflow's repo identity rather than checking the human account's org list. That's why the registry publish step lives in CI, not as a manual local command.

**One-time setup after the first manual publish:** on the package's npmjs.com page → Settings → Trusted Publisher → GitHub Actions, and point it at `meridian-silkdev/meridian-mcp`, workflow `publish.yml`. After that, releasing a new version is just:

```bash
npm version patch   # or minor/major — bumps package.json + creates a git tag
git push --follow-tags
gh release create v0.1.3 --generate-notes   # publishing this release triggers both the npm and MCP Registry publish steps
```
