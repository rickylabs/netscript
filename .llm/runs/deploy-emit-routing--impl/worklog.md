# Worklog: deploy emit routing

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `deploy-emit-routing--impl` |
| Branch | `fix/deploy-emit-routing` |
| Baseline | `origin/main` at `850cc7757d11d420b9061dbe6a61536357ab77fe` |
| Lane | Codex · OpenAI · GPT-5.6 Sol · medium (`normal_implementation`) |
| Archetype | 6 — CLI / Tooling |
| Scope overlays | none |

## Design

The supervisor resumed the lane and explicitly directed implementation after reviewing the earlier
adapter-semantics stop. This supersedes the precondition stop recorded below.

### Public Surface

- `netscript deploy <target> emit` is routed for every adapter that advertises `emit`.
- Router construction rejects advertised operations it cannot route instead of silently omitting
  them.

### Domain Vocabulary

- `DeployTargetOperation` — the finite deploy-operation vocabulary.
- `DeployTargetPort.operations` — operations advertised by a target.
- `ROUTED_OPERATIONS` — operations for which the target command creates subcommands.

### Ports

- `DeployTargetPort` — existing target capability contract; no new port planned.
- `ProcessPort` — existing external-process seam used by meaningful Aspire artifact emission.

### Constants

- `ROUTED_OPERATIONS` — router vocabulary, now including `emit`.
- `OPERATION_DESCRIPTIONS` — existing complete description table.
- `ROUTED_OPERATION_NAMES` — lookup used by the routing invariant.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | RED invariant test proving advertised operations must be routable | affected deploy tests | `a3e135c6872c55a9c2bfae7d37837adf89034c4e` |
| 2 | Route `emit`, reject divergence, and prove the invariant GREEN | scoped check/test/lint/fmt + `quality:gate` | pending commit |

### Deferred Scope

- Adapter operation semantics remain unchanged; the supervisor explicitly bounded this slice to
  routing and divergence detection.

### Contributor Path

Add a new public deploy operation to `DeployOperation`, describe and route it in
`target-deploy-command.ts`, implement it on advertising targets, and extend the default-target
invariant test. An advertised legacy or otherwise unrouted operation now fails during command
construction.

## Progress Log

| Date (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-02 | preflight | baseline | Fresh fetch and fast-forward confirmed `HEAD == origin/main == 850cc775`. |
| 2026-09-02 | preflight | issue | Read #1544 in full and confirmed its acceptance criteria. |
| 2026-09-02 | preflight | adapter verification | Compose `emit` invokes `aspire publish`; Kubernetes/Azure cloud `emit` does too. |
| 2026-09-02 | blocked | adapter verification | Bare-metal service `emit` only returns `#result('emit', request)` and creates no artifact. Cloud Run `emit` aliases a `plan` that only returns a command string and performs no emission. The brief explicitly requires stopping if any advertised implementation is not meaningful. |
| 2026-09-02 | resumed | supervisor ruling | Supervisor explicitly directed RED → bounded implementation → GREEN and thereby accepted the existing adapter semantics for this routing slice. |
| 2026-09-02 | S1 | RED | Structured test wrapper exited 1: 7 passed, 1 failed. `azure-aca` advertised `emit`, but its generated command verbs omitted it. |
| 2026-09-02 | S1 | RED commit | `a3e135c6872c55a9c2bfae7d37837adf89034c4e`. |
| 2026-09-02 | S2 | implementation | Added `emit` to the routed operations and a runtime invariant covering description-without-route and advertised-without-route divergence. |
| 2026-09-02 | S2 | negative guard | A synthetic adapter advertises legacy `build`; the test proves command construction throws `advertises unrouted operations: build`. |
| 2026-09-02 | S2 | GREEN | Affected deploy tests pass: 11 passed, 0 failed. |
| 2026-09-02 | S2 | reconcile | #1544 remains open; implementation satisfies all acceptance boxes pending PR/CI/evaluator evidence. No scope expansion or unrelated issue changes. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Supersede the precondition stop and route `emit` | The supervisor explicitly resumed the lane with an implementation directive after the stop report. | supervisor resume |
| PLAN-EVAL: N/A | The router/table repair is mechanically scoped and the issue supplies the contract, acceptance criteria, and gates. | harness run-loop §4 |
| Preserve RED and GREEN as separate commits | The issue requires a non-vacuous regression demonstration and both SHAs. | implementation brief |
| Fail fast on future divergence | Silent intersection filtering caused the defect; construction-time validation makes unsupported advertisements detectable in production and tests. | #1544 acceptance |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Initial adapter-semantics stop was superseded by the supervisor resume. | significant | no — authorized run-dir scope permits only `worklog.md` |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| RED test | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/public/features/deploy/target/target-deploy-command_test.ts` | FAIL (expected) | exit 1; 7 passed, 1 failed; first mismatch `azure-aca`: advertised `emit`, route absent. |
| source check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/src --ext ts` | PASS | exit 0; 711 files, 6 batches, 0 failed batches/findings. |
| affected tests | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/public/features/deploy/target/target-deploy-command_test.ts packages/cli/src/public/features/deploy/list/list-deploy-targets_test.ts` | PASS | exit 0; 11 passed, 0 failed. |
| lint | `run-deno-lint.ts` with the two touched files and an isolated temporary config | PASS | exit 0; 2 selected/processed, 0 dropped/refused/findings. Root config excludes `packages/cli/**`, so the initial root-config run correctly refused coverage and was not used as evidence. |
| format | `run-deno-fmt.ts` with the two touched files and an isolated temporary config | PASS | exit 0; 2 selected/processed, 0 dropped/refused/findings after formatting exactly those files. Root config excludes `packages/cli/**`, so the initial root-config run was not used as evidence. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| code quality + doctrine | PASS | `deno task quality:gate`, exit 0 | Quality scan found 0 issues; doctrine reported no failures. Existing repository warnings remain outside this slice. |
| JSR surface | N/A | no export, metadata, or JSDoc change | Routing-only internal command-table change. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| full `e2e:cli` | N/A | explicitly excluded | Not run. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `deploy <target> emit` | PASS | target command tests | Default targets expose exactly their advertised operations; direct fake-adapter invocation records `emit`. |
| advertised/unrouted negative | PASS | target command tests | Synthetic advertised `build` is rejected rather than silently filtered. |

## Handoff Notes

- Review `assertDeployRoutingInvariant` beside the command table first.
- RED commit: `a3e135c6872c55a9c2bfae7d37837adf89034c4e`.
- GREEN implementation commit: pending.
- Full `e2e:cli` was deliberately not run per the supervisor's gate selection.
