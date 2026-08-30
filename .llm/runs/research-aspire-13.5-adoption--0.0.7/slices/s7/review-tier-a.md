# S7 Tier-A slice review — #1719 / PR #1744 (phase A, stacked on S3)

- Reviewer: Fable 5 medium supervisor; generator: GPT-5.6 Sol medium, thread
  `01a0509d-93fe-7a53-8de2-9d26aba829fe`. Review worktree `/home/codex/repos/netscript-aspire-13-5-s7-eval`.
- Exact head: `473286671`; base = S3 head `fe4f496bd` (PR base `test/aspire-13-5-s3-fixture-recapture`).
  S3 commits untouched (merge-base == `fe4f496bd`). Tooling-only: 12 files under `.llm/tools`,
  +998/−49; zero `packages/`/`plugins/` changes.

## Commit stack
`593a33cec` RED #1429 fixture `process-tree-13.5.3-orphaned.json` + failing leak-check test
(run-gate receipt) → `555d204ba` descendant tracking in `leak-check.ts`/`ownership.ts` (DCP label /
`--apphost` argv / socket-path containment) → `28f8807d6` `--force-persistent` gate in
`teardown.ts` (only with `--apply` + proven ownership; dry-run prints exact argv; foreign refused)
→ `a0cbaf636` bounded post-stop confirmation (helper exit wait, never-exits → reported) →
`473286671` playbook 13.5 section, receipts, phase-B handoff.

## Substantive review
- `--all` appears only in `forbidden-commands_test.ts` (asserting it is never emitted).
- `MCP_COMMAND` guard (`ownership.ts:66`) still classifies `aspire agent mcp` as `unproven`
  (`ownership_test.ts:79`) and `probes.ts:179` skips it.
- Foreign-worktree AppHost stays reported-never-owned (tests against both ps fixtures).
- Phase B (#1429 live reproduction, foreign re-test) documented in `phase-b-handoff.md`; PR body
  states the S3 stacking and the lease dependency; `Closes #1719` / `Closes #1429` / `Part of #1712`;
  labels/milestone correct; 4 per-slice comments.

## Gates executed at `473286671`
| Gate | Result |
| --- | --- |
| configured `deno task lint` | exit 0 |
| `quality:scan` / `arch:check` | ok / exit 0 |
| `check:assets-barrel` (agent-tools corpus embeds `.llm/tools` docs) | PASS |
| `run-deno-test` `.llm/tools/agentic/teardown` (both fixtures) | 40 passed / 0 failed |
| `run-deno-check` teardown | 0 diagnostics |
| raw `deno lint --no-config` / fmt on 9 changed TS files; fmt on playbook + README | clean |
| new lint-ignore / `as unknown as` / `any` | 0 |

Consumer type-check (D-19): N/A — no generator/template change. No blocking finding.
**Tier-A verdict: sign-off to IMPL-EVAL (phase A) at `473286671`.**
