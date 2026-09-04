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
4. **Cross-family selection composes fallbacks.** Model family is vendor-level: OpenAI, Anthropic,
   Google, Meta, Zhipu, Alibaba, MiniMax, DeepSeek, Moonshot, or xAI. For a selected generator,
   same-family evaluator candidates are skipped and the evaluator fallback chain continues. Matrix
   construction proves every generator candidate has at least one legal evaluator candidate; it does
   not reject the owner's declared matrix merely because one unselected cartesian pair would
   conflict. Separate sessions remain mandatory.
5. **Evaluation limits are data.** The following exact owner values live beside each tier:
   straightforward PLAN has no roundtrip and immediate in-flight repair; feature PLAN max 2 with
   repair on 2; complex PLAN max 3 with repair on 3; architecture PLAN max 1 and escalates the
   second failure to the owner. Straightforward, feature, and complex IMPL max 5 and notify after 3;
   architecture IMPL max 3 and notify after 2. Every iteration re-steers the same evaluator.
   Documentation uses the tier's IMPL policy capped at 2. Simple IMPL is explicitly
   `unspecified_by_owner`, not assigned an invented limit.
6. **Paid dispatch fails closed.** OpenCode Go, Ollama Cloud, and OpenRouter require a fresh
   normalized allowance snapshot. Missing/stale/unknown tier or an exceeded window selects the next
   declared fallback; it never silently consumes Go Zen balance or Ollama extra balance.
7. **Secrets stay host-local.** Credential loaders parse only the expected assignment from mode-600
   env files in `~/.config/netscript-agentic/`, bind only the selected provider key into the child,
   clear rival keys, and expose key names—not values—in errors/receipts.
8. **Old routes are migration inputs only.** Persisted legacy IDs/lanes remain readable where
   needed, but no new launch resolves or heuristically maps a legacy lane. A new-selection request
   carrying an old lane fails closed and asks for explicit workload tier and role.

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
- Add a coverage proof that every generator candidate can compose at least one opposite-family
  evaluator candidate, plus selection tests that skip each illegal same-family pairing.
- **Files:** `config/models.ts`, new `runtime/delegation-matrix.ts`, and
  `runtime/delegation-matrix_test.ts`.
- **Proof:** focused structured check/test plus `config/no-hardcoded-volatile_test.ts`.

### S2 — resolver and legacy boundary

- Resolve a workload role/tier to a concrete route using provider health/capability/budget inputs.
- Make the typed matrix drive the active canonical policy and routing-state human output.
- Retain only explicit persisted-state compatibility for old lane/model identifiers.
- Update selection tests for no silent effort/model/provider drift.
- **Files:** `runtime/routing-policy.ts`, `runtime/routing-policy_test.ts`,
  `runtime/cli/routing-state.ts`, `runtime/cli/routing-state_test.ts`, and the route contract only
  where the two provider kinds require it.
- **Proof:** focused structured check/test, including all legacy-input and active-output assertions.

### S3 — secure OpenCode providers and expense watcher

- Add `opencode_go`, `ollama`, and generic OpenCode/OpenRouter profiles.
- Select the credential loader from the chosen provider/model prefix; clear rival keys.
- Add fixed OpenCode Go limits and dynamic Ollama tier policies.
- Add structured `agentic:expense-watch` preflight with stale/unknown/exceeded fail-closed states.
- Gate paid OpenCode execution before spawning the child process.
- **Files:** `config/subscriptions.ts`, `runtime/subscription-expense.ts`,
  `runtime/subscription-expense_test.ts`, `runtime/provider-profiles.ts` and its test,
  `lib/provider-credential.ts` and its test, `opencode/opencode-run.ts` and its test, the expense
  CLI, and `deno.json`.
- **Proof:** focused structured check/test; fake-value credential isolation; table tests for every
  allowance boundary; a command-spawn spy proving denied expense decisions never spawn OpenCode.

### S4 — docs, skills, and parity

- Replace the active routing tables in lane policy and evaluator protocols.
- Update harness/manager skill instructions and agentic tooling documentation.
- Add/check machine markers so human policy cannot drift from the typed matrix.
- State provisioning, allowance snapshot, provider precedence, and operator recovery without any
  secret path/value in tracked artifacts.
- **Files:** `.llm/harness/workflow/lane-policy.md`, evaluator plan/implementation protocols,
  `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/claude-manager/SKILL.md`,
  `.llm/tools/agentic/README.md`, `.llm/harness/workflow/tooling.md`, and the policy parity test.
- **Proof:** documentation parity test, focused Markdown format check, and stale active-policy term
  scan excluding `.llm/runs/**`.

### S5 — smoke, migration, and evaluation

- Run focused type-check/test/lint/fmt and SSOT/parity guards after every slice.
- Run value-free provider profile and credential-loader smoke tests.
- Run live model/provider smoke through the checked-in launcher with bounded prompts and structured
  receipts after local provisioning; never print credentials.
- Run separate-session, cross-family IMPL-EVAL and address findings within the matrix round limit.
- **Files:** this run's `worklog.md`, `context-pack.md`, `drift.md`, `evaluate.md`, and receipt
  files only; production files change only if a gate/evaluator finding requires a bounded fix.
- **Proof:** exact commands/exit codes and separate evaluator identity recorded in run artifacts and
  PR comments.

## Open-decision sweep

| Question                                                        | Resolution                                                                        |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Is Astra target-active or capability-gated?                     | Target-active per owner; no provisional fallback comment.                         |
| Which provider wins when multiple subscriptions expose a model? | The owner’s ordered provider preference.                                          |
| Can declared fallback candidates share a family?                | Yes; skip an illegal selected pair and require another legal evaluator candidate. |
| May Go fall through to separately funded Zen balance?           | No, fail closed at the subscription allowance.                                    |
| Which Ollama tier should be assumed?                            | None; resolve from account/local config, otherwise fail closed.                   |
| Should historical run artifacts be rewritten?                   | No; `.llm/runs/**` are retained evidence. Only this run changes.                  |
| Does this require package doctrine/public-surface gates?        | No; internal harness/tooling only.                                                |

## Risk register

| Risk                                                  | Severity | Mitigation / proof                                                                           |
| ----------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| A provider slug differs across Go/Ollama/OpenRouter   | high     | Logical IDs plus explicit capability map; no synthesized slugs; catalog smoke.               |
| Same-family selected pair accidentally self-certifies | critical | Vendor-family comparison at selection plus coverage proof for every generator candidate.     |
| Unknown usage silently spends overflow balance        | critical | Fresh snapshot required; fail closed before child spawn.                                     |
| Credential leaks into receipt/error/argv              | critical | file parser tests, rival-key clearing, value-free diagnostics, no key argv.                  |
| Legacy callers silently keep old matrix               | high     | active policy derived from new matrix; legacy records accepted only at deserialize boundary. |
| Human policy drifts from code                         | high     | machine-readable markers and parity test.                                                    |
| Provider publishes changed limits                     | medium   | source date in config, explicit revalidation cadence, stale-policy warning.                  |
| Ollama subscription tier is guessed incorrectly       | high     | dynamic/explicit tier resolution; unresolved tier blocks.                                    |

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

### Archetype-gate applicability

This is repository-internal agentic tooling, not an Archetype-6 package and not a release cut. The
Archetype-6 structural/package publish gates (F-CLI folder shape, JSR surface, `publish:dry-run`,
consumer import, Aspire, browser, scaffold, and release gates) are `N/A`: no `packages/**`,
`plugins/**`, scaffold output, or published CLI surface changes. Applicable universal properties are
covered by the repository check/test/lint/fmt gates, SSOT guard, focused CLI argument/environment
tests, and manual adapter-boundary review. `jsr-audit` is `N/A` for the same reason.

## Non-goals

- No model benchmarking framework or replication of Artificial Analysis benchmarks.
- No provider account mutation, subscription purchase, or overflow-balance enablement.
- No rewrite of historical run artifacts.
- No release cut or package API changes.
