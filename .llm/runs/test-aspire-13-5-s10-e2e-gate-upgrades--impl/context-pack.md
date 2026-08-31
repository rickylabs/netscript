# Context pack — S10 #1722

- Worktree: `/home/agent/projects/netscript/worktrees/007-aspire-s10`
- Branch: `test/aspire-13-5-s10-e2e-gate-upgrades`
- Stack base: reconstructed S8 `bc838a0b3`
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
- Off-host Phase-B cycle 3: Actions run `33328308643` exposed omitted nullable `ResourceJson.State`
  on `prisma-studio` and `sagas-api`. `DescribeResourceLine` now models the complete nullable root
  DTO, missing/null state is explicit pending `Unknown`, missing/null reports are empty, and later
  observations replace pending state. Focused verdict: 17/17 evidence tests plus green scoped
  check/lint/fmt; no runtime, evaluator, or CI dispatch.
- D-133 replayed the nine S10 commits from `fbda6a5b` onto reconstructed S8 `bc838a0b3`; local
  replay head is `00437994d`. The two ruled listener files take main/upstream in full, the stale old
  lineage is absent, and assets/check/fmt/lint/quality/architecture/parity plus repo-wide check are
  green. The surface manifest drops the obsolete row for deleted `wait-for-workers-runtime.ts`.
- Push remains blocked: current main advanced to `584caa03f` and is not an ancestor of fixed target
  `bc838a0b3`; additionally, main's preserved D-101 test fails because unchanged S10 production
  code invokes `evidence/listener-readiness.ts` instead of the expected
  `verify-listener-readiness.ts` (88 pass / 1 fail). `readListenerHealthReport()` remains exported
  from the complete main file. No force-push occurred; coordinator ruling is required.
- D-136 resolved both blockers: the correct stacked ancestry assertion is
  `merge-base HEAD bc838a0b3 == bc838a0b3`, which passes, and the canonical listener module is
  `runtime/verify-listener-readiness.ts`. All remaining consumers were repointed to it, the cosmetic
  `runtime/evidence/listener-readiness.ts` relocation was deleted, and the focused D-101/S10 set
  passes 89/89. Repo-wide check has `failedBatches: 0`; scoped check/lint/fmt, parity, assets,
  quality, and architecture are green. D-133's blocker entry is retained as historical evidence;
  it is no longer active.
- D-171 consumes the selected database's maximum listener expectation as the describe-follow
  minimum (300 seconds normally, 600 seconds for MSSQL); the environment may only raise it. A
  post-database `runtime.aspire-describe` refresh now runs after restart/allocation and before all
  replayed wait gates, so convergence evidence cannot be stale after the fallback. The protected
  D-101 module remains untouched. Static validation only; a supervisor-dispatched IMPL-EVAL follows.
