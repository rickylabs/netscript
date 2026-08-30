# Evaluation: S7 — Aspire 13.5 teardown / leak-check (phase A) — PR #1744

Allowed result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`.
Anti-pattern status values: `CLEAR`, `VIOLATION`, `DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field          | Value                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Run ID         | `fix-aspire-13-5-s7-teardown-leak-check--impl`                                                                             |
| Target         | `.llm/tools/agentic/teardown` + `.llm/tools/CLEANUP-PLAYBOOK.md` (issue #1719, #1429; epic #1712)                          |
| Evaluated head | **`473286671f31d206f7ac75666ae6214bf6498e73`** on `fix/aspire-13-5-s7-teardown-leak-check`; base = S3 head `fe4f496bd` (merge-base verified == `fe4f496bd`, S3 commits untouched) |
| Archetype      | `6 - CLI / Tooling` (internal-tooling analogue)                                                                            |
| Scope overlays | none                                                                                                                       |
| Evaluator      | Claude · Anthropic · Fable 5 · medium, native opposite-family IMPL-EVAL of Codex · GPT-5.6 Sol work; separate session from generator and from Tier-A review; worktree `/home/codex/repos/netscript-aspire-13-5-s7-eval` (detached at head, no product edits); 2026-08-30 |
| Phase          | **Phase A only.** Phase B (#1429 live reproduction, foreign-AppHost re-test) is lease-backed and was **not** required here. |

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                                   |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | `PASS` | `worklog.md` Progress Log 2026-08-30T03:05:31Z records `PLAN-EVAL: N/A` (owner-ratified issue + brief lock all five slices) before slice 1.                 |
| Design section exists in worklog       | `PASS` | `worklog.md` `## Design` with Public Surface / Vocabulary / Ports / Constants / Commit Slices (5) / Deferred Scope.                                        |
| Commit slices match design plan        | `PASS` | 5 commits after `fe4f496bd`: `593a33cec` RED → `555d204ba` descendants → `28f8807d6` `--force-persistent` → `a0cbaf636` post-stop confirm → `473286671` playbook/gates. Order matches Design + brief. |
| Each slice has a passing gate          | `PASS` | Receipts `01`–`05` present and re-executed by me (see Static/Runtime). RED reproduced at `593a33cec` (base source + new test): exit 1, 7 pass / 1 fail, `[]` vs 3 `process`. |
| Commit trail (push + per-slice PR comment) | `FAIL` | PR #1744 has **4** `[PHASE: IMPL] [SLICE: n/5]` comments (1–4). No slice-5 comment exists for `473286671`, yet `worklog.md` slice-5 row states "evidence is posted on PR #1744". Tier-A note also counted 4. |
| No speculative seams (unused files)    | `PASS` | Every new export (`probeProcesses`, `processBelongsToAppHost`, `parseTeardownArgs`, `MCP_COMMAND`, `ProcessCandidate`) has a consumer or focused test.       |
| Constants used for finite vocabularies | `PASS` | `ProcessEvidenceKind` union; `MIN_ORPHAN_PROCESS_AGE_MS`, `DEFAULT_CONFIRM_*`, `MCP_COMMAND` named constants; force argv built by `scopedStopCommand`.       |
| Brief carries `## SKILL` chapter       | `PASS` | `slices/s7/brief.md:3`.                                                                                                                                    |

## Static Gates

All commands executed by the evaluator at `473286671` in the eval worktree.

| Gate             | Command or check                                                                                                                        | Result | Evidence                                                              | Notes |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------- | ----- |
| Narrow typecheck | `run-deno-check.ts --root .llm/tools/agentic/teardown --ext ts`                                                                         | `PASS` | 12 files, 0 diagnostics                                               |       |
| Slice typecheck  | same (all 12 teardown files are the slice)                                                                                              | `PASS` | as above                                                              |       |
| Format           | `run-deno-fmt.ts --root .llm/tools/agentic/teardown --ext ts`                                                                           | `PASS` | 12/12 processed, 0 findings                                           |       |
| Lint (scoped)    | `run-deno-lint.ts --root .llm/tools/agentic/teardown --ext ts --config <empty {}>`                                                      | `PASS` | 12/12 processed, 0 findings. Without `--config` the wrapper refuses `all-excluded` (root config excludes `.llm/`) — generator's "explicit empty config" note verified. |       |
| Lint (configured)| `run-deno-lint.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)\|…)"` (wrapper invoked directly; `deno task lint` was cache-served) | `PASS` | 0 occurrences (`$CLAUDE_JOB_DIR/tmp/gates/configured-lint-direct.json`) |       |
| Quality scan     | `deno task quality:scan`                                                                                                                | `PASS` | exit 0, `allowanceFailures: []`                                       |       |
| Arch check       | `deno task arch:check`                                                                                                                  | `PASS` | exit 0, baseline `export default` WARNs only                          |       |
| Assets barrel    | `deno task check:assets-barrel`                                                                                                         | `PASS` | exit 0; `git status --porcelain` empty afterwards (no generated delta) |       |
| Forbidden patterns | `git diff fe4f496bd..473286671` grep for `deno-lint-ignore`, `as unknown as`, `any`, `@ts-ignore`, `--all`                           | `PASS` | 0 in code; `--all` appears only in `forbidden-commands_test.ts` guard, playbook prose ("never emits `--all`"), plan/handoff prose |       |
| Scope boundary   | `git diff --stat fe4f496bd..473286671`                                                                                                  | `PASS` | 32 files, all under `.llm/`; zero `packages/`/`plugins/` changes; S3 fixtures untouched |       |
| Doc lint / Publish dry-run | —                                                                                                                             | `N/A`  | internal tooling; no package surface                                  |       |

## Fitness Gates

| Gate | Function                     | Result | Evidence                                                                 | Violations |
| ---- | ---------------------------- | ------ | ------------------------------------------------------------------------ | ---------- |
| F-10 | Test-shape audit             | `PASS` | 38 named tests / 40 results (13.4.6 + 13.5.3 ps fixtures loop), synthetic process fixture, all IO injected via `CommandPort`/`FilePort`/`sleep`/`processProbe` | none |
| F-19 | Scoped source gate runners   | `PASS` | scoped check/lint/fmt above                                              | none |
| F-1…F-9, F-11…F-18 | package gates          | `N/A`  | no `packages/`/`plugins/` change                                         | —    |

## Runtime Gates

| Gate                                  | Validation                                                                                                   | Result | Evidence |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------ | -------- |
| RED-first (#1429 visibility)          | Temp worktree at `593a33cec` (= base source + test + fixture): `run-deno-test.ts -- --allow-all leak-check_test.ts` | `PASS` (RED as intended) | exit 1; 7 passed / 1 failed; `13.5.3 orphaned PPID-1 Aspire descendants are reported` → `[]` vs `['process','process','process']`. Matches `receipts/01-red-orphan-process.json`. |
| Teardown unit suite at head           | `run-deno-test.ts -- --allow-all .llm/tools/agentic/teardown`                                                | `PASS` | 40 passed / 0 failed / 0 ignored (both `aspire-ps-13.4.6.json` and `aspire-ps-13.5.3.json` + process fixture) |
| Descendant tracking                   | `probes.ts` `probeProcesses`: DCP env paths, exact `--apphost`/`--apphost=` argv, fd→`/proc/net/unix` socket paths; PPID never used for ownership; `classify` uses path containment only | `PASS` | tests #9, #11 (argv-mention false positive), #18 (owned/foreign/unproven by evidence path) |
| `MCP_COMMAND` guard                   | `ownership.ts` regex now `aspire (agent )?mcp`; `probes.ts` skips MCP rows; `classify` → `unproven`         | `PASS` | tests #16, #17 |
| Foreign AppHost reported, never owned | both ps fixtures → `classify(...) === 'foreign'`; dry-run leaves foreign in `escalated`, runs no command       | `PASS` | probes_test fixture loop; teardown tests #27, #28 |
| `--force-persistent` gating (static)  | flag does not imply apply (#26); dry-run prints exact argv incl. `--force` only for owned (#28); apply emits force only after scoped stop confirmed + `classify === 'owned'` re-check (#29); default apply never forces (#31) | `PASS` | argv exactly `aspire stop --force --apphost <exact> --non-interactive --nologo` |
| `--force-persistent` semantics vs S2  | Ordering **scoped stop → confirm gone → `stop --force`** checked against S2 receipts                          | `FAIL` | See Finding 1. |
| Post-stop confirmation bound          | 6 × 500 ms = 2.5 s, comment cites S2 V6 385 ms; S2 `02-v6-aspire-ps-after-kill.time.txt` = `elapsed_ms: 385` confirmed | `PASS` | tests #35 (helper exits after 2 probes, sleeps `[500,500]`), #36 (never exits → escalated, no kill, only the scoped stop was run) |
| Orphan TERM safety                    | owned + age ≥ 30 s + aspire census ok + stable `/proc/<pid>/stat` start identity + not associated with a surviving AppHost | `PASS` | tests #37, #38 |
| Phase B live reproduction             | —                                                                                                            | `N/A`  | lease-backed; not required for this verdict; procedure in `phase-b-handoff.md` |

## Consumer Gates

| Consumer                    | Validation                                        | Result | Evidence |
| --------------------------- | ------------------------------------------------- | ------ | -------- |
| agent-tools embedded corpus | `deno task check:assets-barrel` + clean git status | `PASS` | exit 0, no delta (corpus embeds `.llm/tools` docs; playbook section is present in `CLEANUP-PLAYBOOK.md` ## Aspire 13.5 teardown semantics) |
| Generated AppHost typecheck (D-19) | —                                          | `N/A`  | no generator/template change |

## Anti-Pattern Check

| AP    | Status      | Evidence                                                                                              | Notes |
| ----- | ----------- | ----------------------------------------------------------------------------------------------------- | ----- |
| AP-10 | `VIOLATION` | `teardown.ts:213-221`: force result accepted on exit code alone; S2 V6 shows scoped stop on an already-stopped AppHost prints "No AppHost is currently running" with `exit_code: 0` → persistent cleanup failure is converted into a clean result (A13). | Finding 1 |
| AP-12 | `CLEAR`     | `sleep`/`processProbe`/`confirmAttempts` injected; no wall-clock in tests                              |       |
| AP-25 | `CLEAR`     | IO confined to `ports.ts`/`probes.ts`; `classify`, `buildLeakReport`, `processBelongsToAppHost` pure  |       |
| AP-1…9, 11, 13–24 | `N/A` | outside tooling scope                                                                                 |       |

## Arch-Debt Delta

| Metric                | Count | Evidence                                   |
| --------------------- | ----- | ------------------------------------------ |
| New entries           | 0     | `plan.md` Arch-Debt: none; none needed     |
| Resolved entries      | 0     | —                                          |
| Deepened violations   | 0     | —                                          |
| Unrecorded violations | 0     | Finding 1 is a correctness fix, not debt   |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| `high`   | **`--force-persistent` apply path is very likely inert and reports false-clean.** `runTeardown` runs `aspire stop --apphost <exact>`, waits until the AppHost PID and helpers are gone, and only then runs `aspire stop --force --apphost <exact>`. S2 V7 (`02-v7-aspire-stop-force.raw.txt`) proved `--force` against a *running* AppHost ("Found running AppHost … stopped successfully … Cleaning up persistent resources … cleaned up", 4.42 s). S2 V6 (`02-v6-aspire-stop-after-kill.raw.txt` + `.time.txt`) shows `aspire stop --apphost <exact>` with no running AppHost returns "ℹ️ No AppHost is currently running … Use 'aspire run' to start it first." with **`exit_code: 0`**. `aspire stop --help` (13.5.3 on this host) defines `--force` as "Stop the AppHost and clean up its persistent resources" — a stop variant. So after the confirmed scoped stop, the force call will hit the no-AppHost early return, exit 0, leave the persistent Postgres in place, and `teardown.ts:216-220` records no escalation (`stoppedAppHosts` already pushed) — exactly the A13 / AP-10 false-clean the plan forbids. Locked decision D4 (V7-proven argv) is honored textually but not semantically. Test #29 encodes the wrong ordering as expected behaviour. | `teardown.ts:196-221`; S2 receipts cited; `aspire stop --help` | **fix**: when `forcePersistent` and the AppHost is owned, make `aspire stop --force --apphost <exact> --non-interactive --nologo` *the* scoped stop (single call, then the same bounded PID/helper confirmation), or keep the two-step but verify persistent cleanup positively (e.g. owned containers labelled `com.microsoft.developer.usvc-dev.persistent=true` gone) and escalate otherwise; update tests #28/#29 and the playbook sentence "Only after … the normal scoped stop is confirmed may teardown execute `aspire stop --force`". Phase B then confirms live. |
| `medium` | **Slice-5 PR comment missing; worklog claims it was posted.** PR #1744 has slice comments 1/5–4/5 only; `worklog.md` slice-5 "push" row says "evidence is posted on PR #1744". Per-slice trackability (harness invariant) requires the comment before the slice is complete. | `gh api …/issues/1744/comments` → 4 comments; Tier-A note "4 per-slice comments" | **fix**: post `**[PHASE: IMPL] [SLICE: 5/5]**` for `473286671` with the 05-* receipt evidence; correct the worklog row. |
| `low`    | `DCP_ENVIRONMENT_KEY = /(?:ASPIRE\|DCP)/i` treats *any* env key containing those substrings as DCP evidence; a non-Aspire long-lived process inside the worktree exporting e.g. `ASPIRE_*=/<worktree>/…` becomes owned + kill-eligible (age ≥ 30 s, census ok). Path containment bounds the blast radius to the run's own worktree, and the argv false-positive test exists, but no env-key false-positive test does. | `probes.ts:12,117-125`; no `ASPIRE`/`DCP` keys in this host's env today | consider tightening to the known DCP/Aspire path variables or requiring `aspireProcessIdentity` for TERM eligibility; add an env-key false-positive test. Non-blocking. |
| `low`    | MCP processes are dropped from discovery (`probes.ts` `continue`) rather than surfaced as `unproven` survivors, so `leak-check` never lists them. Consistent with "never a target", but reduces visibility. | `probes.ts:179` | none required; note only. |
| `info`   | `deno task lint` receipt `05-configured-lint.json` was produced by the task runner; on re-run it was cache-served ("cached, inputs unchanged"). I invoked the wrapper directly (0 findings). Future receipts should cite the wrapper JSON. | `$CLAUDE_JOB_DIR/tmp/gates/configured-lint-direct.json` | none. |

## PR / process checks (brief item 8)

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Draft, base = S3 branch, stacking + lease stated | `PASS` | `isDraft: true`, `baseRefName: test/aspire-13-5-s3-fixture-recapture`, body "Stacked base … @ fe4f496bd", "Phase B depends on a supervisor-provided runtime lease" |
| Closing keywords | `PASS` | body `Closes #1719`, `Closes #1429`, `Part of #1712` |
| Labels / milestone | `PASS` | `type:fix status:impl area:tooling area:aspire priority:p1 epic:aspire-13-5`; milestone `0.0.7`; exactly one `status:` |
| Per-commit comments | `FAIL` | 4 of 5 (Finding 2) |
| Explicit-refspec pushes | `PASS` (as recorded) | worklog rows cite `git push origin HEAD:refs/heads/…`; remote head == `473286671` |
| Close-gate (#1719/#1429 gate boxes) | `N/A` now | PR is draft; DoD boxes for phase B and IMPL-EVAL correctly unchecked; must be revisited before `status:ready-merge` |
| No runtime started | `PASS` | no AppHost start in any receipt; evaluator started none |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| A receipt proves the command *in the state it was run* | V7 proved `stop --force` against a running AppHost; re-using its argv after a completed scoped stop is a different state. Encode lifecycle receipts with their precondition, and test the precondition, not just the argv. | tooling/Aspire lifecycle slices | high |
| Exit 0 from `aspire stop` is not "stopped" | 13.5.3 returns 0 with an info line when nothing is running; confirmation must be positive (PID/helper/container gone), never exit-code based. | teardown tooling | high |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `FAIL_FIX` |
| Rationale | Plan and slice structure are valid and phase A is otherwise complete: RED reproduced independently at `593a33cec`, all gates re-executed green at `473286671` (40/40 tests on both fixtures, scoped check/lint/fmt, configured lint, quality:scan, arch:check, assets-barrel, no forbidden patterns, no `packages/`/`plugins/` or S3 edits, no runtime). Two implementation/evidence defects block PASS: (1) the `--force-persistent` apply ordering runs `stop --force` only after the AppHost is already confirmed gone, which S2 V6 evidence shows returns exit 0 without acting — a silent false-clean of the very feature slice 3 delivers (AP-10/A13); (2) slice 5 has no PR evidence comment while the worklog says it was posted. Phase B was not required and its absence is not held against the PR. Re-evaluate after the fix commit(s) land on the same draft PR. |
