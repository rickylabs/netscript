# Research

## Verified baseline

- The worktree was clean at `25379a543` before this repair.
- The complete six-route AI router still compiles against the current contract in
  `packages/plugin-ai-core/tests/contracts/ai-contract-soundness_test.ts`.
- Commit `6c71f79fa` removed the router and changed its assertions; it did not repair the contract drift.
- `check:emitted-samples` currently collects only `install.starterResources` through
  `collectInstallArtifacts`, so resource-scaffolder defaults are outside the gate.
- The CI workflow enumerates quality commands and does not invoke the `ci:quality` aggregate.

## Collection findings

- The current install collection contains 23 logical TypeScript samples.
- The plugin `resources` collection contains 16 logical samples, producing the required total of 39.
- Install and add resources can intentionally produce identical paths and text within one plugin.
- Four resource scaffolders need explicit `defaultInput` values before they can participate generically:
  streams schema/producer/consumer and workers workflow.

## Public-surface decision

- The contract-bound `/v1/ai` router is restored in full.
- Runtime readonly values are copied to mutable wire values inside the emitted sample.
- No `plugin-ai-core` contract, package export, or JSR export-map change is needed.
- The `jsr-audit` skill is therefore not activated for this slice.

