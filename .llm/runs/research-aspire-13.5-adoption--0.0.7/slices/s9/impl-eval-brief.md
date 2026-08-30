use harness

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md`, `.llm/harness/evaluator/protocol.md`,
`.llm/harness/evaluator/verdict-definitions.md`, `.agents/skills/netscript-doctrine/SKILL.md`, and
`.agents/skills/netscript-tools/SKILL.md`. You are the **independent IMPL-EVAL evaluator** (Claude ·
Fable 5 · medium, native opposite-family route for Codex · GPT-5.6 Sol work): a separate session
from the generator thread and the supervisor; you inherit no verdict and self-certify nothing.

## Context

- Slice: **S9 — skills, corpora, and Aspire MCP alignment with a smoke-receipt gate** (#1721, PR
  #1759 draft, base `feat/aspire-13-5-s8-typed-resource-commands`). Epic #1712. Evaluate **exactly**
  head `e11de98d` on `fix/aspire-13-5-s9-skills-mcp-alignment`; base = S8 `9dd06647` (evaluate only
  `9dd06647..e11de98d`). Your worktree:
  `/home/agent/projects/netscript/worktrees/007-aspire-s9-eval` (detached at that head; product
  files read-only). Supervisor run dir (absolute):
  `/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/`
  — read `sub-issues/09-skills-corpora-mcp-alignment.md` (the contract), `plan.md` D-6/D-7/D-12/
  D-13/D-16 + OF-1 (a), `slices/s9/brief.md`, `slices/s9/review-tier-a.md`, `drift.md` D-39/D-42/
  D-43/**D-45**, `receipts/aspire-13.4.6-mcp-baseline.json`, `aspire-surface-manifest.tsv`; the S9
  branch's own run dir `.llm/runs/fix-aspire-13-5-s9-skills-mcp-alignment--impl/` (worklog, drift,
  `receipts/aspire-13.5.3-mcp-tools-static.json`); PR #1759 commit list + per-slice comments.
- Environment (authoritative, D-39): Deno 2.9.5; Aspire CLI 13.5.3, dotnet 10.0.400, node 24.20.0
  via `/home/agent/.local/bin/mise exec --`; Docker 28.5.2 on `tcp://netscript-dind:2375`; inotify
  1024; tini. **Phase A is static: no `aspire start`, no containers, no `e2e:cli` runtime.** You MAY
  run one AppHost-less stdio `aspire agent mcp` session (initialize / tools/list / doctor, then
  close stdin) to reproduce the static receipt; record `aspire ps` `[]` and `docker ps -a` empty
  before/after. Host AppHost gates are environment-blocked (D-42/D-43) — not a slice defect.
- **D-45 is a known finding, not grounds for FAIL by itself:** the 13.5.3 server exposes the 14
  baseline tools; `get_integration_docs` is documented upstream but unobserved AppHost-less. Judge
  whether the slice handled it honestly (receipt verbatim, gate assertion unchanged and failing
  loudly, skill table not claiming an unobserved tool) — that is the evaluation, not the tool's
  existence.

## What to verify (execute yourself)

1. Gate `agent.aspire-mcp-smoke`: registered in `cli-surface.ts`; placed in `scaffold.runtime` after
   `runtime.aspire-start` + wait gates and before cleanup on both tiers; explicit skip receipt
   (never silently absent) when the runtime phase does not run; transport injectable; recorded
   transcript fixture drives unit tests for: 15-tool expectation and baseline diff, visibility
   (`<db>-cli` MCP-excluded / `describeListsExcluded`), redaction (secret params `null`, no
   plaintext leak), timeouts → `fail` with partial receipt, shutdown lifecycle; receipt schema
   matches the sub-issue.
2. Part B through generators only: `skills/aspire/SKILL.md` claims cite S2/S9 receipts (spot-check
   three claims against the cited receipt files); `.agents/skills/aspire` and
   `.claude/skills/aspire` are byte-identical mirrors produced by `agentic:sync-claude` (no hand
   edits); `netscript agent
   init` installs exactly
   `aspire-init,aspire-orchestration,aspire-monitoring,aspire-deployment` by explicit name (never
   `aspire`/`all`) and the `aspire/SKILL.md` hash-unchanged test exists and passes; `init-agent.ts`
   AGENTS.md block updated; barrel/corpus/publish-assets regenerated (`check:assets-barrel`,
   `check:mcp-export-corpus`, `check:publish-assets`, `agentic:sync-claude:check`,
   `agentic:check-claude` green); dogfood check present or its absence justified in the worklog.
3. Acceptance grep
   `git grep -n '13\.4\.6' -- skills .agents/skills .claude/skills
   packages/cli/src/kernel/assets`
   → only manifest-`archival` rows may remain; list every hit with its manifest disposition.
4. Doctrine + gates: `quality:scan`, `arch:check`, scoped check / raw lint / raw fmt on changed
   files, tests for touched roots; no new `any` / casts / lint-ignores; archival rows untouched; no
   public docs prose (S11), no `excludeFromMcp()` emission change (S8), no pins (S1).
5. PR hygiene: draft, base branch, `Closes #1721`, `Part of #1712`, labels, milestone 0.0.7,
   per-slice comments; #1721 `status:impl`. Report, do not fix.

## Output

Write `evaluate.md` (from `.llm/harness/templates/evaluate.md`, declare the exact head) to
`/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s9/evaluate.md`
and post the same verdict as a PR #1759 comment starting with `**[PHASE: IMPL-EVAL]**` and the head
SHA. Verdict ∈ `PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`; `PASS` means **phase A only** —
say so; Phase B (live D-12 smoke receipt on the isolated AppHost, dashboard-only listing,
`get_integration_docs` resolution) remains lease-backed and environment-blocked. Do not commit to
the S9 branch, do not mark ready, do not merge, do not relabel, do not start any AppHost or
container.
