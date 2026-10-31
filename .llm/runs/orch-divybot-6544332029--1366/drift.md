# Drift

- RTK is unavailable; use focused raw commands and structured wrappers.
- Owner's specific process overrides generic assignment footer: reference-only PR, no labels/milestones, CI scaffold.runtime requested in READY, stop without merge, final report file handoff.
- Declared write surface extended before implementation to plugins/{sagas,triggers}/src/adapter/resources/glue/runtime.stub.ts and canonical generated docs/publish carriers; necessary for automatic adoption in generated children. Do not hand-edit carriers.
- No new architectural debt accepted.

- PLAN-EVAL R1 identified generated --watch reload semantics missing from the initial design. Persist processId plus fatal-failure flag; count same-process reloads only after failure, and test healthy/failing generated watch reloads. Owner explicitly scopes this leaf to sagas/triggers and preserving workers behavior; reviewer B2 asks for wider workers coverage, declined with this explicit authority. No new workers cross-process claim.
