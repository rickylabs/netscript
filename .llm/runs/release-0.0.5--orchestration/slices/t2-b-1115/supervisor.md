# T2-B supervisor preparation — #1115 / PR #1318

- Status: prepared, not dispatchable until T1 has merged into the canary.14 train.
- Worktree: `/home/codex/repos/ns005-plugrm`
- Branch: `feat/agent-follow-live-1115`
- Current local/remote/PR head: `d2a900c7d8f94d8ed608450164c1ab678face149`
- Current PR base: `canary/0.0.5-canary.14`
- Current observed train head: `2508eb8c99c9cfc55e0c9f1d7ab72fea745db492`
- Route after dependency opens: Codex GPT-5.6 Sol low, bypass, launched only through
  `.llm/tools/agentic/` as a new sender-free thread.
- Formal evaluator after implementation handoff: separate Qwen 3.8 Max high session.
- Draft/public PR: <https://github.com/rickylabs/netscript/pull/1318>
- Issue: <https://github.com/rickylabs/netscript/issues/1115>

## Pre-dispatch hold

Do not launch while T1-A lacks a formal evaluator verdict or while T1-B lacks current-head green
hosted contexts. T2 is explicitly sequenced after the T1 train mutations. At dispatch, fetch the
then-current train head, replace the observed-base value above, and carry that exact SHA in the
implementation prompt and launch evidence.

## Existing evidence classification

The inherited branch is currently mergeable, current-head green, and has zero review threads. Its
tracked `evaluate.md` explicitly says the independent evaluation is pending. It is therefore not an
admissible formal IMPL-EVAL despite the live `status:ready-merge` label. The PR body also still
names canary.13 as its base and must be corrected after post-T1 integration.

## Unowned worktree state

The worktree contains only the same pre-existing 45-line `deno.lock` rewrite seen in T2-A. It is not
part of #1115:

- patch hash: `cfc68984cc145d8b1329d34312e8ffb2cf63825baabf7589e55cbad449f26b9c`
- recovery commit: `d953769b0f7d07de94838dcbaa6485f3a024b7d6`

Do not stage, restore, overwrite, pop, or drop it. Re-verify both identities before and after every
supervisor/evaluator turn.
