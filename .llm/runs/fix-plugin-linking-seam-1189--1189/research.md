# Research — fix-plugin-linking-seam-1189--1189

## Re-baseline

- Authority: live issue #1189, read before branch or source work.
- Baseline: `canary/0.0.5-canary.13` @ `44d2635e1ddae0e082a027672b4fb18b8945d0e0`.
- Carried brief: absent from the target tree; recovered read-only from historical commit `dd627fe3b`.
- Issue-over-brief differences: target is the canary train, branch is owner-specified, and a fixture
  third-party plugin is the non-negotiable seam proof. #1093 remains open, so no fixture from it is
  available to reuse on this baseline.

## Findings

| # | Finding | Verification |
| - | ------- | ------------ |
| 1 | Published manifest schema has `provider` and `officialSource`, but no generic linking contract. | `packages/plugin/src/protocol/manifest.ts` |
| 2 | Reconciler rejects manifests without `officialSource`. | `plugin-reference-reconciler.ts:parseDeclaration` |
| 3 | Reconciler discovers companion resources using the `-api` suffix. | `plugin-reference-reconciler.ts:readInstalledDeclarations` |
| 4 | Reconciler mutates only `Plugins` and `BackgroundProcessors`; `Services` and `Apps` are absent. | `AppsettingsShape` and writeback |
| 5 | Install, remove, and Aspire helper regeneration already call the same reconciler. | public/local install, remove, service workspace mutator |
| 6 | Service lifecycle regeneration calls reconciliation, providing the late-consumer convergence hook. | `regenerateAspireHelpers()` |
| 7 | Existing tests prove official plugin-to-plugin behavior only. | `plugin-reference-reconciler_test.ts` |

## jsr-audit surface scan

- `@netscript/plugin` exports the manifest interfaces and parser; adding `linking` is a published
  contract change requiring explicit documented types and schema validation.
- Keep schema version 1 only if the field is optional and backward compatible; old manifests must
  parse unchanged. No inferred exported types or new entrypoints.
- Required gates: full export-map doc lint, package dry-run/slow-type check, scoped checks, and
  consumer compilation through CLI fixtures.

## Open questions

- None before implementation. The fixture owns arbitrary identifiers and both service/app consumer
  names; wildcard semantics are intentionally not invented.
