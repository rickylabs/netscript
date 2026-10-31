# Supervisor

- Assignment: #2132, milestone 0.0.9 C1; coordinator #2474.
- Branch: `orch/divybot-6540033818`, base main at `c6bce8f86f5f9e0bf61d1b5bdb228b153de37d59`.
- Implementer: assigned Codex session, OpenAI family, feature tier, high effort.
- Read matrix: `deno task agentic:matrix --tier feature --json`; implementation sol / muse_spark_1_3, PLAN glm_5_3 / fable_5_1, IMPL muse_spark_1_3 / opus_5.
- Owner override (verbatim): “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”
- Owner limits: at most 2 PLAN rounds / 5 IMPL rounds, same evaluator resumed, no same-family evaluation. Stop after two consecutive terminal failures.
- Authorized write surface: `packages/kv/adapters/redis.adapter.ts`, `packages/kv/adapters/redis/`, `packages/kv/adapters/deno-kv.adapter.ts`, `packages/kv/adapters/memory.adapter.ts`, `packages/kv/tests/`, `packages/kv/types/common.ts`, `packages/kv/README.md`, and this run directory. Deno adapter or memory changes only if shared contract exposes a divergence.
- Private prompts, execution logs and backend configuration: project run storage outside Git. No private machine identifiers in tracked artifacts or PR comments.
- No label/milestone changes; no merge/release; no local scaffold runtime E2E. Assignment file excluded from commits.
- Scope expansion after independent IMPL-EVAL: `packages/kv/adapters/denokv-bridge.ts`, with focused
  native-vs-bridge inclusive-start tests under the already-authorized tests directory. Rationale
  and exact compatibility correction are in drift.md; no exported signature changes.
