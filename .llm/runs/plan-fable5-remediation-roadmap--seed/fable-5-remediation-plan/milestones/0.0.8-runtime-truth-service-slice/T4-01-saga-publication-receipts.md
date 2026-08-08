# fix(sagas): publish receipts are discardable and the publisher silently falls back to 127.0.0.1:8092 — jobs report success while the saga never starts — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T4-01 · **Proposed milestone:** 0.0.8 (new — "Runtime truth + service slice", per
SYNTHESIS §5.3 rename-shift) · **Labels:** `type:fix` `area:plugins` `area:aspire` `area:docs`
`priority:p0` `status:triage` · **Depends on:** none (sequenced with T4-06 for port resolution and
T4-08 for the detecting gate)

## Summary

`SagaPublisherResult` is a well-designed non-throwing discriminated union, but it is not a checked
result: `await publisher.publish(m)` type-checks with the receipt thrown away, and the first-party
sample job the scaffold writes into every new project does exactly that. Composed with the
publisher's silent `http://127.0.0.1:8092` endpoint fallback, an unreachable `sagas-api` produces a
rejected receipt that nobody reads, so the worker job returns `createSuccessResult(...)` while the
saga never starts — no log, no telemetry event, no failed job. The identical code is embedded
verbatim in the canonical documentation with the comment "a typed receipt comes back". This is the
highest-severity composed defect in the runtime audit and no open issue owns it.

## Evidence

- Corpus: `research/repo-audit/runtime-plugins.md` §2.2 (silent-drop chain), §1.4 (fixed-port
  fallback), §1.5 (discovery-key asymmetry), §8 ledger row 2; `SYNTHESIS.md` §1.4, §2 "Runtime
  correctness", §6 (T4 pack, "saga receipt p0" — no existing owner).
- `plugins/sagas/src/runtime/saga-publisher.ts:295-307` — `resolveServiceUrl()` ends
  `?? \`http://127.0.0.1:${SAGAS_API_DEFAULT_PORT}\``; `plugins/sagas/src/constants.ts:11` sets
  `SAGAS_API_DEFAULT_PORT = 8092`. Called from `saga-publisher.ts:164`.
- `packages/plugin-sagas-core/src/integration/publisher/saga-publisher-port.ts:24-46` — the
  `SagaPublisherReceipt | SagaPublisherRejected` union. Nothing forces a caller to discriminate it.
- `plugins/workers/src/cli/official-sample-configuration.ts:393-403` — the scaffold-emitted job:
  `await sagaPublisher.publish({ type: 'UserSettingsCreated', payload: { userId } });` followed
  directly by `createSuccessResult({ userId, settingsCreated: true, source: 'scaffold-sample' })`.
- `docs/site/durable-workflows/sagas.md:418` — the same body embedded in a `tabbedCode` block
  labelled "verbatim from the scaffold", carrying the comment
  `// This is the message the saga below consumes — a typed receipt comes back.`
- `packages/sdk/src/discovery/service-url.ts:55-61` builds `services__<name>__http__0` with the raw
  hyphen; `packages/aspire/src/application/build-vite-env-var-name.ts:50-66` normalizes every
  non-alphanumeric to `_`. Only one form can match what Aspire exports for `sagas-api`; if the
  server form is normalized too, every discovery lookup misses and drops to the 8092 fallback.
- Contrast (the correct pattern already in-repo):
  `packages/plugin-streams-core/src/application/stream-url-resolver.ts:99-133` throws a diagnostic
  error rather than falling back to a port.
- Adjacent open issues: #1326 (streams producer, p0), #1329 (SSE envelope, p0), #1325 (triggers KV
  adapter), #979 (plugin resources pin host ports, unmilestoned).

## Current surface

`HttpSagaPublisher.publish()` never throws: non-2xx becomes `rejectedResult(..., retryable = status
∈ {408,409,425,429,500,502,503,504})`, a transport throw becomes `rejectedResult(...,
isRetryable(cause))` (`saga-publisher.ts:106-134`). `traceparent`/`tracestate` are propagated
(`:280-289`). Endpoint resolution tries `baseUrl`, `services__sagas-api__https__0`,
`services__sagas-api__http__0`, `SAGAS_API_URL`, `NETSCRIPT_SAGAS_URL`, then the 8092 literal. The
same literal appears in `plugins/sagas/src/cli/adapters/runtime-api-client.ts:27` and
`plugins/sagas/src/e2e/probes/probe-context.ts:3`. Since #1211 (`0b11ca47a`) scaffold ports are
allocated from 49152–65535 (`packages/cli/src/kernel/domain/scaffold/default-port-allocation.ts:4-7`),
so 8092 is not a plausible default in a generated project — it is a guess that connects to nothing,
or worse, to another workspace's saga API.

## Target contract

1. **Publication result is non-ignorable.** Either `publish()` returns a type the compiler forces a
   caller to discriminate before the value is dropped, or the port gains an explicit
   throw-on-rejection entry point and a repo gate rejects a bare `await publisher.publish(...)`
   whose result is unused. The chosen mechanism is stated once in the port's doc comment.
2. **No silent endpoint guessing under an AppHost.** When an Aspire environment is detected (any
   `services__*` key present, or an explicit `NETSCRIPT_ASPIRE` marker), a failure to resolve the
   sagas endpoint raises a diagnostic error naming each source tried and the exact env key expected
   — the `stream-url-resolver.ts` pattern. Outside an AppHost, a fixed default is permitted only
   when it is explicitly configured, never as a trailing `??`.
3. **Discovery keys are decided, not assumed.** One documented normalization for hyphenated
   resource names, applied identically on the server and browser paths, with a test that records
   what Aspire actually exports.
4. **The shipped sample models the correct pattern.** The scaffold's `create-user-settings` job
   discriminates the receipt, logs/telemeters the rejection, and fails the job on a non-retryable
   rejection.
5. **Correlation is provable from durable state.** For an accepted publish, the correlation key
   written to the saga store and the `netscript.correlation.id` on the emitted spans agree, and that
   agreement is asserted — not inferred from logs.

## Acceptance

- [ ] Discarding a saga publish result fails type-check or a named lint/quality gate.
- [ ] The publisher raises a diagnostic error instead of falling back to `127.0.0.1:8092` when an
      AppHost environment is detected.
- [ ] The endpoint-resolution error names every source tried and the exact env key expected.
- [ ] Hyphenated service-discovery keys use one documented normalization on server and browser
      paths, with a test recording what Aspire exports for `sagas-api`.
- [ ] The scaffold sample job discriminates the receipt and fails the job on a non-retryable
      rejection.
- [ ] `docs/site/durable-workflows/sagas.md` embeds the fixed sample and a docs test proves the
      embedded code matches the scaffold source.
- [ ] A negative test proves an unreachable sagas-api makes the sample job fail rather than succeed.
- [ ] A negative test proves removing the endpoint-resolution error path fails a gate rather than
      silently restoring a fixed-port default.
- [ ] Tests cover restart, duplicate publish, out-of-order delivery, and sagas-api unavailable.
- [ ] Correlation is proven from persisted saga state plus an OTEL trace, not from log text.

## Boundaries

- **#1326** owns `DurableStreamProducer` reconnect/buffer bounds; **#1329** owns the versioned SSE
  envelope. Do not re-file or absorb either — streams receipts (`upsert()`/`delete()` return `void`,
  `packages/plugin-streams-core/src/application/create-durable-stream.ts:167,205`) are named here
  only as context.
- **#1325** owns the triggers glue KV-adapter omission. **#979** (+ **#980**) own removing pinned
  host ports and the E2E/docs prerequisites for endpoint resolution; T4-06 sequences behind #979 and
  covers the *contribution declarations*. This issue covers only the sagas publisher hot path.
- **#1280** (blocked upstream) owns backing-service health checks. Not in scope.
- **Saga OOM remains a verify-first investigation row** (SYNTHESIS §3.6 / `preplan-package.md`
  §Verify-before-filing). It is deliberately **not** part of this issue and must not be folded in;
  it needs a repro on the current canary before anything is filed.
- Saga compensation semantics (no prior-step rollback, unpersisted compensation state) are separate
  runtime rows and are not fixed here.

## Docs/consumer proof

`docs/site/durable-workflows/sagas.md` and the scaffold source are proven identical by an executed
docs test, so the "verbatim from the scaffold" claim becomes checkable rather than asserted. A
freshly scaffolded project with `sagas-api` stopped shows the sample job in a failed state in the
workers API/CLI listing and an error span in the Aspire dashboard — the consumer-visible difference
between this fix and today's green-job-no-saga behavior.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Drafted from the Stage-B
runtime-plugins audit; all code claims re-verified against worktree baseline `fac9e339042c`.
