# Worklog: saga publisher receipt discipline (#1365)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-saga-publisher-receipt-discipline--0.0.7` |
| Branch | `fix/saga-publisher-receipt-discipline` |
| Archetype | `3 — Runtime/Behavior` for core; `5 — Plugin Package` for plugins |
| Scope overlays | `docs` |

## Design

This section is locked before any implementation file is created. S1 contains harness artifacts
only.

### Public Surface

- Keep `SagaPublisherResult`, `SagaPublisherReceipt`, `SagaPublisherRejected`, `publish()`, and
  `publishMany()` source-compatible.
- Add `publishSagaOrThrow(publisher, message, options?)` to
  `@netscript/plugin-sagas-core/integration/publisher` with an explicit generic return of
  `Promise<SagaPublisherReceipt<TMessage['type']>>`.
- Re-export `publishSagaOrThrow` as a value from `@netscript/plugin-sagas/runtime` so callers who
  obtain `createSagaPublisher()` use one public entrypoint.
- Do not add a required port method, result type, error type, or dependency.
- Add an optional environment-key enumeration seam to `HttpSagaPublisherOptions`; keep it
  permission-aware and subordinate to explicit/discovered endpoint lookup.
- State the consumption discipline once on the `SagaPublisherPort` interface doc: discriminate the
  result(s), or use the throwing helper; repository quality policy rejects unused receipts.

### Domain Vocabulary

- `SagaPublisherResult` — existing accepted/rejected non-throwing boundary.
- `SagaPublisherReceipt` — accepted durable-enqueue acknowledgement returned by the helper.
- `SagaPublisherRejected` — existing failure receipt whose `reason` becomes diagnostic and whose
  `retryable` flag selects the existing `SagasError` factory.
- `publishSagaOrThrow` — explicit failure-boundary adapter over a non-throwing publisher port.
- `discarded-saga-publisher-result` — planned quality rule for bare unused saga publisher receipts.
- “Aspire detected” — any enumerated `services__*` key or a truthy explicit
  `NETSCRIPT_ASPIRE` marker after direct endpoint resolution has failed.
- “attempted source” — an ordered diagnostic label/key, never an inferred port.

### Ports

- `SagaPublisherPort` — remains the core async port; no implementation-specific method is added.
- `SagaPublisherEnvReader` — existing single-key environment boundary for known endpoint sources.
- planned optional environment-key reader — plugin-edge seam used only to detect arbitrary
  `services__*` keys after endpoint lookup misses; default wraps `Deno.env.toObject()`/keys and
  converts permission denial into diagnostic context.
- `SagaPublisherFetch` — existing HTTP boundary; it must not be called when endpoint resolution
  fails.
- No clock, lifecycle, transport, state-machine, supervisor, or cancellation port changes: the leaf
  changes ingress consumption discipline, not saga execution.

### Constants

- `SAGAS_API_SERVICE_NAME = 'sagas-api'` — remains the default raw server-side resource name.
- `SAGAS_API_DEFAULT_PORT = 8092` — remains deprecated compatibility data only; no runtime consumer;
  removal stays deferred to 0.0.8.
- `NETSCRIPT_ASPIRE` — private explicit environment marker for diagnostics/detection; no generated
  AppHost wiring is added in this leaf.
- Endpoint attempt order remains: `baseUrl`, `services__<name>__https__0`,
  `services__<name>__http__0`, `SAGAS_API_URL`, `NETSCRIPT_SAGAS_URL`.
- `SCAFFOLD_DEFAULT_PORT_RANGE = 49152..65535` — source-proven reason no 8092 fallback is plausible.

### Composition Axes

| Axis | Choices | Wiring |
| --- | --- | --- |
| Consumption | discriminate receipt / throwing helper | core helper over unchanged port |
| Cardinality | one / batch sequential / batch parallel | unchanged port; quality rail covers discarded one and batch calls |
| Endpoint | explicit / HTTPS service key / HTTP service key / explicit env / missing | HTTP adapter resolver |
| Context | Aspire key / marker / ordinary env / permission denied | injected key reader at plugin edge |
| Failure | accepted / retryable reject / non-retryable reject | result union; helper maps reject to existing `SagasError` |
| Consumer | generated job / authored worker / docs example | worker generator, quality rule, docs derivation |
| Artifact | source / docs corpus / CLI embed / publish assets / export corpus | existing generators only |

### Plugin Wiring

- `plugins/sagas/src/runtime/saga-publisher.ts` implements only HTTP and environment resolution over
  core-owned contracts. It does not redefine receipt/error vocabulary.
- `plugins/sagas/src/runtime/mod.ts` re-exports the core helper for the 80% caller path.
- `plugins/workers/src/cli/official-sample-configuration.ts` consumes the publisher and demonstrates
  explicit discrimination; workers defines no publisher convention.
- No service, schema, registry, database, host-loader, verify-plugin, or contribution manifest axis
  changes.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| S2.1 | Core helper + port policy + quality rail | core full suite, scanner tests/scan, doc/publish surface | core publisher files/tests, plugin runtime re-export, quality tool/tests |
| S2.2 | Rich missing-endpoint diagnostic | sagas full suite, host-port scan, JSR/doc non-increase | saga publisher/test/README |
| S2.3 | Consumer/sample derivation + docs correction | workers full suite, docs snippets/links/accuracy | worker sample/test, docs tool/task, public docs |
| S2.4 | Generated assets + static merge readiness | four derivative checks, three full suites, ceiling/lock audit | listed generated outputs |
| S2.5 | Runtime consumer proof | one-pass `scaffold.runtime` | no source; primary-granted serialized lease required |

### Deferred Scope

- SDK browser full-key normalization — real parity defect, but the generated shorthand works and it
  does not affect the server publisher.
- `publishManyOrThrow` — no evidence for an all-or-nothing batch policy; callers inspect returned
  results and the quality rail prevents whole-array discard.
- Deprecated 8092 constant removal — already scheduled for 0.0.8.
- CLI client and E2E probe — already explicit-failure paths with no fallback.
- #1764 telemetry/correlation runtime proof — owned by its carrier.
- Existing JSR/doc-lint/cardinality/thinness debt — baseline-only, non-increase contract.
- Runtime validation — deferred until the primary grants a serialized host-runtime lease.

### Contributor Path

For a new saga-publishing caller:

1. Import `createSagaPublisher` and either bind/discriminate every returned receipt or import
   `publishSagaOrThrow` for an exception-owning boundary.
2. Never write a bare `await sagaPublisher.publish(...)` or discard a `publishMany(...)` array; the
   repo quality gate rejects it.
3. Prefer explicit `baseUrl` only for an intentionally configured endpoint. Under Aspire, reference
   `sagas-api` and expect `services__sagas-api__http__0`; never add a literal port.
4. If adding an endpoint source, update the ordered source diagnostic and its unit-test matrix in
   the HTTP adapter—do not change the core port.
5. If changing the official sample, update the source-derived public snippet through the exact sync
   test rather than copying by hand.
6. Run the full core, sagas plugin, and workers plugin suites, then the derivative gates. Request a
   serialized lease before the one-pass runtime consumer gate.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-31 00:00 | S1 | activation | Confirmed branch/base/no-upstream, clean tree, and lock hash. |
| 2026-08-31 00:03 | S1 | skills/doctrine | Read required skills, archetypes, doctrine, debt, run loop, and plan gate. |
| 2026-08-31 00:08 | S1 | issue rebaseline | Verified issue citations; found #1740 already removed fallback and fixed sample. |
| 2026-08-31 00:12 | S1 | discovery research | Proved raw server key, normalized Vite key, and working shorthand fallback. |
| 2026-08-31 00:15 | S1 | carrier diff | Proved #1764 is not integrated; isolated MCP generated collision. |
| 2026-08-31 00:18 | S1 | static baselines | Measured all three whole-package check/test/lint/fmt/doc/audit/publish surfaces. |
| 2026-08-31 00:21 | S1 | repo/docs/derivatives | Measured static quality/doctrine/docs and four derivative gates at base. |
| 2026-08-31 00:27 | S1 | supervisor correction | Locked runtime prohibition; retained no scaffold/AppHost evidence. |
| 2026-08-31 00:34 | S1 | design checkpoint | Chose companion helper + quality rail; locked ceiling and slices. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Companion helper, not required port method | Preserve existing result contract and external structural implementers | doctrine A1/A2/A5; source census |
| Existing `SagasError` only | Preserve vocabulary/retry flag and avoid export proliferation | core domain errors |
| Rich rejected reason plus helper throw | Reconcile non-throwing D-14 with explicit failure boundaries | #1740 state; issue requirement |
| Raw server hyphen remains | Generated AppHost code and tests prove it | CLI/Aspire/SDK source |
| Browser parity deferred | Shorthand succeeds; publisher unaffected | SDK browser source |
| Sample preserved/tested | S5 already corrected it | locked-base workers generator |
| All unsafe public examples fixed | Repo gate must not ship contradictory guidance | docs census |
| Runtime gate lease-blocked | Primary correction is explicit authority | supervisor correction |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| #1740 already removed all named fallbacks and fixed scaffold sample | significant | yes |
| Browser normalization is partial asymmetry, not an all-path miss | significant | yes |
| #1764 carrier not integrated; one generated collision | significant | yes |
| Owner overrides author/PR/PLAN-EVAL defaults | minor | yes |
| `rtk` unavailable | minor | yes |
| Runtime commands require serialized lease; no evidence retained | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Branch/base/upstream | raw git refs/status | PASS | `fix/saga-publisher-receipt-discipline`; exact `5197e70b7`; no upstream; clean before artifacts |
| Lock | `sha256sum deno.lock` | PASS | `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` |
| Core check | structured wrapper, 111 files | PASS | exit 0 |
| Sagas check | structured wrapper, 87 files | PASS | exit 0 |
| Workers check | structured wrapper, 102 files | PASS | exit 0 |
| Core test | structured whole-package wrapper | PASS | 69 passed, 0 failed, 3 ignored |
| Sagas test | structured whole-package wrapper | PASS | 55 passed, 0 failed, 1 ignored |
| Workers test | structured whole-package wrapper | PASS | 52 passed, 0 failed |
| Lint | structured wrapper for all three roots | PASS | 111/87/102 files; zero findings |
| Format | structured wrapper for all three roots | PASS | 111/87/102 files; zero findings |
| Core doc lint | `doc:lint --root packages/plugin-sagas-core` | FAIL | measured baseline: 9 private-type refs only |
| Sagas doc lint | `doc:lint --root plugins/sagas` | FAIL | measured baseline: 23 private-type refs only |
| Workers doc lint | `doc:lint --root plugins/workers` | FAIL | measured baseline: 20 private-type refs only |
| Core publish dry-run | package task | PASS | exit 0 |
| Sagas publish dry-run | package task | PASS | exit 0 |
| Workers publish dry-run | package task | PASS | exit 0 |
| Static host-port scan | `deno task check:aspire-host-ports` | PASS | 958 files; no pinned host ports |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-3 layering | PASS | doctrine/source inspection | Core result semantics, plugin HTTP edge, worker consumer remain separated. |
| F-5 public surface | PASS | `deno doc` current subpath | S2 additive helper requires new corpus. |
| F-6 core JSR | PASS | audit exit 0 | Two warnings. |
| F-6 sagas JSR | FAIL baseline | audit exit 1 | Existing `doctor.ts` module-tag only; two warnings. |
| F-6 workers JSR | FAIL baseline | audit exit 1 | Existing `doctor.ts` module-tag only; three warnings. |
| F-13 runtime invariant, static half | PASS | source/unit baseline | No endpoint fallback; no fetch on missing endpoint. Rich diagnostic absent. |
| Quality scan | PASS | `quality:scan:repo` | 0 findings, 7 valid allowances. New receipt rule not yet present. |
| Doctrine scan | PASS | `arch:check:repo` | exit 0; targeted warning counts recorded in plan. |
| Discarded-receipt quality rail | PENDING_SCRIPT | manual docs census | Gate absent; four public-doc violations at base. |
| Sample/docs derivation | PENDING_SCRIPT | manual comparison | Gate absent; issue-cited docs sample is not verbatim. |

### Docs and Generated Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Docs snippets tests | PASS | exit 0 | 11 passed. |
| Docs links | PASS | exit 0 | 103 docs, no broken link/anchor. |
| Docs accuracy | PASS | exit 0 | Known unrelated TanStack peer warning. |
| Agent docs prose | PASS | exit 0 | Fresh at base. |
| Assets barrel | PASS | exit 0 | Write-before-diff produced no tracked change; no rerun without need. |
| Publish assets | PASS | exit 0 | Fresh at base. |
| MCP export corpus | PASS | exit 0 | hash `a3c4c91e...09ce0`; 35 packages, 270 subpaths, 7623 symbols. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| One-pass scaffold runtime | NOT_RUN | primary correction | Serialized host-runtime lease required; no prior/partial runtime output is evidence. |
| Aspire endpoint behavior | NOT_RUN | primary correction | Unit/static design only until lease. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Core → sagas HTTP adapter | PASS baseline | whole-package core+sagas suites | Rich diagnostic/helper tests are S2. |
| Sagas publisher → workers sample | PASS static baseline | current source + workers whole suite | Current sample discriminates; dedicated regression test absent. |
| Sample → public docs | FAIL baseline | direct source comparison | Docs discard result and are not verbatim. |
| Scaffolded live project | NOT_RUN | primary correction | Exact one-pass command requires serialized lease. |

## Handoff Notes

- Evaluator should first inspect D-1365-1 (helper vs method), then the exact ceiling, then the
  environment-detection seam and #1764 generated-corpus collision.
- Reject any plan-eval response that treats #1740-fixed fallbacks/sample as still present.
- Reject any suggestion to normalize server service keys to underscores.
- Reject a green-runtime claim: no runtime evidence exists for this leaf.
- No implementation begins until separate-session PLAN-EVAL passes.
