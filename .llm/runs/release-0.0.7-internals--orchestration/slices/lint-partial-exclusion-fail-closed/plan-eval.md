# PLAN-EVAL — release-0.0.7-internals--orchestration/slices/lint-partial-exclusion-fail-closed

- Plan evaluator session: `14cfb576-de3f-40a5-b23a-d9e8e8d018e4` / 2026-08-28
- Run: `release-0.0.7-internals--orchestration/slices/lint-partial-exclusion-fail-closed`
- Surface / archetype: `.llm/tools` lint/fmt wrappers + lint-driven CLI consumer asset /
  `6-cli-tooling`
- Scope overlays: none
- **Cycle: 2 of the ordinary 2** (cycle 1 = `FAIL_PLAN` at `59b79ccd8`, preserved bit-identical in
  `plan-eval-cycle-1.md`)

## Identity, route, family, independence

| Field                    | Observed                                                                                                                                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session id               | `14cfb576-de3f-40a5-b23a-d9e8e8d018e4` (`CLAUDE_CODE_SESSION_ID`; job dir `/home/codex/.claude/jobs/14cfb576`)                                                                                                |
| bridgeSessionId          | `session_012pKzuP1udDquhyyjdGBeG6` (non-empty; `CLAUDE_CODE_BRIDGE_SESSION_ID`)                                                                                                                                |
| Job `state.json` backend | `daemon`; `template: bg`                                                                                                                                                                                       |
| respawnFlags             | `--effort medium --remote-control --permission-mode bypassPermissions --name "NetScript 0.0.7 #1709 PLAN-EVAL c2" --model claude-fable-5`                                                                     |
| providerEnv              | `{}` — native Anthropic, no gateway                                                                                                                                                                            |
| cwd                      | `/home/codex/repos/netscript-007-lint-fail-closed`                                                                                                                                                             |
| CLI version              | Claude Code `2.1.250`; Deno `2.9.5 (stable, x86_64-unknown-linux-gnu)`                                                                                                                                         |
| Requested route          | `formal_plan_evaluation` for a Codex GPT-5.6 Sol plan → native Claude · Anthropic · Fable 5 · medium · remote-control (`lane-policy.md` "Local PLAN-EVAL"; brief `1709-plan-eval-cycle2.md`)                    |
| Observed route           | model `claude-fable-5`, effort `medium`, `--remote-control`, `providerEnv {}` → **requested == observed**                                                                                                      |
| Family vs author         | Author = OpenAI Codex `gpt-5.6-sol` (`supervisor.md`, `codex-thread-ids.md`) → evaluator Anthropic family is **opposite**                                                                                      |
| Independence             | Fresh bg Claude job. Not the Codex author `01a047f0-f17e-7692-b6f0-83a6d22888c9`, not the topic supervisor `f7691917-0be2-4bcd-8839-43d3fc809c34`, not the cycle-1 evaluator `1b7a1305-a353-4c1d-a415-34ee8869ff6b` |

## Target verification (before any evaluation)

- Local `HEAD` = `3e934e2de1ed758f7182ad1eebf027750bcfb976`, branch
  `fix/lint-partial-exclusion-fail-closed`, no upstream (by design).
- `git ls-remote origin refs/heads/fix/lint-partial-exclusion-fail-closed` = `3e934e2de…`.
- PR #1710 `headRefOid` = `3e934e2de…`, `isDraft: true`, base `main`, milestone `0.0.7`, labels
  `type:fix area:tooling status:plan ci:skip-e2e ci:skip-scaffold`.
- `git diff --stat cf648f1ff…3e934e2de -- . ':!.llm/runs'` → empty (plan-only leaf confirmed);
  `git status --short` empty at start.
- Cycle-1 preservation: `plan-eval.md` was untouched by the repair commit (`git diff --quiet
  59b79ccd8 3e934e2de -- …/plan-eval.md`); copied to `plan-eval-cycle-1.md`; sha256
  `c59bbe646da4b644743026e609fddefe8dbf02423cbd2ddf7c8a0a68338f443d` on the copy, on the working
  file before overwrite, and on the `59b79ccd8` blob — **byte-identical**.
- Reproductions ran on a `git archive 3e934e2de` copy under `$CLAUDE_JOB_DIR/tmp/repo` and scratch
  projects under `$CLAUDE_JOB_DIR/tmp/sig*`; the checkout was not mutated.

## Carried forward from cycle 1 (not re-derived, and why)

The product/tooling diff from base is empty at both `d437db44d` and `3e934e2de`, so every cycle-1
re-derivation against code and Deno 2.9.5 is unchanged by construction: completion-adapter shapes,
the anti-inference rule, probe forms, both refusals in both wrappers, `allowCount: 7`, the lint-only
publish surface, generator idempotence, the unexposed malformed doctor sibling, and the seventh-path
sweep. Spot-checks run this cycle on what the repair leans on:

| Spot-check (archive copy / scratch, Deno 2.9.5)                                                         | Result                                                                                               |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Fmt seam premise: `runBatch` private, direct `Deno.Command` (`run-deno-fmt.ts:419-426`); `main` `:526+` | Confirmed — no injectable runner exists in fmt; lint has `BatchRunner`/`runLint(..., runner)` `:430-472` |
| Root `lint` as shipped                                                                                  | `filesSelected 2037 / batches 35 / failedBatches 0`, exit 0                                          |
| Root `lint` with `packages/mcp/tests/fixtures/doctor/\|` removed from the `--exclude` alternation       | `2041 / 36 / 0`, exit 0                                                                              |
| Root `fmt:check`                                                                                        | `2041 / 36 / 0`, `findings 0`, exit 0                                                                |
| Healthy doctor fixtures at `--batch-size 1`                                                             | `filesSelected 4 / batches 4 / failedBatches 0`, exit 0 (the +4; `broken/` stays outside selection)  |
| Crash+drop lint signal `deno lint clean.ts syntax.ts excluded/dropped.ts`                               | `Error linting …` / `Checked 2 files`, exit 1 (count present on crash batch, as D5 assumes)          |
| Crash+drop fmt **check** signal `deno fmt --check clean.ts syntax.ts excluded/dropped.ts`               | `error: Found 1 not formatted file in 2 files`, exit 1 (as D5 assumes)                               |
| Crash fmt **write** signal `deno fmt syntax.ts clean.ts` / `deno fmt syntax.ts`                         | **`error: Failed to format 1 of 2 checked files`** / **`… 1 of 1 checked file`**, exit 1 — a third form |

The supervisor-verified numbers reproduce exactly. The last row is new evidence; see F4.

## Do the three cycle-1 findings close?

| Finding | Closed? | Evidence in the repair head                                                                                                                                                                                                                                                                                                                                            |
| ------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1      | **Yes** | D4 now says lint reuses `BatchRunner`, S3 "introduces an equivalent injectable runner seam locally in `run-deno-fmt.ts`"; identity step 3 routes both original batches and probes through it; S3 slice row, risk register ("Fmt tests cannot inject…"), open-decision sweep ("no new module/path"), worklog "Ports / seams" (rewritten: fmt "has no equivalent seam today … S3 introduces…"), research finding 16. No new file. |
| F2      | **Partly** | Precedence locked as refusal ≥ crash ≥ finding (D6, "Failure precedence" table with a crash row and a refusal-wins row). Crash-batch accounting defined (D5, identity step 7: count contributes to `filesProcessed`, short count probed, missing/invalid evidence → refusal). Exact crash+drop control: exit 2 and full `coverage` JSON (`3/2/["excluded/dropped.ts"]`, one `partial-exclusion` refusal, no `unverifiedFiles`) at 1/2/200; crash-only companion: exit 1 and `2/2/[]/[]` at 1/2/200; diagnostics once; S2/S3 rows reference them. I re-walked the three batchings for both wrappers in check mode, including the `[clean, dropped] + [syntax]` ordering, and the stated JSON is reachable at every size. **But** the closure extended coverage to crash batches without measuring the fmt write-mode crash signal, which is a third form the locked adapter does not admit — F4 below. |
| F3      | **Yes** | Validation row 8 reads "exit 0 for both root tasks; no rule weakened". S1 gate: default `2041/36/0` plus `--batch-size 1` `2041/2041/0`, exit 0. S2 gate: per-file root lint `2041/2041/0`. S3 gate: per-file root fmt `2041/2041/0`, findings 0. The pre-implementation baseline cites cycle-1 §7 and forbids inferring coverage from a default-batch green. |

Advisories: A1 folded (D7, JSON contract: `--input` omits `coverage`); A2 folded (D8, step 3:
write-mode mismatch probes use `deno fmt --check`); A3 folded (adapter section and S2/S3 gates pin
CRLF-terminated summaries; research "Trust and failure modes"). All three are also rows in the
open-decision sweep. No advisory was skipped.

## Plan-Gate checklist (full gate on the repaired plan)

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` still baselined at `cf648f1ff` (= live `main`); findings 16-18 record cycle-1 evidence. Finding 10's write-mode claim is incomplete (F4) but the baseline itself is current.                                                                                                                                                                                       |
| Decisions locked                        | FAIL   | D1-D10 carry rationale and F1's false premise is gone. A new false premise remains in D8 / "Completion adapters" / must-not-regress / research finding 10: "original write batches use `Checked N`" and "existing crash … stays exit 1 when coverage is complete" cannot both hold, because a write-mode parse-error batch emits `error: Failed to format M of N checked file(s)`, which the locked adapter does not admit. See F4. |
| Open-decision sweep                     | FAIL   | The plan lists "must resolve now: none after F1-F3 repair". Evaluator sweep found one unflagged decision that forces rework if deferred: the fmt write-mode crash completion form and its expected exit/JSON (F4).                                                                                                                                                                 |
| Commit slices (< 30, gate + files each) | PASS   | S1→S4, each names proof, gates, files; six-path envelope; the fmt seam lands inside path 3.                                                                                                                                                                                                                                                                                      |
| Risk register                           | PASS   | Thirteen risks with mitigations; the two cycle-1 gaps became rows ("Fmt tests cannot inject…", "A crash hides a refusal…").                                                                                                                                                                                                                                                     |
| Gate set selected                       | PASS   | Frozen set unchanged: `check`, `test`, `publish-dry-run`, `quality-job`, `check:assets-barrel` + F-6/F-7/F-10/F-19; runtime/browser/e2e N/A per Arch-6.                                                                                                                                                                                                                         |
| Deferred scope explicit                 | PASS   | `plan.md` "Non-scope and deferrals"; worklog "Deferred scope".                                                                                                                                                                                                                                                                                                                  |
| jsr-audit surface scan (pkg/plugin)     | PASS   | Unchanged from cycle 1: lint-only embedded text/hash delta, exports unchanged, 19-WARN baseline disclosed.                                                                                                                                                                                                                                                                       |

## Findings

**F4 — Unmeasured third fmt completion form makes the write-mode crash contract unsatisfiable as
locked.** Reproduction (scratch project, Deno 2.9.5, `cat -A` on stderr, stdout empty):

| Command                                     | exit | Terminal line                                                              |
| ------------------------------------------- | ---- | -------------------------------------------------------------------------- |
| `deno fmt syntax.ts clean.ts` (write)       | 1    | `error: Failed to format 1 of 2 checked files`                             |
| `deno fmt syntax.ts dirty2.ts` (write)      | 1    | `/abs/dirty2.ts` (rewritten) then `error: Failed to format 1 of 2 checked files` |
| `deno fmt syntax.ts` (write)                | 1    | `error: Failed to format 1 of 1 checked file`                              |
| `deno fmt syntax.ts excluded/dropped.ts`    | 1    | `error: Failed to format 1 of 1 checked file` (dropped path not counted)   |
| `deno fmt --check syntax.ts clean.ts`       | 1    | `error: Found 1 not formatted file in 2 files` (check mode, as the plan says) |

Today's wrapper classifies the write-mode parse error as a crash: `deno run … run-deno-fmt.ts --root
<dir> --ext ts --write` → `filesSelected 2 / batches 1 / failedBatches 1 / findings 0`, exit 1,
`Failed to format` rendered once. The repaired plan locks (D5, identity step 7) that coverage is
evaluated on crash batches and that missing admissible completion evidence is a
`processed-count-unavailable` refusal with exit 2 "even when the batch also crashes"; it locks the
fmt adapter to exactly two forms (`Checked N`, `Found M … in N`); and it simultaneously guarantees
(D8, S3 row, must-not-regress) that "original write batches use `Checked N`" and that a crash
"stays exit 1 when coverage is complete". A literal S3 implementation therefore turns every
`deno task fmt` run that contains a parse-error file from today's exit 1 crash into exit 2
`processed-count-unavailable` with every file of that batch (up to 200) listed in
`unverifiedFiles` — although Deno stated the processed count (`N checked`) and identity is fully
knowable. The plan's write-mode controls ("pin raw `Checked N` write-mode controls, including a
rewritten file") never exercise a parse error, so the S3 test matrix would pass and the defect
would land; fixing it afterwards reworks the S3 adapter, its fixtures, and the locked adapter
section. Neither `plan.md` nor `research.md` (finding 10: "Write mode emits `Checked N file(s)`")
mentions `Failed to format`; cycle 1 did not measure write-mode parse errors either, but before the
repair crash batches were outside coverage, so the form was not load-bearing. D5 made it
load-bearing. This is the F1 pattern — a locked decision resting on an unmeasured premise — so it
fails the same box by the same standard.

In-envelope fix (no seventh path, no wire-contract change): admit a third fmt form for write mode,
anchored `^error: Failed to format (\d+) of (\d+) checked files?$`, taking the second integer as
processed (singular/plural verified above: `1 of 1 checked file`, `1 of 2 checked files`). With it,
write-mode crash+drop reconciles exactly like check mode (`1 of 1 checked` on a 2-file batch is a
short count → `--check` probes → `syntax.ts` processed via `Found 1 not formatted file in 1 file`,
`excluded/dropped.ts` dropped) and the locked JSON at 1/2/200 becomes reachable in write mode.

**A4 (advisory, not gate-blocking) — pre-existing fmt check-mode diagnostic loss contradicts the
universal wording of the diagnostic-multiplicity invariant.** `deno fmt --check syntax.ts dirty.ts`
emits one `from dirty.ts:` block and `Found 2 not formatted files in 2 files`; `crashedBatches`
(`run-deno-fmt.ts:490-496`) classes the batch as an ordinary finding because a finding parsed, so
the `SyntaxError` for `syntax.ts` is rendered nowhere. Wrapper run at batch size 200: exit 1,
findings `[dirty.ts]`, stderr `SyntaxError` count 0; at batch size 1: exit 1, findings
`[dirty.ts]`, `SyntaxError` count 1. Coverage is correct at both sizes (`2 == 2`), so #1709's
contract is unaffected, but the plan's "identical … diagnostic multiplicity for any selected set"
is false for this set today and the plan does not touch the classifier. Either scope the invariant
to coverage identities plus the named controls, or record the pre-existing classifier limitation in
the risk register / deferred scope.

## Open-decision sweep (evaluator-run)

| Decision                                                                      | Verdict              | Notes                                                                                                                       |
| ----------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Fmt write-mode crash completion form; expected exit/JSON in write mode (F4)   | **must resolve now** | Not flagged by the plan; a literal S3 regresses `deno task fmt` crash exits and forces adapter/fixture/plan rework.         |
| Crash-vs-coverage precedence; crash-batch accounting (cycle-1 F2)             | resolved             | Locked for lint and fmt check mode; reachable at 1/2/200 (re-walked, including alternate batch orderings).                 |
| Fmt runner seam inside `run-deno-fmt.ts` (cycle-1 F1)                         | resolved             | Text, slice row, risk row, worklog all corrected; no new module.                                                            |
| Root tasks exit 0 + per-file drop-free evidence (cycle-1 F3)                  | resolved             | Row 8, S1/S2/S3 gates, baseline paragraph.                                                                                  |
| A1 `--input` omission / A2 `--check` probes / A3 CRLF fixtures                | resolved / folded    | Present in D7, D8, adapter section, sweep table.                                                                            |
| Diagnostic-multiplicity wording vs. pre-existing fmt classifier (A4)          | safe to defer        | Coverage unaffected; wording or a deferred-scope note suffices.                                                             |
| Existing fmt test crash fixture without a summary (`Failed to parse "workspace"…`) | safe to defer   | Under D5 it becomes a `processed-count-unavailable` refusal; the fixture lives in path 4 and is S3's to update — consistent with D5, no plan change needed. |
| Local helper/type/function names                                              | safe to defer        | Agrees with the plan.                                                                                                       |

## Verdict

`FAIL_PLAN`

**Cycle 2 of the ordinary 2.** This second `FAIL_PLAN` exhausts the ordinary allowance and returns
the leaf to the owner; no third cycle is assumed or recommended here.

### Required fix (single, narrow)

1. **F4 (decisions-locked + open-decision-sweep boxes)** — Measure and lock the fmt write-mode
   crash completion form. Recommended: add
   `^error: Failed to format (\d+) of (\d+) checked files?$` (second integer = processed) as the
   third admissible fmt form, scoped to write mode; correct D8, the "Completion adapters" list,
   must-not-regress ("Fmt write mode retains a verified original `Checked N` count" →
   `Checked N` or `Failed to format M of N checked`), the S3 slice row, the risk-register write
   row, and research finding 10; add write-mode crash-only and crash+drop controls at 1/2/200 with
   the same exit/JSON as the check-mode controls. If the author instead chooses to refuse
   write-mode crashes, must-not-regress and the precedence table's crash row must be restated as
   check-mode-only and the S3 controls must pin exit 2 / `processed-count-unavailable` in write
   mode — I do not recommend that path, since Deno provides the count.

Advisory A4 as above. F1, F3, A1-A3 are closed and need no further author action; F2 needs only
the write-mode extension in item 1.

## Notes

- Carried forward from cycle 1 without re-derivation (rationale above): adapter shapes, anti-
  inference, probe forms, both refusals, `allowCount: 7`, lint-only publish surface, generator
  idempotence, malformed sibling unexposed, no seventh path. Spot-checked this cycle: seam premise,
  `2037/35/0 → 2041/36/0`, fmt `2041/36/0` findings 0, healthy doctor +4 per-file, crash+drop
  signals in both wrappers, and the new write-mode crash signal.
- The topic supervisor's Tier-A `PASS` on this head is a lighter gate and did not measure Deno
  signals; it does not change this verdict.
- No implementation grant exists and none is recommended before a separate coordinator
  authorization; this evaluation does not authorize implementation.
- Hard bounds honoured: no product/tooling/config/workflow mutation; reproductions in
  `$CLAUDE_JOB_DIR/tmp`; no runtime lease, Aspire, Docker, browser, or `e2e:cli`; no label, ready,
  merge, checkbox, acceptance-evidence, or central-state mutation. Run-dir edits: this file and the
  byte-identical `plan-eval-cycle-1.md` only.
