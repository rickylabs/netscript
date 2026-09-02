# Context pack — topic-docs-0.0.7

**Lane status: 0.0.7 queue CLEAR.** Reconciled against live GitHub and `origin/main` on 2026-09-02.

This file has twice been wrong in the same direction — claiming live work that had already shipped,
then claiming a parked lane that was mid-programme. Reconcile against `origin/main` and live GitHub
before trusting a word of it.

## Anchor facts

| Fact | Value |
| --- | --- |
| Current `main` | `850cc7757` (merged #1935) |
| Supervisor | native Claude Opus 5 · high |
| Topic branch | `orchestrator/release-0.0.7-docs` — push by explicit refspec only |
| Authoritative queue | every open item labelled `orchestrator:docs` |
| **0.0.7 docs queue** | **empty** — no open docs-owned issue or PR in milestone 27 |
| Merge authority | primary milestone coordinator merges; this supervisor **never** merges |
| Ownership labelling | `orchestrator:docs` applied **when the leaf PR is opened**, never at finalization |
| Evaluator route | OpenRouter · **GLM 5.3 Flash** · `max` for IMPL-EVAL; **Qwen 3.8 Flash** · `max` for PLAN-EVAL. No DeepSeek for new dispatches. |
| Evaluator transport | `deno task agentic:claude-openrouter` → `.llm/tools/agentic/claude/openrouter-run.ts` |
| Workflow-scoped push | `env -u GH_TOKEN -u GITHUB_TOKEN git -c credential.helper= -c credential.helper='!gh auth git-credential' push …` — the injected `GH_TOKEN` and `~/.gitconfig`'s helper are both repo-only |

## Shipped

- **`docs:exports-drift`** — umbrella **#1777 CLOSED**. 35 mapping rows + 1 typed exclusion = 36/36
  reference pages, self-enforcing: a newly published reference page fails the gate unless mapped or
  excluded.
- **`docs:jsdoc-examples`** — **#1756** merged `0f7fefb6b`; **#1914** (`declare global` program-wide
  leakage, unattributed diagnostics) merged `634b83d64`. Ceilings 116 / 14.
- **`docs:readme-fences`** — **#1925** merged (squash) `25a026c0e`, **#1935** merged `850cc7757`.
  Package and plugin README fences now compile. Census on `main`:
  `readmes=36 fences=168 ts_like=73 checked=73 syntax_invalid=0 type_errors=7 failing_readmes=5`.

## Open, deliberately outside 0.0.7

**#1939** (`Backlog / Triage`, `status:triage`) — the `@app/router.ts` fence pair. The #1935
IMPL-EVAL prototyped a `materializeSharedSupports` support stub that clears it and its downstream
`TS18046` (7→5, failing READMEs 5→4) **with no README change**. Deferred because a fabricated router
stub is a shared fixture every package's fences compile against and can drift from the real scaffold
generator silently. Filed to Backlog on purpose so it cannot gate the release train.

## Traps this lane paid for — do not relearn them

- **A ratchet baseline measured on a branch head is stale the moment `main` moves.** #1925's gate
  failed its own first CI run for exactly this. Measure on the **merge base**.
- **A stacked PR base silently disables required CI.** `ci.yml` filters
  `pull_request.branches: [main, 'feat/**', 'epic/**', 'canary/**']`, so a leaf-branch base runs
  **no** `check-test`/`quality`/`close-gate` while GitHub still reports `MERGEABLE / CLEAN`.
  Retargeting emits `edited`, not a trigger type — a **new head** is required. Verify a `ci` run
  exists for the exact head (`gh api "repos/<r>/actions/runs?head_sha=<sha>"`).
- **Never `deno fmt` a Markdown file to tidy an edit.** Package READMEs are not fmt-enforced;
  formatting one buries the change in rewrapping and can split inline code spans. And **never check
  formatting on a copy outside the repo** — `deno fmt` then uses its defaults, not the repo config,
  and reports false positives. That error put a wrong claim in a PR body.
- **Flip `status:ready-merge` before the push that triggers CI**, or close-gate races the label and
  you pay a rerun.
- **A repaired README stales `packages/mcp/src/publish-assets.generated.ts`**, which embeds it
  verbatim. Regenerate with `deno task gen:publish-assets`; the sibling artifacts
  (`check:agent-docs-prose`, `check:assets-barrel`) are unaffected by package READMEs.
- **Never restore a shared file wholesale when converging.** Take current `main`'s copy, apply only
  this change's own edit, then assert prior content survived **by name**. Near-missed five times
  this milestone; on #1935 the add/add resolution was verified line-by-line against `origin/main`
  for exactly this reason.
- **`git diff --check` run bare after committing is a no-op.** Use
  `git diff --check $(git merge-base origin/main HEAD) HEAD`.

## Exact next actions

None owned in 0.0.7 — the queue is clear. If a slot frees, useful work in priority order:

1. Documentation/claim audits of active 0.0.7 PRs owned by other lanes, handing bounded findings to
   their owning supervisor **without changing topic ownership**.
2. **#1939**, only once 0.0.7 has shipped.
