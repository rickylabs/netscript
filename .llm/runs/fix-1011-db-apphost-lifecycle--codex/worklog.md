# Worklog: preserve resident AppHost during database CLI operations

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1011-db-apphost-lifecycle--codex` |
| Branch | `fix/1011-db-apphost-lifecycle` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Design

### Public Surface

- `netscript db <operation>` behavior is preserved; no exported TypeScript signature changes.

### Domain Vocabulary

- `startedByInvocation: boolean` — explicit authority to stop the detached AppHost.
- resident AppHost — an AppHost successfully observed for the target path before DB start.

### Ports

- `AspireCommandExecutor` — existing process/test seam used for the liveness probe and lifecycle.

### Constants

- No new finite value group is required; existing Aspire argument literals remain local.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove detached cleanup is ownership-bound and resident AppHosts receive no `stop`. | targeted adapter tests + scoped check/lint/fmt + quality/arch | `operation-runner.ts`, `operation-runner_test.ts`, run artifacts |

### Deferred Scope

- Unique generated DB-operation AppHost identity/backchannel — template/scaffold expansion is not
  required for the concrete ownership defect.
- Live AppHost PID fixture — no runnable fixture is checked in; executor-seam integration coverage
  is the accepted bounded substitute.

### Contributor Path

Lifecycle changes start in `operation-runner.ts`; extend `FakeAspireExecutor` scenarios in the
adjacent test and assert exact Aspire commands before changing cleanup authority.

### Review Remediation Design — 2026-08-01

- **Public surface:** unchanged; all new contracts remain inside the database adapter folder and
  the E2E-only gate surface.
- **Domain vocabulary:** `AppHostLifecycleLock`, `AppHostLifecycleLease`, `LockRecord`, and
  `AspireAppHostAbsence` classification.
- **Ports/seams:** inject `AppHostLifecycleLock` through `DbOperationRunnerOptions`; the default
  file adapter owns `Deno.open`, pid liveness, timestamps, stale recovery, and removal.
- **Constants:** use `SCAFFOLD_DIRS.ASPIRE_GENERATED` for the already-ignored `.aspire` lock home;
  add one stable E2E gate id for resident DB lifecycle.
- **Slices:** S1 lock/race; S2–S3 probe diagnostics and coverage; S4 live gate; final gate/review
  artifact slice. Each slice gets its own commit and includes run-artifact progress.
- **Deferred:** distinct DB-operation identity/backchannel remains outside this review remediation;
  acceptance box 1 stays unticked.

Lock location evidence: the generated gitignore contains `.aspire/`, and the scaffold constants
define `ASPIRE_GENERATED: '.aspire'`. Selected path:
`aspire/.aspire/netscript-db-<sha256(normalized-apphost-path)>.lock`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 | bootstrap | research/design | Concrete unconditional `aspire stop` established; PLAN-EVAL pending. |
| 2026-08-01 | plan-eval | evaluator launch | Separate Qwen session `aa3c6460-8788-4e0d-b4c3-9b04fc11eb17` launched with the canonical route but failed authentication before evaluating. |
| 2026-08-01 | plan-eval | supervisor waiver | `WAIVED — evaluator transport unavailable, supervisor-approved`. The owner approved D1–D4 and authorized implementation without a fabricated formal verdict artifact. |
| 2026-08-01 | slice 1 | implementation | Added pre-start ownership probe, conditional cleanup, and resident/owned/failure/ambiguous-probe coverage. |
| 2026-08-01 | slice 1 | targeted gate | First run exited 1 on a fixture typo; second exited 1 on a stale poll-count expectation; final run passed 4 modules / 14 steps. |
| 2026-08-01 | slice 1 | supervisor review | Full diff approved: ownership fails closed, resident path has no stop, owned failure cleans up, studio is unchanged, and there is no cast/ignore/template/lock churn. |
| 2026-08-01 | slice 1 | reconcile | Issue #1011 remains open; PR #1027 retains `Closes #1011`, milestone 0.0.3, required taxonomy, and draft state. No rescope or debt change. |
| 2026-08-01 | review remediation | supervisor plan approval | Owner-waived evaluator; supervisor approved S1–S4 plan above. No formal PASS or `plan-eval.md` claimed. |
| 2026-08-01 | review remediation | research | Verified all four review findings, `.aspire/` gitignore coverage, injected-lock boundary, and existing `aspire-start.json` runtime metadata seam. |
| 2026-08-01 | remediation S1 | implementation | Added injected file/fake lifecycle lock, atomic create, pid/time/token record, dead/expired recovery, full detached-lifecycle lease, and non-masking release warning. |
| 2026-08-01 | remediation S1 | supervisor review | Focused tests passed 5 modules / 15 steps; corrected partial-write cleanup to close the handle before removal for Windows compatibility. |

## Gate Results

PLAN-EVAL: **WAIVED — evaluator transport unavailable, supervisor-approved**. The first evaluator
launch exited before evaluation with `Not logged in`; no verdict artifact exists or is claimed.

### Static Gates

| Gate | Command | Result | Notes |
| --- | --- | --- | --- |
| Adapter tests | `deno test -A packages/cli/src/kernel/adapters/database/` | PASS, exit 0 | 4 modules, 14 steps; earlier test-development exits 1 retained above. |
| Scoped check (requested spelling) | `...run-deno-check.ts --root packages/cli --ext ts,tsx --unstable-kv` | INVALID, exit 1 | Wrapper rejects `--unstable-kv`; it enables that flag by default. |
| Scoped check (supported equivalent) | `...run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS, exit 0 | 742 files, 7 batches; reports `deno check --quiet --unstable-kv`. |
| Scoped lint | `...run-deno-lint.ts --root packages/cli --ext ts,tsx` | PASS, exit 0 | 742 files, 4 batches, 0 findings. |
| Scoped format | `...run-deno-fmt.ts --root packages/cli --ext ts,tsx` | PASS, exit 0 | 742 files, 4 batches, 0 findings. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Code quality | PASS, exit 0 | `deno task quality:scan` | No findings; seven pre-existing allowed boundaries reported. |
| Doctrine fitness | PASS, exit 0 | `deno task arch:check` | Zero FAIL findings; repository-baseline WARN/INFO diagnostics only. |
| Manual A6 review | PASS | supervisor diff review | Private adapter/test change; no new public surface, casts, lint ignores, permissions, templates, or debt. |

### Runtime and Consumer Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Resident lifecycle seam | PASS | `never stops an AppHost that was already running` | Exact commands: `describe`, `start`, `describe`, `logs`; no `stop`. |
| Invocation-owned cleanup | PASS | success + non-zero status tests | `stop` is last command only after documented no-running probe. |
| Ambiguous probe | PASS | `fails closed when ... ambiguous` | Exact commands: `describe`; never reaches `start`. |
| Studio path | PASS | existing studio test | Zero detached output calls; interactive `run` spawn unchanged. |
| Full scaffold runtime | N/A | user instruction | Not run; no scaffold/template/generated output changed. |

## Handoff Notes

- Review the explicit `startedByInvocation` assignment and four ownership command sequences first.
  Formal PLAN-EVAL was owner-waived; no PASS artifact is claimed.
