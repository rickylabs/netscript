OPENHANDS_VERDICT: FAIL_FIX

IMPL-EVAL — PR #1945 fix(scaffold): gate /design out of production builds.

## Summary

IMPL-EVAL (separate session) for issue #1481 / PR #1945 "fix(scaffold): gate /design out of production builds" (RFC 0005 §5 H-8), evaluated at immutable head `d2a5e167f71f5cd0dc35859e7daf639394fa6f56` against trusted base `f589d251a`. Protocol read from the base commit: `.llm/harness/evaluator/{protocol,verdict-definitions,anti-pattern-catalog}.md` + `.llm/harness/templates/evaluate.md`; run artifacts at `.llm/runs/design-route-prod-gate--plan/` (plan `f8ed75b41`, separate-session PLAN-EVAL `PASS_PLAN`).

The plan is valid and the implementation matches it (two exclusions per RFC 0005 §5: Fresh `ignore` of the `(design)` route group + `/_middleware` 404; new `scaffold.design-production-exclusion` gate wired into `scaffold.runtime` with registry-order tests; drift D-1 recorded for the suite-selector file; no `deno.lock` churn; diff confined to `packages/cli/**`, generated barrels, and the run dir). But the required hosted gates are red at the evaluated head, so acceptance cannot stand:

- **HIGH — the new gate breaks both runtime E2E suites.** Run 33696750193 (`scaffold-runtime` and `scaffold-runtime-sqlite`, both at `d2a5e167f`): the gate runs immediately after `scaffold.init` and its production Vite build fails with `[deno] Could not load .../database/{sqlite,postgres}/schema/.generated/zod/crud.ts (imported by ../../contracts/versions/v1/users.contract.ts)`. That file is produced by `GATE.DATABASE_CODEGEN` (`deno task db:generate`), which sits at `RUNTIME_GATES` position ~68 (`capability-suites.ts:70`) — after the new gate at line 54. The suite aborts, so `behavior.app-reference` (dev-behavior acceptance) and every later runtime gate have **no evidence** at this head. This is the PR's required runtime/consumer gate, red — not pending.
- **MEDIUM — hosted `quality` red on the merge-commit** (run 33696747921): `aspire-version-parity` receipt at `pr-1945-merge` `391628016a` fails `"manifestFresh":false` (`checked:909, fail:1`). The merge tree carries the new `.agents/skills/aspire-upgrade/SKILL.md` (+181 lines from base `f589d251a`) but the manifest still has 911 rows / 0 `aspire-upgrade` rows; main tip `262aa8fbe` fixed exactly this via `79adb103b` (#1962, manifest → 912 rows incl. `aspire-upgrade`), which the branch lacks. Main's `Code quality` is green at `262aa8fbe`; the PR diff touches no skills/manifest files.
- **MEDIUM — close-gate red**: PR body line 8 is `Refs #1481` with no `Closes/Fixes/Resolves` keyword (AGENTS.md mandate #1), and all of #1481's acceptance/`gate:` checkboxes are unchecked. Protocol rule 12 (netscript-pr close-gate #387) blocks `status:ready-merge`; boxes may only be checked with linked evidence at a green head (the #260 failure).

Full protocol evaluation: `.llm/runs/impl-eval-1481--openhands-33696765169-1/evaluate.md` (findings F-1..F-4, severity-ranked, with exact evidence).

## Changes

None — read-only evaluator session. No files edited, no commits, no pushes, no lock-file churn.

## Validation

- Read protocol + verdict definitions + anti-pattern catalog + evaluate template from the trusted base; verified `PASS_PLAN` in `plan-eval.md` and the Design checkpoint in `worklog.md` (line 12), with per-slice local gates (check 733 files / 88 tests / lint / fmt / quality / arch all PASS at `21ee63419`).
- Independently verified the runtime failure from hosted logs (`gh run view 33696750193 --log-failed`): both suites fail at `scaffold.design-production-exclusion` (~20s) with the missing generated `zod/crud.ts` import; confirmed the codegen gate's standalone script runs `deno task db:generate` and its `RUNTIME_GATES` position is after the new gate; confirmed the registry test asserts membership/placement against plugin-slice indices but not against `DATABASE_CODEGEN`.
- Independently verified the quality failure from the gate receipt embedded in the failed log (exit 1, `manifestFresh:false`, `pr-1945-merge` head `391628016a`), and the manifest row delta across `391628016a` (911/0) vs `262aa8fbe` (912/1) via `git show`.
- Confirmed CI ran at exactly `d2a5e167f` (both runs' `headSha`), the diff contains 0 `deno.lock` hunks, and main tip `262aa8fbe` is green (contains `f589d251a` and `79adb103b`).

## Responses to review comments or issue comments

- Trigger (phase=impl eval request): honored — separate-session IMPL-EVAL per `.llm/harness/evaluator/protocol.md`; verdict below and mirrored in the summary path; full evaluation written to the run directory.
- PLAN-phase comment (plan locked at `f8ed75b41`): confirmed — `PASS_PLAN` verified in-repo.
- IMPL final S-summary: verified — head `d2a5e167f` matches PR head; local gates were genuinely green, but the hosted runtime/quality/close-gate failures above were not yet known and now block PASS.
- Earlier workflow summary comment and close-gate CI failure: consistent with F-3 — the missing closing keyword is real and is one of the three fixes.

## Required actions (ranked)

1. **F-1 (high)**: move `scaffold.design-production-exclusion` after `GATE.DATABASE_CODEGEN` in `RUNTIME_GATES` (and mirror in `RUNTIME_SQLITE_GATES` derivation), update `suite-registry_test.ts` order assertions; keep the plant→fail→restore `finally` discipline intact. Then re-run both hosted runtime suites so `behavior.app-reference` and the production-exclusion probe produce real evidence (also resolves F-4, the unproven dev-behavior box).
2. **F-2 (medium)**: merge current `main` into the branch (brings `f589d251a` + `79adb103b`) or rebase, and re-run hosted quality; if the manifest still drifts, run the manifest generator per the gate's own remediation message.
3. **F-3 (medium)**: change PR body to `Fixes #1481` only once the gate + acceptance evidence exists at a green head, then check #1481's acceptance/`gate:` boxes with linked receipts (never before — #387/#260 rule).

## Remaining risks

- Merge interplay with `9464ab223` (#1885, on main, not in branch): it adds behavior gates + island receipts to the same runtime suites; after the F-1 rebase/merge, the new gate's ordering assertions and cleanup restore path should be re-checked against those additions.
- The plan itself encoded the early-build ordering (slice table + drift D-1 "immediately after `scaffold.init`"), so the F-1 fix is a small, plan-consistent correction under the same plan scope; no rescope needed. Two FAIL_FIX cycles on the same finding would warrant escalation per harness rules.

This evaluation comment was generated by an AI agent (OpenHands) on behalf of the repository maintainers.
