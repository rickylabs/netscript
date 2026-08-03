## Summary

Hardens the four release-blocking control gaps found during the 0.0.4 cut: evaluator child-model
cost safety, session-owned PR publication bodies, mandatory Redis regression execution, and the
declared streams breaking-change note.

All four evidence-backed acceptance mirrors, PLAN-EVAL, slice reviews, and final IMPL-EVAL pass.

## Scope

- Archetype / area: internal tooling + CI + release notes
- Closes #1087
- Closes #1084
- Closes #1080
- Closes #1083

## Slices

- [x] S0 research, plan, and Design checkpoint — bootstrap commit
- [x] S1 #1087 evaluator child-model guard
- [x] S2 #1084 session-owned publication bodies
- [x] S3 #1080 Redis CI execution and negative control
- [x] S4 #1083 0.0.4 breaking-change note
- [x] S5 full gates and separate IMPL-EVAL

## Definition of Done

- [x] PLAN-EVAL passed before implementation
- [x] Every issue acceptance box has linked command/CI evidence
- [x] Each issue slice was committed, pushed, and commented before the next
- [x] Required static, agentic, Redis/package, and docs gates are green
- [x] IMPL-EVAL passed in a separate open-model session
- [x] Close-gate and review-thread gate pass

## Validation

- Root check: 2,526 files / 22 batches / zero findings.
- Full repository tests: 2,548 passed / zero failed / 16 explicit integration-E2E ignores.
- Agentic suite: 337 passed / zero failed, including volatile-config and routing-policy guards.
- Hosted Redis proof:
  [run 30808236575, job 91668504084](https://github.com/rickylabs/netscript/actions/runs/30808236575/job/91668504084)
  — both exact tests `ok`; both exact tests `FAILED` under the pre-#1075 transform; outer negative
  control PASS.
- Hosted close-gate and review-thread gate:
  [run 30808935212](https://github.com/rickylabs/netscript/actions/runs/30808935212) — success.
- PLAN-EVAL and IMPL-EVAL: PASS in separate guarded open-model sessions.

## Harness

- Run dir: `.llm/runs/fix-1087-harness-hardening--release-blockers/`
- Phase: IMPL-EVAL passed — see `impl-eval.md` and structured phase comments.

## Drift / Debt

- Owner-assigned Codex supervisor route and bootstrap evaluator `Agent` deny are recorded in
  `drift.md`; no architecture debt is planned.

## Acceptance evidence

- #1087: https://github.com/rickylabs/netscript/issues/1087#issuecomment-5165174894
- #1084: https://github.com/rickylabs/netscript/issues/1084#issuecomment-5165272641
- #1080: https://github.com/rickylabs/netscript/issues/1080#issuecomment-5165611814
- #1083: https://github.com/rickylabs/netscript/issues/1083#issuecomment-5165636677
