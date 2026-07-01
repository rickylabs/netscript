# Drift

- minor: The S2 coordinator checkout had unrelated dirty supervisor scratch files. This run uses a
  clean sibling worktree to avoid mixing those changes into the branch.
- minor: `.agents/skills/README.md` said `aspire` was not present, but the tracked repo includes
  `.agents/skills/aspire/SKILL.md`.
- minor: Repo `codex-wsl-remote` guidance lacked the current medium reasoning defaults.
- significant: PLAN-EVAL identified hook lockfile churn and smoke evidence hygiene gaps. Both are
  now promoted into the plan and fixed in the follow-up slice.
- significant: Claude dynamic workflows / Ultracode were missing from the first plan despite being
  a high-leverage Claude Code feature. The plan now includes a cost-controlled policy that combines
  workflows with the NetScript harness and WSL Codex subagent lane instead of replacing it.
