# Plan: default open-model routing → GLM 5.3 Flash / Qwen 3.8 Flash

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-agentic-open-evaluator-routing` |
| Branch | `chore/agentic-open-evaluator-routing` |
| Phase | `plan` |
| Target | Internal agentic runtime, harness policy/docs, and OpenHands workflows |
| Archetype | N/A — no `packages/**` or `plugins/**` surface |
| Scope overlays | `SCOPE-docs` for policy/README/skill parity |

## Archetype

N/A. The doctrine archetypes govern package/plugin product surfaces. This leaf is internal
infrastructure/configuration and workflow automation; it uses the owner-specified typed/static,
workflow, sync, and live-canary gates.

## Current Doctrine Verdict

N/A for package/plugin verdicts. The applicable operating rule is single-authority configuration:
model strings in `config/models.ts`, route bindings in `routing-policy.ts`, and generated skill
mirrors produced only by `agentic:sync-claude`.

## Goal

Make Qwen 3.8 Flash/max the single OpenRouter PLAN-EVAL route and GLM 5.3 Flash/max the single
OpenRouter IMPL-EVAL and hybrid/gateway default, while preserving old evaluator preset IDs only at
the persisted-record parsing boundary. Prove both new routes with non-empty, >=300-token-budget live
canaries and finish with a fresh exact-implementation-head GLM/max IMPL-EVAL.

## Scope

- Central model vocabularies, active vs legacy evaluator model/preset acceptance, provider presets,
  formal routing, hybrid delegation, interactive gateway defaults, evaluator guard, and routing
  state rendering.
- Static/live canary identity, effort, output budget, non-empty response, and capability evidence.
- The duplicate Deno task alias and all active references to the gateway/formal transport split.
- OpenHands phase/default models, manual profiles, allowlist, labels, workflow tests, and explicit
  no-effort-attestation wording.
- Routing/docs/protocol/root docs/source skills and generated Claude mirrors.
- Full internal-tooling gates, live canaries, PR lifecycle, and separate-session IMPL-EVAL.

## Non-Scope

- Re-evaluating #1774/#1775 or rewriting immutable historical run artifacts.
- Implementing OpenHands reasoning-effort attestation before its adapter exposes evidence.
- Changing native Claude/Codex routes or ordinary opposite-family review pairing.
- Package/plugin architecture, JSR publication, scaffold output, or release publication.

## Hidden Scope

- `OPENROUTER_PRESET_IDS` is currently a shared launch/deserialization vocabulary; it must split so
  historical compatibility does not preserve active selection.
- The generic OpenHands workflow has a second allowlist/default/profile surface beyond the phase
  workflow.
- Provider canary evidence must distinguish requested identity from observed argv/profile identity
  and must reject an empty visible response.
- Policy parity needs a new executable assertion because none exists.
- Old live GitHub labels cannot be deleted; their checked-in descriptions remain as deprecated
  historical markers while dispatch rejects them for new runs.

## Locked Decisions

| ID | Decision | Rationale |
| --- | -------- | --------- |
| D1 | Add explicit current `planEvaluator`/`implEvaluator` model constants and a separate legacy model map in `config/models.ts`. | Keeps all volatile strings in one authority while making active vs historical intent reviewable. |
| D2 | Active evaluator allowlists contain only Qwen 3.8 Flash and GLM 5.3 Flash. Retired Minimax/DeepSeek/Qwen Max IDs remain available only through historical constants. | The owner requires historical parsing without canonical or guard selection. |
| D3 | Split active preset IDs from persisted preset IDs. `matchOpenRouterPreset` and live CLI selection see active presets only; `local-state-adapter` accepts the combined persisted vocabulary. | Parsing compatibility must not imply launch authorization. |
| D4 | Replace both formal OpenRouter rows with one phase-specific row each and remove complexity-dependent selection/conditions. | The DeepSeek-small/Qwen-complex split is explicitly superseded. |
| D5 | Hybrid delegation admits both new IDs, defaults to GLM/max, and excludes legacy IDs. The interactive gateway defaults to GLM/max and accepts current configured IDs only. | Matches the new owner-selected open-model pair and retirement rule. |
| D6 | The live Claude canary passes `--effort`, forces `CLAUDE_CODE_MAX_OUTPUT_TOKENS=1024`, records requested-vs-observed argv/profile identity and budget, and requires the visible `PROVIDER_CANARY_OK` marker. | 1024 exceeds the mandated 300-token floor and the marker closes the GLM reasoning-only empty-content false green. |
| D7 | `preset-canary.ts` statically rejects a Claude preset plan whose argv omits/mismatches `--effort`. | Prevents later adapter drift from making live effort nominal again. |
| D8 | Keep `agentic:claude-openrouter` for formal `openrouter-run.ts`; rename the interactive `remote-model-launcher.ts` alias to `agentic:claude-openrouter-gateway`. | Resolves duplicate-key shadowing without breaking the formal transport name. |
| D9 | OpenHands phase defaults are Qwen Flash for PLAN and GLM Flash for IMPL; generic default is GLM Flash; only `eval:model:qwen` and new `eval:model:glm` select current routes. Old labels remain defined but are historical/deprecated and fail dispatch. | No retired route remains selectable, and existing labels are not destructively deleted. |
| D10 | Every OpenHands dispatch/status surface says effort attestation is unavailable; no OpenHands text claims `max`. | Matches the stated adapter limitation and non-scope. |
| D11 | Add a machine-parsed formal OpenRouter parity table to `lane-policy.md` and compare it exactly with `CANONICAL_ROUTE_POLICY` in tests. | Turns the existing prose parity claim into an executable contract. |
| D12 | Do not edit `.claude/skills` directly; edit `.agents/skills` then run the canonical sync. | Generated mirrors must stay byte-identical. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Legacy presets in active registry vs parser-only vocabulary | Resolved now | Parser-only combined ID tuple; active registry excludes them. |
| Canary output budget | Resolved now | 1024 tokens, above the required 300 floor. |
| OpenHands legacy label handling | Resolved now | Keep label definitions, mark deprecated/historical, reject for new dispatch. |
| OpenHands effort implementation | Safe to defer | Explicit owner non-scope pending adapter evidence support. |
| Historical run artifact wording | Safe to defer | Immutable evidence remains truthful for the route used at that time. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Legacy persisted state stops parsing. | Add a table-driven test for all retired evaluator preset IDs/models through `parseDesiredRuntimeState`. |
| A retired model remains active through an overlooked workflow/profile/allowlist. | Residue scan outside historical runs plus workflow static tests and central active-vs-legacy tuples. |
| GLM canary returns HTTP/process success but empty content. | 1024 output-token budget plus exact non-empty marker requirement. |
| Canary evidence repeats requested effort without proving argv. | Record requested/observed identity with source and assert exact `--effort` argv. |
| Docs drift from code. | Exact formal-route parity test and `docs:maintenance`. |
| OpenHands wording overclaims effort. | Explicit limitation in workflow comment/summary, labels, README, policy/protocol, and handoff skill; grep review. |
| Duplicate Deno key remains shadowed. | JSON parse/task assertion and distinct names in all active references. |
| Skill mirrors diverge. | Source-only edits followed by sync + sync-check + surface check. |
| Live canary exposes credential. | Use the mode-600 env file through a non-printing sourced environment; structured result contains no secret or raw response. |
| `deno.lock` churn. | Every task/hook/canary uses existing `--no-lock` tasks; compare `deno.lock` to baseline before each sign-off. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Focused routing/canary/workflow tests | Structured test wrapper over touched `*_test.ts` files | PASS |
| 2 | Scoped typecheck | `run-deno-check.ts --root .llm/tools/agentic --ext ts,tsx` | PASS |
| 3 | Full agentic tests | `run-deno-test.ts -- --allow-all .llm/tools/agentic` | PASS |
| 4 | Scoped lint | `run-deno-lint.ts --root .llm/tools/agentic --ext ts,tsx` | PASS |
| 5 | Scoped format | `run-deno-fmt.ts --root .llm/tools/agentic --ext ts,tsx` | PASS |
| 6 | Static preset canary | `deno task agentic:provider-canary` | PASS; active presets exhaustive |
| 7 | Policy/doc parity | Focused `routing-policy_test.ts` through structured wrapper | Exact current rows match |
| 8 | Workflow validity | Existing workflow static tests plus Ruby/Psych parse of both changed YAML files | PASS |
| 9 | Volatile literal guard | `config/no-hardcoded-volatile_test.ts` through structured wrapper/full suite | PASS |
| 10 | Skill mirrors | `agentic:sync-claude`, `agentic:sync-claude:check`, `agentic:check-claude` | PASS |
| 11 | Docs overlay | `deno task docs:maintenance` | PASS |
| 12 | Lock hygiene | `git diff --exit-code a3ddcbb... -- deno.lock` | unchanged |
| 13 | Live Qwen canary | `agentic:provider-canary --live` with Qwen preset/max | PASS; budget 1024, non-empty, route matched, tools/reasoning/streaming supported |
| 14 | Live GLM canary | `agentic:provider-canary --live` with GLM preset/max | PASS; budget 1024, non-empty, route matched, tools/reasoning/streaming supported |
| 15 | IMPL-EVAL | Fresh separate GLM/max OpenRouter session against exact pushed implementation head | `PASS` |

## Commit Slices

1. **S1 — typed current/legacy routing and canary evidence.** Proves new phase/default routes,
   parser-only legacy compatibility, effort/budget/content attestation, and distinct Deno tasks.
2. **S2 — OpenHands current routing and honest cloud evidence.** Proves phase/default workflow
   models, label behavior, open-only allowlist, YAML/static validity, and no effort overclaim.
3. **S3 — policy/docs/skills convergence.** Proves executable policy parity, README/protocol/root
   documentation, source skills, generated mirror identity, and rollout/current canary guidance.
4. **S4 — exact-green evidence packet.** Records full structured gates, both live canaries, residue
   audit, lock proof, separate-session IMPL-EVAL, and final PR handoff without merging.

## Arch-Debt Implications

- None expected. The missing policy/doc parity assertion is fixed in this leaf rather than deferred.
- OpenHands effort attestation remains an explicit upstream-adapter limitation and owner-declared
  non-scope, not hidden architecture debt.

## Drift Watch

- Any live catalog disappearance/capability mismatch, inability to source the credential, canary
  empty response, task alias reference missed, policy parity gap, or evaluator route substitution
  is append-only drift and blocks handoff until resolved or owner-authorized.
