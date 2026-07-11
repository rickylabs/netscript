# Worklog

## Design

- Public surface: test-internal `prepareLocalSourceFixture` and package-set constants; no package exports or CLI changes.
- Domain vocabulary: local-source package set, import entrypoint, fixture target (generated config/import-map), source base.
- Ports: filesystem operations remain direct because this is an executable e2e fixture; pure import resolution provides the unit seam.
- Constants: AI and Flow-B package sets name the finite mappings.
- Commit slices: one slice, as listed in `plan.md`, proven by unit/static/narrow-e2e gates.
- Deferred scope: published-source behavior, templates, product code, and full runtime suite.
- Contributor path: add an explicit entrypoint to the relevant named package set, then pass the desired generated target(s) to the helper.

## Process

- PLAN-EVAL waived in writing by the owner (drift D1); implementation proceeds after this design checkpoint.

## Evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Helper + affected e2e-layer tests | PASS | `deno test -A ...local-source-fixture_test.ts ...scaffold-gates_test.ts ...runtime-gates_test.ts`: 11 passed, 0 failed |
| Scoped check | PASS | `run-deno-check.ts --root packages/cli --ext ts,tsx`: 599 files, 0 failed batches/findings |
| Scoped lint | PASS | `run-deno-lint.ts --root packages/cli --ext ts,tsx`: 599 files, 0 findings |
| Scoped format | PASS | `run-deno-fmt.ts --root packages/cli --ext ts,tsx`: 599 files, 0 findings |
| Affected gate discovery | PASS | `deno task e2e:cli gates scaffold.runtime` lists both `scaffold.ui-local-source` and `runtime.flow-b-fixture` |
| Narrow gate-ID execution | N/A (CLI unsupported) | `deno task e2e:cli gates scaffold.ui-local-source runtime.flow-b-fixture` exits 2 because `gates` accepts exactly one suite and only lists its gates; `run` accepts only a suite and has no gate filter. Full `scaffold.runtime` is explicitly orchestrator-owned. See drift D2. |

## Reconcile

- Slice 1: issue/PR reconciliation is orchestrator-owned; this lane was explicitly told not to open a PR. Scope remains #606 with no product/template changes and no lock-file churn.
- Rebase follow-up (2026-07-11): fetched current `origin/main` at `7f7ed76b` (including #631 at `523a154a`) and rebased the slice. The only conflict was the import block in `prepare-flow-b-fixture.ts`; resolution retains both helpers. Published mode now uses `configurePublishedWorkersBlock()` from #631, while local mode uses `prepareLocalSourceFixture()` from this slice.

## Post-rebase evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Helper + affected e2e-layer tests | PASS | Local-source helper, #631 published-workers helper, scaffold gates, and runtime builder tests: 13 passed, 0 failed |
| Scoped check | PASS | `run-deno-check.ts --root packages/cli --ext ts,tsx`: 601 files, 0 failed batches/findings |
| Scoped lint | PASS | `run-deno-lint.ts --root packages/cli --ext ts,tsx`: 601 files, 0 findings |
