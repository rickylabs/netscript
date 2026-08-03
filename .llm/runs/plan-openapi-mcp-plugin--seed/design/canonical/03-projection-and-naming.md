# Projection and Naming (canonical design, rev 2)

> Draft — design document only. Rev 2 integrates Sol stage-2 findings S-2, S-19, S-22
> (`../../adversarial-triage.md`). This is where "reads like NetScript, not like a REST dump"
> is earned concretely.

## 1. Why we write the projection ourselves

The upstream libraries (research.md §3) solve a *general* problem: arbitrary specs with external
`$ref`s, allOf/oneOf soup, missing operationIds, HTML descriptions, 64-char name collisions.
**Our spec producer is in-repo and deterministic**: `@orpc/openapi`'s `OpenAPIGenerator` +
`ZodToJsonSchemaConverter` (`packages/service/src/primitives/openapi.ts:20-21`) generate every
document from our own contracts. Verified consequences (`@orpc/openapi@1.14.13`,
`dist/shared/openapi.BwdtJjDu.mjs:535-549`):

- `operationId` defaults to the **dotted contract procedure path** (`path.join('.')`) — e.g.
  `publisher.publish`. NetScript-native identity is free.
- `summary` / `description` / `tags` / `deprecated` flow from `.route()` when contracts set them.
- Schemas come from our Zod, with `.describe()` descriptions intact
  (`zod-helpers.ts:44-101`); refs are internal.

So the projection is a small pure module in `packages/mcp/src/domain/` (~200–400 lines with
tests): parse the fetched document, build an operation index, produce schema views. No runtime
dependency; shapes credited: ivo-toby's meta-tool triad, nihal1294's description ladder, awslabs'
response-code enrichment. (Vendoring harsha-iiiv's `getToolsFromOpenApi` was considered — MIT,
clean — but it emits *per-operation MCP tool definitions*, which is precisely the shape D2
rejects; we would use ~10% of it and fight the rest.)

64-char MCP name limits and collision hashing — the hard part of upstream naming — **do not
apply**: our tool names are the three static meta-tools; operation ids appear as *data* in
results, not as tool names.

## 2. Operation identity

- Primary key: the spec `operationId` (dotted path). Stable across runs, matches what the agent
  sees in contract source and in oRPC client code — one vocabulary everywhere.
- Fallback (spec from a non-preset service or hand-set operationId absent): `METHOD path` string
  (`POST /api/publisher/publish`), accepted by `get_operation_schema` interchangeably with the
  id. **Canonicalization law (S-2):** lookup resolves input to exactly **one** spec operation —
  exact dotted id first, else exact `METHOD path` — and everything downstream (views, policy
  predicates, receipts) uses only the canonical dotted identity. Ambiguity refuses: a spec
  containing case-variant ids (`Foo.read` / `foo.read`) or an input matching more than one
  operation returns the candidates instead of picking one. Case-insensitive and substring
  matching exist **only** to populate the `operation_unknown` suggestion list (01) — they are
  display aids, never resolution, and never execution matchers.

## 3. Schema views

`get_operation_schema` returns **views**, not the raw operation object:

| View | Contents |
| --- | --- |
| `request` | merged path/query/header parameters (name, location, required, schema, description) + request-body JSON Schema, internal refs inlined, cycle-guarded (WeakSet, harsha precedent) |
| `response` | the success-response schema (2xx), plus `Returns: <status codes>` line (awslabs enrichment) |
| `errors` | derived from the operation's **actual declared responses** (S-19): the no-database scaffold's in-memory contract template builds routes from bare `oc`, not `baseContract` (`contract.memory.ts.template:73-87` vs `contract-primitives.ts:81`), so the common envelope is *not* universal. When the projection detects the `commonErrorMap` family in the operation's responses it renders it once, compactly — that is the "RPC envelope" the wave-four agent was guessing at; when absent, the view shows exactly what the operation declares and never hallucinates the family |
| `all` | the three above, applied to the truncation budget in that priority order |

Ref inlining is bounded: refs are internal by construction; a cycle or depth overflow degrades to
the `$ref` name with a note, never an error. Measured real sizes are Wave-0 [P2].

## 4. The description ladder

Every operation row in `list_service_operations` carries a one-line `summary`, produced by the
first rung that yields text (nihal1294's ladder, adapted):

1. `.route({ summary })` — once the D9 enrichment slice lands, the normal case.
2. First sentence of `.route({ description })`.
3. Humanized operationId (S-22 — the prior-art rung restored): `publisher.publish` →
   "Publish (publisher)". Deterministic, always well-defined. The rev-1 rung — "output schema's
   top-level `.describe()` when it reads as a sentence" — is removed: it had no deterministic
   predicate, and generated scaffolds describe *fields*, not the top-level object
   (`contract.memory.ts.template:13-47`), so it was normally unreachable anyway.
4. Synthesized verb+resource from method + path: `POST /api/publisher/publish` →
   "Invoke publish on publisher." — always available, honestly mechanical.

Rung provenance is not surfaced (agents don't care); the ladder is a pure function with fixture
tests per rung, and the fixture corpus includes a real generated no-summary spec proving which
rung fires for a pristine scaffold.

## 5. Before / after — the case for a tailored surface

**Generic generator output** (harsha-iiiv against the same spec, names as it would emit them):

```
Tools (one per operation, 7 for publisher alone, 40+ across the app):
  PostApiPublisherPublish        input: { requestBody: {...} }
  GetApiPublisherStatusById      input: { id: string }
  ...
```

Forty-odd tools loaded into every session's context, named by path munging, descriptions empty
(our routes carry no summaries yet), schema soup inline in every tool definition — the "REST
dump" the brief warns about, paid for on every conversation whether or not the agent debugs.

**This design** (three static tools; operations as data):

```
> list_service_operations { service: "publisher" }
publisher — 7 operations (base http://localhost:61432)
  publisher.publish      POST /api/publisher/publish     Publish a document and enqueue distribution.
  publisher.status       GET  /api/publisher/status/{id} Get distribution status for a publish job.
  ...

> get_operation_schema { service: "publisher", operation: "publisher.publish", view: "request" }
body (application/json):
  { document: { title: string  — "Document title, 1–200 chars",
                body: string,
                channels: ("rss"|"email"|"webhook")[] — "Distribution channels" },
    idempotencyKey?: string — "Client-supplied dedupe key" }
curl -X POST http://localhost:61432/api/publisher/publish -H 'content-type: application/json' -d '{...}'
```

Context cost when idle: three tool summaries. Identity: contract vocabulary. Descriptions: the
contract's own words. That is the concrete content of "reads like NetScript".

## 6. The enrichment prerequisite (D9)

Nothing in first-party contracts sets `summary`/`tags` today (every `.route()` found passes only
`{method, path}` — e.g. `auth.contract.ts:437-457`). The ladder keeps the tools useful without
it, but rung 1 is the difference between "Publish a document and enqueue distribution." and
"Invoke publish on publisher." The slice is mechanical and additive: one `summary:` (and
`tags:` where a natural group exists) per route literal, reviewed like prose. Drift risk (new
contracts omitting summaries) is recorded as a debt candidate with a doc-lint-shaped fix
(06 §5) rather than a hard gate now.
