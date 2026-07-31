# Drift — workers Aspire contribution and plugin RPC seam

## 2026-07-31 — significant framing correction

The carried plan repeated #977's claim that returning an `EnvSource` creates a `ServiceReferences`
edge. Current code disproves that: only `AspireBuilder.reference/waitFor` records graph edges, and
`declareEnv()` currently has no production consumer. The locked implementation therefore pairs the
resource-shaped declaration with explicit builder dependencies and will correct the issue itself.

The default triple worker registration is confirmed as duplicate execution, not an intentional
conditional graph. The default contribution will retain the combined mode only; standalone worker
and scheduler manifest entries remain available as explicit modes.
