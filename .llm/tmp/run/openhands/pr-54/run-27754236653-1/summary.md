# Summary

## Verdict: **FAIL_PLAN**

PLAN-EVAL evaluator session for `chore-prod-readiness--cleanup` (group 1 of the `release/jsr-readiness` umbrella). I walked the plan-gate checklist box-by-box, performed an open-decision sweep, spot-checked the S1–S8 consumer claims against the actual tree, and verified the off-limits guardrail. The plan's overall shape is sound (off-limits fence, consumer-scan-first, scaffold.runtime E2E on the high-risk slice) but the per-slice touch lists and gate coverage understate the work in three places. Verdict committed and pushed to `chore/prod-readiness` as `3e305a82`.

## Changes

- **Wrote** `.llm/tmp/run/chore-prod-readiness--cleanup/plan-eval.md` (102 lines) — full verdict with checklist, open-decision sweep, S1–S8 spot-check table, off-limits guardrail check, per-slice remediation matrix, and seven required fixes.
- **Committed and pushed** to `chore/prod-readiness` (commit `3e305a82`). Off-limits `deno.lock` drift from earlier grep operations reverted before commit.
- **Did not** implement any slice (PLAN-EVAL mode forbids).

## Key findings

| ID  | Symbol                                       | Plan claim          | Verifier finding                                                                                                          |
| --- | -------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| F1  | Aspire D-7 `_aspire-compat.mts` shim        | off-limits (functional) | Confirmed functional at `helpers-generator-pipeline.ts:42-55`; emitted into generated scaffold. Plan fence correct.         |
| F2  | esbuild CJS post-bundle fixup               | off-limits (functional) | Confirmed functional at `compile-bundler.ts:30-60,120-145`; ~879MB → ~97MB binary fix. Plan fence correct.                  |
| F3  | Servy `ConnectionStrings__${provider}db` alias | off-limits (inherited verify) | Confirmed functional (3 readers in `database-connectivity.ts:48,71,94` + 2 writers in `env-file-*.ts` + 1 in `servy-environment.ts:139`). **Plan must record this resolution and add an `arch-debt.md` entry** to make the fence auditable. |
| **S4** | `database/extensions/sql-json.extension.ts` `mysqlJsonExtension` | "deprecated alias" | **DRIFT.** The export has no `@deprecated` docstring and no `LEGACY COMPATIBILITY` header. `mssqlJsonExtension` in the same file is correctly marked; `mysqlJsonExtension` is not. Removing it is a silent public-API break. |
| **S5** | `mssql.adapter.ts:66` `options.trustedConnection` | "deprecated alias, remove" | **DRIFT.** Internal writer at line 416 sets `config.options!.trustedConnection = true` and the `integratedSecurity` mapping at line ~414-419 must be rewritten to `authentication.type = 'ntlm'`. This is a behavioural refactor (~10-15 LOC), not a symbol delete. |
| **S6** | `JobBuilder.schedule` | scaffold-template scan | **DRIFT.** Confirmed additional live consumer at `plugins/workers/src/scaffolding/job-scaffolders.ts:64-65` which **injects `.schedule(...)` calls into generated worker modules**. Scaffolder must be updated before the public surface can be removed. |
| G1-3 / G1-4 | public-surface removals | primary gate = `publish:dry-run` + scoped `check` | **DRIFT.** Per `plan-protocol.md` task 4, all public-surface removals should be gated behind `e2e:cli run scaffold.runtime` as a regression guard. G1-3 and G1-4 currently lack this. |
| Per-slice LOC + file list | — | not provided | **DRIFT.** Plan uses per-group gates only; `plan-protocol.md` requires per-slice file list + LOC estimate. |
| G1-6 | "remaining dead code sweep" | open list | **DRIFT.** Either enumerate candidates with evidence or defer to a follow-up run. |
| Off-limits guardrail (aspire public, scaffold-versions, version pins, catalog) | respected | PASS. None appear in any slice's touch list. |
| F1, F2, F3 fence | off-limits | PASS in intent; F3 must be documented (see above). |

## Required fixes (each in `plan.md` and `research.md`; resubmit to PLAN-EVAL)

1. **F3 — record the resolution.** Update `research.md` to mark F3 functional with the 3-reader / 3-writer evidence. Add an `arch-debt.md` entry `database-connectivity-legacy-connstring-alias` with a post-release removal target.
2. **S4 — deprecate first, then remove.** Split G1-3 into G1-3a (clean S3) + G1-3b (deprecate `mysqlJsonExtension` to mirror `mssqlJsonExtension`) + G1-3c (refactor S5 + remove both).
3. **S5 — name the internal rewrite.** Plan must explicitly state G1-3c touches `mssql.adapter.ts:414-419` (the `integratedSecurity`/`trustedConnection` mapping) and that the deprecated field's removal is a refactor, not a symbol delete.
4. **S6 — add the scaffolder consumer.** G1-5 touch list must include `plugins/workers/src/scaffolding/job-scaffolders.ts:64-65` and the corresponding scaffolder test fixture.
5. **G1-3 and G1-4 — add the scaffold.runtime smoke gate.** Per `plan-protocol.md` task 4.
6. **Per-slice LOC + file list.** Each of G1-0…G1-6 must name the files and a LOC estimate.
7. **G1-6 — scope or defer.** Enumerate candidates with evidence, or move to a follow-up run with a `## Deferred scope` reference.

## Validation

- `git status` confirmed clean after the `deno.lock` revert (only `plan-eval.md` is added).
- `git log -1` and `git show 3e305a82` confirmed the commit is on `chore/prod-readiness` and includes the Co-authored-by trailer.
- `git push` output: `fc70df26..3e305a82  chore/prod-readiness -> chore/prod-readiness` — push succeeded.
- All S1–S8 / F1–F3 verifications cross-checked against the actual tree (paths cited in the plan-eval.md).

## Responses to review comments or issue comments

- No PR review-thread or issue-comment replies requested (`output_mode: pr-comment`; the workflow owns the status post). No `replies.json` was written.

## Remaining risks

- **None for this evaluator session.** The plan must address the seven required fixes before resubmission. The off-limits guardrail is correctly respected — no drift detected in `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, version pins, or catalog/`catalog:` references.
- The G1-3 / G1-4 gate-coverage gap is the most likely source of a follow-up re-evaluation; the e2e:cli smoke is the cheapest way to confirm that public-surface removals do not regress scaffold-generated users.
- Recommend adding a `.llm/tools/check-deprecation-coverage.ts` script to the harness so the S4-style "missing `@deprecated` marker" gap is caught at the research stage, not at the plan-eval stage.
