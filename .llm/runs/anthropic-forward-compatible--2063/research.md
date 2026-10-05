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
