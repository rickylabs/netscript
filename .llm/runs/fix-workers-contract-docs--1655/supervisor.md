# Supervisor

G1 #1655, tracker #2474. Branch fix/workers-contract-docs from main a9620a34e14e067c56bb6af025ec015f7252b7aa. Owner authorized continuing unclaimed tracker cells. Codex implementer, feature tier, medium effort; separate read-only Claude Opus 5.5 evaluation (high effort requested), owner override continued from prior leaves. No privileged tier.

Write surface: this run directory; packages/plugin-workers-core/src/contracts/v1/workers.contract-types.ts and related contract exports only if necessary; public contract-graph consumer tests in packages/plugin-workers-core/tests/ and plugins/workers/tests/public/; .llm/harness/debt/arch-debt.md entries owned by #1655/#2066; generated MCP export corpus if public type/JSDoc changes require it. Preserve all existing export targets and exact oRPC capabilities. No runtime implementation, dependency or lock changes. Coordinator owns labels/milestones/merge/release and expensive runtime scheduling.
