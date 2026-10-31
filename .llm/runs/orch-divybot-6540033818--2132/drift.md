# Drift

- RTK unavailable, using focused native CLI invocations. No external memory connector is exposed;
  committed run memory is the consulted and extended memory surface.
- Deno's native inclusive start and illegal prefix+start+end selector are independently confirmed;
  correct their translation within the already-declared adapter surface for shared contract parity.
- Assignment contains conflicting PR closure instructions: specific process says never Closes,
  later required delivery says the body MUST end with `Closes rickylabs/netscript#2132`. Follow
  the later explicit delivery requirement, consistent with the repository close-gate rule; start
  the body with the requested Refs URL. Do not close the issue by hand.

- PLAN-EVAL expanded prefix parity to omit the exact prefix key in memory and requires a private
  unordered single-pass watch discovery path to preserve polling performance. Both fit the
  declared write surface. Existing typed-key encoding/order differences are deferred and fixture
  keys are restricted to round-trippable non-numeric ASCII strings; no universal parity claim.

- Existing watch startup/discovery tests intercepted public list(). Move their pause/count hooks
  to real SCAN/MGET via Redis.sendCommand because watch discovery intentionally bypasses ordered
  list. Keep all race, starvation and debounce assertions unchanged. These test files are within
  the declared tests write surface; no tests are removed or skipped.

- Preserve native typed ordering when its selector already applies a bound: only exclude exact
  start equality, including structural byte-array equality. Applying compareKeys again would
  newly drop numeric 10 after numeric 9. Added a Deno-specific regression without changing the
  existing cross-adapter key encoding/order policy.

- IMPL-EVAL round 1: CHANGES, one consumer regression. The public kvdex export uses the native
  Deno-compatible bridge and must retain INCLUSIVE selector.start even though KvStore.start
  is now consistently exclusive. Expand the declared write surface to
  packages/kv/adapters/denokv-bridge.ts and a focused tests/bridge-list_test.ts. Add a boundary
  translation (read the start entry, include it in order and limit/cursor accounting), without
  changing public exports or implementing a new listing mode. This is necessary compatibility
  work within #2132, not an independent issue or a codec migration. Keep owner scope authority;
  the independent evaluator reviews the correction before readiness.
- Self-review found fractional limits could bypass an equality-only heap capacity check. Use
  >= capacity so retained memory remains bounded even for fractional input; preserve Redis's
  existing ceiling-like result count, and add a heap-cap regression.

- CI quality at the first pushed implementation head finds stale generated MCP export-surface
  metadata after KV adapter shape changes. Expand the write surface to the existing
  generator's single output, packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts,
  as identified by the generator. Refresh with gen:mcp-export-corpus from committed package
  source, then run freshness and corpus consumer tests. Do not hand-edit compressed rows.
  Keep this in a separate corrective slice with worklog/context and independent review.
