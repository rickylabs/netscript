# Worklog: W2-A #1325 generated trigger KV bootstrap

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.5--orchestration/slices/w2-a-1325` |
| Branch | `fix/triggers-generated-kv-adapter-bootstrap` |
| Archetype | `5 — Plugin Package` |
| Scope overlays | `service` |

## Design

### Public Surface

- No new package/plugin export is planned.
- Generated `triggers/runtime.ts` remains the explicit background entrypoint.
- Scaffold runtime gate registry gains an internal enumerated KV-runtime invariant.

### Domain Vocabulary

- `KvBackgroundRuntime` — a first-party generated background runtime whose startup consumes the
  shared `@netscript/kv` lifecycle.
- `KvProviderScenario` — finite generated-runtime selections for Redis/Garnet and Deno KV.
- `RuntimeHealthEvidence` — resource state, health JSON/endpoint, and structured startup-log proof.

### Ports

- Existing `@netscript/kv` adapter registry and shared lifecycle only; no new product port.
- Existing CLI E2E command, HTTP, and reporting ports collect runtime evidence.

### Constants

- `KV_BACKGROUND_RUNTIMES` — `workers`, `sagas`, `triggers`, determined from real startup paths.
- `KV_PROVIDER_SCENARIOS` — Redis/Garnet family and `denokv`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | RED behavioral invariant | focused Deno test: pre-fix nonzero | resource/E2E tests; run artifacts |
| 2 | Thin triggers composition | focused plugin tests + verify-plugin | trigger stub/tests; run artifacts |
| 3 | Generated runtime health enumeration | focused CLI E2E tests + isolated Aspire evidence | CLI E2E; run artifacts |
| 4 | Fitness/release evidence | scoped/quality/arch/JSR/granted full E2E | run artifacts |

### Deferred Scope

- Trigger connector convergence and plugin restructuring remain accepted debt.

### Contributor Path

To add a KV-backed first-party background runtime, use `@netscript/kv` for provider selection,
compose the provider entrypoint in its generated server runtime, and add the runtime once to the
shared E2E enumeration so every provider scenario proves real health.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-08 | bootstrap | research | Re-baselined issue and source at `c383b2e84`; no source edits. |
| 2026-08-08 | plan | PLAN-EVAL request | Selected separate native Claude/Fable plan evaluation; implementation paused. |
| 2026-08-09 | S1 | RED | Generated-workspace behavioral probe failed at the real core registration boundary: exit 1, 8 passed/1 failed, `KvConnectionError: Redis adapter is not registered`. |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| S1 RED | `deno test --config plugins/triggers/deno.json --allow-all --unstable-kv plugins/triggers/src/adapter/resources/resources.test.ts` | EXPECTED FAIL (exit 1) | 8 passed, behavioral registration test failed before network access. |

## Handoff Notes

- PLAN-EVAL should first challenge the behavioral RED seam and the exact KV-runtime enumeration.
- `_shared-brief-contract.md` is missing locally; use the owner brief's inlined contract and drift note.
