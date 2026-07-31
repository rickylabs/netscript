# Drift — workers Aspire contribution and plugin RPC seam

## 2026-07-31 — significant framing correction

The carried plan repeated #977's claim that returning an `EnvSource` creates a `ServiceReferences`
edge. Current code disproves that: only `AspireBuilder.reference/waitFor` records graph edges, and
`declareEnv()` currently has no production consumer. The locked implementation therefore pairs the
resource-shaped declaration with explicit builder dependencies and will correct the issue itself.

The default triple worker registration is confirmed as duplicate execution, not an intentional
conditional graph. The default contribution will retain the combined mode only; standalone worker
and scheduler manifest entries remain available as explicit modes.

## 2026-07-31 — invalid PLAN-EVAL launch rejected

The first local Qwen evaluator attempted to delegate a template read to an internal closed-model
Claude helper. The supervisor terminated the process immediately. This attempt is invalid under the
open-models-only evaluator policy and produced no accepted verdict. The replacement prompt forbids
all delegation and requires the Qwen session to perform direct reads itself.

## 2026-07-31 — S1 review exposed a second false-green router shape

The first S1 implementation mounted a flat test router at the canonical client prefix. The required
opposite-family review exercised the real assembled workers router and proved the canonical URL
still returned 404: production routers already carried a version node, so the mount duplicated
route ownership. The slice was rejected before commit.

The corrected design mounts one assembled router at the RPC base and makes
`assemblePluginContractRouter` own the version + namespace tree. Its version-only branch preserves
the beta.11 route for one compatibility window. The regression guard now uses the same assembler,
and restoring the old binder makes it fail with `Error: Not Found` (exit 1). This is a significant
implementation correction within the plan's stated single-owner route contract, not a scope change.

Configured opposite-family reviewer IDs `fable-5` and `opus-4.8` were unavailable. The bounded
repair selector `opus` resolved to `claude-opus-5`, session
`91d34eb6-8829-4376-b1b1-de542c875872`; its blocking finding is the correction above.
