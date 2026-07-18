use harness

## SKILL
- netscript-harness — you are the supervisor-dispatched IMPL-EVAL for a Claude-authored chore (route review_claude: Codex · GPT-5.6 Sol · xhigh). You EVALUATE ONLY: no fixes, no merges, no pushes, no labels.
- netscript-tools; rtk

## IMPL-EVAL: PR #794 — review-pairing ladder in routing policy (Claude Opus 4.8-authored)

Read `.llm/harness/evaluator/protocol.md` + `verdict-definitions.md` + `.llm/harness/workflow/lane-policy.md` (in this worktree — it contains the change). Subject: worktree `/home/codex/repos/b10-routing`, branch `chore/routing-review-ladder` @ 7084c9b0, base `feat/beta10-integration`. Diff: `git diff origin/feat/beta10-integration...HEAD`.

Ratified doctrine to check against (owner, 2026-07-16): light_implementation Sol·low → review Opus 4.8·high (fallback Sonnet 5·high); Sol·medium → Fable 5·low (fallback Opus·low); Sol·high → Fable 5·medium (fallback Opus·medium); future Sol·max → Fable·high (prose forward-rule); fast_iteration Luna·max (swarm) → Opus 4.8·medium (fallback Sonnet·high). Fable review primaries in-plan/auto-selectable (per #784 doctrine — note #784 is on main, not this base; the PR intentionally applies it to review lanes only and defers the rest to integration→main reconciliation). Sol effort-selection guidance prose (low default / medium research-decisions / high new-feature-complex / max architectural-escalation) must be present and dated.

Probe: (1) routing-policy.ts bindings exactly match the ladder incl. fallback families (all Claude-family — opposite-family review never traded away); (2) no hardcoded model-id strings outside config/ (re-run the guard test); (3) the rescoped "Fable never auto-selected on non-review lanes" test doesn't accidentally weaken an invariant that other code relies on (grep consumers of resolveCanonicalRoute); (4) lane-policy.md table/prose consistent with the TS bindings (no drift between the two); (5) tests: re-run `deno test --no-lock -A .llm/tools/agentic/runtime/ .llm/tools/agentic/config/` yourself; (6) MODEL_IDS.sonnet addition is referenced, not orphaned.

Write verdict (PASS/FAIL_FIX/FAIL_RESCOPE/FAIL_DEBT) + numbered findings to `/home/codex/repos/netscript-beta10-cli/.llm/runs/beta10-cli--orchestrator/slices/794-routing-eval/evaluate.md` (you have write access to that path only for the verdict). Final message: verdict + rationale + findings. Do not modify the subject worktree.
