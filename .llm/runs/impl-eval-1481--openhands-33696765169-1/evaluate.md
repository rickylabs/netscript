# Evaluation: issue #1481 / PR #1945 — fix(scaffold): gate /design out of production builds

## Metadata

| Field          | Value                                                          |
| -------------- | -------------------------------------------------------------- |
| Run ID         | `impl-eval-1481--openhands-33696765169-1`                      |
| Target         | PR #1945 at head `d2a5e167f71f5cd0dc35859e7daf639394fa6f56`; trusted base `f589d251a`; issue #1481 (RFC 0005 §5 H-8) |
| Archetype      | CLI/E2E framework slice (`packages/cli/e2e` + `packages/cli` templates) |
| Scope overlays | service/runtime gates; docs overlay n/a (no docs surface changed) |
| Evaluator      | OpenHands IMPL-EVAL session, openrouter/z-ai/glm-5.3-flash, 2026-09-03, action run 33696765169 |

## Process Verification

| Check                                  | Result        | Evidence                                                                                              |
| -------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS          | `.llm/runs/design-route-prod-gate--plan/plan-eval.md`: separate-session `PASS_PLAN` at plan head `f8ed75b41` |
| Design section exists in worklog       | PASS          | `worklog.md` line 12 `## Design`; commit slices follow it (RED 2 → GREEN 3/4 → mechanical merge)      |
| Commit slices match design plan        | PASS          | `worklog.md` Gate Results table; slice chain `21ee63419` (impl) → `d2a5e167f` (evidence); drift D-1 recorded |
| Each slice has a passing gate          | PARTIAL       | Local check/test/lint/fmt/quality/arch all PASS at `21ee63419`; **hosted runtime gates RED at head** (Findings F-1) |
| No speculative seams (unused files)    | PASS          | Diff `ba6f1f49a..d2a5e167f`: only gate files, `cli-surface.ts`, `capability-suites.ts`, registry test, generated barrels; no unused modules |
| Constants used for finite vocabularies | PASS          | New gate ID `scaffold.design-production-exclusion` flows through `GATE` constants; no string-literal spray |
| Close-gate honored                     | FAIL          | `check-close-gate.ts` job red: PR body says "Refs #1481" with **no closing keyword**; every #1481 `gate:`/acceptance box unchecked (`gh issue view 1481` lines 20–22). Protocol rule 12 blocks any `status:ready-merge` (Findings F-3) |

## Static Gates

| Gate             | Command or check                                                    | Result | Evidence                                                                 |
| ---------------- | -------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| Narrow typecheck | `run-deno-check.ts --root packages/cli/src` + e2e root (impl worklog) | PASS   | worklog Gate Results: exit 0, 733 files, 0 failed batches (EXPECTED_STEP_BOUNDARY on e2e root resolved by GREEN 4) |
| Slice typecheck  | focused `run-deno-test.ts` on five touched test files                | PASS   | worklog: 88 passed, 0 failed at `21ee63419`                              |
| Format           | `run-deno-fmt.ts` (12 touched non-generated TS files)                | PASS   | worklog Gate Results                                                     |
| Lint             | `run-deno-lint.ts` (12 touched files)                                | PASS   | worklog Gate Results, 0 findings                                         |
| Doc lint         | n/a — no doc surface in diff                                         | N/A    | diff file list                                                           |
| Publish dry-run  | `check:publish-assets` + `check:mcp-export-corpus` + agent-docs-prose | PASS   | worklog Gate Results, all exit 0                                         |
| Link/path check  | `check:agent-docs-prose`                                             | PASS   | worklog Gate Results                                                     |
| Embedded barrel freshness | `gen:assets-barrel` + `check:assets-barrel`                  | PASS   | worklog Gate Results; `deno.lock` byte-identical (0 lock diff hunks vs merge-base) |
| Hosted quality   | run 33696747921 job `quality` at `pr-1945-merge` `391628016a`         | **FAIL** | receipt `aspire-version-parity` exit 1: `"manifestFresh":false`, `{"checked":909,"fail":1}` (Findings F-2) |
| Hosted close-gate| run 33696747921 job `close-gate`                                     | **FAIL** | PR body lacks `Closes/Fixes/Resolves #1481`; only `Refs #1481` (Findings F-3) |

## Fitness Gates

Gate rows with repo-native evidence only; F-gates not touched by this diff are N/A.

| Gate | Function                       | Result | Evidence                                                                    |
| ---- | ------------------------------ | ------ | --------------------------------------------------------------------------- |
| F-19 | Scoped source gate runners     | PASS   | All local validation went through `run-deno-check/test/lint/fmt.ts` structured wrappers (worklog) |
| F-14 | Console-log lint               | PASS   | `run-deno-lint.ts` 0 findings across 12 touched files                       |
| F-9  | Permission declaration check   | PASS   | New standalone codegen script uses explicit `Deno.Command` args; arch:check PASS |
| F-12 | Naming-convention lint         | PASS   | lint PASS; gate/probe names follow `generated-quality-probes.ts` precedent  |
| Debt posture | `scaffold-runtime-a8-f16-1333` | PASS  | Plan explicitly does not touch it; diff adds no new top-level gate-directory child (D-1 ruling honored) |

## Runtime Gates

| Gate                                    | Validation                                             | Result     | Evidence                                                                                                                                       |
| --------------------------------------- | ------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `scaffold.design-production-exclusion`  | hosted `scaffold-runtime`/`scaffold-runtime-sqlite`, run 33696750193 | **FAIL**   | Both jobs red at head `d2a5e167f`: gate runs immediately after `scaffold.init`; Vite build dies `Could not load .llm/tmp/cli-e2e/plugin-smoke-20260903-001236/database/sqlite/schema/.generated/zod/crud.ts (imported by ../../contracts/versions/v1/users.contract.ts)` (postgres job: identical failure on `database/postgres/.../zod/crud.ts`). That file is produced by `GATE.DATABASE_CODEGEN` (`deno task db:generate`, `database-gates.ts` standalone script), which sits at `RUNTIME_GATES` position ~68 (`capability-suites.ts:70`), **after** the new gate at line 54 (Findings F-1) |
| `behavior.app-reference` (dev behavior) | hosted, same suites                                    | NOT_RUN    | Suite aborted at the new gate; dev-behavior proof for `/design/composition` has **no evidence at this head**                                   |
| All later runtime gates                 | hosted, same suites                                    | NOT_RUN    | `scaffold.agent-init`, plugin installs, generated checks — suite aborted before any of them ran                                                |

## Consumer Gates

| Consumer                  | Validation                                    | Result | Evidence                                                                 |
| ------------------------- | --------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| Scaffolded app (production build) | exclusion probe on generated output   | **FAIL** | F-1 above: build never completes, exclusion cannot be asserted          |
| Scaffolded app (dev mode) | `/design/composition` reachable (issue box 1 complement) | NOT_RUN | deferred with the aborted suite                                        |

## Anti-Pattern Check

Scope-touched patterns only; all others N/A (diff is gate/test/config surface in `packages/cli/**`).

| AP    | Status | Evidence                                                                          |
| ----- | ------ | --------------------------------------------------------------------------------- |
| AP-25 | CLEAR  | New standalone codegen script confines `Deno.Command` inside the gate script string; arch:check PASS |
| AP-9  | CLEAR  | Probe reused/extended `generated-quality-probes.ts` precedent per plan; no flags-driven helper added |
| AP-11 | CLEAR  | No module-load env reads added; env keys passed as args                            |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                          |
| --------------------- | ----- | --------------------------------------------------------------------------------- |
| New entries           | 0     | Plan: "no debt registry edit is planned"; diff confirms none                       |
| Resolved entries      | 0     | —                                                                                  |
| Deepened violations   | 0     | `scaffold-runtime-a8-f16-1333` untouched                                           |
| Unrecorded violations | 0     | None observed; the gate-ordering defect is a gate-wiring bug, not doctrine debt    |

## Findings

| Severity | Finding                                                                                                                                                                                                                                                                         | Evidence                                                                                                                                                                                                                                                                                              | Required action |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| high     | **F-1 — New hosted gate breaks the runtime suite by building before database codegen.** `scaffold.design-production-exclusion` runs a production Vite build before `GATE.DATABASE_CODEGEN` has generated `schema/.generated/zod/crud.ts`, which the scaffolded `contracts/versions/v1/users.contract.ts` imports. The build fails; the suite aborts; `behavior.app-reference` and every later runtime gate have zero evidence. The required runtime/consumer gate for this PR is RED, not pending. | run 33696750193 (`scaffold-runtime` + `-sqlite`, both at head `d2a5e167f`): `scaffold.design-production-exclusion … FAILED 20887ms` → `[deno] Could not load …/database/sqlite/schema/.generated/zod/crud.ts (imported by ../../contracts/versions/v1/users.contract.ts)`; `capability-suites.ts`: new gate line 54, `GATE.DATABASE_CODEGEN` line 70; codegen script runs `deno task db:generate` (`database-gates.ts:8`) | fix: move the gate after `DATABASE_CODEGEN` in `RUNTIME_GATES` **and** in `SCAFFOLD_RUNTIME_DEFERRED_GATES`-adjacent ordering assumptions; update `suite-registry_test.ts` order assertions (design gate currently asserted against plugin-slice indices); do not weaken the restore/cleanup `finally` discipline; re-run hosted suites |
| medium   | **F-2 — Hosted `quality` gate red at the merge-commit the evaluator must honor.** `aspire-version-parity` fails `"manifestFresh":false` on `pr-1945-merge` (`391628016a`, base `f589d251a` + head): the merge tree carries the new `.agents/skills/aspire-upgrade/SKILL.md` (+181 lines) but the manifest still has 911 rows with 0 `aspire-upgrade` entries; main tip `262aa8fbe` fixed this via `79adb103b` (#1962, manifest → 912 rows). The branch is missing both `f589d251a`'s post-merge sync and `79adb103b`. | run 33696747921 job `quality`: receipt `gitHead 391628016a9cb860b90ce21d0d8db3c989bdac86` (comment `pr-1945-merge`), `{"checked":909,"fail":1,"manifestFresh":false}`; `git show 391628016a:.llm/runs/.../aspire-surface-manifest.tsv` = 911 rows, `grep -c aspire-upgrade` = 0; `git show 262aa8fbe:...` = 912 rows incl. `aspire-upgrade`; main `Code quality` green at `262aa8fbe` | fix: merge current `main` into the branch (brings `f589d251a` + `79adb103b`), or rebase; re-run hosted quality; if the manifest drifts again, run the manifest generator per the gate's own instruction |
| medium   | **F-3 — Close-gate red: PR body has no closing keyword and the referenced issue's acceptance/gate boxes are unchecked.** Per protocol rule 12 and the netscript-pr merge close-gate (#387), `status:ready-merge` is blocked; boxes may only be checked with linked evidence (the #260 failure). | run 33696747921 job `close-gate` failure; PR body line 8 `Refs #1481` (no `Closes/Fixes/Resolves`); `gh issue view 1481`: acceptance box 20 and gate boxes 21–22 all `- [ ]`; AGENTS.md mandate #1 (closing keyword)                                                                                        | fix: change body line to `Fixes #1481` only when the gate+acceptance evidence exists at a green head; check issue boxes with linked receipts at that point; otherwise keep partial-reference and leave boxes open |
| low      | **F-4 — Dev-behavior acceptance (`/design/composition` reachable in dev) has no evidence at this head** because the suite aborts before `behavior.app-reference`. Issue box 1's complement is currently unproven hosted-side.                                                   | run 33696750193: suite log stops at the new gate's FAILED line; `behavior.app-reference` never reached                                                                                                                                                                                                 | fix: lands automatically once F-1 is fixed and the suite re-runs; no code change beyond F-1 |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Insertion order in shared runtime suites is itself a contract | New gates added before generator gates inherit the generated-tree prerequisites; the plan gate list must encode build-order, not just membership | e2e runtime suites, scaffold capability gates | high |
| `pr-<n>-merge` refs are the real evaluation surface for PR-branch CI | A branch tip that predates a main commit can still fail quality on a GitHub merge-commit; "stale merge-base" and "pre-existing on main" are distinct claims requiring distinct SHAs | CI triage, quality gates | high |

## Verdict

| Field     | Value                                            |
| --------- | ------------------------------------------------ |
| Verdict   | FAIL_FIX                                          |
| Rationale | Plan remains valid (PASS_PLAN at `f8ed75b41`); implementation matches the plan. Blocking defects are fixable without rescoping: (F-1) the plan-specified gate ordering breaks the hosted runtime suite — the required runtime/consumer gate is RED and the dev-behavior gate has no evidence; (F-2) hosted quality is red on the merge-commit due to a missing main-side manifest sync; (F-3) close-gate red with no closing keyword and unchecked issue boxes. No false-done acceptance claim can stand while the production-exclusion probe itself fails hosted-side. |

OPENHANDS_VERDICT: FAIL_FIX
