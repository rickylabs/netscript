# Research — fix-saga-publisher-receipt-discipline--0.0.7

## Re-baseline

- Carried-in source: issue [#1365](https://github.com/rickylabs/netscript/issues/1365), its cited
  paths, and owner brief.
- Re-derived against `main` at
  `5197e70b716eafb82fbb12ddb9a910c248ddb86a` on 2026-08-31.
- What changed vs the carried-in version:
  - Aspire S5 commit `2a1248d33` (#1740) is already in the locked base. It removed all three named
    runtime/CLI/probe `127.0.0.1:8092` fallbacks.
  - The same S5 commit already changed the official workers sample to bind and discriminate the
    `SagaPublisherResult`, returning `createFailureResult(...)` on rejection.
  - The publisher still returns the terse rejected reason `no-endpoint`, the port still permits an
    unused receipt, public docs still show discarded receipts, and the reference page still calls
    8092 a runtime fallback.
  - #1764 carrier head `9d8bbb4e96e555462cdd8432883a28d493b051eb` has not been integrated into the
    locked base. Its merge base with this branch is exactly `5197e70b7`.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | `SagaPublisherResult` is already a sound `published: true/false` union, but TypeScript permits an async result to be discarded. TypeScript has no `must_use` or linear-return facility that can make option (a) work for this existing Promise-returning port. | `packages/plugin-sagas-core/src/integration/publisher/saga-publisher-port.ts:24-61`; `deno doc packages/plugin-sagas-core/src/integration/publisher/mod.ts` |
| 2 | `SagaPublisherPort` has exactly one in-repo implementation, `HttpSagaPublisher`; external structural implementations remain possible. A required new interface method would be source-breaking for those consumers. | `rg "implements SagaPublisherPort|SagaPublisherPort<" packages plugins` |
| 3 | A companion core helper can consume the existing result union, throw the existing `SagasError.retryable/nonRetryable`, and return only `SagaPublisherReceipt`; it adds no error class or result type. | `packages/plugin-sagas-core/src/domain/errors.ts:3-61`; `packages/plugin-sagas-core/src/integration/publisher/mod.ts` |
| 4 | The in-repo diagnostic precedent does not guess a port: the streams resolver names all expected sources and permission-denied keys, then throws. | `packages/plugin-streams-core/src/application/stream-url-resolver.ts:79-121` |
| 5 | Current publisher resolution order is explicit `baseUrl`, Aspire HTTPS, Aspire HTTP, `SAGAS_API_URL`, and `NETSCRIPT_SAGAS_URL`; missing resolution returns reason `no-endpoint` and never calls fetch. | `plugins/sagas/src/runtime/saga-publisher.ts:107-141,297-307`; `plugins/sagas/tests/runtime/saga-publisher_test.ts:14-53` |
| 6 | Port 8092 is not a plausible scaffold-allocated listener. The allocator's inclusive range is 49152–65535. | `packages/cli/src/kernel/domain/scaffold/default-port-allocation.ts:3-27` |
| 7 | `SAGAS_API_DEFAULT_PORT = 8092` remains only as a deprecated compatibility export scheduled for removal in 0.0.8. It is not used by runtime resolution. | `plugins/sagas/src/constants.ts:7-14`; `rg "SAGAS_API_DEFAULT_PORT"` |
| 8 | The two other issue-cited 8092 sites have already been fixed: the CLI adapter and E2E probe both require explicit/discovered URLs and throw when missing. | `plugins/sagas/src/cli/adapters/runtime-api-client.ts:25-47`; `plugins/sagas/src/e2e/probes/probe-context.ts:19-30` |
| 9 | Aspire's server-side service key preserves the resource hyphen: generated consumers receive `services__<raw-name>__http__0`; tests specifically assert `services__workers-api__http__0`. | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts:138-157,178-203`; `packages/cli/src/kernel/templates/aspire/helpers/tests/generators-background-app_test.ts:446`; `packages/cli/src/kernel/adapters/windows/servy/servy-environment.ts:197` |
| 10 | Vite browser injection intentionally normalizes non-identifier characters, so `sagas-api` becomes `VITE_services__sagas_api__http__0` plus `VITE_SAGAS_API_URL`. | `packages/aspire/src/application/build-vite-env-var-name.ts:15-64`; `packages/aspire/tests/helpers_test.ts:83-100` |
| 11 | The SDK server key is correct because it preserves the raw hyphen. Its browser full-key builder is asymmetric because it preserves the hyphen while Aspire emits an underscore; however, the SDK shorthand normalizes the hyphen and therefore still resolves the generated `VITE_SAGAS_API_URL`. The asymmetry is real but does not make every lookup miss and does not affect the server-side saga publisher. | `packages/sdk/src/discovery/service-url.ts:52-61,67-92`; `packages/sdk/src/discovery/browser-env.ts:15-53`; `packages/aspire/src/application/build-vite-env-var-name.ts:50-64` |
| 12 | The official scaffold source already binds `publishResult`, checks `published`, and returns a failed job result with reason/retryability before returning success. | `plugins/workers/src/cli/official-sample-configuration.ts:376-415` |
| 13 | The durable-workflows page falsely says its unsafe bare-await sample is “verbatim from the scaffold.” Two other public pages also discard saga-publisher receipts, for a total of four unsafe calls in docs. | `docs/site/durable-workflows/sagas.md:409-425`; `docs/site/explanation/durability-model.md:303-324`; `docs/site/tutorials/storefront/04-checkout-saga.md:257-304`; `rg "sagaPublisher\.publish" docs/site` |
| 14 | The sagas reference still describes 8092 as a default HTTP fallback, contradicting code and S5's deprecation contract. | `docs/site/reference/sagas/index.md:43-50` |
| 15 | Current quality scanning has no discarded-receipt rule. It scans TypeScript source and fenced Markdown code, while the durable-workflows `tabbedCode` string needs an explicit raw-Markdown path or derivation test. | `.llm/tools/quality/scan-code-quality.ts:4-12,71-133,859-965`; `docs/site/durable-workflows/sagas.md:414-425` |
| 16 | `writeOfficialSampleConfiguration` is already an exported, testable generator boundary; a test can create only temporary directories and read the emitted job without running a scaffold or host. | `plugins/workers/src/cli/official-sample-configuration.ts:4-69` |
| 17 | Adding a public helper changes the `deno doc` export corpus. Editing public docs changes the compressed agent-docs bundle and CLI embedding; publish-asset generation consumes the same bundle/provenance and may update both CLI and MCP assets. | `.llm/tools/docs/generate-export-surface-corpus.ts`; `.llm/tools/docs/build-agent-docs-bundle.ts`; `.llm/tools/generate-cli-assets-barrel.ts`; `.llm/tools/generate-publish-assets.ts` |
| 18 | #1764 changes saga runtime/telemetry files and the generated MCP export corpus, but not the publisher port, HTTP publisher, workers sample, or planned public-doc source pages. The generated corpus is the single locked-ceiling collision. | `git diff --name-status 5197e70b7..9d8bbb4e...`; `drift.md` |
| 19 | The documentation-authoring exception is permissive, not a requirement to defer docs. It permits documentation authoring under the harness while keeping framework implementation in the implementation lane and evaluation separate. | `CLAUDE.md:35-52`; `.llm/harness/archetypes/SCOPE-docs.md` |
| 20 | The primary has not granted a serialized host-runtime lease. Runtime/scaffold observation is not available evidence for S1. | Primary correction in this thread; `supervisor.md` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `@netscript/plugin-sagas-core`, `@netscript/plugin-sagas`, and
  `@netscript/plugin-workers` exports plus their `deno publish --dry-run` packages.
- Core baseline: exit 0; two warnings (existing `src/` cardinality and slow-types checker output).
- Sagas plugin baseline: exit 1 only for the existing missing `@module` tag on `./doctor`; existing
  cardinality and slow-types warnings remain.
- Workers plugin baseline: exit 1 only for the existing missing `@module` tag on `./doctor`; existing
  root/worker cardinality and slow-types warnings remain.
- Slow-type/surface risk: `publishSagaOrThrow` will be an inferred public generic unless its return
  type is explicitly declared. S2 must give it an explicit `Promise<SagaPublisherReceipt<...>>`
  signature and run `deno doc --lint`/publish dry-run without increasing the measured diagnostic
  counts.
- Export derivative: the new helper is an intentional additive export from
  `@netscript/plugin-sagas-core/integration/publisher` and a value re-export from
  `@netscript/plugin-sagas/runtime`; the MCP export corpus must move.

## Open questions

- No product-design question remains open for implementation. PLAN-EVAL must specifically rule on:
  1. the helper-not-method choice and its generic signature;
  2. the bounded environment-key enumeration seam and `NETSCRIPT_ASPIRE` marker;
  3. the generated MCP corpus collision with not-yet-integrated #1764;
  4. the runtime gate remaining lease-blocked rather than being claimed green.
