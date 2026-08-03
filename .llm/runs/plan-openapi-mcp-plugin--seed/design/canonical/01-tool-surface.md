# Tool Surface (canonical design, rev 1)

> Draft — design document only. Shapes follow `packages/mcp/src/domain/tool-contracts.ts`
> conventions: hand-written JSON Schema, `additionalProperties: false`, Standard-Schema wrapped,
> centrally output-validated and truncated (`mcp-server.ts:105-112`).

## Naming and kinds

Existing names are snake_case verbs (`get_app_status`, `search_docs`); the new tools follow.
All three v1 tools are kind `read` (`tool-registry.ts:11-26` vocabulary). The v2 execution tool
(04) is kind `mutate`. Registry grows 14 → 17 (→ 18 with v2). Summaries follow the house pattern
(`summary + " Returns a bounded summary; do not print raw output to the user."`,
`tool-registry.ts:54-56`) and are written to name the *moment of need*, because the summary is
what the agent's tool picker sees (05-activation.md):

| Tool | Kind | Summary (draft) |
| --- | --- | --- |
| `list_api_services` | read | "List the app's HTTP services with their live base URLs and API status. Call before probing any service endpoint." |
| `list_service_operations` | read | "List a running service's API operations — names, methods, paths, one-line summaries. Use instead of guessing endpoints with curl." |
| `get_operation_schema` | read | "Get the exact request/response/error schema for one named service operation. Use before hand-writing a request body." |

## `list_api_services`

Input: `{}` (no required fields; optional `includeStopped?: boolean` default true).

Output (bounded; one row per service from the endpoint directory, 02-discovery.md):

```jsonc
{
  "services": [
    {
      "name": "publisher",
      "status": "running",            // running | configured (not running) | spec_unavailable
      "baseUrl": "http://localhost:61432",   // absent unless running
      "specUrl": "http://localhost:61432/api/openapi.json",
      "docsUrl": "http://localhost:61432/api/docs",
      "operations": 7,                // from a HEAD-style cheap fetch; absent if not running
      "source": "run-manifest"        // run-manifest | appsettings | override
    }
  ],
  "hint": "Use list_service_operations {service} next."
}
```

Rows for configured-but-not-running services carry `status: "configured (not running)"` and a
`hint` naming the start command — the tool teaches the fix rather than failing silently (D6).

## `list_service_operations`

Input:

```jsonc
{
  "type": "object",
  "properties": {
    "service": { "type": "string" },
    "filter": { "type": "string" },   // optional substring over id/path/summary/tags
    "limit": { "type": "integer", "minimum": 1, "maximum": 100 }  // house limit shape
  },
  "required": ["service"],
  "additionalProperties": false
}
```

Output: one compact row per operation from the projection (03):

```jsonc
{
  "service": "publisher",
  "operations": [
    {
      "id": "publisher.publish",          // operationId == dotted contract path (verified)
      "method": "POST",
      "path": "/api/publisher/publish",
      "summary": "Publish a document and enqueue distribution.",  // description ladder (03)
      "tags": ["publisher"],
      "deprecated": false
    }
  ],
  "truncated": false,
  "hint": "get_operation_schema {service, operation, view} for the exact shapes."
}
```

Row cost is deliberately flat (~1 line per operation) so a 50-operation service fits the
truncation budget; `filter`/`limit` exist for the pathological case, and `truncated: true` plus
the filter hint is emitted rather than silently cutting (no-silent-caps rule). Real-size
measurement against a scaffolded app is Wave-0 proof [P2].

## `get_operation_schema`

Input:

```jsonc
{
  "type": "object",
  "properties": {
    "service": { "type": "string" },
    "operation": { "type": "string" },   // the id from list_service_operations
    "view": { "type": "string", "enum": ["request", "response", "errors", "all"] }  // default "all"
  },
  "required": ["service", "operation"],
  "additionalProperties": false
}
```

Output: the dereferenced JSON Schema **view** (03 §3) — request parameters + body schema,
success-response schema, or the error envelope family — with Zod `.describe()` descriptions
intact (they flow today: `zod-helpers.ts:44-101` → `ZodToJsonSchemaConverter`). `view` exists
because whole operations can exceed the truncation budget; the tool returns views, never a raw
spec dump [P2]. A `curlExample` field renders one ready-to-run request line (method, URL with
resolved base, minimal valid body skeleton) — the single highest-leverage output for the
mid-debug agent, borrowed from awslabs' enrichment.

## Failure envelopes (uniform across the three)

Structured, never throwy, following house bounded-summary style:

- `service_unknown` — name + the known-service list (from the directory) in the message.
- `service_not_running` — with the start hint.
- `spec_unavailable` — HTTP status from the spec fetch; when 401/403, the message names the
  likely cause ("an authz rule matches /api — see define-service auth options") per open
  question 2 / proof [P3].
- `operation_unknown` — with three nearest ids by substring match (cheap, no fuzzy dependency).

## Registry integration

- `TOOL_NAMES` (`tool-types.ts:4-19`) gains the three names; kinds/summaries/schemas in
  `tool-registry.ts` and `tool-contracts.ts` as siblings of the existing 14.
- Flows live in `application/flows/` one file per tool (house shape), pure over two injected
  ports: `ServiceEndpointDirectoryPort` (02) and a `ServiceSpecPort` (localhost fetch adapter,
  infrastructure) — both constructor-injected with test fakes, per doctrine 07 injection rule.
- `withReceipt` wrapping (`cli.ts:175`): the read flows write diagnostic receipts exactly like
  the existing read flows, which is what makes fork F4's evidence-gate integration a
  configuration choice rather than new machinery.
