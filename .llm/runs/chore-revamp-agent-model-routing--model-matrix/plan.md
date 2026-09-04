# Plan: agent model routing and subscription expense policy revamp

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `chore-revamp-agent-model-routing--model-matrix` |
| Branch         | `chore/revamp-agent-model-routing`               |
| Phase          | `plan-eval`                                      |
| Target         | harness and agentic tooling                      |
| Archetype      | `6 - CLI / Tooling`                              |
| Scope overlays | docs                                             |

## Goal

Replace the legacy delegation matrix with the owner-ratified 2026-09-04 matrix, make the complete
route/fallback/evaluator contract machine-checkable, prefer subscription transports in the mandated
order, and block paid OpenCode dispatch when subscription allowance cannot be proven—all without
printing or committing credentials.

## Locked decisions

1. **One typed matrix is authoritative.** Add a finite workload-tier matrix and coordinator matrix.
   Human policy and compatibility selectors derive from it; no second hand-maintained routing table.
2. **Logical model identity is provider-neutral.** Central model metadata owns family and
   provider-specific slugs. A route binds one logical model plus one supported provider capability.
3. **Fallback is a declared chain.** Claude → Codex → Google → OpenCode Go → Ollama → OpenRouter is
   the global provider preference. Per-cell model fallbacks remain exactly those in the owner
   matrix; provider precedence chooses a supported transport for that model, not a different model.
4. **Cross-family is exhaustive.** For each tier, every PLAN/IMPL evaluator candidate is checked
   against every implementer/plan candidate. Equal model family is a construction error. Separate
   sessions remain mandatory.
5. **Evaluation limits are data.** PLAN/IMPL maximum rounds, evaluator-in-place repair points, and
   owner-notification thresholds live beside the tier, with explicit state transitions.
6. **Paid dispatch fails closed.** OpenCode Go, Ollama Cloud, and OpenRouter require a fresh
   normalized allowance snapshot. Missing/stale/unknown tier or an exceeded window selects the next
   declared fallback; it never silently consumes Go Zen balance or Ollama extra balance.
7. **Secrets stay host-local.** Credential loaders parse only the expected assignment from mode-600
   env files in `~/.config/netscript-agentic/`, bind only the selected provider key into the child,
   clear rival keys, and expose key names—not values—in errors/receipts.
8. **Old routes are migration inputs only.** Persisted legacy IDs/lanes remain readable where
   needed, but no new launch resolves through the superseded policy.

## Public surface and vocabulary

Internal-only TypeScript surface under `.llm/tools/agentic/`:

- `WorkloadTier`: `simple | straightforward | feature | complex | architecture`
- `CoordinatorTier`: `small_project | project | framework | milestone`
- `LogicalModelId`, `ModelFamily`, `ProviderCapability`
- `DelegationCell`: implementer, plan, plan evaluator, implementation evaluator, vision evaluator,
  documentation writer, plus fallback and evaluation policy
- `SubscriptionBudgetPolicy`, `UsageSnapshot`, `ExpenseDecision`
- provider kinds `opencode_go` and `ollama` in addition to existing native/OpenRouter identities

No `packages/` or `plugins/` export changes.

## Slices

### S1 — model and matrix contract

- Replace active model identifiers with Astra/Fable 5.1/current owner-matrix models.
- Add logical-family/provider capability metadata.
- Encode all five workload tiers and four coordinator tiers.
- Add table-driven tests for every matrix cell, effort, fallback, evaluator limit, and provider
  order.
- Add an exhaustive primary/fallback cross-product self-certification test.

### S2 — resolver and legacy boundary

- Resolve a workload role/tier to a concrete route using provider health/capability/budget inputs.
- Make the typed matrix drive the active canonical policy and routing-state human output.
- Retain only explicit persisted-state compatibility for old lane/model identifiers.
- Update selection tests for no silent effort/model/provider drift.

### S3 — secure OpenCode providers and expense watcher

- Add `opencode_go`, `ollama`, and generic OpenCode/OpenRouter profiles.
- Select the credential loader from the chosen provider/model prefix; clear rival keys.
- Add fixed OpenCode Go limits and dynamic Ollama tier policies.
- Add structured `agentic:expense-watch` preflight with stale/unknown/exceeded fail-closed states.
- Gate paid OpenCode execution before spawning the child process.

### S4 — docs, skills, and parity

- Replace the active routing tables in lane policy and evaluator protocols.
- Update harness/manager skill instructions and agentic tooling documentation.
- Add/check machine markers so human policy cannot drift from the typed matrix.
- State provisioning, allowance snapshot, provider precedence, and operator recovery without any
  secret path/value in tracked artifacts.

### S5 — smoke, migration, and evaluation

- Run focused type-check/test/lint/fmt and SSOT/parity guards after every slice.
- Run value-free provider profile and credential-loader smoke tests.
- Run live model/provider smoke through the checked-in launcher with bounded prompts and structured
  receipts after local provisioning; never print credentials.
- Run separate-session, cross-family IMPL-EVAL and address findings within the matrix round limit.

## Open-decision sweep

| Question                                                           | Resolution                                                       |
| ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Is Astra target-active or capability-gated?                        | Target-active per owner; no provisional fallback comment.        |
| Which provider wins when multiple subscriptions expose a model?    | The owner’s ordered provider preference.                         |
| Can a fallback evaluator share family with any generator fallback? | No; all cross-products are rejected.                             |
| May Go fall through to separately funded Zen balance?              | No, fail closed at the subscription allowance.                   |
| Which Ollama tier should be assumed?                               | None; resolve from account/local config, otherwise fail closed.  |
| Should historical run artifacts be rewritten?                      | No; `.llm/runs/**` are retained evidence. Only this run changes. |
| Does this require package doctrine/public-surface gates?           | No; internal harness/tooling only.                               |

## Risk register

| Risk                                                | Severity | Mitigation / proof                                                                           |
| --------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| A provider slug differs across Go/Ollama/OpenRouter | high     | Logical IDs plus explicit capability map; no synthesized slugs; catalog smoke.               |
| Same-family fallback accidentally self-certifies    | critical | Exhaustive cross-product invariant at construction and in tests.                             |
| Unknown usage silently spends overflow balance      | critical | Fresh snapshot required; fail closed before child spawn.                                     |
| Credential leaks into receipt/error/argv            | critical | file parser tests, rival-key clearing, value-free diagnostics, no key argv.                  |
| Legacy callers silently keep old matrix             | high     | active policy derived from new matrix; legacy records accepted only at deserialize boundary. |
| Human policy drifts from code                       | high     | machine-readable markers and parity test.                                                    |
| Provider publishes changed limits                   | medium   | source date in config, explicit revalidation cadence, stale-policy warning.                  |
| Ollama subscription tier is guessed incorrectly     | high     | dynamic/explicit tier resolution; unresolved tier blocks.                                    |

## Gate plan

| Gate                  | Command / evidence                                                                             | Required     |
| --------------------- | ---------------------------------------------------------------------------------------------- | ------------ |
| PLAN-EVAL             | separate OpenCode/Muse Spark 1.3 max session; plan protocol                                    | before S1    |
| Focused check         | structured Deno check wrapper on changed TypeScript roots                                      | each slice   |
| Focused test          | structured Deno test wrapper on routing/provider/expense tests                                 | each slice   |
| Lint/fmt              | structured wrappers on changed TypeScript                                                      | before push  |
| SSOT                  | `config/no-hardcoded-volatile_test.ts`                                                         | S1/S4        |
| Policy parity         | routing documentation parity test                                                              | S4           |
| Static OpenCode smoke | credential/profile/argv tests with opaque fake values                                          | S3           |
| Live OpenCode smoke   | bounded `agentic:opencode` turns for Go and Ollama with structured receipts                    | S5           |
| Repo check/test       | `deno task check`, `deno task test` (CI/runtime classifier may natively skip unrelated suites) | before ready |
| IMPL-EVAL             | separate cross-family Grok 4.6 xhigh; max 3, notify after 2                                    | before ready |
| PR lifecycle          | exact-head CI, review-thread gate, status/milestone                                            | before merge |

## Non-goals

- No model benchmarking framework or replication of Artificial Analysis benchmarks.
- No provider account mutation, subscription purchase, or overflow-balance enablement.
- No rewrite of historical run artifacts.
- No release cut or package API changes.
