# Supervisor identity

- Run: `fix-release-publish-budget-residue--w1a`
- Host: native WSL ext4
- Worktree: `/home/codex/repos/ns005-c15-w1a-publish-safety`
- Branch: `fix/release-publish-budget-residue`
- Base: `origin/main` at `d6db645a89d830e6c36e838e8e1dac98fc84fde5`
- Implementation lane: `light_implementation` — daemon-attached Codex, requested GPT-5.6 Sol low
- Thread: `019fdad7-3da6-7cf2-bc1d-7a87431bd4ba`; daemon-attached receipt in `codex-thread-ids.md`
- Formal evaluation: separate-session IMPL-EVAL; owner override selects DeepSeek V4 Flash 0731 max, with Gemini 3.6 Flash high through checked-in AGY/Google only if the OpenRouter lane is blocked
- PLAN-EVAL: explicitly waived by the owner for this small W1 cluster; proportional research, design, gates, and independent IMPL-EVAL remain required
- Merge authority: milestone orchestrator only

## Overrides

- The owner's Canary.15 continuation prompt supersedes the older checked-in evaluator default where they differ.
- OpenHands is paused and must not be invoked.
- Written owner waiver: PLAN-EVAL is intentionally skipped for this proportional W1-A cluster;
  the separate-session IMPL-EVAL remains mandatory and is left to the milestone orchestrator.
