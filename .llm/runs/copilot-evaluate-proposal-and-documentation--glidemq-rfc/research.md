# Research — GlideMQ integration evaluation

Run: `copilot-evaluate-proposal-and-documentation--glidemq-rfc` · baseline `2779fb24` (2026-07-09)

## Corpus layout

| File | Content |
| --- | --- |
| `research/01-netscript-seams.md` | verified map of NetScript's queue/KV seams, plugin consumers, doctrine constraints, benchmark state |
| `research/02-glidemq-dossier.md` | exhaustive external dossier: GlideMQ value proposition, full API, internals, AI primitives, observability, Deno/NAPI analysis, maturity/bus-factor, ecosystem |
| `research/03-compatibility-matrix.md` | backend-by-backend compatibility verdicts (Garnet/Deno KV/Valkey/…), Deno runtime risk, supply-chain assessment |
| `research/04-ecosystem-mapping.md` | feature-by-feature projection onto workers/sagas/triggers/streams/ai/telemetry/dashboard + epics #399/#400 |

## Re-baseline

No carried-in plan. The proposal arrived as free-form owner text; all facts were derived fresh
against the current branch and primary sources (GlideMQ GitHub docs — glidemq.dev is DNS-blocked in
this sandbox, but the site is generated from `glide-mq/docs/*.md`, which were read directly;
mapping: guide/usage→USAGE.md, guide/architecture→ARCHITECTURE.md, guide/advanced→ADVANCED.md,
guide/observability→OBSERVABILITY.md, guide/ai-native→README+USAGE AI sections).

## Findings (each verifiable)

1. **F1 — GlideMQ hard-requires Valkey/Redis 7.0+ Functions and Streams.** All 44 server ops go
   through `FCALL` on a persistent Lua library; workers consume via `XREADGROUP`/`XAUTOCLAIM`.
   No EVAL fallback exists. (`glide-mq/docs/ARCHITECTURE.md`)
2. **F2 — Garnet cannot run GlideMQ.** Garnet has no FUNCTION/FCALL and no Streams. Deno KV,
   RabbitMQ, Postgres are structurally out. Therefore GlideMQ is only viable as **an additional
   adapter behind the `MessageQueue` port**, never a seam replacement.
3. **F3 — NetScript has precedent for exactly this shape.** `plugin-sagas-core` ships a
   Garnet-compatible LIST transport alongside the Redis Streams transport
   (`packages/plugin-sagas-core/src/transports/`), proving the "portable floor + capable ceiling"
   adapter policy this evaluation recommends.
4. **F4 — Deno compatibility is claimed but untested upstream.** README says "Deno with NAPI
   support"; `HANDOVER.md` says Bun/Deno NAPI testing is still pending (across 0.14→0.15.4). The
   `@glidemq/speedkey` Rust NAPI binary is the risk unit. A spike must gate any adapter plan. The
   documented cross-language `WIRE_PROTOCOL.md` (FCALL specs) provides a pure-TS fallback path.
5. **F5 — Bus factor is 1 with a forked native transport.** Single author across core, speedkey
   (personal valkey-glide fork, self-declared temporary), dashboard, and all integrations; pre-1.0
   (0.15.4); Apache-2.0. Containment: GlideMQ types must never leak into a NetScript public
   surface.
6. **F6 — The AI-native primitive set is the missing layer of `plugins/ai`.** NetScript's ai stack
   has model adapters + registry but zero durable-execution semantics. GlideMQ's seven primitives
   (usage recording, token streaming, suspend/resume, fallback chains, TPM limits, budgets, per-job
   locks) are queue-level concepts portable to any backend as NetScript ports.
7. **F7 — Dashboard/OTel assets align with open epics.** The dashboard REST+SSE+authorize surface
   is prior art for #400 S7–S10 and `/_netscript/*` (with its log-tail/metrics screens as the
   documented anti-pattern); span conventions + BYO-tracer + server-side metric buckets inform
   #399 TC/T6/T7.
8. **F8 — The seam benchmark has no successor.** `packages/bench` is the agent self-bench, not a
   seam perf benchmark; the legacy `rickylabs/netscript-start` benchmark repo is inaccessible
   (404). A benchmark must exist *before* a GlideMQ adapter ships or its 1-RTT claim cannot be
   validated on NetScript workloads → `issue-draft-benchmark.md`.
9. **F9 — Claimed performance is credible but narrow.** +9%→+38% vs "leading alternative" (BullMQ)
   on ElastiCache Valkey with TLS at c=5..20, converging at the Valkey single-thread ceiling. The
   mechanism (completeAndFetchNext in 1 FCALL) is sound; numbers are author-published and must be
   re-derived on NetScript's own benchmark (F8) before being cited.

## Open questions

| # | Question | Resolution path |
| --- | --- | --- |
| OQ1 | Does `@glidemq/speedkey` load under Deno 2.9 (`npm:` + nodeModulesDir + `--allow-ffi`)? | Phase 0 spike (RFC §7) |
| OQ2 | Valkey container resource in Aspire scaffold: reuse existing Redis resource with a Valkey image, or add a first-class provider? | CLI scaffold slice design at implementation time |
| OQ3 | Do the proposed AI ports (usage/stream/suspend/budget) live in `plugin-workers-core`, `plugin-ai-core`, or a shared execution-contract package? | doctrine decision, needs owner + PLAN-EVAL |
| OQ4 | Should NetScript adopt GlideMQ span names or keep OTel semconv `messaging.*`? | resolve in #399 T1 convention work (recommend semconv) |
