# Context pack — S10 #1722

- Worktree: `/home/agent/projects/netscript/worktrees/007-aspire-s10`
- Branch: `test/aspire-13-5-s10-e2e-gate-upgrades`
- Stack base: S8 `9dd06647`
- Draft PR base: `feat/aspire-13-5-s8-typed-resource-commands`
- Issues: closes #1722; part of #1712; refs #1372 without closing it
- This host remains static-only: no AppHost start, containers, or runtime suites
- D-43: remote-Docker loopback makes all lease-backed AppHost gates environment-blocked here
- Push: `git push origin HEAD:refs/heads/test/aspire-13-5-s10-e2e-gate-upgrades`
- Required evaluator: separate Fable IMPL-EVAL; this implementation session cannot certify
- S7 contract is mirrored from branch file/lines and never imported from `.llm/tools`
- Doctor fixture capture: Aspire/Docker empty before and after, 5 pass / 3 warning / 0 fail
- Draft PR: `rickylabs/netscript#1760`, draft, base S8 branch, milestone `0.0.7`
- Phase-A commits: `b4d0a56f`, `690d70b6`, `d6daf416`, `df8b3f18`, `14daa764`, plus this IMPL-EVAL
  cycle-1 fix commit
- IMPL-EVAL cycle 1: independent Fable verdict `FAIL_FIX`; F-1/F-2/F-3/F-4/F-7 are addressed in this
  commit, while F-5/F-6/F-8 are documented for the Phase-B/evaluator handoff
- Final static verdict after fixes: 190 CLI-E2E tests pass; scoped check/lint/fmt and all required
  repository gates pass
- Off-host Phase-B evidence: Actions run `33326591443` exposed Aspire 13.5.3's bare-`ResourceJson`
  follow-stream shape after 36 passing gates in both tiers. The current slice adds dual bare/wrapped
  parsing with captured-style RED coverage; local focused wrapper verdict is 16/16 tests plus green
  scoped check/lint/fmt.
- Off-host Phase-B cycle 2: Actions run `33327294781` exposed nullable/omitted
  `ResourceHealthReportJson.Status`. The parser now represents this as explicit pending `Unknown`,
  retries convergence, and lets later string reports win. The exact 18-line real capture is checked
  in; its final postgres report is Unhealthy (not Healthy as the steering text stated), while the
  web report supplies the real pending-to-Healthy transition. Focused verdict: 14/14 evidence tests
  plus green scoped check/lint/fmt; no runtime, evaluator, or CI dispatch.
