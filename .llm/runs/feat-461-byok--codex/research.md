# Research — #461 BYOK per-request resolution

## Re-baseline

- Required base verified at `fd0dafaf0d4fe2f60e037a547dd2e2fc8068eae3`; branch is `feat/461-byok-seam` and initially clean.
- Issue #461 acceptance requires per-request API-key/base-URL resolution, including Ollama host, plus `gate:jsr`.
- FAI-10 is present: `ChatClientPort.stream(request, options)` owns a call-level `ChatClientCallOptions.modelOptions` bag. `toTanstackChatClient` resolves its precedence immediately before `chat()`.

## Findings

1. `AnthropicModelProvider`, `OpenAiCompatibleModelProvider`, `OpenRouterModelProvider`, and `OllamaModelProvider` currently construct their TanStack adapter in `createChatClient`; credentials/endpoints are therefore frozen before a request exists.
2. The single anti-corruption bridge, `src/adapters/tanstack-chat-client.ts`, is the narrow point that sees call options immediately before transport IO. Allowing it to resolve an adapter per stream keeps SDK types internal.
3. Static defaults differ by provider: Anthropic may delegate key lookup upstream; OpenRouter has config → environment fallback and a default URL; OpenAI-compatible requires key and URL; Ollama has a default host and placeholder key.
4. Existing configuration errors name missing fields but do not interpolate credential values. Request-time errors must retain that property.
5. The changed owned contract is exported through `@netscript/ai/ports`; it needs JSDoc and explicit types to retain the clean JSR surface.

## JSR surface scan

- Planned public addition is an owned, readonly call-options credential shape; no provider SDK type crosses the export boundary.
- Explicit annotations and JSDoc are required to avoid slow types / `missing-jsdoc`.
- Existing export map remains unchanged; full package `deno doc --lint` and publish dry-run are required.

## Open questions

- None that force rework. Whether non-chat embedding/vision calls later share the credential shape is safe to defer because issue #461 explicitly anchors the seam to `ChatClientPort.stream` and adapters on the FAI-10 surface.

