# Context Pack — copilot-evaluate-proposal-and-documentation--glidemq-rfc

**One-paragraph resume:** Evaluation of GlideMQ (avifenesh/glide-mq, v0.15.4) for NetScript.
Verdict: **conditional-positive** — GlideMQ hard-requires Valkey/Redis 7+ Functions + Streams, so
it can never replace the `MessageQueue` seam (Garnet has neither; Deno KV/AMQP/Postgres are out),
but it fits as (A) an opt-in adapter gated on a Deno/NAPI spike, (B) the blueprint for
NetScript-owned AI-execution ports (usage/streaming/suspend/budget/failover — the layer
`plugins/ai` is missing), and (C) design harvest for epics #399 (OTel) and #400 (dashboard). RFC
drafted; benchmark-reintroduction issue drafted as a hard prerequisite; both pending owner
ratification + separate-session PLAN-EVAL (evaluator lanes blocked in this sandbox).

## Artifact index

| Artifact | State |
| --- | --- |
| `research.md` + `research/01..04` | complete — findings F1–F9, OQ1–OQ4 |
| `rfc-glidemq.md` | DRAFT, pending PLAN-EVAL + ratification |
| `issue-draft-benchmark.md` | draft, not filed |
| `.llm/harness/workflow/research-rfc-run.md` | landed (workflow promoted from this run) |
| plan/worklog/drift/supervisor | current |

## Key facts a resuming session must not re-derive

- GlideMQ: 44 Lua functions via FUNCTION LOAD/FCALL, streams+XAUTOCLAIM consumer model,
  `@glidemq/speedkey` Rust NAPI (personal valkey-glide fork), CJS, Node>=20, Apache-2.0, bus
  factor 1, Deno NAPI support claimed in README but flagged untested in the project's HANDOVER.md.
- Garnet: Lua EVAL only (no FUNCTION), no Streams → permanent GlideMQ blocker.
- NetScript precedent for the adapter policy: sagas Garnet list-transport
  (`packages/plugin-sagas-core/src/transports/`).
- `packages/bench` = agent self-bench, NOT a transport benchmark; legacy
  `rickylabs/netscript-start/benchmark` is 404.

## Next actions (owner)

1. PLAN-EVAL the RFC (OpenHands minimax-M3, separate session).
2. File the benchmark issue.
3. Phase-0 spike: `npm:glide-mq` under Deno 2.9 + Valkey container (OQ1 kill-switch for Track A).
