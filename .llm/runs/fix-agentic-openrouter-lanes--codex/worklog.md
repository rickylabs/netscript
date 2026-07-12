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
| 2026-07-12 | S2 | diagnosis | Official OpenRouter recipe plus isolated `CLAUDE_CONFIG_DIR` showed cached native Claude state caused the empty-output symptom; explicit empty rival auth produced non-empty GLM text. |
| 2026-07-12 | S2 | live acceptance | GLM completed a Bash `pwd` tool call and returned `GLM_AGENTIC_OK`; checked-in `claude-print.ts` then completed the same agentic flow as `GLM_RUNTIME_ADAPTER_OK`. Redacted evidence is in `glm-live-evidence.md`. |
| 2026-07-12 | S2 | capability boundary | Added supported Claude GLM preset and retained the Codex GLM preset as explicit `codex-native-namespace-tool` unsupported; live canaries returned Claude PASS and Codex structured FAIL. |
| 2026-07-12 | S2 | slice review | Reviewed child-only credential binding, cached-auth isolation, non-mobile boundary, prompt-file reachability, same-session resume argv, declared-vs-observed incompatibility provenance, and provider-id canonicalization. Tightened incompatibility evidence with an explicit source and derived finite constants; no blocking findings remain. |
| 2026-07-12 | S2 | reconcile | PR #696 remains `status:impl` with required labels/milestone and no closing issue. The carried-in GLM unknowns are resolved in `plan.md`; no reviewer comment changed scope. |
| 2026-07-12 | S3 | implementation | `agentic:provider-canary` now defaults to exhaustive, credential-free validation of every OpenRouter preset and requires `--live` before any provider process; the rollout runner was migrated to the explicit flag. |
| 2026-07-12 | S3 | CI/consumer | Added the default static preset canary to the CI check/test job and documented static versus live invocation in the suite and harness indexes. |
| 2026-07-12 | S3 | structural review | The S1 launcher had grown to 608 LOC; route/profile materialization and evidence rendering moved to `launcher-route.ts`, leaving the compatibility entrypoint at 499 LOC and preserving behavior through focused tests. |
| 2026-07-12 | S3 | slice review | Reviewed all four preset rows, capability coherence, real Claude/Codex command planners, explicit live parsing, rollout-runner migration, CI wiring, secret safety, and lock hygiene. No blocking findings remain. |
| 2026-07-12 | S3 | reconcile | Commit `1596c32f` pushed and phase evidence posted to PR #696; required taxonomy/milestone remain correct, PR is ready for review, and sole phase label is now `status:impl-eval`. |
| 2026-07-12 | eval | handoff | Prepared a read-only, opposite-family Claude Opus 4.8 prompt with the required `## SKILL` chapter; evaluator owns only `evaluate.md` and is forbidden from another paid live probe. |

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

### S2 Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Full agentic suite | PASS | 235 passed, 0 failed. |
| Focused provider/adapter suite | PASS | 36 passed, 0 failed plus volatile guard 4/4. |
| Scoped check | PASS | 101 files, 0 findings. |
| Scoped lint | PASS | 101 files, 0 findings. |
| Scoped format | PASS | 101 files, 0 findings. |
| Claude GLM provider canary | PASS | tools/reasoning/streaming supported; exit 0; fan-out eligible. |
| Codex GLM provider canary | EXPECTED UNSUPPORTED | exit 1; observed `codex-native-namespace-tool`; fan-out blocked. |
| Checked-in runtime wrapper | PASS | two-turn Bash `pwd`; exact non-empty `GLM_RUNTIME_ADAPTER_OK`. |

### S3 and Final Implementation Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Exhaustive preset canary | PASS | Default task, with provider credential variables unset, validated all four `OPENROUTER_PRESETS` rows and their real launch plans without a provider process. |
| Live opt-in contract | PASS | CLI tests reject provider route flags without `--live`; rollout runner tests require `--live` on every provider request. |
| Full agentic suite | PASS | 239 passed, 0 failed. |
| Volatile config guard | PASS | 4 passed, 0 failed as part of the full suite. |
| Scoped check | PASS | 105 files, 0 findings. |
| Scoped lint | PASS | 105 files, 0 findings. |
| Scoped format | PASS | 105 files, 0 findings. |
| CLI hard cap | PASS | `launch-codex-slice.ts` 499 LOC; extracted `launcher-route.ts` 142 LOC; new canary modules at or below 193 LOC. |
| Secret scan | PASS | No OpenRouter/Anthropic key-shaped values in changed tooling or run artifacts. |
| Lock hygiene | PASS | `deno.lock` unchanged. |
| Consumer wiring | PASS | CI invokes the credential-free default task; rollout live probes use the explicit opt-in contract. |

### Final Fitness Ledger

| Gate | Result | Evidence / rationale |
| --- | --- | --- |
| F-1/F-3/F-5/F-10..F-12/F-15..F-19 | PASS / reviewed | Typed checks, lint/format, 239-test suite, finite preset registry, secret scan, and changed-file structural review; no package architecture surface changed. |
| F-2 helper reinvention | PASS (manual) | Reused the existing Claude/Codex command planners, provider-profile resolver, profile renderer, route-identity comparison, WSL helper, and rollout runner instead of adding parallel process/config abstractions. |
| F-4 inheritance audit | PASS (manual) | No class hierarchy or inheritance was introduced; new behavior is finite typed data plus pure planning/validation functions at existing edges. |
| F-6 JSR publishability | N/A (internal tooling) | `.llm/tools/agentic` is not a published package. |
| F-7 doc-score | N/A (internal tooling) | No JSR public export surface. |
| F-8 workspace lib override | N/A (internal tooling) | No package workspace import map. |
| F-9 permission declaration | N/A (internal tooling) | Task permissions remain declared in the root task definition; no package manifest is involved. |
| F-CLI-1/F-CLI-2 | PASS / reviewed | Changed files were manually classified; the universal 500-LOC hard cap is met (maximum 499), and new focused modules remain 193 LOC or less. |
| F-CLI-3..F-CLI-31 | reviewed / N/A where package-layout-specific | No new `src/` CLI package, surface/composition layer, barrels, templates, registries, abstracts, or extension axes; changed flat internal-tooling edges were reviewed for direct Deno/process use and output remains confined to CLI/adapters. |
| Runtime acceptance | PASS | Real GLM 5.2 tool turn completed through the checked-in Claude wrapper; Codex namespace incompatibility was independently observed and encoded. |
| Consumer acceptance | PASS | Exhaustive static task runs in CI and the broader rollout runner retains explicit bounded live probes. |

## Handoff Notes

- IMPL-EVAL should independently inspect profile/effort identity, the redacted GLM live proof, the structured Codex incompatibility, exhaustive preset coverage, and the final gate ledger.
