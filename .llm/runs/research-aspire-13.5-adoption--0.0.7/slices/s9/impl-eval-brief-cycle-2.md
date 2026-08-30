use harness

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md`, `.llm/harness/evaluator/protocol.md`, and
`.llm/harness/evaluator/verdict-definitions.md`. You are the **independent IMPL-EVAL evaluator,
cycle 2** (Claude · Fable 5 · medium): a separate session from the generator thread, the supervisor,
and the cycle-1 evaluator; you inherit no verdict.

## Context

- Slice **S9** (#1721, PR #1759 draft, base `feat/aspire-13-5-s8-typed-resource-commands`). Cycle 1
  (`slices/s9/evaluate.md`, head `e11de98d`) = `FAIL_FIX`: F-1 `S9-HELP` citation path; F-2
  smoke-gate failure receipt discarded `toolsObserved`; F-3 outer timeout == inner deadline; F-4
  `list_structured_logs` unchecked; F-5 sqlite-tier visibility names assumed (Phase-B input); F-6
  supervisor disclosure. The docs_audit cycle 1 (`slices/s9/docs-audit/report.md`) = `FAIL_FIX` (H1,
  M1–M4, L1) was fixed in `4af21ddf`; the IMPL-EVAL fixes land in the commit(s) after it.
- Evaluate **exactly** head `f6ca9695`; scoped range `e11de98d..f6ca9695` for the fixes, and confirm
  nothing else regressed (re-run the gate set). Worktree:
  `/home/agent/projects/netscript/worktrees/007-aspire-s9-eval` (detached at `f6ca9695`, read-only
  for product files). Supervisor run dir:
  `/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/`
  (read `slices/s9/evaluate.md`, `slices/s9/review-tier-a.md`, `slices/s9/docs-audit/report*.md`,
  `drift.md` D-45/D-46/D-47).
- Environment (D-39): Deno 2.9.5; Aspire 13.5.3 / dotnet 10.0.400 / node 24.20.0 via
  `/home/agent/.local/bin/mise exec --`; Docker 28.5.2 on `tcp://netscript-dind:2375`; inotify 1024.
  **Static only: no `aspire start`, no containers, no `e2e:cli` runtime**; at most one AppHost-less
  stdio `aspire agent mcp` session if you need to re-reproduce the static receipt; `aspire ps` `[]`
  before/after.

## What to verify (execute yourself)

1. F-1 closed: the `S9-HELP` tag cites a committed S9 receipt that actually captures
   `aspire docs api search --help` (`receipts/aspire-13.5.3-docs-api-search-help.json`), propagated
   to all mirrors/bundles (sha256 identical).
2. F-2 closed: drive the gate with the recorded 14-tool transcript → the **failure** receipt
   persists `toolsObserved` (14 names), `toolsMissing == ["get_integration_docs"]`, `toolsExtra`,
   `baselineDiff`, `serverInfo`, `doctor`, partial lifecycle timings; fixture test present and
   green.
3. F-3 closed: outer budget strictly exceeds the inner deadlines or the partial receipt is written
   before the final deadline; tested.
4. F-4 closed: `list_structured_logs` `isError` checked and count recorded.
5. F-5: recorded in the S9 worklog as a Phase-B brief input (no code change expected).
6. Regression gates at head: scoped `deno check`, raw lint/fmt on changed files, `quality:scan`,
   `arch:check`, `check:assets-barrel`, `check:publish-assets`, `check:mcp-export-corpus`,
   `agentic:sync-claude:check`, `agentic:check-claude`, `agentic:dogfood-skills:check`, tests for
   `packages/cli/e2e/tests` and agent-init roots;
   `git grep -n '13\.4\.6' -- skills .agents/skills .claude/skills packages/cli/src/kernel/assets` →
   0 hits; no new `any`/casts/lint-ignores.
7. PR hygiene unchanged (draft, base, `Closes #1721`, `Part of #1712`, labels, milestone, per-slice
   comments for the fix commits).

## Output

Write `evaluate-cycle-2.md` (declare the exact head) to
`/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s9/evaluate-cycle-2.md`
and post the verdict as a PR #1759 comment starting with `**[PHASE: IMPL-EVAL]**` and the head SHA.
Verdict ∈ `PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`; `PASS` = **phase A only**. Do not
commit to the S9 branch, do not mark ready, do not merge, do not relabel, no runtime.
