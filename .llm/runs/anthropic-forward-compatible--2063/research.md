# Research

The supported public TanStack extension seam exists in the locked workspace 0.52.0/0.18.3 graph and the reported consumer 0.52.3/0.18.3 graph, so the defect can be fixed without a peer-family upgrade.

- Root cause: `packages/ai/src/adapters/anthropic.adapter.ts:156` checks module-global `MODEL_IDS`, and construction repeats that gate at line187; config at line82 accepts key/baseURL only. `packages/ai/anthropic.ts:35` also discards additive IDs in registered-factory configuration.
- Generic mapping at adapter line 48 emits disabled thinking. `packages/ai/src/adapters/tanstack-chat-client.ts:124` validates only `options.modelOptions`, leaving `request.options.providerOptions` unchecked.
- https://github.com/rickylabs/netscript/issues/2063 retrieved 2026-10-05: explicit additive-ID configuration preferred, unknown unconfigured IDs reject, native Messages wire and released-package proof required.
- https://github.com/rickylabs/netscript/pull/2071 retrieved 2026-10-05: hardcoded Sonnet-only extension already merged.
- https://tanstack.com/ai/latest/docs/advanced/extend-adapter retrieved 2026-10-05: public extension factories preserve original configuration and forward exact custom model names. Confirmed against the installed source; no private subpath imports needed.
- https://platform.claude.com/docs/en/models/opus-5-5/migration-guide retrieved 2026-10-05: omitted/adaptive thinking, documented effort levels and auto/none tool choice; manual/disabled thinking and non-default sampling reject.
- https://platform.claude.com/docs/en/models/fable-5-1/migration-guide retrieved 2026-10-05: mandatory adaptive thinking and auto/none tool choice.
- https://platform.claude.com/docs/en/build-with-claude/thinking retrieved 2026-10-05: Sonnet 5.5 accepts `between_tools` only at high or lower effort; other two models reject this mode.

- https://platform.claude.com/docs/en/build-with-claude/streaming retrieved2026-10-05: basic and client-tool examples put input usage in message_start and only output usage in message_delta. Server-tool examples may update input counts in final delta; therefore later reported fields must replace cumulative counters, not be summed.
- https://tanstack.com/ai/latest/docs/advanced/debug-logging retrieved2026-10-05: public custom Logger receives provider frames; explicitly disable every other category and provide silent methods. Confirmed in both installed0.52.0 and0.52.3 source. No adapter-internals import or SDK mutation.
- https://jsr.io/@netscript/ai/meta.json retrieved2026-10-05 via Deno fetch: lateststable0.0.7;0.0.8 notpublished; canary0.0.8-canary.1 immutable and predates this source. See published-release-audit.json.
