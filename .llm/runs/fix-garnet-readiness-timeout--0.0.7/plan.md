# Plan: split the Garnet readiness timeout before repair

## Run Metadata

| Field            | Value                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| Run ID           | `fix-garnet-readiness-timeout--0.0.7`                                  |
| Branch           | `fix/garnet-readiness-timeout`                                         |
| Phase            | `plan` (S1 artifact-only)                                              |
| Target           | `packages/cli/e2e` Garnet listener-readiness evidence path             |
| Parent archetype | `6 — CLI / Tooling`                                                    |
| Scope overlay    | `docs` for S1 run artifacts; none for the later E2E diagnostic         |
| Base             | `8f1fcb2bc3b9b3ef57c222825f50ee2db43a2f1d` (`origin/main`, 2026-08-31) |

## Archetype

Archetype 6 applies because `@netscript/cli` owns the scaffold runtime harness. The nested
`packages/cli/e2e` workspace is not a separately published doctrine unit. S1 itself is a
run-artifact change under the docs overlay; the planned diagnostic changes no CLI command, generated
product, or public library surface.

## Current Doctrine Verdict

`packages/cli`: **Keep** — preserve the Archetype-6 kernel/surface split. Existing debt
`scaffold-runtime-a8-f16-1333` is relevant: the runtime gate directory has 12 immediate children, so
this plan adds no file or gate and edits the existing readiness verifier only.

## Axioms in Play

| Axiom | Why it matters                                                                                                                   |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| A8    | Reuse the existing bounded runtime verifier; do not add a thirteenth runtime child.                                              |
| A11   | Keep the two named health checks explicit; do not introduce a generic readiness abstraction before the failing axis is measured. |
| A13   | Preserve the original timeout as the primary failure and append diagnostic context without swallowing it.                        |
| A14   | A focused parser/failure-path test is necessary, while hosted Postgres-tier evidence remains the authoritative behavior proof.   |

## Goal

Capture the Garnet resource's per-check health detail at the `runtime.wait.garnet` failure point and
answer exactly one question: is `garnet_resp` unhealthy, is `test_only_garnet_resp` unhealthy, or
are both unhealthy? Stop after recording that result; write a new repair plan for the implicated
surface.

## Scope

- S1: commit only `plan.md`, `research.md`, and `worklog.md` in this run directory.
- After PR #1773 is sequenced: amend the existing listener readiness verifier so a failed aggregate
  wait captures and reports all health checks attached to the matching Garnet resource.
- Add focused tests proving a wait failure retains the original command failure and prints both
  named health reports when present.
- Run the exact hosted Postgres-tier observation at the diagnostic head and record the split in
  `research.md`/`worklog.md`.

## Non-Scope

- No timeout increase, retry-budget change, readiness bypass, or check removal.
- No repair to the real check or synthetic fixture before the split is observed.
- No `packages/cli/src/**`, generated asset, AppHost template, public API, or command change in this
  plan.
- No local Aspire, Docker, scaffold, `e2e:cli`, container, or runtime-resource operation.
- No overlap with PR #1773 until the supervisor explicitly sequences it.
- No PLAN-EVAL self-certification, PR creation, or merge/label operation.

## Locked Product Path Ceiling

**LOCKED: zero product paths.** This diagnostic plan may not modify any file under
`packages/cli/src/**`, `packages/cli/bin/**`, or generated scaffold assets.

After #1773 is sequenced, its code ceiling is exactly two existing E2E-harness paths:

1. `packages/cli/e2e/src/application/gates/scaffold/runtime/verify-listener-readiness.ts`
2. `packages/cli/e2e/tests/application/gates/listener-readiness-gates_test.ts`

No new runtime-directory child is allowed. Any need for a third code/test path, or any diagnosis
implicating the real product check, is a rescope and requires a revised plan before editing.

## Locked Decisions

| ID | Decision                                                                                                                         | Rationale                                                                                                                                             |
| -- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1 | Capture `aspire describe --format Json` on the failed wait path and report the matching resource's complete `healthReports` map. | The aggregate timeout alone cannot distinguish the checks; complete named reports also preserve host/port/error data for follow-up.                   |
| D2 | Preserve the original wait exit/error and attach the health snapshot as diagnostic context.                                      | Diagnostics must not turn an actual timeout into a false success or a different primary failure.                                                      |
| D3 | Do not hard-code a diagnosis or remove either check.                                                                             | The two possible outcomes require opposite repairs.                                                                                                   |
| D4 | Keep the 300-second budget unchanged.                                                                                            | The issue explicitly forbids a blanket increase, which would only hide the unsatisfied check.                                                         |
| D5 | Add no file and no gate; edit the existing verifier and its existing test module.                                                | The runtime directory is at its 12-child ceiling and carries open debt.                                                                               |
| D6 | Stop after the hosted split and re-plan the repair.                                                                              | Product versus fixture ownership cannot be selected safely before per-check evidence.                                                                 |
| D7 | Do not treat #1740 as causal from timing alone.                                                                                  | Both tiers' Garnet entries omit `Port`, so the proposed tier asymmetry is statically absent and the generated endpoint is unchanged for those inputs. |

## Open-Decision Sweep

| Decision                       | Status                                                                                 | Notes                                                                                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Which check is unhealthy?      | safe to defer through S1 and the diagnostic code slice; **must resolve before repair** | Resolved only by hosted per-check evidence.                                                                                                                   |
| Exact repair path              | safe to defer; **must resolve before repair**                                          | Test-only unhealthy means E2E fixture ownership; real unhealthy means product readiness ownership.                                                            |
| Host/port resolution follow-up | safe to defer until split                                                              | Inspect report `description`/`data` plus controller/DCP logs for the implicated check.                                                                        |
| #1740 endpoint-port lead       | resolved for static premise; contingent at runtime                                     | No Garnet `Port` differs by tier and unpinned generated output is unchanged. Reopen only if the real check fails with contradictory hosted endpoint evidence. |
| Timeout budget                 | resolved now                                                                           | No increase.                                                                                                                                                  |

## Design

### Public surface

- No published or command surface changes.
- The existing E2E-only `ListenerHealthReport`/readiness verifier remains internal to the harness.

### Domain vocabulary

- `ListenerHealthReport` — one named Aspire custom health report.
- `healthReports` snapshot — the complete named check map for the matched Garnet resource at the
  aggregate wait failure.
- `real` / `test-only` — `garnet_resp` and `test_only_garnet_resp`; these names remain explicit in
  evidence and are not merged into a new abstraction.

### Ports

- Existing `aspire wait` subprocess — authoritative aggregate wait.
- Existing `aspire describe --format Json` subprocess — read-only per-check evidence source.
- No new port/interface is introduced.

### Constants

- Existing `DEFAULT_LISTENER_WAIT_TIMEOUT_SECONDS = 300` remains byte-for-byte unchanged.
- Existing health keys remain `garnet_resp` and `test_only_garnet_resp`.

## Commit Slices

| # | Slice                                                                                                            | Proving gate                                                                                                                                                        | Files                            |
| - | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 1 | Record the no-diagnosis S1 research, locked diagnostic plan, measured base gates, collision, and proof standard. | Artifact review; base static gate table; `deno.lock` byte comparison.                                                                                               | the three run artifacts only     |
| 2 | After supervisor sequencing of #1773, preserve per-check health detail on the failed aggregate wait path.        | Focused structured test/check/lint/fmt; original timeout remains primary and both keys appear in the fixture.                                                       | the two locked E2E paths only    |
| 3 | Capture the hosted Postgres-tier split and stop before repair.                                                   | Hosted `deno task e2e:cli run scaffold.runtime --cleanup --format pretty --report .llm/tmp/e2e-report-scaffold-runtime.json`; per-check snapshot answers the split. | `research.md`, `worklog.md` only |

## Gate Table and Measured Base Baselines

| Order | Gate                                                      | Base result at `8f1fcb2bc`                                                       | Required after slice 2/3                                                                                                                                                                                                                                                                                                                                                 |
| ----- | --------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | Focused structured test wrapper on readiness/splice tests | PASS, 8/8                                                                        | PASS; add failure-path assertions without weakening current tests.                                                                                                                                                                                                                                                                                                       |
| 2     | Structured check on the two locked files                  | PASS, 2 selected, 0 diagnostics                                                  | PASS.                                                                                                                                                                                                                                                                                                                                                                    |
| 3     | Structured lint on the two locked files                   | PASS, 2/2 processed, 0 findings/refusals                                         | PASS.                                                                                                                                                                                                                                                                                                                                                                    |
| 4     | Structured format on the two locked files                 | PASS, 2/2 processed, 0 findings/refusals                                         | PASS.                                                                                                                                                                                                                                                                                                                                                                    |
| 5     | E2E workspace structured check                            | PASS, 185 files, 0 diagnostics                                                   | PASS if the supervisor requests workspace-wide static evidence.                                                                                                                                                                                                                                                                                                          |
| 6     | E2E workspace structured format                           | PASS, 185/185, 0 findings/refusals                                               | PASS if requested.                                                                                                                                                                                                                                                                                                                                                       |
| 7     | E2E workspace structured lint                             | REFUSAL, exit 2: detached fixture catalog `zod`; 0 findings                      | Do not call this PASS. Use the focused clean gate; any full-root sufficiency decision belongs to the supervisor.                                                                                                                                                                                                                                                         |
| 8     | Lock hygiene                                              | PASS; SHA-256 `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` | Byte-identical.                                                                                                                                                                                                                                                                                                                                                          |
| 9     | Hosted Postgres-tier diagnostic                           | NOT RUN by S1 constraint                                                         | Required to answer the split. Exact command: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty --report .llm/tmp/e2e-report-scaffold-runtime.json`. Instrument the failure path to persist pre-cleanup `aspire describe --apphost <exact-generated-apphost.mts> --format Json --non-interactive --nologo` and upload it plus `~/.aspire/logs/cli_*.log`. |
| 10    | Hosted fix-head proof                                     | NOT RUN; no repair exists                                                        | Required after the later repair plan.                                                                                                                                                                                                                                                                                                                                    |

## Authoritative Proof Standard

A unit test is necessary but not sufficient. Final repair acceptance requires all of the following:

1. The diagnostic failing-head run captures the status of both `garnet_resp` and
   `test_only_garnet_resp`, selecting the correct ownership path.
2. `runtime.wait.garnet` passes on the **Postgres tier** in a hosted `scaffold.runtime` run at the
   repair head.
3. #1747 and #1754 are rerun at that repair head and are green.
4. The 300-second timeout is not increased and neither check is bypassed.

## Risk Register

| Risk                                         | Mitigation                                                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| A fourth confident but unsupported diagnosis | Treat the split as unresolved until both named reports are captured.                                                 |
| Diagnostic masks the original failure        | Preserve wait error/exit as primary; attach bounded structured health context.                                       |
| Diagnostics race cleanup                     | Capture `describe` inside the failing gate before command return triggers suite cleanup.                             |
| Directory debt deepened                      | Add no file; edit the existing verifier.                                                                             |
| PR #1773 collision                           | S2 is blocked until supervisor sequencing; do not edit owned E2E paths now.                                          |
| Recency turns #1740 into a false diagnosis   | Keep its failed static premise in research; reopen only after real-check and contradictory hosted endpoint evidence. |
| A timeout increase hides the defect          | D4 locks the budget at 300 seconds.                                                                                  |
| Unit-only false confidence                   | Hosted Postgres-tier pass plus #1747/#1754 reruns is the proof bar.                                                  |

## Anti-Patterns to Resolve or Avoid

| AP        | Status             | Plan                                                                        |
| --------- | ------------------ | --------------------------------------------------------------------------- |
| AP-1 / A8 | existing debt risk | No new runtime child and no unrelated registry growth.                      |
| AP-18     | risk               | Assert semantic named reports and statuses, not a giant whole-log snapshot. |
| AP-25     | risk               | Aspire process access remains in the existing E2E runtime edge.             |

## Fitness and Debt Implications

| Item                                     | Disposition                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Static gates                             | Required through structured focused wrappers.                                         |
| Runtime/Aspire                           | Hosted diagnostic required; locally forbidden in S1.                                  |
| JSR/public-surface gates                 | N/A for this unpublished E2E diagnostic.                                              |
| `quality:gate` / full Archetype-6 matrix | N/A for S1 artifacts; re-evaluate only if later repair touches `packages/cli/src/**`. |
| `scaffold-runtime-a8-f16-1333`           | Do not deepen; no new file/gate. No debt entry is created or closed in S1.            |

## Deferred Scope

- The actual repair and its code paths, until the per-check split is measured.
- Stable release/canary work.
- Any general health-diagnostic refactor beyond the one failure path.

## Dependencies and Stop Conditions

- PR #1773 owns `packages/cli/e2e/**`; S2 stops pending supervisor sequencing.
- The exact 300451/300465 run/job identities are recorded. Their DCP/AppHost logs were runner-local
  and not uploaded, which is why a new pre-cleanup diagnostic capture is required.
- PLAN-EVAL disposition belongs to the supervisor. This generator does not self-certify.
- Any request for a hosted observation before diagnostic instrumentation should use the exact
  canonical command above and be supervisor-dispatched; this leaf holds no runtime lease.
