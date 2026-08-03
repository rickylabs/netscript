## Summary

Hardens the four release-blocking control gaps found during the 0.0.4 cut: evaluator child-model
cost safety, session-owned PR publication bodies, mandatory Redis regression execution, and the
declared streams breaking-change note.

Do not merge until PLAN-EVAL, all four evidence-backed acceptance mirrors, and final IMPL-EVAL pass.

## Scope

- Archetype / area: internal tooling + CI + release notes
- Closes #1087
- Closes #1084
- Closes #1080
- Closes #1083

## Slices

- [x] S0 research, plan, and Design checkpoint — bootstrap commit
- [ ] S1 #1087 evaluator child-model guard
- [ ] S2 #1084 session-owned publication bodies
- [ ] S3 #1080 Redis CI execution and negative control
- [ ] S4 #1083 0.0.4 breaking-change note
- [ ] S5 full gates and separate IMPL-EVAL

## Definition of Done

- [ ] PLAN-EVAL passed before implementation
- [ ] Every issue acceptance box has linked command/CI evidence
- [ ] Each issue slice was committed, pushed, and commented before the next
- [ ] Required static, agentic, Redis/package, and docs gates are green
- [ ] IMPL-EVAL passed in a separate open-model session
- [ ] Close-gate and review-thread gate pass

## Validation

- Pending PLAN-EVAL and implementation.

## Harness

- Run dir: `.llm/runs/fix-1087-harness-hardening--release-blockers/`
- Phase: plan — see structured phase comments.

## Drift / Debt

- Owner-assigned Codex supervisor route and bootstrap evaluator `Agent` deny are recorded in
  `drift.md`; no architecture debt is planned.

## Acceptance evidence

Evidence is intentionally absent until observed. No issue checkbox should be mirrored yet.
