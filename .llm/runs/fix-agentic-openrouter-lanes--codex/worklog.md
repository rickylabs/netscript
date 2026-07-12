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
| 2026-07-12 | plan-gate | PLAN-EVAL | Separate Claude Opus 4.8 session returned PASS. F-2/F-4 manual evidence and F-6..F-9 internal-tooling N/A entries are required in the final ledger. |
| 2026-07-12 | S1 | added acceptance | Owner-provided launch record proves requested `max` was observed as `low`; effort propagation and truthful observation added to S1. |
| 2026-07-12 | S1 | implementation | Launcher now materializes the adapter-rendered named profile plus an equivalent isolated app-server base config, never sends unsupported `--profile` to app-server, and passes provider/model/effort from runtime planning. |
| 2026-07-12 | S1 | runtime proof | With global effort `max`, a no-turn v0.144 handshake requested `low` in `thread/start.config` and observed `low`, with thread/provider/cwd identity present. |
| 2026-07-12 | S1 | slice review | Reviewed profile content as credential-free, WSL paths/modes as 0700/0600, child env inheritance, sender-lease release on missing identity/materialization failure, and mismatch fail-closed behavior. No blocking findings; added rejection for silently ignored native named profiles. |
| 2026-07-12 | S1 | reconcile | PR #696 remains independent of #685, has no resolving issue/closing keyword, carries one `status:impl`, required taxonomy, and Backlog/Triage milestone; no new review comments required readjustment. |

## Gate Results

PLAN-EVAL: PASS (`plan-eval.md`).

### S1 Static and Consumer Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused behavioral suite | PASS | 89 tests: app-server requests, launcher profile/exit, v0.144 parser, runtime adapter, route identity. |
| Volatile config guard | PASS | 4 tests, no hardcoded model/endpoint/tool-version drift. |
| Scoped check | PASS | 99 files, 0 findings (`run-deno-check.ts --root .llm/tools/agentic --ext ts`). |
| Scoped lint | PASS | 99 files, 0 findings (`run-deno-lint.ts --root .llm/tools/agentic --ext ts`). |
| Scoped format | PASS | 99 files, 0 findings (`run-deno-fmt.ts --root .llm/tools/agentic --ext ts`). |
| v0.144 effort handshake | PASS | global `max`; request `low`; observed `low`; thread/provider/cwd identities present; no model turn. |

### S1 Fitness Ledger

| Gate | Result | Evidence / rationale |
| --- | --- | --- |
| F-2 helper reinvention | PASS (manual) | Reused `renderCodexOpenRouterProfile`, `wsl`, `sq`, route identity, and sender ownership primitives; no parallel config renderer or process abstraction. |
| F-4 inheritance audit | PASS (manual) | No classes or inheritance introduced; changes are typed data/functions at existing adapter/CLI edges. |
| F-6 JSR publishability | N/A | Internal `.llm/tools/agentic` tooling, not a published package. |
| F-7 doc-score | N/A | Internal tooling, no JSR public export surface. |
| F-8 workspace lib override | N/A | Internal tooling, no package workspace import map. |
| F-9 permission declaration | N/A | Internal tooling task permissions remain declared in root task definitions; no package manifest. |

## Handoff Notes

- PLAN-EVAL should spot-check launcher profile handling and the preset registry.
