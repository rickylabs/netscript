# Plan

## Profile

- Archetype 2 — Integration; no scope overlays.
- Doctrine verdict: extend the existing owned port/adapter boundary without restructuring unrelated package debt.
- In-scope anti-patterns: AP-3, AP-5, AP-9, AP-11, AP-15, AP-20, AP-25.

## Locked decisions

1. Add `modelOptions?: Readonly<Record<string, unknown>>` to `ChatClientCallOptions`, because acceptance names the per-call `stream` boundary.
2. Treat the bag as provider-native wire options. Merge static construction options first and per-call options last, so calls override construction defaults.
3. Validate the deprecated Anthropic enabled/budget shape in the Anthropic adapter mapping seam and throw an exported typed error before transport.
4. Preserve omitted-options behavior by emitting no model options when neither static nor per-call options exist.
5. Retire the carried nested `ChatClientRequest.options`/neutral mapper path from this slice where necessary to avoid two competing per-call contracts.

## Open-decision sweep

- Safe to defer: deeper provider-specific schemas beyond acceptance; adding first-class Ollama model-option vocabulary.
- Must resolve now: none.

## Risks

- Shallow merging nested provider objects can replace static nested objects. This is deliberate per-call override semantics and will be locked by tests.
- A thrown validation error inside an async generator may otherwise become an error event. Validate before the transport try/catch and assert typed rejection during iteration.
- Carried AI-494 call sites may depend on request-level options. Scoped check/tests will expose them and they will be migrated to call options.

## Gates

- Scoped check, lint, and format wrappers for `packages/ai`.
- Focused adapter/request-shape unit tests plus full `packages/ai` unit suite.
- Full export-map `deno doc --lint` via the structured runner.
- `deno task publish:dry-run`.
- Relevant manual Archetype 2 surface/layering review; no runtime backend is required because transports are stubbed.

## Deferred scope

- No provider SDK upgrades, agent-loop feature expansion, README redesign, or unrelated doctrine remediation.

