# Worklog

## Bootstrap

- 2026-07-11: preflight PASS at `955b4abf639522c7da50bd15d20c6e999acb808f` on `feat/460-modeloptions-passthrough`; clean tree.
- Issue #460 acceptance read and recorded in research.
- PLAN-EVAL owner-waived by the slice brief (carried drift D1); plan recorded before implementation.

## Design

- **Archetype/public surface:** Archetype 2 Integration. Public impact is additive `ChatClientCallOptions.modelOptions` plus an exported typed Anthropic deprecation error; request-level carried options are removed/migrated to keep one contract.
- **Domain vocabulary:** `ReasoningEffort` remains the existing finite union. `modelOptions` is a readonly provider-native record. The deprecated Anthropic shape is identified structurally by `thinking.type === "enabled"` with `budget_tokens`.
- **Ports:** `ChatClientPort.stream(request, callOptions)` is the owned invocation seam. Named adapters are Anthropic, OpenAI-compatible, OpenRouter, and Ollama; the shared TanStack bridge is the transport seam.
- **Composition root:** provider `createChatClient()` methods construct the bridge and retain static options. No new container or global state.
- **Constants:** existing provider IDs and `ReasoningEffort` remain authoritative; no new finite identifier is needed.
- **Commit slices:** (1) contract + typed rejection + bridge/adapters/tests, proved by scoped unit/check/lint/doc gates; files under `packages/ai` plus run artifacts. (2) final gate evidence and reconciliation, proved by publish dry-run and raw git verification; run artifacts.
- **Deferred scope:** provider-specific schemas beyond acceptance and unrelated AI-494 features.
- **Contributor path:** add a provider by implementing `ModelProviderPort.createChatClient`, pass static defaults into `toTanstackChatClient`, and consume the per-call bag at the adapter validation/mapping seam only when provider policy requires it.

## Evidence

| Gate | Command | Result |
| --- | --- | --- |
| Focused options tests | `deno test --allow-all packages/ai/tests/generation_options_test.ts` | PASS — 13 passed, 0 failed |
| Full AI unit suite | `deno test --allow-all packages/ai/tests/` | PASS — 92 passed, 0 failed |
| Scoped check | `run-deno-check.ts --root packages/ai --ext ts,tsx` | PASS — 77 files, 0 diagnostics; wrapper used `deno check --quiet --unstable-kv` |
| Scoped lint | `run-deno-lint.ts --root packages/ai --ext ts,tsx` | PASS — 77 files, 0 findings |
| Scoped format | `run-deno-fmt.ts --root packages/ai --ext ts,tsx` | PASS — 77 files, 0 findings |
| Full export-map doc lint | `run-deno-doc-lint.ts --root packages/ai --pretty` | PASS — 12 entrypoints, 0 combined diagnostics / missing JSDoc / private refs |
| Workspace publish simulation | `deno task publish:dry-run` | PASS — exit 0, `Success Dry run complete`; existing slow-type/dynamic-import warnings remain outside this slice |

## Implementation

- Added `ChatClientCallOptions.modelOptions` as an open readonly provider-native bag.
- The TanStack boundary resolves static defaults → neutral request mapping → request escape hatch → per-call bag, so each call wins without mutating construction defaults.
- Anthropic rejects `thinking.type = "enabled"` plus `budget_tokens` before transport with `InvalidModelOptionsError` (`statusCode = 400`); adaptive thinking and effort pass through.
- Request-shape assertions cover Anthropic, OpenAI-compatible, OpenRouter (`maxCompletionTokens`), static override, and unchanged omission behavior. Ollama remains pass-through/no-options compatible.
- Lock hygiene: `deno.lock` unchanged.

## Reconcile

- Issue #460 remains the complete scope; no related issue/status mutation and no PR were authorized.
- D2 was reconciled by retaining the existing neutral request mapping as a lower-priority layer while adding the acceptance-required per-call bag, avoiding a breaking removal of AI-494 behavior.
