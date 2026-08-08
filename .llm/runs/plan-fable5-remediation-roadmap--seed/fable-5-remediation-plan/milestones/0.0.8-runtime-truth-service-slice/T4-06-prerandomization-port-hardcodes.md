# fix(plugins): sagas/triggers/streams contributions and the generated browser consumer stub still publish pre-randomization ports — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T4-06 · **Proposed milestone:** 0.0.8 (new — "Runtime truth + service slice") ·
**Labels:** `type:fix` `area:plugins` `area:aspire` `area:cli` `priority:p2` `status:triage` ·
**Depends on:** #979 prerequisite (1) — gates resolve endpoints instead of hardcoding
`127.0.0.1:<port>`; sequenced with T4-01 (publisher fallback) and T4-02 (health URLs)

## Summary

Since #1211 the scaffolder allocates listener ports from the IANA dynamic range 49152–65535, but
three of four plugin Aspire contributions still bake `8092`/`8093`/`4437` into the URLs and health
probes they publish, each after correctly allocating a port through `ctx.port(...)`. The generated
browser consumer stub does the same: it passes a literal `http://localhost:4437` as `baseUrl`, which
bypasses the stream URL resolver's throw-on-missing behavior entirely. These are currently masked
because the declaration seam is unread in production — which means fixing the seam without fixing
these values would ship broken health checks on day one.

## Evidence

- Corpus: `research/repo-audit/runtime-plugins.md` §1.3 (table of hardcoded values), §1.4 (sibling
  occurrences), §8 ledger row 9; `SYNTHESIS.md` §6 (T4 pack, "stub port hardcodes ... feeds #979").
- Allocation range: `packages/cli/src/kernel/domain/scaffold/default-port-allocation.ts:4-7`
  (49152–65535, landed by #1211 / `0b11ca47a`).
- Contributions that allocate then publish a literal:
  - `plugins/sagas/src/aspire/sagas-contribution.ts:112` allocates via
    `ctx.port(SAGAS_API_SERVICE_NAME, SAGAS_API_DEFAULT_PORT)`; `:135` publishes
    `SAGAS_API_URL: 'http://localhost:8092'`; `:146` probes `http://localhost:8092/health` with
    `_ctx` unused.
  - `plugins/triggers/src/aspire/triggers-contribution.ts:139` publishes
    `TRIGGERS_API_URL: 'http://localhost:8093'`; `:149` probes `http://localhost:8093/health` with
    `_ctx` unused.
  - `plugins/streams/src/aspire/streams-contribution.ts:43` publishes
    `DURABLE_STREAMS_URL: 'http://localhost:4437'` as a bare string rather than an `EnvSource`;
    `:51` probes `http://localhost:4437/health` with `_ctx` unused.
  - Correct counter-example: `plugins/workers/src/aspire/workers-contribution.ts:71`
    (`{ kind: 'resource', resource: WORKERS_API_RESOURCE, key: 'url' }`) and `:78-84` reading the
    allocated port back through `ctx.port(...)`.
- Generated browser code:
  `plugins/streams/src/adapter/resources/consumer/consumer.stub.ts:42` —
  `url: buildStreamUrl('%%STREAM_PATH%%', options.baseUrl ?? 'http://localhost:4437')`. Because the
  literal is passed as `baseUrl`, the resolver at
  `packages/plugin-streams-core/src/application/stream-url-resolver.ts:99-133` — which is built to
  throw a diagnostic error rather than guess — never fires.
- Sibling literals in shipped (non-test) code:
  `plugins/sagas/src/cli/adapters/runtime-api-client.ts:27`,
  `plugins/workers/src/cli/adapters/runtime-api-client.ts:27`,
  `plugins/{sagas,workers,triggers,auth}/streams/factory.ts` (`baseUrl ?? 'http://localhost:4437'`),
  `plugins/{sagas,workers,streams}/src/e2e/probes/probe-context.ts`,
  `plugins/workers/test-api.ts:13`, `plugins/triggers/tests/e2e/webhooks_helpers.ts:3`.
- Owner for the prerequisite work: **#979** (unmilestoned, p2) plus **#980**.

## Current surface

Each contribution allocates through `ctx.port(name, DEFAULT)` inside `contribute()` and then
publishes a URL that assumes the fallback was taken. Two workspaces that both install plugins would
also collide on the fixed ports, which is #979's framing. The blast radius is currently limited only
because `composeAppHost` never runs in production
(`packages/aspire/src/application/compose-apphost.ts:47`) and the declarations are unread — an
accidental safety net, not a design.

## Target contract

1. **Nothing publishes a port it did not allocate.** Every env value and health URL a contribution
   declares is derived from the resource endpoint or from the same `ctx.port(...)` call used at
   registration — `workers-contribution.ts` is the reference shape.
2. **Streams publishes an `EnvSource`, not a string.** `DURABLE_STREAMS_URL` becomes a
   `{ kind: 'resource' }` source like every other resource URL.
3. **The generated consumer stub resolves, never guesses.** The emitted browser module calls the
   stream URL resolver and surfaces its diagnostic error; the literal default is removed so a
   missing endpoint fails loudly in the browser path exactly as it does on the server path.
4. **Fixed-port literals in shipped CLI clients and probes are resolved or explicitly named as
   dev-only defaults** with a single documented constant, not scattered magic numbers.

## Acceptance

- [ ] No plugin contribution publishes an env URL or health URL containing a literal port.
- [ ] `DURABLE_STREAMS_URL` is declared as a resource-derived `EnvSource`.
- [ ] The generated consumer stub resolves the streams URL and propagates the resolver's diagnostic
      error instead of defaulting to `localhost:4437`.
- [ ] Fixed-port literals remaining in shipped CLI clients and probes resolve from one documented
      constant or from service discovery.
- [ ] A negative test fails if any plugin contribution reintroduces a literal port in a declared env
      or health value.
- [ ] A negative test proves the generated browser consumer errors diagnostically when no stream
      endpoint is configured.
- [ ] A scaffolded project on randomized ports resolves every plugin endpoint with no manual
      configuration.

## Boundaries

- **#979 owns the prerequisites and must land first**: the `scaffold.runtime` gates must resolve each
  plugin resource endpoint from Aspire instead of live-probing `127.0.0.1:8091–8094` (including the
  `--allow-net` grant passed to the generated project), and ~20 tutorial/explanation passages under
  `docs/site/**` must stop `curl`-ing those ports. **Do not re-file that work here**, and do not drop
  `Port` from scaffolder-written plugin entries in this issue — that is #979's "Then" step. **#980**
  owns the same defect for `netscript service add`.
- **T4-01** owns the sagas publisher's `127.0.0.1:8092` fallback (a runtime hot path, p0); this issue
  owns the declared contribution values and the generated consumer stub.
- **T4-02** owns the child health contract; it consumes correct URLs from this issue.
- **T4-05** owns the concurrency env-name mismatch in the same files; separate PRs.
- The dead `declareEnv`/`declareHealthChecks` seam question (whether `composeAppHost` becomes the
  production path or is deleted) is decided in **T4-02**, not here.

## Docs/consumer proof

Docs stop teaching fixed plugin ports (coordinated with #979's docs leg) and teach reading the
endpoint the dashboard reports. Consumer proof: two scaffolded projects run simultaneously with
plugins installed and neither collides nor requires a manual port edit — the concrete symptom #979
records.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. All literals and their
line numbers re-verified against worktree baseline `fac9e339042c`.
