# Worklog: Garnet readiness timeout S1 diagnosis

## Run Metadata

| Field            | Value                                                                |
| ---------------- | -------------------------------------------------------------------- |
| Run ID           | `fix-garnet-readiness-timeout--0.0.7`                                |
| Branch           | `fix/garnet-readiness-timeout`                                       |
| Base             | `8f1fcb2bc3b9b3ef57c222825f50ee2db43a2f1d`                           |
| Parent archetype | `6 — CLI / Tooling`                                                  |
| Scope overlay    | `docs` for S1 artifacts                                              |
| Constraint       | S1 artifact-only; static, package-level, read-only measurements only |

## Design

### Public Surface

- S1 changes no product, test, generated, command, or published surface.
- The future diagnostic is internal to the unpublished CLI E2E harness and preserves the existing
  command/gate vocabulary.

### Domain Vocabulary

- `ListenerHealthReport` — existing E2E representation of one named Aspire health report.
- `healthReports` failure snapshot — complete per-check state on the matched Garnet resource.
- `garnet_resp` — real generated Garnet readiness check.
- `test_only_garnet_resp` — synthetic fixture check attached to the same resource.
- `split` — the observed classification: real-only, test-only-only, or both unhealthy.

### Ports

- Existing `aspire wait` subprocess seam for aggregate readiness.
- Existing `aspire describe --format Json` subprocess seam for per-check detail.
- No new application port, network service, file protocol, or dependency.

### Constants

- `DEFAULT_LISTENER_WAIT_TIMEOUT_SECONDS = 300` — locked unchanged.
- `garnet_resp` and `test_only_garnet_resp` — named evidence keys, locked unchanged.
- Diagnostic code ceiling — two existing E2E paths; zero product paths.

### Locked Path Ceiling

- S1: only this run's `plan.md`, `research.md`, and `worklog.md`.
- Future diagnostic, after #1773 sequencing:
  - `packages/cli/e2e/src/application/gates/scaffold/runtime/verify-listener-readiness.ts`
  - `packages/cli/e2e/tests/application/gates/listener-readiness-gates_test.ts`
- No new `runtime/` child and no `packages/cli/src/**` path.

### Commit Slices

| # | Slice                                                                        | Gate                                                                 | Files                          |
| - | ---------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------ |
| 1 | S1 no-diagnosis artifact set with measured base evidence and collision stop. | Artifact review, static base gates, lock comparison.                 | the three run artifacts        |
| 2 | Future failed-wait per-check capture after supervisor sequencing.            | Focused structured tests/check/lint/fmt.                             | two locked E2E paths           |
| 3 | Supervisor-dispatched hosted Postgres-tier split.                            | Canonical one-pass `scaffold.runtime`; exact named reports captured. | research/worklog evidence only |

### Deferred Scope

- Repair implementation — the implicated ownership surface is unknown.
- Runtime execution — this leaf has no lease.
- Timeout changes — forbidden, not deferred.
- PLAN-EVAL and PR disposition — supervisor-owned.

### Contributor Path

Start at `verify-listener-readiness.ts`: preserve the failed aggregate wait, capture the matching
resource's `healthReports`, and prove the behavior in `listener-readiness-gates_test.ts`. Read the
two named statuses before opening either the real-check generator or synthetic fixture. If the
result requires any path outside the locked ceiling, stop and revise the plan.

## Progress Log

| Time (UTC)        | Slice | Step                     | Notes                                                                                                                                                                                                           |
| ----------------- | ----- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-31T19:00Z | S1    | Harness/bootstrap        | Read harness activation/run-loop, plan gate, lane policy, Archetype 6, docs overlay, doctrine, Aspire, CLI, tools, PR, and RTK instructions. `rtk` was unavailable on host; focused `rg` and raw Git were used. |
| 2026-08-31T19:01Z | S1    | Re-baseline              | `HEAD`, `origin/main`, and merge base all `8f1fcb2bc`; clean worktree; target remote branch absent.                                                                                                             |
| 2026-08-31T19:02Z | S1    | First measurement        | Found the failure-path evidence gap: aggregate wait throws before `describe`; no per-check split is present in checked-in artifacts. Diagnosis deliberately withheld.                                           |
| 2026-08-31T19:03Z | S1    | Collision                | PR #1773 remains live and owns `packages/cli/e2e/**`; future diagnostic code stops pending supervisor sequencing.                                                                                               |
| 2026-08-31T19:04Z | S1    | Aspire coordination      | Sent read-only request for both exact run/job pairs plus DCP/per-check logs; did not dispatch runtime.                                                                                                          |
| 2026-08-31T19:05Z | S1    | Base gates               | Measured structured package/focused static gates and tests; recorded broad lint refusal honestly; lock remained unchanged.                                                                                      |
| 2026-08-31T19:05Z | S1    | Design checkpoint        | Locked zero product paths, two future E2E paths, no new file, no timeout increase, and hosted proof standard.                                                                                                   |
| 2026-08-31T19:06Z | S1    | Aspire evidence returned | Recorded exact run/job/head identities. Both uploaded artifacts contain aggregate timeout only; referenced Aspire logs were runner-local and not uploaded.                                                      |
| 2026-08-31T19:15Z | S1    | #1740 lead tested        | Both tier paths provision Garnet `Mode: Auto` without `Port`; unpinned generated endpoint is unchanged across #1740. Lead retained only as a contingent real-check runtime question.                            |

## Decisions

| Decision                           | Reason                                                                       | Source                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| No diagnosis in S1                 | Timeout alone cannot select the real versus synthetic check.                 | Leaf brief plus static verifier control flow.                 |
| Diagnostic before repair           | The two outcomes imply opposite ownership and repair paths.                  | Leaf acceptance contract.                                     |
| Zero product path ceiling          | Product involvement is unproven; a diagnostic does not need product changes. | Plan D3/D6 and doctrine boundary.                             |
| Edit existing verifier only        | Runtime directory is already at 12 immediate children.                       | Debt `scaffold-runtime-a8-f16-1333`; measured tree.           |
| Keep 300 seconds                   | A larger budget hides an unsatisfied condition and is explicitly forbidden.  | Leaf constraint.                                              |
| Hosted proof remains authoritative | Local/unit evidence cannot reproduce the Postgres-tier aggregate.            | Leaf proof standard.                                          |
| #1740 is not a diagnosis           | Its required `entry.Port` tier difference is absent at both failing heads.   | Static tier/config and parent-to-commit generator comparison. |

## Drift

| Drift                                                                                           | Severity                 | Disposition                                                                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------- |
| `rtk` named by repo guidance is not installed on this host.                                     | minor                    | Used focused `rg` and raw Git; no evidence claim depends on filtered output.                       |
| Broad E2E-root lint cannot produce a verdict because detached fixture catalog resolution fails. | minor baseline           | Recorded as REFUSAL, not PASS/FAIL; focused two-file lint is clean. No source or lock workaround.  |
| Exact run/job IDs were recovered, but DCP/AppHost logs were runner-local and not uploaded.      | significant evidence gap | Record exact missing paths and require pre-cleanup `describe` plus log upload; still no diagnosis. |

## Gate Results

### Static Gates

| Gate                   | Command or check                                              | Result           | Notes                                                                                        |
| ---------------------- | ------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| E2E workspace check    | structured check wrapper, root `packages/cli/e2e`, `--ext ts` | PASS             | 185 files, 2 batches, 0 diagnostics.                                                         |
| E2E workspace format   | structured format wrapper, same root                          | PASS             | 185 selected/processed, 0 findings/refusals.                                                 |
| E2E workspace lint     | structured lint wrapper, same root                            | REFUSAL (exit 2) | Detached `desktop-native` fixture lacks catalog `zod`; 0 lint findings; no false PASS claim. |
| Diagnostic-path check  | structured check wrapper on two locked files                  | PASS             | 2 files, 0 diagnostics.                                                                      |
| Diagnostic-path lint   | structured lint wrapper on two locked files                   | PASS             | 2/2 processed, 0 findings/refusals.                                                          |
| Diagnostic-path format | structured format wrapper on two locked files                 | PASS             | 2/2 processed, 0 findings/refusals.                                                          |
| Lock hygiene           | base diff plus SHA-256                                        | PASS             | `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`; byte-identical.          |

### Focused Tests

| Gate                                     | Result | Evidence                                                             |
| ---------------------------------------- | ------ | -------------------------------------------------------------------- |
| readiness expectation and fixture splice | PASS   | Structured test wrapper: 8 passed, 0 failed across two test modules. |

### Fitness Gates

| Gate                 | Result      | Evidence                                                                        | Notes                                                  |
| -------------------- | ----------- | ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Source alignment     | PASS        | Every S1 claim maps to checked-in code/doctrine or is labeled supplied/pending. | Docs overlay.                                          |
| Scope separation     | PASS        | S1 evidence, future diagnostic, and later repair are explicitly separate.       | No target-state diagnosis represented as current fact. |
| F-16 / existing debt | PASS for S1 | Runtime directory measured at 12 children; S1 adds none.                        | Future diagnostic may not add a file.                  |
| JSR/public surface   | N/A         | No published surface.                                                           | Re-evaluate only after a product rescope.              |

### Runtime Gates

| Gate                                  | Result  | Evidence                                                | Notes                                                              |
| ------------------------------------- | ------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| per-check Postgres-tier split         | NOT RUN | Existing runs/artifacts inspected; named detail absent. | Exact future command and pre-cleanup capture are recorded in plan. |
| `runtime.wait.garnet` hosted fix head | NOT RUN | No repair exists.                                       | Required later; unit test insufficient.                            |
| #1747/#1754 reruns                    | NOT RUN | No repair exists.                                       | Both must be green at repair head.                                 |

## PLAN-EVAL Disposition

Pending supervisor disposition. This generator has not evaluated or certified its own plan, has not
started implementation, and has not opened a PR.

## Handoff Notes

1. Read `research.md` **First measurement** first: the split is unresolved because current code
   discards it, not because either check has been exonerated.
2. Sequence PR #1773 before allowing any `packages/cli/e2e/**` edit.
3. Use the recorded run/job identities; do not search the uploaded suite artifacts again. They lack
   per-check detail, and the referenced Aspire logs were not uploaded.
4. Treat #1740 as tested but unsupported: no tier-specific Garnet `Port` exists. Reactivate it only
   if the real check fails and hosted endpoint evidence contradicts the static path.
5. Dispatch the canonical hosted Postgres-tier diagnostic only after the two-path instrumentation
   exists; then record both named statuses and stop before repair.
6. Any product repair requires a revised, separately evaluated plan. Do not increase the timeout.
