# T2-A supervisor preparation — #1117 / PR #1317

- Status: prepared, not dispatchable until T1 has merged into the canary.14 train.
- Worktree: `/home/codex/repos/ns005-genjobs`
- Branch: `feat/mcp-openapi-tools-1117`
- Current local/remote/PR head: `abdae400e099c9b47c2381ad08c5921ca164ab22`
- Current PR base: `canary/0.0.5-canary.14`
- Current observed train head: `2508eb8c99c9cfc55e0c9f1d7ab72fea745db492`
- Route after dependency opens: Codex GPT-5.6 Sol low, bypass, launched only through
  `.llm/tools/agentic/` as a new sender-free thread.
- Formal evaluator after implementation handoff: separate Qwen 3.8 Max high session.
- Draft/public PR: <https://github.com/rickylabs/netscript/pull/1317>
- Issue: <https://github.com/rickylabs/netscript/issues/1117>

## Pre-dispatch hold

Do not launch while T1-A lacks a formal evaluator verdict or while T1-B lacks current-head green
hosted contexts. T2 is explicitly sequenced after the T1 train mutations. At dispatch, fetch the
then-current train head, replace the observed-base value above, and carry that exact SHA in the
implementation prompt and launch evidence.

## Existing evidence classification

The inherited branch is currently mergeable, current-head green, and has zero review threads. Its
tracked `evaluate.md` is a historical composed waiver under ruling D6, not the separate formal
IMPL-EVAL required by the current owner contract. The PR body also still names canary.13 as its base
train. Both must be corrected after the post-T1 integration and fresh validation.

## Unowned worktree state

The worktree contains only a pre-existing 45-line `deno.lock` rewrite. It is not part of #1117:

- patch hash: `cfc68984cc145d8b1329d34312e8ffb2cf63825baabf7589e55cbad449f26b9c`
- recovery commit: `b7b335566a0cece79677137ccb2ec73efb92d027`

Do not stage, restore, overwrite, pop, or drop it. Re-verify both identities before and after every
supervisor/evaluator turn.
