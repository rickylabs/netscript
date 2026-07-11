# Plan — #498 OpenAI-compatible vision adapter

## Profile

- Archetype: 2 — Integration, because this wraps an external HTTP API behind the existing
  package-owned `VisionProviderPort`.
- Overlays: none.
- Doctrine verdict: new code is immediately doctrine-bound; existing repository remediation is out
  of scope.
- In-scope anti-patterns: AP-1, AP-2, AP-3, AP-5, AP-7, AP-9, AP-11, AP-14, AP-16, AP-19, AP-20,
  AP-22 through AP-25.

## Locked decisions

1. Export `OpenAiVisionProvider` from the existing `@netscript/ai/openai-compatible` provider-family
   subpath and register id `openai-compatible` in the vision registry. This keeps a dedicated
   adapter without exceeding the package root-cardinality gate.
2. Use injected `fetch` as the transport seam and the OpenAI Chat Completions multimodal request
   shape. This matches existing adapters and adds no client dependency.
3. Convert inline data to `data:<mime>;base64,<value>` and pass URL values unchanged.
4. Normalize provider errors to `AiError`, missing configuration to `AiNotConfiguredError`, and
   token usage to `Usage`.
5. Remove vision behavior/registration from the embeddings adapter and subpath so each adapter has
   one concern.

## Open-decision sweep

- Safe to defer: Responses API support; configurable image detail; multiple images; richer
  provider-specific usage details.
- Must resolve now: none.

## Commit slice

1. Dedicated vision adapter, provider-family registration, focused tests, and run evidence. Proved
   by scoped check/lint/fmt, unit tests, doc lint, architecture check, and publish dry-run. Files:
   `packages/ai/openai-compatible.ts`, adapter/test files, embeddings cleanup, and this run
   directory.

## Risks

- Existing consumers may have used the accidental embeddings vision registration. Mitigation: this
  feature was not an accepted public slice; keep the port contract stable and provide the correctly
  named subpath.
- OpenAI-compatible endpoints vary in error payloads. Mitigation: extract a provider message when
  present and retain an HTTP-status fallback.
- Public export changes can expose slow types/docs failures. Mitigation: full export-map doc lint
  and package publish dry-run.

## Gates

- Scoped wrapper check, lint, and format for `packages/ai`.
- Focused unit tests for URL/base64 request shape, usage, error mapping, registration, and typed
  unconfigured default.
- `deno task doc:lint --root packages/ai --pretty`.
- `deno task arch:check` scoped/attributed to the package where supported.
- Consumer/export check and package publish dry-run for the changed public surface.

## Deferred scope

- Inline-chat multimodal behavior, other provider protocols, live-provider integration, and broader
  AI package refactors.
