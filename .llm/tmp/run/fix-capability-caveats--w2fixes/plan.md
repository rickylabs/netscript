# Plan — Capability Caveats Fix Track (W2 "fix them all")

Run-id: `fix-capability-caveats--w2fixes`  ·  Base: `main`  ·  Branch family: `fix/cap-caveat-*`
Source of truth: `.llm/tmp/run/docs-v2-audit/{capability-truth-matrix,caveats-and-gaps}.md`

## Intent
The W2 ground-truth audit found 5 real implementation caveats. The maintainer directed: fix all of
them in code (not document-as-limitation), so the docs can describe them as WORKING. Each fix is an
independent harnessed slice with its own branch/PR, gates, and IMPL-EVAL. This plan is the single
PLAN-EVAL target covering all five.

## Doctrine / constraints (binding)
- Supervisor (Claude) coordinates only; WSL Codex implements; OpenHands evaluates. No self-cert.
- No implementation slice starts before this plan returns PLAN-EVAL `PASS`.
- Do NOT touch the dependency catalog, version pins (`scaffold-versions.ts`), or lock files except
  where a slice genuinely requires a reviewed dep (S5 may need a pg/queue dep — flag for review, do
  not de-catalog). Option-A catalog law holds: npm via `catalog:`, JSR inline `jsr:`.
- Contract-first: define/confirm the schema-or-type contract, then implementation, then tests.
- Each slice: branch off `main`, `git branch --unset-upstream`, push explicit refspec, open PR →
  `main`, comment slice scope + commit + gate evidence, append `commits.md`.
- Wrap validation in `rtk proxy`; targeted `deno check` includes `--unstable-kv`.

## Slices

### S1 — Service RPC path correction (size S, low risk) — START FIRST
**Problem (evidence):** the scaffolded service serves oRPC at `/api/rpc` (default
`packages/service/src/builder/service-rpc.ts:41`, scaffold template passes no `rpcPath` override),
but three user-facing surfaces wrongly say `/rpc`:
- `packages/cli/src/kernel/application/scaffold/init-orchestrator.ts:112` (post-scaffold next-steps)
- `packages/cli/src/kernel/templates/workspace/generate-readme.ts:140` (generated README)
- `docs/site/tutorials/build-a-service.md:209` (tutorial) — docs surface, may be done in W3 instead.
**Fix:** correct the two CLI strings to `/api/rpc` (keep them consistent with the actual default).
Do not change the default path or the preset. Update/extend the CLI tests that assert next-steps /
README text so they pin `/api/rpc`.
**Acceptance / gates:**
- Unit: `orchestrate-init_test.ts` + `generators_test.ts` assert `/api/rpc`, no `/rpc` for the RPC
  endpoint. `rtk proxy deno test` green for those files.
- Runtime confirm (the maintainer-requested check): scaffold a service workspace, start it, GET
  `/rpc` → 404 and GET `/api/openapi.json` (proves `/api` base) → 200; record outputs in worklog.
- `rtk proxy deno task check` (CLI scope) green.
- Lock hygiene: deno.lock unchanged.
**Archetype:** ARCHETYPE for `packages/cli` (CLI scaffold output) + SCOPE-docs for the tutorial line.

### S2 — Trigger `defer` action dispatch (size M)
**Problem:** `plugins/triggers/src/runtime/trigger-runtime-processor.ts:94` returns immediately for
`action.kind === 'defer'`; only `enqueue` proceeds (`:98`). A `defer` action is silently dropped.
**Fix (contract-first):** decide the intended `defer` semantics from the builder/contract
(`packages/plugin-triggers-core/src/builders`). Either (a) implement deferred dispatch (schedule the
action for later execution via the existing jobs/cron path) or (b) if deferred semantics are
out-of-scope for this release, make the processor hard-error / log-and-reject so it is never a silent
no-op. Prefer (a) if the contract already models a delay; else (b) with a tracked debt entry.
**Gates:** new runtime test proving a `defer` action is dispatched (or rejected, per chosen
semantics); triggers plugin check/lint/test green; no change to webhook ingress behavior.

### S3 — Streams topic producer/consumer wiring + reconnect (size M/L)
**Problem:** `plugins/streams/src/public/stream-api.ts:28` `publish()` is an empty body; `:43`
`subscribe()` returns a no-op unsubscribe. The real durable path exists in
`packages/plugin-streams-core` (`DurableStreamProducer.upsert` at create-durable-stream.ts:156) but
drops writes after a failed connect (`:118`) with no retry (`:222` flush throws).
**Fix:** (a) wire `defineStreamProducer().publish` and `defineStreamConsumer().subscribe` to the
`-core` durable producer/consumer so topic pub/sub actually emits/receives; (b) add reconnect/backoff
(or an explicit, documented buffering policy) to `DurableStreamProducer` so writes are not silently
dropped after a transient connect failure.
**Gates:** integration test: publish to a topic → consumer receives; connect-failure path retries or
surfaces an error rather than silently dropping; streams plugin + streams-core check/test green.
NOTE: highest-risk slice; may need the durable-streams dev service running. If the transport surface
is larger than this plan implies, STOP and rescope (record in drift.md).

### S4 — Task-executor OTel span export (size M)
**Problem:** `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:147` collects
spans into an in-memory `TaskExecutorSpan`; no OTel export bridge is visible. Framework telemetry
(`packages/telemetry` `withSpan`, `traceJobExecution`) is real and should be reused.
**Fix:** bridge task-executor instrumentation to real OTel spans via `@netscript/telemetry`
`withSpan`/tracer, mirroring `traceJobExecution`, so polyglot task runs emit spans to the configured
exporter.
**Gates:** test asserting a task run produces an OTel span via the telemetry tracer (in-memory
exporter); workers-core + telemetry check/test green. Also unblocks documenting task telemetry as
working in the new Polyglot chapter (W4).

### S5 — Postgres queue adapter (size M/L)
**Problem:** `packages/queue/factory/create-queue.ts:221` rejects `QueueProvider.Postgres` with "not
yet implemented" (KV/Redis/RabbitMQ work).
**Fix:** implement a PostgreSQL queue adapter behind the existing provider selector, matching the
adapter interface used by the Redis/RabbitMQ/DenoKV adapters. If a new dep (e.g. `pg`) is required,
it must come through the catalog (Option-A) — flag for maintainer review, do not de-catalog.
**Gates:** adapter conformance tests matching the other providers; `createQueue` resolves Postgres;
queue check/test green; dep added via catalog only.

## Sequencing
1. PLAN-EVAL this whole plan (OpenHands minimax-m3) → PASS.
2. Implement in risk order: **S1 → S2 → S4 → S5 → S3** (S1 cheap/high-value first; S3 riskiest last).
   Each is its own branch/PR + IMPL-EVAL (qwen3.7-max). Slices are independent; can overlap if Codex
   capacity allows, but S3 should not block the others.
3. As each slice lands, W3 documents that surface as WORKING (remove the caveat).
4. Any fix deferred mid-flight (e.g. S2 chooses reject-not-implement, or S3 rescopes) → tracked in
   `arch-debt.md`, and W3 documents the residual caveat honestly.

## Out of scope
- No changes to `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, version pins, or lock
  files beyond a reviewed S5 dep. `@netscript/cli` publishes last (LD-7). No JSR publish here.
