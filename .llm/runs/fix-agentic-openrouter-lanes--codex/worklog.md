# Worklog: durable OpenRouter agentic lanes

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agentic-openrouter-lanes--codex` |
| Branch | `fix/agentic-openrouter-lanes` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | none |

## Design

### Public Surface

- `launch-codex-slice` and its app-server message client.
- `deno task agentic:provider-canary`, including exhaustive preset validation and opt-in live mode.
- Runtime Codex/Claude provider adapters and structured compatibility evidence.

### Domain Vocabulary

- `OpenRouterPresetCapability` — launch/live support state and reason.
- `ProviderCanaryMode` — static validation versus explicit live turn.
- `CodexProfileReference` — isolated supported named profile file.
- `ProviderCanaryResult` — non-secret evidence and diagnostics.

### Ports

- Existing profile file port for credential-free materialization.
- Existing command factory/environment reader seams for bounded process tests.
- No new speculative ports.

### Constants

- `OPENROUTER_PRESET_IDS` / `OPENROUTER_PRESETS` — finite preset registry.
- Central model IDs/endpoints remain in `.llm/tools/agentic/config/`.
- Canary modes and capability statuses are finite constants with derived types.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove launcher profile materialization, Responses-only config, v0.144 identity parsing, and truthful exit behavior. | focused launcher/lib/profile tests + scoped check | codex launcher/client, profile adapter, fixtures/tests, run artifacts |
| 2 | Prove one real GLM 5.2 lane and encode both Codex/Claude support boundaries without stubs. | adapter tests + redacted one-shot live evidence | provider profiles, Claude/Codex adapters, tests, run artifacts |
| 3 | Prove every OpenRouter preset has a cheap structured canary and explicit live opt-in. | provider-canary tests/task + scoped lint/fmt/check + volatile guard | canary core/adapter/CLI/runner/tests/docs, run artifacts |

### Deferred Scope

- Native mobile remote-control for experimental provider routes — explicitly unavailable and not required for bounded canaries.
- Provider rollout/promotion — owned by #582.

### Contributor Path

Add or modify model strings/endpoints only in `config/`; declare a preset and capability in `provider-profiles.ts`; run the exhaustive static canary test; use explicit live mode before promotion.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-12 | bootstrap | research/plan | Re-baselined against `ec61dc78`; implementation blocked pending PLAN-EVAL PASS. |

## Gate Results

Not run; Plan-Gate pending.

## Handoff Notes

- PLAN-EVAL should spot-check launcher profile handling and the preset registry.
