# Research

- Issue #498 acceptance contract: an OpenAI-compatible adapter registered through
  `registerVisionProvider`, accepting URL and base64 image sources and returning usage.
- Baseline and branch match the slice brief.
- `VisionProviderPort` and its throwing `createUnconfiguredVisionProvider` already exist.
- Carried baseline unexpectedly combines vision behavior with `OpenAiEmbeddingsProvider` and
  registers it under `openai-embeddings`. This makes a dedicated capability depend on an unrelated
  subpath and class.
- Existing adapter conventions use injected `fetch`, Web Platform request primitives, `AiError`
  mapping, explicit configuration, and provider-neutral usage mapping.
- No relevant open architecture-debt entry applies to `packages/ai`.
- JSR surface scan: the package metadata and publish include/exclude shape already exist. New
  exports from `./openai-compatible` need explicit documentation and types; `deno doc --lint` and
  publish dry-run will detect documentation and slow-type regressions.
