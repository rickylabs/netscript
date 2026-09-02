# Supervisor brief — #1908 concurrency-key isolation

- Topic: `topic-internals-0.0.7`. Issue **#1908**, p1, milestone 0.0.7, `orchestrator:internals`.
- Base of record: `main` at dispatch = `d5c5810db`. Branch `ci/e2e-concurrency-key-isolation`.
- Lane policy: implementation on WSL Codex. Native Fable 5 IMPL-EVAL is owner-reported
  quota-blocked; the recorded fallback is a fresh local Claude/OpenRouter GLM 5.3 Flash max session,
  as bound by `formal_impl_evaluation` policy.
- **This is blocking PR #1889.** Its runtime receipt has now been destroyed twice by this defect.
