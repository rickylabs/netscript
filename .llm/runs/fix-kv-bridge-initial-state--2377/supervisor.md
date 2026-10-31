# KV bridge initial-state fallback — supervisor

Issue #2377, tracker #2474 (mc009e, C1); branch fix/kv-bridge-initial-state. Baseline main: 14816a409e31505bc528714332b0bf4670be2fcb (includes merged #2522).

Assigned implementer: OpenAI Codex, feature tier, high effort. Current pinned matrix queried using `deno task agentic:matrix --tier feature --json`: implementation sol/xhigh then muse_spark_1_3/xhigh; plan evaluation glm_5_3/provider_default then fable_5_1/low; implementation evaluation muse_spark_1_3/xhigh then opus_5/xhigh. Feature policy: plan max 2, implementation max 5, reuse reviewer; two consecutive terminal failures escalate.

Workflow retained from the owner-authorized milestone leaf process: separate read-only Anthropic Claude Opus 5.5/high PLAN-EVAL and IMPL-EVAL, stdin closed; final review at exact pushed head. Different session/vendor from implementation; same reviewer reused across rounds for this leaf. Override grant carried from prior leaf workflow: "Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only."

## Allowed write surface

- packages/kv/adapters/denokv-bridge.ts: watch fallback and wrapped-adapter JSDoc.
- packages/kv/tests/bridge_test.ts and watch-initial_test.ts: regression coverage as needed.
- .llm/runs/fix-kv-bridge-initial-state--2377/**: plan, research, design, evaluations, evidence, memory and dated lesson.

Retain prior run artifacts. No lock/dependency churn, no labels/milestones or coordinator control-plane mutation, no merge/tag/release. No local scaffold.runtime or expensive-gate overlap. Public artifacts omit operator paths, hostnames, ports and session ids. Native runner evidence stays outside the Git tree.

PLAN-EVAL implementation scope refinement: new dedicated `packages/kv/tests/bridge-watch-initial_test.ts` replaces extending the already 384-line initial-watch suite with unrelated third-party fallback cases. No source or runtime scope change.
