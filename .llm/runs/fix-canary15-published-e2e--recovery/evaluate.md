# Evaluation: fix/canary15-published-e2e recovery (PR #1346 / issue #1345)

This is the mandatory independent IMPL-EVAL pass for the frozen current head
`f33167ca1c023da345aa07e0a895ea68cdb31ac4`. Implementation commit `8f1c5785171938583f30c1a0a089bd296fb550d3`;
post-implementation `chore(harness): record canary recovery gates` `f33167ca1` touches only
`.llm/runs/` artifacts and changes no product code (verified: `git diff 8f1c..f33167` = the three
run-artifact files only). Baseline `fc70a97d1664c1729c0c9c49cf0fba48fcaf2df3`.

## Metadata

| Field          | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| Run ID         | `fix-canary15-published-e2e--recovery`                             |
| Target         | Repair of immutable canary.15 pinned published production E2E (PR #1346) |
| Archetype      | 6 — CLI / Tooling                                                  |
| Scope overlays | none                                                               |
| Evaluator      | independent IMPL-EVAL, 2026-08-07                                  |

**Route identity (requested → observed).** Requested (per `supervisor.md` lane table and
`evaluator/protocol.md`): local Claude Code + OpenRouter evaluator lane, preset
`claude-evaluator-deepseek-v4-flash-0731` (`deepseek/deepseek-v4-flash-0731`) at max effort — an
open model adversarial to both the Claude and Codex generator families. Observed: this session is
`deepseek/deepseek-v4-flash-0731` at max effort over the checked-in OpenRouter local route, with a
real agentic turn (independent tool calls executed). Requested and observed identities match. OpenHands
was not used (paused by owner directive) — consistent with the run artifacts.

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` = `N/A`, recorded before implementation with justification (`supervisor.md`, `worklog.md` § 2026-08-07): the exact failing production logs + local exact-version reproduction define a bounded mechanical repair with no material architecture/scope decision. Matches run-loop § 4 small/mechanical skip rule. |
| Design section exists in worklog       | PASS   | `worklog.md`/#design — product and test seams kept semantic and narrow; explicit "do not weaken file selection, remove the AppHost batch, rerun W1-B, or change canary.15 artifacts." |
| Commit slices match design plan        | PASS   | Three slices per `plan.md` § Slices; PR #1346 body lists `a83865298` (bootstrap/diagnosis), `8f1c57851` (the repair), `f33167ca1` (receipt capture). Product change is one focused slice. |
| Each slice has a passing gate          | PASS   | Focused tests exit 0 (10/10) per slice; receipt in `worklog.md` § merge-readiness receipts and PR comments. |
| No speculative seams (unused files)    | PASS   | Only the two existing files (`configure-published-workers-block.ts`, `quickstart-walk-suite.ts`) edited; no new files introduced. No dead code. |
| Constants used for finite vocabularies | PASS   | Flow-B config name and CLI flags kept as inline semantic literals consistent with existing code; no new finite-domain vocabulary requiring a constant. |

## Evaluation focus — direct verification

1. **Flow-B rewrite handles formatted/multiline generated argument arrays without weakening the
   semantic missing-config guard or dependency-age behavior.**
   `configure-published-workers-block.ts` (HEAD):
   - config rewrite now uses `/((?:'--config'|"--config")\s*,\s*)(?:'deno\.json'|"deno\.json")/` +
     `"$1'.netscript-flow-b-deno.json'"`, so the adjacent pair is rewritten independently of line
     formatting/newlines (the W1-B formatter split the array across lines — root cause 1).
   - Semantic guard is **strengthened, not weakened**: if no config rewrite happened AND the
     block does not already carry `'.netscript-flow-b-deno.json'`, the function now **throws**
     (`workers-api resource did not contain the expected Deno config argument`) instead of the old
     silent no-op pass-through.
   - dependency-age bypass: default insertion now matches a formatted `[\n 'run',` array via
     `/(\[\s*(?:'run'|"run")\s*,)/` → `"$1 '--minimum-dependency-age=0',"`; the
     `configuredBlock.includes("'--minimum-dependency-age=0'")` idempotency check is unchanged.
   Independently ran `tests/application/gates/configure-published-workers-block_test.ts` — 5/5 pass,
   including two new formatted-array cases and the missing-config rejection. `deno.lock` unchanged
   (see Lock hygiene).
2. **Quickstart step 3 checks only the newly added service; the whole-project task remains at
   documented step 6.**
   - `quickstart-walk-suite.ts` step 3 (`GATE.QUICKSTART_SERVICE_ADD`) now runs
     `['deno', 'check', '--unstable-kv', 'services/users']` (targeted) instead of the premature
     `['deno', 'task', 'check']`.
   - `GATE.QUICKSTART_CHECK` (step 6, `BEHAVIOR` phase, after Aspire restore/start step 4 and
     db init/generate/seed step 5) is **unchanged**: `['deno', 'task', 'check']`, matching
     `QUICKSTART_DOCUMENTED_COMMANDS` and the docs. Test `quickstart project-check verdict runs the
     documented command exactly` still asserts `['deno', 'task', 'check']` — verified by reading the
     test and by execution (passes).
3. **Focused regression coverage for both roots + false-positive/false-done risks.**
   - `configure-published-workers-block_test.ts`: formatting/newline acceptance, dependency-age
     insertion into a formatted array, and a missing-config rejection. Tests use semantic asserts
     (`assertStringIncludes` + occurrence counts), not giant snapshots → AP-18 CLEAR.
   - `quickstart-walk-suite_test.ts`: service-add verdict now asserts `--unstable-kv`, `services/users`
     present and **`task` absent** (guards against step-3 regression); project-check verdict asserts
     `deno task check` exactly (guards the step-6 false-done risk). Semantically asserted, no snapshot.
   - Independently ran both focused files: **10 passed, 0 failed (exit 0)**.
4. **Release-gate receipt consistency.** The supervisor recorded published quickstart 10/10 and
   canonical one-pass `scaffold.runtime` 76/76 (incl. formerly-failing `runtime.flow-b-fixture`),
   both exit 0, with raw-exit-code evidence in `worklog.md` § merge-readiness receipts and the
   `[PHASE: IMPL] [STATUS: GATES_GREEN]` PR comment. Records are internally consistent (same counts,
   same exit codes, same failing-suite name). Per instructions these expensive environment gates were
   not rerun; the recorded evidence is not internally inconsistent.

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Focused tests    | `deno test tests/application/gates/configure-published-workers-block_test.ts tests/presentation/quickstart-walk-suite_test.ts` | exit 0 | independently run this session — 10 passed / 0 failed | both changed roots |
| Narrow typecheck | scoped check wrapper (`packages/cli/e2e`, ts,tsx) | exit 0 | recorded — 131 selected / 0 findings | covers the 5 changed files |
| Lint             | scoped lint wrapper (`packages/cli/e2e`, ts,tsx) | exit 0 | recorded — 131 selected / 0 findings | |
| Format           | scoped format wrapper (`packages/cli/e2e`, ts,tsx) | exit 0 | recorded — 131 selected / 0 findings | |
| Code quality     | `deno task quality:gate` = `quality:scan && arch:check` | exit 0 | recorded — existing warnings only; diff introduces no `any`/casting/lint-ignore/hardcoded plugin coupling (independently scanned diff) | |
| Doc lint         | N/A | — | no public JSDoc/mod.ts surface change | N/A |
| Publish dry-run  | N/A | — | no package surface / publish shape change; e2e package is not a JSR-published surface | N/A |
| Link/path check  | changed files | PASS | both edited files are reachable and exercised by passing tests | |

## Fitness Gates

| Gate | Function | Result | Evidence | Violations |
| ---- | -------- | ------ | -------- | ---------- |
| F-5  | Public surface audit | N/A | no `mod.ts`/export change | none |
| F-6  | JSR publishability gate | N/A | no publish-shape change | none |
| F-14 | Console-log lint | CLEAR | no `console.*` added | none |
| AP-18 equivalent | Semantic (non-snapshot) assertions | CLEAR | new tests use `assertStringIncludes`/occurrence counts, not giant snapshots | none |
| F-CLI-* 1–31 | Archetype-6 fitness | N/A | no folder/composition/adapter structure change; change is E2E suite logic | none |

## Runtime Gates

| Gate       | Validation | Result | Evidence |
| ---------- | ---------- | ------ | -------- |
| quickstart.walk (published) | walk exact `jsr:@netscript/cli@0.0.5-canary.15`; step-3 service-add boundary + cleanup | exit 0 | recorded 10 passed / 0 failed; zero run-owned survivors |
| scaffold.runtime (canonical one-pass) | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | exit 0 | recorded 76 passed / 0 failed, incl. `runtime.flow-b-fixture` |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| Published CLI quickstart walk | installed-consumer path over `jsr:@netscript/cli@0.0.5-canary.15` | exit 0 | recorded 10/10 (covers the service-add boundary and step-6 whole-project check) |

## Anti-Pattern Check

| AP | Status | Evidence |
| -- | ------ | -------- |
| AP-18 | CLEAR | semantic asserts replace any string snapshot on generated output |
| AP-21 | N/A | no command-surface/folder structure change |
| AP-1/AP-6/AP-11/AP-23/AP-24/AP-25 | N/A | out of scope (E2E suite logic, no new orchestration/env access) |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | `plan.md` states new debt none; no new unrecorded violation; no entry added to `debt/arch-debt.md` |
| Resolved entries      | 0     | none claimed |
| Deepened violations   | 0     | none |
| Unrecorded violations | 0     | full diff reviewed; regex-based repair introduces no doctrine violation class |

## Lock & Resource Hygiene

- `deno.lock`: `git diff fc70a97d..HEAD -- deno.lock` is **empty**; `sha256sum deno.lock =
  d32ef0c1f2b9256e05cf7339c452bd8cf6addeb9a4b433d38abcee992651b529`, identical to baseline blob —
  matches the `worklog.md` claim exactly. No lock mutation.
- Leak report (`leak-report.md`): 15 `foreign` + 3 `unproven` resources reported and left untouched;
  Aspire/Docker probes ok; zero run-owned survivors. Consistent with run-loop § 9 foreign-resource rule.

## #1343 dependency/deferral check

Genuinely deferred, not implicitly claimed:
- Issue #1343 is `OPEN`, milestone **0.0.6**, `status:triage`; its body defines the external-checkout
  installed-consumer smoke observation.
- PR #1346 body carries `Refs #1343 — ... remains deferred to milestone 0.0.6` (no closing keyword).
- Issue #1345 body § Scope boundary explicitly states it "does not satisfy or duplicate #1343".
No implicit claim of #1343 completion anywhere in this cluster.

## Close-gate / readiness state

PR #1346 is **draft**, `status:impl-eval`, IMPL-EVAL and CI DoD boxes **deliberately unchecked**. This
is not a close-gate violation: no `status:ready-merge`, no merge, and the `Closes #1345` keyword is
correctly placed for the intended full resolution (single `status:` label present). #1343 is referenced
(`Refs`) not closed.

**Pre-ready conditions the supervisor must satisfy before moving to `status:ready-merge`:**
1. Record this independent IMPL-EVAL **PASS** on the frozen head (evidenced here; add the receipt to
   the PR DoD and uncheck/check the box appropriately on transition).
2. Confirm **current-head required CI is green** on the frozen head (DoD box pending) — the PR validates
   against local gates but must record the current-head CI outcome.
3. Confirm the issue #1345 acceptance "Independent IMPL-EVAL records PASS on the immutable repair head"
   is checked against this verdict.
4. Record that **post-merge next-canary recovery is release-orchestrator scope**: canary.15 is immutable
   and published-but-red; this PR does not and must not mutate it. After merge the orchestrator mints a
   fresh next canary and requires a green pinned (publish + E2E) pair. This is not a merge blocker but must
   be stated so the red canary is not mistaken for an unresolved gate of this PR.

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low | Pre-ready conditions are outstanding (IMPL-EVAL record, current-head CI, next-canary handoff) | PR DoD unchecked boxes; PR is draft `status:impl-eval` | supervisor transitions per conditions above; none block the PASS verdict |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Formatter-tolerant semantic rewrites | Regex the semantic pair across whitespace, not the exact one-line literal, when rewriting generated argument arrays | Archetype 6 CLI/E2E | high |
| Order-sensitive E2E steps | A pre-generation whole-project check surfaces expected pre-generation state; scope each step's check to what that step just produced | E2E release gates | medium |

## Verdict

| Field     | Value                                                                                      |
| --------- | ------------------------------------------------------------------------------------------ |
| Verdict   | **PASS**                                                                                    |
| Rationale | The approved small repair plan is fully implemented at the frozen head: the Flow-B rewrite accepts formatted/multiline generated argument arrays without weakening the semantic missing-config guard or the dependency-age bypass; quickstart step 3 checks only the newly added service while the documented whole-project task stays at step 6; focused regression coverage exists for both roots and is free of false-positive/false-done states. The Plan-Gate was correctly recorded N/A before implementation. Every PASS row carries evidence: the two changed roots' tests were independently re-run (10/10 exit 0), `deno.lock` is byte-identical to baseline, leak/resource hygiene is clean, no new or unrecorded doctrine debt was introduced, and #1343 remains genuinely deferred (milestone 0.0.6) rather than implicitly claimed. Recorded published quickstart 10/10 and canonical `scaffold.runtime` 76/76 (both exit 0, incl. `runtime.flow-b-fixture`) are internally consistent and accepted as the expensive release-gate evidence. PR #1346 is correctly draft with `status:impl-eval` and unchecked IMPL-EVAL/CI boxes — no close-gate violation. Pre-ready conditions (record this PASS, confirm current-head CI, hand next-canary minting to the release orchestrator) are stated but do not block `PASS`. |
