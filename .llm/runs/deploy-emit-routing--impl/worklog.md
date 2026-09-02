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

- Proposed surface: `netscript deploy <target> emit`.
- Current surface remains unchanged.

### Domain Vocabulary

- `DeployTargetOperation` — the finite deploy-operation vocabulary.
- `DeployTargetPort.operations` — operations advertised by a target.
- `ROUTED_OPERATIONS` — operations for which the target command creates subcommands.

### Ports

- `DeployTargetPort` — existing target capability contract; no new port planned.
- `ProcessPort` — existing external-process seam used by meaningful Aspire artifact emission.

### Constants

- `ROUTED_OPERATIONS` — proposed router vocabulary, not changed because the precondition failed.
- `OPERATION_DESCRIPTIONS` — existing complete description table.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | RED invariant test proving advertised operations must be routable | affected deploy tests | not started |
| 2 | Route `emit` and prove the invariant GREEN | scoped check/test/lint/fmt | not started |

### Deferred Scope

- Implementing real service-target artifact emission is outside the authorized slice.
- Defining meaningful Cloud Run emission rather than returning a plan string is outside the
  authorized slice.

### Contributor Path

Resolve the capability semantics in the target adapters first; only then add `emit` to the router
and keep the advertised-versus-routed invariant beside `target-deploy-command.ts`.

## Progress Log

| Date (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-02 | preflight | baseline | Fresh fetch and fast-forward confirmed `HEAD == origin/main == 850cc775`. |
| 2026-09-02 | preflight | issue | Read #1544 in full and confirmed its acceptance criteria. |
| 2026-09-02 | preflight | adapter verification | Compose `emit` invokes `aspire publish`; Kubernetes/Azure cloud `emit` does too. |
| 2026-09-02 | blocked | adapter verification | Bare-metal service `emit` only returns `#result('emit', request)` and creates no artifact. Cloud Run `emit` aliases a `plan` that only returns a command string and performs no emission. The brief explicitly requires stopping if any advertised implementation is not meaningful. |
| 2026-09-02 | resumed | supervisor ruling | Supervisor explicitly directed RED → bounded implementation → GREEN and thereby accepted the existing adapter semantics for this routing slice. |
| 2026-09-02 | S1 | RED | Structured test wrapper exited 1: 7 passed, 1 failed. `azure-aca` advertised `emit`, but its generated command verbs omitted it. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Supersede the precondition stop and route `emit` | The supervisor explicitly resumed the lane with an implementation directive after the stop report. | supervisor resume |
| PLAN-EVAL: N/A | The requested router/table repair is mechanically scoped and the issue already supplies contract, acceptance, and gates; implementation is blocked earlier by source verification. | harness run-loop §4 |
| Preserve RED and GREEN as separate commits | The issue requires a non-vacuous regression demonstration and both SHAs. | implementation brief |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Initial adapter-semantics stop was superseded by the supervisor resume. | significant | no — authorized run-dir scope permits only `worklog.md` |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| RED test | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/public/features/deploy/target/target-deploy-command_test.ts` | FAIL (expected) | exit 1; 7 passed, 1 failed; first mismatch `azure-aca`: advertised `emit`, route absent. |
| check/test/lint/fmt | not run | NOT_RUN | No package files changed. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Archetype 6 / quality gate | N/A | no implementation | No package changes to evaluate. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| full `e2e:cli` | N/A | explicitly excluded | Not run. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `deploy <target> emit` | NOT_RUN | blocked preflight | Public surface was not changed. |

## Handoff Notes

- `AspireComposeDeployTarget.emit()` is meaningful: it invokes `aspire publish --output-path`.
- `AspireCloudDeployTarget.emit()` is meaningful for AppHost-backed Kubernetes/Azure targets, but
  not for `cloud-run`, where it returns the plan string without executing or writing an artifact.
- `ServiceDeployTarget.emit()` is descriptor-only for both default service targets; existing tests
  explicitly characterize these targets as descriptors whose handlers return descriptor results.
- The supervisor must decide whether to narrow `emit` advertisement by target or expand this issue
  to implement real service/Cloud Run emission before routing the verb.
