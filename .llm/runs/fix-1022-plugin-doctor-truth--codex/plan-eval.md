# PLAN-EVAL — fix-1022 plugin doctor truth

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

Issue: rickylabs/netscript#1022 · Branch: `fix/1022-plugin-doctor-truth` · Base `3ab64720f`

Context: the first slice turn was cut off mid-research at 21:17 with zero commits and no `plan.md`. Rather than pay for a second research cycle, the supervisor re-derived the cause from source directly and issued a **locked, pre-approved scope** (S1–S6 in the resume brief). This document evaluates that locked scope with the same rigour an independent evaluator would apply to a slice-authored plan — including the parts the supervisor specified, which are the parts most at risk of going unquestioned.

## Plan-Gate checklist

| # | Check | Verdict | Evidence |
| - | --- | --- | --- |
| 1 | Cause independently re-derived, not accepted from the issue | PASS | Supervisor read `doctor-plugin-use-case.ts` and `doctor-plugin-command.ts` in the worktree. The issue's stated cause (tautology at line 158) is confirmed verbatim but is **incomplete**: `renderDoctorReports` prints and returns with no exit-code path, so an `error` status already produced today would still exit 0. Recorded in the brief as "the issue understates this". |
| 2 | Cause matches the shipped artefacts | PASS | `NetScriptPlugin.doctor` with `extraChecks` exists (`packages/plugin/src/adapter/contract.ts`) and is executed by `runDoctorCommand` (`packages/plugin/src/adapter/commands/doctor.ts`). `plugins/workers/src/adapter/plugin.ts:39` and `plugins/sagas/src/adapter/plugin.ts:35` declare `doctor` with no `extraChecks`. The seam is built and empty exactly as the issue claims. |
| 3 | Fix direction bounded to what can be evidenced | PASS | S1–S6 cover issue boxes 1,2,3,5,7. Boxes 4 and 6 (live AppHost resource validation; "no AppHost" vs "AppHost unhealthy") are explicitly excluded as needing a running AppHost, with an instruction to leave them unticked and state why. Partial coverage declared up front beats a tick that `close-gate` cannot substantiate. |
| 4 | Blast radius bounded and stated | PASS | Touched roots: `packages/cli` (doctor feature), `packages/plugin` (contract consumers only), `plugins/workers`, `plugins/sagas`. No scaffold output or `scaffold.runtime.json` change is anticipated, which is why the expensive `e2e:cli run scaffold.runtime` is excluded. If the slice does touch scaffold output, that exclusion is void — flagged in the brief. |
| 5 | Regression is catchable after the fix, ungated | PASS | S5 requires an ungated, DB-free test asserting **the exit code**, not only the report object. The exit path is the untested half; a test that only asserts `status === 'error'` would go green while the shipped command still exits 0. |
| 6 | R-PLUGIN-THIN respected | PASS (qualified — C1) | S4 puts domain knowledge (registry shape, declared-job registration) in the plugin's `extraChecks` and keeps execution machinery in core. The named anti-pattern — extending the core-side `cli.doctorChecks` string union (`resolved-config.ts:166`) with workers/sagas-specific ids — is explicitly forbidden, because that is how core reacquires plugin knowledge. |
| 7 | The load-bearing unknown is named rather than assumed | **WEAK — C1** | The host-side CLI use case has **no** path today that executes plugin-contributed `DoctorReport`s; `runDoctorCommand` is reached only through the plugin's own CLI runner (`plugin-cli-runner.ts`). The brief asserts a bridge is buildable without specifying it. This is the one genuinely unscoped element of the plan and the most likely place for it to over- or under-run. |
| 8 | Validation scoped, no gratuitous expensive suites | PASS | `run-deno-check.ts` across the four roots (without `--unstable-kv`, which the wrapper rejects), lint/fmt, targeted tests. `e2e:cli run scaffold.runtime` excluded with a stated condition for reinstating it. |
| 9 | The discoverability bar is carried into the change | PASS | The owner's acceptance bar for this cluster is that an agent can *find and act on* the tool — `plugin doctor` was invoked zero times across five agent runs. The brief requires every failing check message to name its remediation command. A doctor that reports a true failure an agent cannot act on has not cleared the bar this issue exists to clear. |
| 10 | Issue treated as a lead, not a diagnosis | PASS | The brief instructs the slice to verify the cause and record `drift.md` if measurement differs, despite handing it a supervisor-verified ground truth — the ground truth is a starting point, not a substitute for measurement. |

## Conditions

- **C1 (mandatory) — the S4 bridge is the risk, and it decides whether box 3 is real.** Contributed checks that live in `plugins/{workers,sagas}` but are never executed by `netscript plugin doctor` do **not** satisfy acceptance box 3: the entire defect is an unused seam, so adding a second unused seam reproduces it. The slice must either wire contributed checks through to the rendered host-side report, or stop and report that the bridge is larger than the slice. Faking it via the core-side `cli.doctorChecks` union is a fail.
- **C2 (mandatory) — assert the exit code.** S5 must assert non-zero exit, not merely `status === 'error'`.
- **C3 (mandatory) — no unevidenced ticks.** Boxes 4 and 6 stay unticked with a stated reason in the PR body. If S6 cannot be done because the config loader swallows the `ZodError` before the doctor sees it, box 5 stays unticked too.

## Where this plan is only as good as the supervisor's framing

Stated plainly, because the supervisor wrote the scope it is evaluating:

1. **The S4 bridge was specified as an outcome, not a mechanism.** Row 7 above is WEAK for that reason. It is mitigated by an explicit stop-and-report instruction rather than resolved.
2. **Excluding boxes 4 and 6 is a supervisor judgement call, not a measurement.** It is very likely right — both need a live AppHost — but no one has measured how expensive box 6 actually is. If the slice finds box 6 cheap once the exit-code path exists, taking it is an improvement, not scope creep.
3. **Preferring deletion of the tautological check over a cosmetic downgrade is an opinion.** It is the supervisor's, not the issue's; the issue permits either. The slice was told to justify its choice rather than obey.

## Verdict

PASS, conditional on C1, C2 and C3. C1 is load-bearing: without a real bridge this fix closes the tautology and the exit code — genuine value — but leaves the issue's central complaint, that no plugin contributes a check that anyone runs, exactly where it was.

## Addendum — evaluation of the slice's `plan.md` as written (21:49)

The slice's plan was read after this verdict was drafted. It conforms to the locked scope and resolves the one WEAK row:

- **C1 is answered with a mechanism, not a promise.** Slice 1 proposes a *module-valued doctor contribution* on the plugin manifest, loaded relative to the plugin root via file URL, mapping the plugin's existing `DoctorReport` checks into host reports. That is a real bridge and it keeps domain checks plugin-owned — it does not extend the core-side `cli.doctorChecks` string union, the anti-pattern C1 forbids. Row 7 upgrades from WEAK to PASS on the plan; it remains the thing to verify in the artefact at IMPL-EVAL, because a bridge that type-checks but is never exercised by `netscript plugin doctor` still fails box 3.
- The risk register independently names the hazard the supervisor did not: *"dynamic import path differs for copied plugins"*, mitigated by carrying `rootDir` plus module path. Local-path/copied plugin installs are exactly where a naive specifier resolution would break.
- `research.md` re-derived the four causes against `3ab64720f` rather than reciting the brief, and records that the stated causes held. No drift on cause.
- **C3 is honoured pre-emptively and in a stronger form than required:** the config-error row commits to expanding only an actual `ZodError` and reporting an honest generic failure if the child loader flattened it, rather than fabricating field names to tick box 5.
- The plan additionally defers `triggers` and `streams` (the issue names four plugins; box 3 requires only workers and sagas). That is correct scoping and must be stated in the PR body alongside boxes 4 and 6.

C1, C2, C3 remain binding and will be checked against the diff, not the plan. Verdict unchanged: **PASS**.
