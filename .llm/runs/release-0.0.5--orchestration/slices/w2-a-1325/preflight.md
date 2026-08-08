# W2-A preflight — generated triggers KV adapter bootstrap

Observed on 2026-08-06 before dispatch:

- The triggers runtime stub can emit a combined background process without registering the
  configured KV adapter; the default Aspire Redis/Garnet path then crash-loops until a manual import
  is added.
- The saga sibling fix exists, but there is no cross-plugin invariant preventing one KV-backed
  generated runtime from shipping without its provider bootstrap.
- #1325 requires both Redis/Garnet and `CACHE_PROVIDER=denokv`, a RED-first generated-output test,
  and real health for every KV-backed first-party background runtime.

## Required supervisor mission

1. Identify the canonical cache-provider selection and adapter-registration authority. Keep
   convention-bearing provider contracts in core and plugin code limited to thin composition.
2. Add a RED generated-output/runtime test that fails when the selected adapter bootstrap is absent;
   do not pin a text-only import assertion if behavior can still be inert.
3. Emit deterministic trigger glue for Redis/Garnet and Deno KV without manual edits or
   regeneration-unsafe state. Reuse the saga seam or introduce one shared enumerated invariant.
4. Install every KV-backed first-party background runtime in a generated project and prove each
   reaches a real healthy state under the appropriate provider.
5. Use `aspire start --isolated`, exact `aspire wait`/resource evidence, structured logs, and exact
   AppHost-scoped cleanup. Never stop or remove foreign resources.
6. Run focused generator/plugin tests, `verify-plugin`, scoped source check/lint/fmt, doctrine and
   package gates, then exact one-pass `scaffold.runtime --cleanup --format pretty`.
7. Open a draft PR with `Closes #1325` only after all six rows are evidenced; leave it at
   `status:impl-eval` for separate Qwen evaluation.

An emitted import or unit mock is not sufficient: acceptance requires both backend selections and
real generated background-resource health.
