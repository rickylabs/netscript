# S7 Tier-A slice review — #1719 / PR #1744 (phase A, stacked on S3)

- Reviewer: Fable 5 medium supervisor; generator: GPT-5.6 Sol medium, thread
  `01a0509d-93fe-7a53-8de2-9d26aba829fe`. Review worktree
  `/home/codex/repos/netscript-aspire-13-5-s7-eval`.
- Exact head: `473286671`; base = S3 head `fe4f496bd` (PR base
  `test/aspire-13-5-s3-fixture-recapture`). S3 commits untouched (merge-base == `fe4f496bd`).
  Tooling-only: 12 files under `.llm/tools`, +998/−49; zero `packages/`/`plugins/` changes.

## Commit stack

`593a33cec` RED #1429 fixture `process-tree-13.5.3-orphaned.json` + failing leak-check test
(run-gate receipt) → `555d204ba` descendant tracking in `leak-check.ts`/`ownership.ts` (DCP label /
`--apphost` argv / socket-path containment) → `28f8807d6` `--force-persistent` gate in `teardown.ts`
(only with `--apply` + proven ownership; dry-run prints exact argv; foreign refused) → `a0cbaf636`
bounded post-stop confirmation (helper exit wait, never-exits → reported) → `473286671` playbook
13.5 section, receipts, phase-B handoff.

## Substantive review

- `--all` appears only in `forbidden-commands_test.ts` (asserting it is never emitted).
- `MCP_COMMAND` guard (`ownership.ts:66`) still classifies `aspire agent mcp` as `unproven`
  (`ownership_test.ts:79`) and `probes.ts:179` skips it.
- Foreign-worktree AppHost stays reported-never-owned (tests against both ps fixtures).
- Phase B (#1429 live reproduction, foreign re-test) documented in `phase-b-handoff.md`; PR body
  states the S3 stacking and the lease dependency; `Closes #1719` / `Closes #1429` /
  `Part of #1712`; labels/milestone correct; 4 per-slice comments.

## Gates executed at `473286671`

| Gate                                                                              | Result               |
| --------------------------------------------------------------------------------- | -------------------- |
| configured `deno task lint`                                                       | exit 0               |
| `quality:scan` / `arch:check`                                                     | ok / exit 0          |
| `check:assets-barrel` (agent-tools corpus embeds `.llm/tools` docs)               | PASS                 |
| `run-deno-test` `.llm/tools/agentic/teardown` (both fixtures)                     | 40 passed / 0 failed |
| `run-deno-check` teardown                                                         | 0 diagnostics        |
| raw `deno lint --no-config` / fmt on 9 changed TS files; fmt on playbook + README | clean                |
| new lint-ignore / `as unknown as` / `any`                                         | 0                    |

Consumer type-check (D-19): N/A — no generator/template change. No blocking finding. **Tier-A
verdict: sign-off to IMPL-EVAL (phase A) at `473286671`.**

## IMPL-EVAL cycle 1 (session `4cd5ba90`, head `473286671`) — `FAIL_FIX`

- HIGH: `--force-persistent` runs `aspire stop --force` only after the scoped stop confirmed the
  AppHost gone — S2 V6 shows that form exits 0 with "No AppHost is currently running" → silent
  false-clean; S2 V7 shows `--force` acts only against a running AppHost. **Tier-A miss:** I checked
  the gate/argv/refusal arms, not the lifecycle precondition against the S2 receipts. Lesson
  (evaluator's, adopted): a receipt proves the command _in the state it was run_; exit 0 from
  `aspire stop` is not "stopped".
- MEDIUM: slice-5 PR comment missing though the worklog claims it. LOW: `DCP_ENVIRONMENT_KEY`
  env-key false positive untested; MCP processes dropped rather than surfaced (note only).
- Fix brief sent on the thread (slice 6). Cycle 2 follows.

## Cycle 2 — head `eb6f188ce` (slice 6) — **sign-off to IMPL-EVAL cycle 2**

- `scopedStopCommand(appHostPath, forcePersistent)` makes `--force` the stop variant while the owned
  AppHost is running (`teardown.ts:57-61,192,244`); `NO_RUNNING_APPHOST_FOR_PERSISTENT_CLEANUP` is
  an action-required line, never clean; positive confirmation only.
- New test arms:
  `apply uses force-persistent as the single stop while the owned AppHost is
  running`,
  `force-persistent refuses an already-gone AppHost and reports operator action`,
  `force-stop accepts a persistent container only after a positive gone census`,
  `process probe
  ignores worktree paths in Aspire-like env keys without Aspire identity` (env-key
  false positive).
- Gates at `eb6f188ce`: configured lint wrapper exit 0 / 0 findings; `quality:scan` ok; `arch:check`
  0; `check:assets-barrel` PASS; teardown suite 46/0; check 0; raw lint/fmt clean; no `--all`
  outside the forbidden-commands test; PR comments now 6 (slices 5 + 6 posted).
