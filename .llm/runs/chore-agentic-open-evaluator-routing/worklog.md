# Worklog: GLM 5.3 Flash / Qwen 3.8 Flash default open-model routing

## Run Metadata

| Field            | Value                                                          |
| ---------------- | -------------------------------------------------------------- |
| Run ID           | `chore-agentic-open-evaluator-routing`                         |
| Branch           | `chore/agentic-open-evaluator-routing`                         |
| Archetype        | N/A — internal tooling/config/workflows                        |
| Scope overlays   | `SCOPE-docs`                                                   |
| Worktree         | `/home/agent/projects/netscript/worktrees/007-leaf-routing`    |
| Generator thread | `01a05481-a2ff-7632-809a-e478889e626e`                         |
| Requested route  | OpenAI / `gpt-5.6-sol` / high                                  |
| Observed route   | OpenAI / `gpt-5.6-sol` / high (`codex-thread-ids.md`, matched) |

## Design

Recorded before implementation source edits.

### Public Surface

- Internal config exports for current and legacy OpenRouter model IDs, selectable model IDs, hybrid
  defaults, and open evaluator IDs.
- Active and persisted OpenRouter preset ID tuples; active `OPENROUTER_PRESETS` registry.
- `CANONICAL_ROUTE_POLICY` formal PLAN/IMPL OpenRouter rows and
  `resolveCanonicalFormalEvaluatorRoute()`.
- `ProviderCompatibilityEvidence`, including bounded route/effort/budget/content attestation.
- Root tasks `agentic:claude-openrouter` (formal print transport) and
  `agentic:claude-openrouter-gateway` (interactive inference gateway).
- OpenHands workflow inputs/labels for `glm` and `qwen` current routes.

### Domain Vocabulary

- `CurrentOpenRouterModelId` — model IDs selectable for new work.
- `LegacyOpenRouterModelId` — retired IDs retained only for persisted evidence/state.
- `ActiveOpenRouterPresetId` — preset IDs accepted for launch/canary selection.
- `PersistedOpenRouterPresetId` / `OpenRouterPresetId` — active plus legacy IDs accepted by state
  deserialization.
- `LaunchIdentityEvidence` — requested versus observed provider/model/effort match.
- `response: non_empty | empty | unknown` — secret-safe visible completion status.
- `outputTokenBudget` — the child-environment output cap actually applied to a live Claude canary.
- `OpenHands effort attestation: unavailable` — cloud adapter limitation, never a nominal effort.

### Ports

- OpenRouter public catalog API — research-only live existence/capability check.
- Claude Code CLI — live canary/evaluator transport; explicit model, effort, output budget.
- OpenRouter Anthropic-skin endpoint — credentialed provider boundary.
- GitHub Actions/OpenHands — cloud phase dispatcher without effort attestation.
- GitHub PR/labels/milestone — harness review and lifecycle surface.

### Constants

- Current evaluator model pair — Qwen 3.8 Flash (PLAN), GLM 5.3 Flash (IMPL/default).
- Legacy evaluator model IDs — Minimax M3, DeepSeek V4 Flash 0731, Qwen 3.8 Max.
- Current evaluator preset IDs — `claude-evaluator-qwen-3-8-flash`,
  `claude-evaluator-glm-5-3-flash`.
- Legacy evaluator preset IDs — existing Minimax/DeepSeek/Qwen Max identifiers.
- `PROVIDER_CANARY_MAX_OUTPUT_TOKENS = 1024` — above the required 300-token floor.
- OpenHands current override labels — `eval:model:qwen`, `eval:model:glm`.

### Commit Slices

| # | Slice                                               | Gate                                                                                    | Files                                                                                                                                                                                          |
| - | --------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Typed current/legacy routing and canary evidence    | Focused structured routing/provider/canary/hybrid/launcher tests; scoped check/lint/fmt | `config/models.ts`, `runtime/provider-profiles.ts`, `runtime/routing-policy.ts`, provider/preset canary and adapters/tests, hybrid/launcher/tests, `deno.json`, task references, run artifacts |
| 2 | OpenHands current routing and honest cloud evidence | Structured OpenHands tests + YAML parse                                                 | both OpenHands workflows, `.github/labels.yml`, OpenHands tests, run artifacts                                                                                                                 |
| 3 | Policy/docs/skills convergence                      | Parity test, docs maintenance, skill sync/check                                         | `lane-policy.md`, evaluator protocols, agentic README, `AGENTS.md`, `ROLLOUT.md`, source skills, generated mirrors, run artifacts                                                              |
| 4 | Exact-green evidence packet                         | Full structured suite, both live canaries, lock proof, separate-session IMPL-EVAL       | run artifacts and PR comments only unless a reviewed evaluator fix is required                                                                                                                 |

### Deferred Scope

- OpenHands effort attestation — deferred until the adapter exposes observed effort.
- Historical run/evaluator artifact rewriting — immutable evidence remains unchanged.
- Native Claude/Codex route changes — not part of the open-model layer.

### Contributor Path

Change model strings only in `config/models.ts`; change preset shape/activation in
`provider-profiles.ts`; bind lanes only in `routing-policy.ts`; update the formal parity table in
`lane-policy.md`; run the exhaustive preset canary, full agentic wrappers, and skill sync.
Historical IDs belong only in the explicit legacy/persisted tuples.

## PLAN-EVAL

**N/A — owner decision recorded before implementation.** Issue #1791 supplies a complete prospective
infrastructure/config contract: exact model IDs, phase/default bindings, effort, historical
compatibility, canary hazard/floor, required docs/workflows, gates, and non-scope. No architecture,
sequencing, or rework-forcing decision remains open; a ceremonial planning evaluator would not
change the implementation contract. IMPL-EVAL remains mandatory.

## Progress Log

| Time (UTC)       | Slice       | Step                                | Notes                                                                                                                                                                                                                                                                                                                                  |
| ---------------- | ----------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30 21:11 | Research    | Catalog verification                | Both IDs present; only plain Qwen Flash ID exists; GLM mandatory reasoning/max.                                                                                                                                                                                                                                                        |
| 2026-08-30 21:20 | Plan        | Design checkpoint                   | Active-vs-persisted preset split, canary attestation, workflow behavior, gates, and four slices locked.                                                                                                                                                                                                                                |
| 2026-08-30 21:31 | S1/S2       | Runtime and workflow implementation | Current/legacy domains split; Qwen/GLM presets and formal bindings active; gateway task unshadowed; OpenHands routes current models and states its effort limitation.                                                                                                                                                                  |
| 2026-08-30 21:35 | S3          | Policy/docs/skills convergence      | Added exact lane-policy parity markers/test; updated evaluator docs, README, root docs, source skills; canonical sync updated three mirrors.                                                                                                                                                                                           |
| 2026-08-30 21:38 | S4          | Full local gates                    | 165-file check/lint/fmt coverage and 491 tests green; workflow YAML parsed; no-hardcoded guard and skill sync/check green.                                                                                                                                                                                                             |
| 2026-08-30 21:40 | S4          | Live canaries                       | Both new Claude/OpenRouter presets passed with matched route identity, `max` argv effort, 1024-token budget, non-empty response, and tools/reasoning/streaming evidence.                                                                                                                                                               |
| 2026-08-30 21:41 | S1-S3       | Product sign-off commit             | `601a53e04` — routing, canaries, workflows, parity/docs, skills, and lint-gate remediation committed atomically.                                                                                                                                                                                                                       |
| 2026-08-30 21:44 | Publication | Connector fallback                  | HTTPS token lacked workflow scope; GitHub connector published tree-identical product `1e659932f4` and evidence `9937705b5d` commits without force.                                                                                                                                                                                     |
| 2026-08-30 21:56 | S4          | Separate-session IMPL-EVAL          | GLM/max evaluator session `ab4ca47b-00db-49e3-a969-6f779c024a6e` independently reviewed exact published head `d9722b0b17a478af3db5bdafad87391a2ccbfd67` and returned `PASS`; disclosed dogfooding dependency.                                                                                                                          |
| 2026-08-30 22:02 | S4          | Exact-green publication             | Evaluator verdict and closed bookkeeping published in a final run-artifact-only commit; authoritative SHA is the PR branch head carrying this record. S1-S4 packet posted as PR comment `5471524652`; PR/issue advanced to `status:augment-review` without merging.                                                                    |
| 2026-08-30 22:14 | S4          | Merge-head IMPL-EVAL refresh        | Concurrent main merge advanced the PR to `1f5bda258`; fresh GLM/max session `7352a19f-013d-438e-8671-c238e46998ff` proved zero overlap, byte-identical branch delta, repeated the structured gates, and returned `PASS`.                                                                                                               |
| 2026-08-30 22:21 | S4          | Final-head IMPL-EVAL refresh        | Concurrent commit `6fe9f3b32` repaired two stale OpenHands test-fixture constants. Fresh GLM/max session `6b75ca52-691b-4cae-9235-bae987fc4a90` evaluated that exact published head, proved the sole delta green at 16/16 plus typecheck/lock/currency checks, and returned `PASS`; `CLAUDE_EFFORT=max` was observed inside the child. |
| 2026-08-30 22:27 | S4          | Augment review hardening            | Two medium findings were accepted as in-scope: canary markers now count only visible assistant/result text, capture retains a reasoning-heavy tail, and OpenHands rejects cross-phase model labels. Full structured gates reached 493/493; both stricter live canaries passed. Exact-head IMPL-EVAL refresh pending publication.       |
| 2026-08-30 22:39 | S4          | Non-qualifying evaluator attempts   | Session `cdf06638-b578-4981-9c3d-7697f9507169` was invalidated when the branch head advanced; session `cccbef73-de8a-49bb-a8a0-1c1620cda959` then ended with SIGTERM before a verdict. Neither attempt is acceptance evidence.                                                                                                         |
| 2026-08-30 22:49 | S4          | Review-fixed exact-head IMPL-EVAL   | Fresh session `ec1cfcda-7207-4719-a976-5e16c0914e8d` evaluated exact published head `ba70c6c90098129821cad342d0f005a38d37bb77`, independently reran 493/493 tests, found no required fixes, and returned `PASS`. Dogfood dependency disclosed.                                                                                         |

## Gate Results

| Gate                          | Result | Evidence / notes                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OpenRouter catalog existence  | PASS   | Public catalog query at 2026-08-30T21:11:02Z; both IDs true; no Qwen Flash Next.                                                                                                                                                                                                                                                                                         |
| PLAN-EVAL                     | N/A    | Owner decision and complete issue contract; recorded before source edits.                                                                                                                                                                                                                                                                                                |
| Full agentic tests            | PASS   | Structured wrapper after review hardening: 493 passed, 0 failed.                                                                                                                                                                                                                                                                                                         |
| Full agentic check            | PASS   | Structured wrapper: 165 selected, 2 batches, 0 failed; `--unstable-kv`.                                                                                                                                                                                                                                                                                                  |
| Full agentic lint             | PASS   | Structured wrapper with run-owned config overriding the root `.llm/` exclusion: 165 selected/processed, 0 findings. Initial covered run exposed 15 baseline findings; fixed without suppressions.                                                                                                                                                                        |
| Full agentic fmt              | PASS   | Structured wrapper: 165 selected/processed; write normalization then check, 0 findings.                                                                                                                                                                                                                                                                                  |
| Policy/doc parity             | PASS   | `routing-policy-doc-parity_test.ts`; exact PLAN/IMPL preset/model/effort/condition match.                                                                                                                                                                                                                                                                                |
| Volatile-model guard          | PASS   | `no-hardcoded-volatile_test.ts` within full suite and focused six-test gate.                                                                                                                                                                                                                                                                                             |
| OpenHands static behavior     | PASS   | Phase/dispatch workflow tests within 493-test suite; Qwen PLAN, GLM IMPL/default, cross-phase overrides rejected, effort limitation text asserted.                                                                                                                                                                                                                       |
| Workflow YAML parse           | PASS   | `@std/yaml` parsed both OpenHands workflows and `.github/labels.yml`; `actionlint` unavailable.                                                                                                                                                                                                                                                                          |
| Skill sync/check              | PASS   | `agentic:sync-claude`: 18 skills/22 mirrors, three updated; `agentic:check-claude` green including lock hook.                                                                                                                                                                                                                                                            |
| Legacy preset deserialization | PASS   | Table test parses all four retired preset IDs; active match test proves they cannot launch.                                                                                                                                                                                                                                                                              |
| GLM live canary               | PASS   | Hardened rerun requested/observed `openrouter` / `z-ai/glm-5.3-flash` / `max`, matched via argv/profile; budget 1024; visible assistant response non-empty; tools 5, reasoning 82, streaming 86; exit 0. An initial stricter rerun correctly blocked when the 64 KiB capture ended before visible output; bounded capture increased to 512 KiB with regression coverage. |
| Qwen live canary              | PASS   | Hardened rerun requested/observed `openrouter` / `qwen/qwen3.8-flash` / `max`, matched via argv/profile; budget 1024; visible assistant response non-empty; tools 6, reasoning 109, streaming 113; exit 0.                                                                                                                                                               |
| `deno.lock`                   | PASS   | `git diff --quiet -- deno.lock` exit 0 after hooks, YAML parser, and canaries.                                                                                                                                                                                                                                                                                           |
| IMPL-EVAL                     | PASS   | Fresh separate GLM/max session `ec1cfcda-7207-4719-a976-5e16c0914e8d` evaluated exact published head `ba70c6c90098129821cad342d0f005a38d37bb77`; requested OpenRouter/GLM/max and observed Z.AI/GLM/`CLAUDE_EFFORT=max`; 493/493 independent tests, no required fixes. Dogfood dependency disclosed.                                                                     |

## Commit Trail

| Commit      | Scope                                                                 | Gate state                                          |
| ----------- | --------------------------------------------------------------------- | --------------------------------------------------- |
| `a8d9248e3` | Research, locked plan/design, PLAN-EVAL N/A record                    | Bootstrap/research/plan complete                    |
| `601a53e04` | S1-S3 product/config/workflows/docs/skills plus full-lint remediation | Full generator gate set and both live canaries PASS |
| `3872c5db8` | Review hardening for visible canary output and phase-safe labels      | 493/493 plus hardened GLM/Qwen live canaries PASS   |
| `ba70c6c90` | Current-main convergence and historical-evidence restoration          | Fresh exact-head IMPL-EVAL PASS                     |

Published GitHub mapping (connector-authored commit metadata changes hashes; trees are identical):

| Local commit | Published commit | Tree                                       |
| ------------ | ---------------- | ------------------------------------------ |
| `601a53e04`  | `1e659932f4`     | `de5127fe74b044c05c531aa992ff893b5623f00a` |
| `fe2416919`  | `9937705b5d`     | `038df88d417893753ad26aca61f0ffe0016329e9` |
| `56a5b2b2f`  | `d9722b0b1`      | `ea0f60adfab1af43bc490319f510f2ac1a6e6153` |

## Handoff Notes

- Review hardening is fully gated, live-probed, and covered by a fresh exact-head separate-session
  IMPL-EVAL `PASS`; publish this final evaluator record as an artifact-only head before handoff.
- Current evaluator findings are informational only: the 512 KiB scan remains intentionally bounded
  and a pre-existing capability counter can over-count reasoning without bypassing visible-response
  eligibility. Neither requires a change for this leaf.
- Do not merge; hand the supervisor the exact-green packet with the evaluated head and final
  artifact-only head distinguished explicitly.
