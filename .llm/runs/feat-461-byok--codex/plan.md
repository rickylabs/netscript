# Plan — #461 BYOK per-request resolution

## Profile and verdict

- Archetype: **2 — Integration**. The package owns provider-neutral ports and adapters over external AI transports.
- Overlays: none.
- Doctrine verdict: `@netscript/ai` is newer than the doctrine census; new work follows A1/A2/A10/A11 and does not deepen recorded debt.
- In-scope anti-patterns: AP-7, AP-9, AP-11, AP-13, AP-14, AP-19, AP-25.

## Locked decisions

1. Extend the existing `ChatClientCallOptions` surface with one owned readonly connection override object (`apiKey`, `baseURL`, `host`) beside `modelOptions`; this is the same per-call options layer established by FAI-10.
2. Resolve adapters at `stream()` time through `toTanstackChatClient`, because this is the last owned boundary before transport IO and avoids leaking TanStack types.
3. Precedence is per-request override → static provider config → existing provider default/environment behavior. Empty or omitted override values do not erase usable defaults.
4. Ollama resolves `host`; hosted providers resolve `apiKey`/`baseURL`. Provider-specific irrelevant fields are ignored.
5. Missing-configuration errors identify field names/provider only. They never include key, URL, host, headers, or serialized call options.
6. Preserve `createChatClient` compatibility and all current static/default behavior.

## Open-decision sweep

- Embedding/vision per-request credentials: safe to defer; they do not use `ChatClientPort.stream` and need their own request-contract design.
- Async credential callbacks/vault lookup: safe to defer; acceptance asks for an override resolution seam, and callers can resolve secrets before invoking `stream` without hand-building an adapter.

## Gate set

- Scoped check, lint, and format wrappers on `packages/ai`.
- Package unit tests, specifically provider override/static fallback/Ollama host/no-secret-leak assertions.
- Consumer/public surface: full export-map `deno doc --lint`.
- `gate:jsr`: root `deno task publish:dry-run` plus package dry-run if root output requires attribution.
- Doctrine fitness: `deno task arch:check` scoped/available evidence.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Adapter factory still executes before call options exist | Bridge accepts an adapter resolver and invokes it inside `stream`. |
| Static defaults regress | Resolver tests cover omitted overrides for every adapter. |
| Secrets enter error events | Central missing-field errors use fixed messages; tests assert sentinel secrets are absent from thrown/streamed error serialization. |
| Provider SDK type leaks | Public contract contains strings only; `AnyTextAdapter` remains internal. |
| URL/host ambiguity | `baseURL` is for hosted APIs; `host` is Ollama-specific and normalized to `{host}/v1`. |

## Deferred scope

- Embeddings, vision, vault callbacks, key persistence, logging/redaction infrastructure, and provider discovery changes.

