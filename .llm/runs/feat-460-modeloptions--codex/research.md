# Research

## Re-baseline

- Preflight matched the required base `955b4abf…`, branch, and clean worktree.
- Issue #460 acceptance was read directly and matches the slice brief.
- `deno doc` shows `ChatClientPort.stream(request, options?)`; the current call options contain only `signal`.
- The baseline contains carried AI-494 work: `GenerationOptions` is nested at `ChatClientRequest.options` and adapter mappers translate it. Issue #460 instead requires a `modelOptions` bag on the per-call `stream` options boundary.

## Findings

- `@netscript/ai` is Archetype 2: an owned chat port isolates Anthropic, OpenAI-compatible, OpenRouter, and Ollama adapters.
- Static OpenRouter `reasoningEffort` already becomes static TanStack `modelOptions`.
- `openRouterReasoningModelOptions` and `ReasoningEffort` already exist and remain reusable.
- TanStack `chat()` accepts a `modelOptions` bag; the shared bridge is the single transport seam and can merge static and per-call values.
- Anthropic deprecated `thinking: { type: "enabled", budget_tokens }` must be rejected before transport with an exported typed `AiError` subtype.
- Ollama has no normalized reasoning contract, but the generic bag can pass through unchanged at the shared bridge.

## JSR surface scan

- Changed public surfaces: `@netscript/ai/ports` call options and `@netscript/ai/contracts` typed error, both already exported by their subpath barrels.
- New public fields/classes require explicit types and JSDoc to avoid slow types and `missing-jsdoc`.
- Full package export-map doc lint and publish dry-run are required.

## Open questions

- None that force rework. The provider-native bag is intentionally open and provider-owned; only the explicitly deprecated Anthropic shape is centrally rejected.

