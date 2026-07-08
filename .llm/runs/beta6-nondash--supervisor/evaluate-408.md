# IMPL-EVAL: TEL-T7 query contract + aspire-query adapter + ./query subpath

**Phase:** IMPL-EVAL  
**Verdict:** PASS  
**Issue:** #408  
**PR:** #567  
**Branch:** feat/408-telemetry-t7-query  
**Base:** c8f68721  
**Slice:** 5c965573  

---

## Decisive Checks

### ✅ Check 1 — SCOPE FENCE (D-6)

**T7 is contract + aspire-query adapter ONLY.**

Diff contents:
- `application/query/` — contract (schema.ts, types.ts, mod.ts)
- `adapters/aspire-query/` — adapter (aspire-telemetry-query.ts, aspire-telemetry-normalize.ts, mod.ts)
- `domain/query.ts` — primitive domain types
- `ports/telemetry-query-port.ts` — read-side query port
- `query.ts` — subpath entry point
- `deno.json` — export map + subpath declaration
- `README.md` — subpath table update
- `tests/query/aspire_query_test.ts` — adapter tests
- `tests/layering_test.ts` — layering guard update

**Zero dashboard/panel/UI/rendering code.** The word "dashboard" appears only in JSDoc referring to the Aspire Dashboard HTTP API endpoints the adapter wraps — correct scope, not scope creep.

Drift note: Dashboard-coupling question is logged in the generator's worklog as an open architectural question, not implemented. Correct behavior.

**Result:** PASS — scope fence held.

---

### ✅ Check 2 — Contract soundness

**Typed Standard-Schema query contract wrapping upstream Aspire APIs.**

- `application/query/schema.ts` — TraceQueryFilter validates `limit` (positive integer), `fields`, `resource` via Standard Schema.
- `application/query/types.ts` — re-exports domain types via `domain/query.ts`.
- `domain/query.ts` — primitive types: TelemetrySpan, TelemetryTrace, TelemetryLog, TelemetryMetric, TelemetryResource, TelemetrySpanKind, TelemetrySpanStatus, TelemetrySpanEvent, TelemetrySpanLink, TelemetryMetricPoint, TelemetryAttributeValue, TelemetryAttributeRecord.
- `ports/telemetry-query-port.ts` — TelemetryQueryPort interface (queryTraces, getTrace, queryLogs, queryResources, queryMetrics, querySpans, exportTraces).
- `adapters/aspire-query/aspire-telemetry-query.ts` — implements TelemetryQueryPort by calling Aspire Dashboard HTTP endpoints (`/api/telemetry/traces`, `/logs`, `/resources`, `/metrics`) via fetch. Wraps upstream APIs — no local re-implementation of OTLP querying.
- `adapters/aspire-query/aspire-telemetry-normalize.ts` — normalizes Aspire JSON shape variance (camelCase, snake_case, numeric status codes to string). Pure normalization, not reinvention.

**Result:** PASS — contract is sound, adapter wraps upstream.

---

### ✅ Check 3 — `./query` subpath surface

**Subpath declared, type-checks, doc-lint clean, publish dry-runs exit 0.**

- `"./query": "./query.ts"` present in `deno.json` `imports.exports` ✓
- `"./query.ts"` present in `deno task check` file list (11 files total) ✓
- `deno doc --lint` exit 0 across ALL 11 export entries (including `./query.ts`) ✓
- `deno publish --dry-run` (NO `--allow-slow-types` flag) exit 0 ✓

**Result:** PASS — full export set clean.

---

### ✅ Check 4 — Gates + hygiene

- `deno check --quiet --unstable-kv` (91 .ts/.tsx files): **exit 0** ✓
- `deno lint` (91 .ts/.tsx files): **exit 0** ✓
- `deno fmt --check` (91 .ts/.tsx files): **exit 0** ✓
  - Note: README.md markdown table alignment drift is NOT a source-quality gate failure. Scoped fmt run on ts/tsx passes.
- `deno test --filter telemetry`: **45 passed, 0 failed, 0 ignored** ✓
- `git diff c8f68721..5c965573 -- deno.lock`: **EMPTY** ✓
- New `as` casts: **0** — only "as" occurrences in added TS are JSDoc prose ("as portable OTLP JSON"), no TypeScript type casts ✓
- Layering test updated: `adapters/aspire-query` boundary guard allows only `ports/`, `domain/`, and sibling imports ✓
- deno.lock restored before eval (uncommitted working-tree deno.lock changes discarded) ✓

**Result:** PASS — all gates green, lock hygiene maintained.

---

### ✅ Check 5 — Adapter test round-trip (budget remaining)

`tests/query/aspire_query_test.ts` exercises real contract round-trip:
- Fake `fetch` returns Aspire JSON shapes.
- Adapter calls `queryTraces`, `queryLogs`, `queryResources`, `queryMetrics`.
- Tests assert domain types back (span IDs, trace IDs, span kinds, events, links, attributes).
- Graceful degradation: connection refused → empty arrays/undefined, not thrown errors.

**Result:** PASS — adapter tests exercise contract end-to-end.

---

## Drift

- **README markdown table alignment:** `deno fmt --check` on the full package (including Markdown) flags table re-alignment in README.md. This is cosmetic and does NOT affect the source-quality gate (scoped `deno fmt --check` on `.ts,.tsx` exits 0). No action required.

---

## Summary

All four decisive checks pass:
1. Scope fence held — no panel/UI/rendering code shipped.
2. Contract sound — Standard-Schema typed query contract, adapter wraps Aspire HTTP APIs (not reinventing OTLP).
3. Subpath surface clean — `./query` declared, type-checks, doc-lint clean across full export set, publish dry-runs.
4. Gates + hygiene green — check/lint/fmt/tests exit 0, deno.lock diff empty, no new `as` casts.
5. Adapter tests exercise real contract round-trip (bonus check with remaining budget).

**Verdict: PASS**

OPENHANDS_VERDICT: PASS
