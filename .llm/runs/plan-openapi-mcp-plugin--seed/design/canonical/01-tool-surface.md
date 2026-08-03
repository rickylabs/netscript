# Tool Surface (canonical design, rev 2)

> Draft — design document only. Rev 2 integrates Sol stage-2 findings S-9, S-12, S-13, S-14,
> S-15, S-24, S-25 (`../../adversarial-triage.md`). Shapes follow
> `packages/mcp/src/domain/tool-contracts.ts` conventions: hand-written JSON Schema,
> `additionalProperties: false`, Standard-Schema wrapped, centrally output-validated and
> truncated (`mcp-server.ts:105-112`) — with the truncation-metadata correction below.

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

Output (bounded; one row per service from the endpoint directory, 02-discovery.md, plus the
directory's per-source outcomes — a failed source read is data, never a silent absence, S-9):

```jsonc
{
  "services": [
    {
      "name": "publisher",
      "status": "running",            // running | not_running | spec_unavailable
                                      //   | identity_mismatch | excluded   (02 §status mapping)
      "baseUrl": "http://127.0.0.1:61432",   // absent unless running
      "specUrl": "http://127.0.0.1:61432/api/openapi.json",
      "docsUrl": "http://127.0.0.1:61432/api/docs",
      "operations": 7,                // computed from the parsed spec of the liveness GET;
                                      // ABSENT whenever no spec was fetched — never defaulted (S-14)
      "source": "run-manifest",       // run-manifest | appsettings | override | aspire-cli
      "conflict": null                // populated when a lower-precedence source disagreed (S-10)
    }
  ],
  "sources": [
    { "source": "run-manifest", "outcome": "failed", "reason": "invalid JSON" },
    { "source": "appsettings",  "outcome": "used" }
  ],
  "hint": "Use list_service_operations {service} next."
}
```

Rows for `not_running` services carry a `hint` naming the start command — the tool teaches the
fix rather than failing silently (D6). The `sources` block is what distinguishes "manifest
unreadable, appsettings healthy" from "AppHost never started": identical service rows, different
source outcomes (the absence-of-red-is-not-green requirement). `excluded` rows (S-25,
`introspection.excludeServices` in the validated config carrier, 04 §3) appear by name with no
spec fetch — proven by test.

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

**Truncation arithmetic (S-13 — corrected).** The central truncator slices arrays to 50 and
does not update sibling metadata (`truncation.ts:9-28`), so a flow returning 75 rows with
`truncated: false` would reach the client as 50 rows and a false flag. Rev 2 requirements: (a)
flows self-cap every array **below** the central caps and compute `truncated` **after** their
own capping, so the central pass never edits their output; (b) the implementing run changes the
central truncator to recompute truncation metadata after any cap it applies and to enforce a
whole-result byte bound — recorded as a named slice, since it touches existing machinery; (c)
"row cost" claims are replaced by measured budgets from Wave-0 proof [P2]. `filter`/`limit`
remain for the pathological case, and a `truncated: true` result carries the filter hint rather
than silently cutting (no-silent-caps rule).

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
spec dump [P2]. A `curlExample` field renders one request line (method, URL with resolved base,
minimal valid body skeleton) — the single highest-leverage output for the mid-debug agent,
borrowed from awslabs' enrichment. **Auth honesty (S-24):** service auth middleware installs
globally before the spec routes (`service-builder-impl.ts:442-474`) and the generator receives
no security metadata (`openapi.ts:74-92`), so a protected operation can look unauthenticated in
the spec — absence of security metadata is **not evidence of no auth**, and the tool never
infers it. The example is therefore always labeled an *unauthenticated request template*, with
an `authNote` stating that a 401/403 means the service enforces auth and credentials must be
supplied by the developer. "Paste-ready" is claimed for shape (method, URL, valid body
skeleton), never for authorization.

## Failure envelopes (uniform across the three)

Structured, never throwy, following house bounded-summary style, and aligned one-to-one with
02's status mapping (S-12 — one mapping, no second vocabulary):

- `service_unknown` — name + the known-service list (from the directory) in the message.
- `service_not_running` — no listener; with the start hint.
- `spec_unavailable` — listener present but timeout / HTTP error / parse failure; carries the
  failure class; when 401/403, the message names the likely cause ("an authz rule matches /api —
  see define-service auth options") per proof [P3].
- `identity_mismatch` / `excluded` — per 02 (S-8, S-25).
- `operation_unknown` — with three nearest ids by substring match (suggestion display only —
  never an execution matcher, S-2).

## Registry integration

- `TOOL_NAMES` (`tool-types.ts:4-19`) gains the three names; kinds/summaries/schemas in
  `tool-registry.ts` and `tool-contracts.ts` as siblings of the existing 14.
- Flows live in `application/flows/` one file per tool (house shape), pure over two injected
  ports: `ServiceEndpointDirectoryPort` (02) and a `ServiceSpecPort` (localhost fetch adapter,
  infrastructure) — both constructor-injected with test fakes, per doctrine 07 injection rule.
- `withReceipt` wrapping (`cli.ts:175`) — **with the S-15 correction**: today the wrapper marks
  success when the flow returns, *before* the runner validates the output
  (`mcp-server.ts:96-112`), so an invalid tool result (or a throw, which the runner does not
  catch around `tool.flow`) can leave green or stale-green evidence. Rev 2 requires receipt
  commit to move **after** output validation, and thrown/validation failures to record a failed
  attempt — a named change to existing machinery, prerequisite to any evidence-gate use of these
  receipts. With that fix, F4(a) (receipts *accepted* as evidence) is wiring; F4(b) (receipts
  *required*) additionally needs per-evidence-class receipt keys (S-16, see 05 §2F) and is
  costed as new machinery in the fork table, not as configuration.
