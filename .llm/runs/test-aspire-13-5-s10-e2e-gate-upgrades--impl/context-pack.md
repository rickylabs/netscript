# Context pack — S10 #1722

- Worktree: `/home/agent/projects/netscript/worktrees/007-aspire-s10`
- Branch: `test/aspire-13-5-s10-e2e-gate-upgrades`
- Stack base: S8 `9dd06647`
- Draft PR base: `feat/aspire-13-5-s8-typed-resource-commands`
- Issues: closes #1722; part of #1712; refs #1372 without closing it
- Phase A only: fixtures/static gates; no AppHost start, containers, or runtime suites
- D-43: remote-Docker loopback makes all lease-backed AppHost gates environment-blocked here
- Push: `git push origin HEAD:refs/heads/test/aspire-13-5-s10-e2e-gate-upgrades`
- Required evaluator: separate Fable IMPL-EVAL; this implementation session cannot certify
- S7 contract is mirrored from branch file/lines and never imported from `.llm/tools`
- Doctor fixture capture: Aspire/Docker empty before and after, 5 pass / 3 warning / 0 fail
