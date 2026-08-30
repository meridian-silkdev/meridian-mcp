# meridian-mcp

MCP server for the **Meridian** business-services platform. Exposes services, service requests, workflow steps, payments and meetings as [Model Context Protocol](https://modelcontextprotocol.io) tools and resources.

## Install

```bash
cd meridian-mcp
npm install
npm run build
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
npm start            # stdio MCP server (for Claude Desktop / pi)
npm run dev          # watch mode via tsx
```

### Claude Desktop / pi

Add to your MCP config:

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

Or with pi:

```bash
pi --mcp meridian-mcp/dist/index.js
# or via npx after publish
npx meridian-mcp
```

## Tools

| Tool | Description |
|------|-------------|
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
```
