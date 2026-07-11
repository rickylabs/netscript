# Worklog — #638 root SDK imports

## Plan

- Confirm issue #638 acceptance and trace root import-map mutation for official plugins.
- Add a red regression guard that scans root-level scaffold source imports and proves resolution in both `jsr` and local package-source modes.
- Align worker root imports with the scaffold resolver's SDK key set, then run focused tests and scoped package gates.
- Commit and push to `fix/638-scaffold-root-sdk-imports`; do not open a PR.

PLAN-EVAL is owner-waived for this slice (drift D1 in the brief). The separate-session implementation evaluator and full `scaffold.runtime` live verdict remain owned by the beta-7 orchestrator/CI.

## Design

- **Archetype:** Archetype 6 — CLI/tooling. `packages/cli` owns user-run scaffold and plugin-install flows; this change stays in the existing kernel scaffold adapter and its focused tests.
- **Public surface:** no exported symbol, entry point, or CLI command changes. Generated root `deno.json` behavior changes so root-level scaffold code resolves its declared bare imports.
- **Domain vocabulary:** root-level scaffold source, bare NetScript specifier, package-source mode, root import map.
- **Ports:** existing `FileSystemPort` through `PluginWorkspaceMutator`; no new port or abstraction.
- **Constants:** reuse `SCAFFOLD_PACKAGES`, `SCAFFOLD_WORKSPACE_PACKAGES`, and existing package-source marker. Add SDK entries to the existing finite worker root-import declaration.
- **Commit slice:** one bounded defect + guard slice touching `workspace-mutator.ts`, its focused test, and this run artifact. Proof: red-before/green-after guard, affected template/unit tests, scoped check/lint.
- **Deferred scope:** no full `scaffold.runtime` run locally; CI/orchestrator owns that expensive merge-readiness and live Aspire verdict. No unrelated import-map refactor.
- **Contributor path:** add or change root-level scaffold sources, then extend the scanner roots only when a new root-level generated directory is introduced; the guard reports the unresolved bare specifier and source mode.
- **Doctrine impact:** A14 is strengthened by a static regression gate. No public-surface expansion, new layering seam, folder change, or architecture debt. AP-9/AP-18 are avoided by extending the existing registry and asserting parsed semantics rather than snapshotting generated output.

## Evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Guard red-before | Expected failure | `deno test --allow-read packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts`: 12 passed, 1 failed; worker root map returned `undefined` for `@netscript/sdk` instead of `jsr:@netscript/sdk@0.0.1-beta.7`. |
| Guard green-after + affected templates | PASS | Focused `deno test` over workspace mutator, root workspace generator, app config generator, and route templates: 31 passed (33 steps), 0 failed. Final focused mutator rerun after broadening the guard to scan real worker jobs/contracts plus the runtime fixture: 13 passed, 0 failed. |
| Scoped check | PASS | `run-deno-check.ts --root packages/cli --ext ts,tsx`: 599 files, 5 batches, 0 failed batches/occurrences. |
| Scoped lint | PASS | `run-deno-lint.ts --root packages/cli --ext ts,tsx`: 599 files, 3 batches, 0 occurrences. |
| Full `scaffold.runtime` | Deferred by brief | Not run locally. The PR CI scaffold-runtime job is the live merge-readiness/Aspire verdict owned by the orchestrator. |

## Reconcile

- Issue #638 acceptance remains unchanged. The implementation adds the two missing worker root aliases and a semantic two-mode resolver guard. No PR was opened or updated, per the brief.
- No plan/doctrine divergence beyond owner-waived PLAN-EVAL D1; no new or deepened architecture debt.
