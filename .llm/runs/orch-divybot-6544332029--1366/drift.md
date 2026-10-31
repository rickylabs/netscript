# Drift

- RTK is unavailable; use focused raw commands and structured wrappers.
- Owner's specific process overrides generic assignment footer: reference-only PR, no labels/milestones, CI scaffold.runtime requested in READY, stop without merge, final report file handoff.
- Declared write surface extended before implementation to plugins/{sagas,triggers}/src/adapter/resources/glue/runtime.stub.ts and canonical generated docs/publish carriers; necessary for automatic adoption in generated children. Do not hand-edit carriers.
- No new architectural debt accepted.

- PLAN-EVAL R1 identified generated --watch reload semantics missing from the initial design. Persist processId plus fatal-failure flag; count same-process reloads only after failure, and test healthy/failing generated watch reloads. Owner explicitly scopes this leaf to sagas/triggers and preserving workers behavior; reviewer B2 asks for wider workers coverage, declined with this explicit authority. No new workers cross-process claim.

- Normal main integration: merge 19a677eced816061b3196ef8dffcbc0ccd8b5ad4 (#2529 and #2534), preserving both parents and all owner/coordinator work. #2529 relocates the shared prose carrier from CLI to MCP and changes carrier generation. Followed its canonical generated-carriers.md chain, including the Aspire surface manifest; MCP publish assets require the regenerated corpus hash. No implementation source conflicts. Automated relay's rebase/force-push suggestion is ignored under the explicit assignment rule.

- Owner requested another concrete CI repair after the previous READY handoff: both runtime tiers fail formatting of emitted triggers/runtime.ts, and test-2 identifies a private-type reference introduced by ChildHealthMonitor.trackProcess. Extend the declared surface to the existing shared-health type re-exports in plugins/workers/{bin/runtime.ts,worker/mod.ts}, plugins/sagas/src/runtime/mod.ts and plugins/triggers/src/runtime/mod.ts. These expose the already-public shared history contract required by the monitor signature; no worker supervisor behavior changes. The emitted-artifact formatting regression is added to the existing trigger resources test.
- This is an explicitly owner-requested post-handoff repair, rather than a new attempt to pass the closed feature evaluation loop. Keep the same independent evaluator and owner-selected model for the repair; record its supplemental exact-head review transparently without relabeling it as one of the original five rounds.
