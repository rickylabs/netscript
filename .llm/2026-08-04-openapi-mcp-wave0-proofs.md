# 2026-08-04 — OpenAPI→MCP Wave-0 proofs

Run dir: `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/` · Branch `test/openapi-mcp-wave0-proofs`
· draft PR [#1182](https://github.com/rickylabs/netscript/pull/1182)

## What the proofs established

P1 found a usable Aspire post-allocation callback seam: `onResourceEndpointsAllocated` plus
`getValueAsync()` emitted a complete, identity-bound endpoint manifest with the allocated port. The
full proof still correctly failed because the generated SQLite service exited without `--allow-ffi`,
and a later HTTP 200 could not be attributed to that owned process. The qualified, revisitable
arbitration is F1(b): productize a disposable startup-side writer after the generated runtime
permission defect is fixed.

P2 measured a real, attributed no-database scaffold: a 3657-byte OpenAPI 3.1.1 document with three
dotted operation IDs, 73/89/88-byte discovery rows, no references, no non-2xx/common error envelope,
and no observed truncation-limit exceedance. Its combined verdict is FAIL because the required
DB-backed branch could not produce an attributable live spec; #1128 therefore remains open without a
closing keyword.

P3 independently confirmed the auth-guarded spec route's exact 401 and 403 envelopes plus an
authorized 200, and ratified the locked `spec_unavailable` guidance without implying authenticated
spec support exists in the future production feature.

## Two things worth remembering

1. A proof slice can finish successfully with an empirical FAIL. The formal Qwen IMPL-EVAL passed
   this run because all required verdict artifacts were truthful and evidence-backed; it did not
   reinterpret a failed runtime or missing branch as a product PASS.

2. Ownership evidence is part of the result. An HTTP response without captured listener ownership
   and ordering cannot rescue a failed owned process. Likewise, shared-host leak checks must name
   specific owned roots and leave foreign or unproven AppHosts and containers untouched.

## Deliberately not done

- No package/plugin public-surface or generated-template productization.
- No workaround for the generated SQLite `--allow-ffi` defect.
- No closing keyword for #1128 while its DB-backed acceptance evidence is absent.
- No `deno task e2e:cli`; merge-readiness E2E remains the orchestrator's decision.
