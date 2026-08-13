use harness

## SKILL

Read and follow `AGENTS.md` plus these skills completely before evaluating:

- `.agents/skills/netscript-harness/SKILL.md`
- `.agents/skills/netscript-tools/SKILL.md`
- `.agents/skills/netscript-pr/SKILL.md`
- `.agents/skills/netscript-cli/SKILL.md`
- `.agents/skills/netscript-doctrine/SKILL.md`
- `.agents/skills/netscript-deno-toolchain/SKILL.md`
- `.agents/skills/jsr-audit/SKILL.md`
- `.agents/skills/aspire/SKILL.md`
- `.agents/skills/rtk/SKILL.md`

# Formal IMPL-EVAL — legacy-port-pin-sweep / PR #1643

Act as the fresh separate formal IMPL-EVAL session for Codex-authored PR #1643. The native
Claude-family route is currently allowance-blocked, so lane policy selected the configured open
fallback: Claude/OpenRouter `deepseek/deepseek-v4-flash-0731`, max effort. You are the sole fixes
topic evaluator. Do not delegate or launch another evaluator.

Subject facts:

- immutable base: `01e0960494c95ce56eb35892c211a095eb13e6ed`;
- current review/sign-off head before this prompt: `af3dca0f5`;
- semantic implementation: `3d32e9ee2ee37dc9cebfe645f93e3a4ea479c215`;
- receipt subject: `6242edabc3679173c841e2e167f7f5786819e720`;
- evidence commit: `98d5d9654d00ca3e737d68cb2a68c2e0223f4c1e`;
- hygiene correction: `786c5e78513706889c48e53664ba1bea9b9a51ae`;
- Tier-A review: `.llm/runs/fix-legacy-port-pin-sweep--0.0.7-wave0/review-tier-a.md`;
- live issue: #1243; draft PR: #1643 direct to `main`.

Evaluate independently:

1. Read the live issue, coordinator scope-amendment comments, PR body/comments, full product diff,
   Tier-A review, plan/drift/worklog, and every relevant receipt/report.
2. Confirm the implementation removes the auth command's silent localhost:4437 default, requires
   explicit `--stream-url`, fails before calling the session adapter when omitted, and provides
   actionable Aspire endpoint discovery guidance.
3. Confirm the coordinator-classified manifest/copy port fields remain unchanged compatibility
   metadata and no undeclared schema/copy redesign entered the branch.
4. Verify receipt claims, claimed/actual Git heads, lock hygiene, JSR/publish evidence, and review
   isolation. Run only the smallest independent non-expensive checks needed to substantiate the
   verdict. Do not run `scaffold.runtime`, Aspire, Docker, or publish.
5. Treat the broad formatting delta as reviewable only if it remains mechanically isolated from the
   semantic commit. Inspect for hidden behavioral drift rather than trusting the implementer.

Output contract:

- Write `.llm/runs/fix-legacy-port-pin-sweep--0.0.7-wave0/evaluate.md` with requested and observed
  route/session identity, evidence reviewed, findings with severity, and exactly one formal verdict:
  `IMPL-EVAL: PASS`, `IMPL-EVAL: FAIL_FIX`, `IMPL-EVAL: FAIL_RESCOPE`, or `IMPL-EVAL: ERROR`.
- Do not edit product code. The only permitted file edit is `evaluate.md`.
- Commit only `evaluate.md`, push with explicit refspec
  `git push origin HEAD:refs/heads/fix/legacy-port-pin-sweep`, and leave the worktree clean with no
  upstream.
- Post one structured PR comment headed `**[PHASE: IMPL-EVAL] [VERDICT: <verdict>]**`, including the
  evaluated source/receipt heads and evaluator commit SHA.
- Keep PR #1643 draft at `status:impl`. Do not mark ready, add a closing keyword, merge, publish,
  mutate issue/milestone state, request an expensive-gate lease, or touch central cluster state.
