use harness

## SKILL

Read `AGENTS.md`, `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-tools/SKILL.md`.
You are the Codex · GPT-5.6 Sol · medium implementation thread for **S1 bounded review fix**
(PR #1727 review comment `r3890336485`), worktree
`/home/agent/projects/netscript/worktrees/007-aspire-s1`, branch
`chore/aspire-13-5-s1-pin-bump` @ `c4cbda25410cd56d915d420c17d97ee74c16be55`. **No runtime, no
AppHost, no containers, no evaluators, no CI dispatch.** Explicit-refspec push.

## Finding (augmentcode, `.llm/tools/validation/check-aspire-version-parity.ts:171`)

The peer-version check uses substring matching, so `13.5.30` (or any longer token containing
`13.5.3`) is misclassified as satisfying the required `13.5.3` pin — phase 2 could pass a compat
fixture that is not actually on the pinned train.

## Required change (bounded)

1. Replace the substring match with an **exact token match** (equality on the parsed/trimmed
   version string, or a boundary-anchored match if the field can carry a suffix like
   `-preview.1.26425.3` that must still equal exactly). Name the exact comparison in a constant.
2. RED first: a fixture/unit test where the peer value is `13.5.30` and the required pin is
   `13.5.3` — must FAIL under the old logic and PASS (correctly rejected) under the fix. Add a
   companion exact-match positive case.
3. Negative regression test asserting `13.5.30` is never accepted as `13.5.3`.
4. Scoped gates: `run-deno-check.ts`/`lint`/`fmt --ext ts,tsx` on
   `.llm/tools/validation`, `run-deno-test.ts -- --allow-all` on the touched test file,
   `deno task check:aspire-version-parity`. Commit citing PR comment `r3890336485`; push
   `HEAD:refs/heads/chore/aspire-13-5-s1-pin-bump`; PR #1727 comment
   `## [PHASE: IMPL] S1 — exact-token version match`; final line = new head SHA.
