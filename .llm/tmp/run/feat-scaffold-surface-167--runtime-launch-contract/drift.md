# Drift

- 2026-06-30 Slice 0 (minor): The PLAN-EVAL refinement said sagas already exposed
  `startSagaRuntime`; inspection showed the real exported start API was `startSagaRunner`.
  Chose option (a) and added `startSagaRuntime` as an additive alias while keeping the existing
  `./runtime` export and real saga background runner.

