# IMPL-EVAL: #1709 lint/fmt partial-exclusion fail-closed

## Verdict

PASS_IMPL

## Evaluated head

| Field                     | Value                                                                          |
| ------------------------- | ------------------------------------------------------------------------------ |
| Evaluated head            | `5c4eaf0a38a505ac0d9cad2419230ba986c6bd2d`                                     |
| Branch                    | `fix/lint-partial-exclusion-fail-closed`                                       |
| Draft PR                  | #1710 (`headRefOid` `5c4eaf0a38a505ac0d9cad2419230ba986c6bd2d`, base `main`)   |
| Baseline                  | `cf648f1ff973d74c213bb125a6f5f5b9328e693b`                                     |
| Evaluator session         | Claude Fable 5 (native opposite-family; Codex-authored work), fresh session    |
| Evaluator worktree        | `/home/codex/repos/netscript-007-eval-1709-impl`                               |
| Contract                  | `plan.md` at this head (owner-accepted F4 amendment, Tier-A `PASS` at `fc00aed0f`) |
| Date                      | 2026-08-29                                                                     |

**Head-equality assertion.** `git rev-parse HEAD` = `5c4eaf0a3…`;
`git ls-remote origin refs/heads/fix/lint-partial-exclusion-fail-closed` =
`5c4eaf0a3…`; `FETCH_HEAD` after `git fetch origin <branch>` = `5c4eaf0a3…`;
`gh pr view 1710 --json headRefOid` = `5c4eaf0a3…`. All four OIDs are equal. The
local `origin/<branch>` tracking ref was stale at `f2b3fc8b3` (the cycle-2
plan-eval commit) before the fetch; that was a local cache artifact, not a
remote divergence, and was refreshed before any gate ran. Working tree was
clean before and after evaluation (`git status --short` empty at end).

Preserved evaluator history (`plan-eval.md`, `plan-eval-cycle-1.md`) was read
and not modified.

## Scope (brief item 1)

`git diff --name-only cf648f1ff...HEAD` returns exactly 15 paths:

- Six authorized product paths: `.llm/tools/run-deno-lint.ts`,
  `.llm/tools/run-deno-lint_test.ts`, `.llm/tools/run-deno-fmt.ts`,
  `.llm/tools/run-deno-fmt_test.ts`, `deno.json`,
  `packages/cli/src/kernel/assets/agent-tools.generated.ts`.
- Nine leaf harness artifacts under the slice run directory.
- No lock, cache, workflow, evaluator, or seventh product path.
- `deno.json` delta is one line (`1 insertion(+), 1 deletion(-)`): removal of
  the `packages/mcp/tests/fixtures/doctor/` term from the root `lint` task's
  `--exclude`. Root `lint.exclude` and fmt exclusions are unchanged.
- Generated-asset delta is two hunks only: the embedded `run-deno-lint.ts`
  string and `EMBEDDED_AGENT_TOOL_BUNDLE_HASH`
  (`500b6940…` → `f5bbc95d…`). `run-deno-fmt` appears 0 times in
  `consumer-tools.json` and 0 times in the generated asset.

## Executed gates (brief items 7–9)

All commands run from the worktree root at head `5c4eaf0a3` with Deno 2.9.5.

| # | Gate | Command | Executed result |
| - | ---- | ------- | --------------- |
| 1 | Root lint, default | `deno task lint` | exit 0; `selection {2041, 36 batches, 0 failed}`; `coverage {2041/2041, droppedFiles [], refusals []}`; 0 occurrences |
| 2 | Root lint, per-file | `deno task lint --batch-size 1` | exit 0; `selection {2041, 2041 batches, 0 failed}`; `coverage {2041/2041, [], []}`; 0 occurrences |
| 3 | Root fmt check, default | `deno task fmt:check` | exit 0; `{2041, 36 batches, 0 failed, findings 0, ignoredFindings 0}`; `coverage {2041/2041, [], []}` |
| 4 | Root fmt check, per-file | `deno task fmt:check --batch-size 1` | exit 0; `{2041, 2041 batches, 0 failed, findings 0}`; `coverage {2041/2041, [], []}` |
| 5 | Focused lint suite | `run-deno-test.ts -- --allow-all .llm/tools/run-deno-lint_test.ts` | exit 0; 14 passed / 0 failed / 0 ignored |
| 6 | Focused fmt suite | `run-deno-test.ts -- --allow-all .llm/tools/run-deno-fmt_test.ts` | exit 0; 17 passed / 0 failed / 0 ignored |
| 7 | Focused check | `run-deno-check.ts --root .llm/tools --ext ts --include '^\.llm/tools/run-deno-(lint\|fmt)(_test)?\.ts$'` | exit 0; 4 selected, 1 batch, 0 failed, 0 occurrences |
| 8 | Frozen `check` | `deno task check` | exit 0; 2,925 selected, 25 batches, 0 failed, 0 occurrences |
| 9 | Frozen `test` (run 1) | `deno task test` | **exit 1**; 4,232 passed / **1 failed** / 19 ignored — see Finding 1 |
| 9b | Frozen `test` (run 2) | `deno task test` | exit 0; 4,233 passed / 0 failed / 19 ignored / 4,252 total |
| 10 | `quality:scan` | `deno task quality:scan` | exit 0; `"findings":[]`, `"allowCount":7`, `--max-allow 7` retained |
| 11 | `arch:check` | `deno task arch:check` | exit 0 (pre-existing F-5/F-6 `export default` WARNs only) |
| 12 | Generator idempotence | `deno task gen:assets-barrel` ×2 | both exit 0; `agent-tools.generated.ts` sha256 prefix `bdfd2bc6aae84602` identical for committed / pass 1 / pass 2; `git status --short` empty after each pass |
| 13 | `check:assets-barrel` | `deno task check:assets-barrel` | exit 0; tree clean |
| 14 | CLI publish dry run | `run-publish-dry-run.ts --root . --member packages/cli` | exit 0; `Success Dry run complete`; `agent-tools.generated.ts` present in the published set; `run-deno-fmt` absent |
| 15 | Per-member CLI JSR audit | `audit-jsr-package.ts --root packages/cli --text` | exit 0; `dry-run: OK slowTypeWarnings=1`; **exactly 19 WARN** (3× F-DOCT-4 `helpers` vocabulary, 15× F-DOCT-5 cardinality, 1× F-JSR-7 slow-types). Baseline debt, not clean; none on a leaf path |
| 16 | S1 doctor fixture | lint wrapper `--root packages/mcp/tests/fixtures/doctor --batch-size 1` with the root task's exclude | exit 0; `selection {4, 4, 0}`; `coverage {4/4, [], []}`; `broken/` (marker-owned) absent — 4 healthy `.ts` files exist outside `broken/` |

Coordinator-waived N/A (not run, per brief): `scaffold.runtime`, `e2e:cli`,
Aspire, Docker, browser/Playwright, MCP JSR audit, docs-site gates. Docker and
Aspire were left empty; no runtime lease taken.

## Adversarial identity-rule evaluation (brief items 2–6)

Disposable project outside the checkout (`deno.json`:
`lint.exclude`/`fmt.exclude` = `["excluded/"]`), files `clean.ts`, `clean2.ts`,
`finding.ts` (`any`), `syntax.ts` (parse error), `dirty.ts` (unformatted),
`excluded/dropped.ts`, `excluded/dropped2.ts`, `link.ts → clean.ts`,
`ignorefile.ts` (`deno-fmt-ignore-file` + `deno-lint-ignore-file`). Each
wrapper was driven with `--cwd <project> --file …` at `--batch-size 1`, `2`,
and `200`; write-mode runs used a fresh copy per size.

Raw Deno 2.9.5 signal capture (all on stderr): lint finding ends
`Found 1 problem` / `Checked 2 files`; lint crash ends `Checked 2 files`;
`deno lint clean.ts link.ts` → `Checked 2 files`; fmt check dirty+syntax+clean
ends `error: Found 2 not formatted files in 3 files`; fmt write
dirty+syntax+clean ends `error: Failed to format 1 of 3 checked files`; fmt
write clean pair ends `Checked 2 files`; all-excluded → `error: No target files
found.`. Because lint and fmt emit every line (diagnostics, paths, and the
completion summary) on stderr, the wrapper's `stdout + stderr` concatenation
cannot reorder the terminal summary.

Results — identical at sizes 1, 2, 200 in every row (exit, cause,
`droppedFiles`, `filesProcessed`, diagnostic count, and zero crash text inside
`coverage`):

| Selection | lint | fmt check | fmt write |
| --------- | ---- | --------- | --------- |
| clean + dropped (mixed) | exit 2, `2/1`, `partial-exclusion`, dropped `[excluded/dropped.ts]` | same | — |
| clean + syntax + dropped (crash+drop) | exit 2, `3/2`, `partial-exclusion`, 1 crash in `failures`, 1 `SyntaxError` on stderr, 0 in `coverage` | exit 2, `3/2`, same, 1 crash rendered | exit 2, `3/2`, same, 1 crash rendered |
| clean + syntax (crash-only) | exit 1, `2/2`, `refusals []`, 1 crash | exit 1, `2/2`, `[]`, 1 crash | **exit 1**, `2/2`, `[]`, 1 crash (F4 case: write crash without drop stays exit 1) |
| finding/dirty + dropped | exit 2, `2/1`, `partial-exclusion`, 1 occurrence (once) | exit 2, `2/1`, 1 finding (once) | exit 2, `2/1`, `partial-exclusion` |
| finding/dirty + clean | exit 1, `2/2`, `[]`, 1 occurrence | exit 1, `2/2`, `[]`, 1 finding | exit 0, `2/2`, `[]` (dirty written) |
| dirty + syntax + clean (write) | — | — | exit 1, `3/3`, `[]` (`Failed to format 1 of 3` → N=3), 1 crash |
| dropped + dropped2 (all-excluded) | exit 2, `2/0`, `all-excluded`, both paths listed | same | — |
| clean + clean2 | exit 0, `2/2`, `[]` | same | same |
| clean + link.ts (symlink) | exit 0, `1/1` (deduped at selection) | — | — |
| ignorefile + clean | exit 0, `2/2` (Deno counts ignore-file files as checked) | exit 0, `2/2` | — |
| clean + missing.ts (vanished path) | exit 2, `2/1`, `partial-exclusion`, dropped `[missing.ts]` | — | — |
| `--root empty/` | exit 2, `0/0`, `empty-selection` | exit 2, `0/0`, `empty-selection` | — |
| broken `deno.json` | exit 2, `processed-count-unavailable`, `unverifiedFiles [clean.ts]`, 1 crash rendered | same | — |
| lint `--input <log>` | `has("coverage")` = `false` | n/a | n/a |

No selection was found in which either wrapper reports exit 0 while a selected
path was not in Deno's processed count. The identity rule (batch processed
count == batch membership, else per-file probe reconciliation, else typed
refusal) held in every constructed case, including the pairing where a dropped
path shares a size-2 child batch with a crashing file and the pairing where
it sits alone in a size-1 batch.

Parser pins verified by reading and executing the focused suites: lint
`Checked N` singular/plural/ANSI/LF/CRLF; fmt all three forms with CRLF and
ANSI; `Found M … in N` and `Failed to format M of N` both use the **second**
integer (`Found 1 … in 2` → 2; `Failed 2 of 3` → 3); the third form is
rejected in check mode and the second form in write mode (`processed-count-
unavailable`); a duplicated summary is `processed-count-inconsistent`. `from
<path>:` blocks are never matched (anchored regexes; the dirty+clean control
with a `from` block yields `2/2`).

Precedence confirmed: refusal (exit 2) over crash (exit 1) over finding
(exit 1) in every mixed row above; lint exit is derived as
`refusals>0 ? 2 : failures>0||finding ? 1 : 0`; fmt exits 2 on any refusal
before the findings/crash exit 1.

## Findings

1. **Severity: informational (disclosed discrepancy, not a leaf defect).**
   The first `deno task test` execution at this head returned exit 1 with
   4,232/1/19: `plugins/streams/services/src/proxy_test.ts:79`
   ("streams live-read race: first live poll of a not-yet-created stream stays
   open and delivers on producer write") asserted `expected 200, got 204`.
   Evidence: that run overlapped with the `--batch-size 1` root lint (2,041
   sequential Deno spawns), root fmt, and unrelated jobs on the host; the file
   is outside the six-path envelope (`git diff --stat cf648f1ff...HEAD --
   plugins/streams` is empty; last touched in the beta.5 release cut); the
   test uses `getAvailablePort()` and a live-poll timing window; it passed
   3/3 on three isolated reruns of the file and the full `deno task test`
   rerun on a quieter host returned exit 0 with 4,233/0/19 (author's stated
   numbers). The author's `4,233 passed / 0 failed` claim is reproduced on
   the rerun; the first-run failure is a pre-existing timing flake outside
   this leaf. No plan clause is violated; recorded because the brief requires
   any executed-vs-claimed discrepancy to be stated.

2. **Severity: informational (observation, no plan clause violated).**
   `summary.failedBatches` in the fmt report differs across batch sizes for the
   same selection (e.g. mixed clean+dropped: 1 at size 1, 0 at sizes 2/200)
   because a wholly-excluded child batch is counted via `noTargetBatches`.
   The plan's batch-invariance clause enumerates exit, cause,
   processed/dropped identities, and diagnostic multiplicity — all of which
   are invariant — and does not include `summary.failedBatches`; the field's
   behavior is pre-existing. Not a finding against the contract.

No other finding. No new `deno-lint-ignore`, `quality-allow`, `as unknown
as`, or `any` appears in the product diff (the single grep hit is the string
literal `'export const value: any = 1;\n'` used as a lint-probe fixture inside
`run-deno-lint_test.ts`).

## Process checks (evaluator protocol)

- Plan-Gate: `plan-eval.md` records cycle-2 `FAIL_PLAN` (F4 only); the
  owner-accepted F4 amendment landed at `fc00aed0f` and the topic-supervisor
  Tier-A `PASS` on that head is recorded on PR #1710 before S1 (`fe4e4eec6`).
  Accepted decisions D1–D10, the six-path envelope, and closed findings F1–F4 /
  A1–A3 were not re-litigated.
- Design checkpoint present in `worklog.md`; commit slices S1→S4 follow the
  recorded order (`fe4e4eec6`, `78d9d008e`, `20898a074`, `14c4d7349`) with
  per-slice PR comments `[PHASE: IMPL][SLICE: S1..S4]` on #1710.
- PR #1710: `Closes #1709` present in body; labels `type:fix`, `area:tooling`,
  `status:impl-eval`, `ci:skip-e2e`, `ci:skip-scaffold`; milestone `0.0.7`.
- `arch-debt.md` delta vs baseline: none; plan declares no new or deepened
  debt and none was introduced.
- No Docker/Aspire/runtime lease, no merge, no label flip, no issue closure,
  no push to the author's implementation commits by this session.

## Plan stop conditions checked (Drift watch) — all intact

| Stop condition | Checked | Result |
| -------------- | ------- | ------ |
| Implementation needs a seventh path | scope diff | intact — six paths only |
| Either adapter lacks a reconcilable terminal processed count | raw Deno captures + adversarial matrix | intact — every form reconciled or refused with a typed cause |
| Root lint does not retain `2041/36/0` | gates 1–2 | intact — `2041/36/0` and `2041/2041/0` |
| Fmt cannot preserve ordinary/write semantics | fmt matrix rows dirty+clean (check exit 1; write exit 0 with file written), write crash exit 1 | intact |
| Shared JSON causes diverge | cross-wrapper rows (same keys/causes) + focused test "lint and fmt expose identical coverage keys and causes" | intact |
| Generator touches another output | gate 12–13 | intact — single file, idempotent |
| Quality allowances change | gate 10 | intact — `allowCount: 7` |
| CLI audit gains a new finding | gate 15 | intact — 19 WARN baseline, none new |
| CI-root/publish-consumer bound changes | manifest + dry run | intact — fmt not embedded, lint asset published |

## Must-not-regress list — verified

All-excluded exit 2 with every path and `all-excluded` (lint, fmt); empty exit
2 `empty-selection` (both); fully processed clean exit 0 with selected ==
processed (both, plus root 2041/2041); ordinary findings exit 1 with
diagnostics once (both); crash-without-finding exit 1 when coverage complete,
exit 2 only with a refusal, crash diagnostics once (lint, fmt check, fmt
write); fmt write counts from `Checked N` or `Failed to format M of N` using
`N` and probes with `--check` (write dirty+drop: original write applied,
probe non-mutating, exit 2); no rule/config/ignore/parser weakened;
`quality:scan` `allowCount: 7`.
