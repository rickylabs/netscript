# Worklog: GLM 5.3 Flash / Qwen 3.8 Flash default open-model routing

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-agentic-open-evaluator-routing` |
| Branch | `chore/agentic-open-evaluator-routing` |
| Archetype | N/A — internal tooling/config/workflows |
| Scope overlays | `SCOPE-docs` |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-routing` |
| Generator thread | `01a05481-a2ff-7632-809a-e478889e626e` |
| Requested route | OpenAI / `gpt-5.6-sol` / high |
| Observed route | OpenAI / `gpt-5.6-sol` / high (`codex-thread-ids.md`, matched) |

## Design

Recorded before implementation source edits.

### Public Surface

- Internal config exports for current and legacy OpenRouter model IDs, selectable model IDs,
  hybrid defaults, and open evaluator IDs.
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

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Typed current/legacy routing and canary evidence | Focused structured routing/provider/canary/hybrid/launcher tests; scoped check/lint/fmt | `config/models.ts`, `runtime/provider-profiles.ts`, `runtime/routing-policy.ts`, provider/preset canary and adapters/tests, hybrid/launcher/tests, `deno.json`, task references, run artifacts |
| 2 | OpenHands current routing and honest cloud evidence | Structured OpenHands tests + YAML parse | both OpenHands workflows, `.github/labels.yml`, OpenHands tests, run artifacts |
| 3 | Policy/docs/skills convergence | Parity test, docs maintenance, skill sync/check | `lane-policy.md`, evaluator protocols, agentic README, `AGENTS.md`, `ROLLOUT.md`, source skills, generated mirrors, run artifacts |
| 4 | Exact-green evidence packet | Full structured suite, both live canaries, lock proof, separate-session IMPL-EVAL | run artifacts and PR comments only unless a reviewed evaluator fix is required |

### Deferred Scope

- OpenHands effort attestation — deferred until the adapter exposes observed effort.
- Historical run/evaluator artifact rewriting — immutable evidence remains unchanged.
- Native Claude/Codex route changes — not part of the open-model layer.

### Contributor Path

Change model strings only in `config/models.ts`; change preset shape/activation in
`provider-profiles.ts`; bind lanes only in `routing-policy.ts`; update the formal parity table in
`lane-policy.md`; run the exhaustive preset canary, full agentic wrappers, and skill sync. Historical
IDs belong only in the explicit legacy/persisted tuples.

## PLAN-EVAL

**N/A — owner decision recorded before implementation.** Issue #1791 supplies a complete
prospective infrastructure/config contract: exact model IDs, phase/default bindings, effort,
historical compatibility, canary hazard/floor, required docs/workflows, gates, and non-scope. No
architecture, sequencing, or rework-forcing decision remains open; a ceremonial planning evaluator
would not change the implementation contract. IMPL-EVAL remains mandatory.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| ---------- | ----- | ---- | ----- |
| 2026-08-30 21:11 | Research | Catalog verification | Both IDs present; only plain Qwen Flash ID exists; GLM mandatory reasoning/max. |
| 2026-08-30 21:20 | Plan | Design checkpoint | Active-vs-persisted preset split, canary attestation, workflow behavior, gates, and four slices locked. |
| 2026-08-30 21:31 | S1/S2 | Runtime and workflow implementation | Current/legacy domains split; Qwen/GLM presets and formal bindings active; gateway task unshadowed; OpenHands routes current models and states its effort limitation. |
| 2026-08-30 21:35 | S3 | Policy/docs/skills convergence | Added exact lane-policy parity markers/test; updated evaluator docs, README, root docs, source skills; canonical sync updated three mirrors. |
| 2026-08-30 21:38 | S4 | Full local gates | 165-file check/lint/fmt coverage and 491 tests green; workflow YAML parsed; no-hardcoded guard and skill sync/check green. |
| 2026-08-30 21:40 | S4 | Live canaries | Both new Claude/OpenRouter presets passed with matched route identity, `max` argv effort, 1024-token budget, non-empty response, and tools/reasoning/streaming evidence. |
| 2026-08-30 21:41 | S1-S3 | Product sign-off commit | `601a53e04` — routing, canaries, workflows, parity/docs, skills, and lint-gate remediation committed atomically. |
| 2026-08-30 21:44 | Publication | Connector fallback | HTTPS token lacked workflow scope; GitHub connector published tree-identical product `1e659932f4` and evidence `9937705b5d` commits without force. |

## Gate Results

| Gate | Result | Evidence / notes |
| ---- | ------ | ---------------- |
| OpenRouter catalog existence | PASS | Public catalog query at 2026-08-30T21:11:02Z; both IDs true; no Qwen Flash Next. |
| PLAN-EVAL | N/A | Owner decision and complete issue contract; recorded before source edits. |
| Full agentic tests | PASS | Structured wrapper: 491 passed, 0 failed. |
| Full agentic check | PASS | Structured wrapper: 165 selected, 2 batches, 0 failed; `--unstable-kv`. |
| Full agentic lint | PASS | Structured wrapper with run-owned config overriding the root `.llm/` exclusion: 165 selected/processed, 0 findings. Initial covered run exposed 15 baseline findings; fixed without suppressions. |
| Full agentic fmt | PASS | Structured wrapper: 165 selected/processed; write normalization then check, 0 findings. |
| Policy/doc parity | PASS | `routing-policy-doc-parity_test.ts`; exact PLAN/IMPL preset/model/effort/condition match. |
| Volatile-model guard | PASS | `no-hardcoded-volatile_test.ts` within full suite and focused six-test gate. |
| OpenHands static behavior | PASS | Phase/dispatch workflow tests within 491-test suite; Qwen PLAN, GLM IMPL/default, effort limitation text asserted. |
| Workflow YAML parse | PASS | `@std/yaml` parsed both OpenHands workflows and `.github/labels.yml`; `actionlint` unavailable. |
| Skill sync/check | PASS | `agentic:sync-claude`: 18 skills/22 mirrors, three updated; `agentic:check-claude` green including lock hook. |
| Legacy preset deserialization | PASS | Table test parses all four retired preset IDs; active match test proves they cannot launch. |
| GLM live canary | PASS | Requested/observed `openrouter` / `z-ai/glm-5.3-flash` / `max`, matched via argv/profile; budget 1024; non-empty; tools 6, reasoning 154, streaming 158; exit 0. |
| Qwen live canary | PASS | Requested/observed `openrouter` / `qwen/qwen3.8-flash` / `max`, matched via argv/profile; budget 1024; non-empty; tools 6, reasoning 184, streaming 188; exit 0. |
| `deno.lock` | PASS | `git diff --quiet -- deno.lock` exit 0 after hooks, YAML parser, and canaries. |
| IMPL-EVAL | NOT_RUN | Mandatory separate exact-head evaluation runs after implementation commits are pushed. |

## Commit Trail

| Commit | Scope | Gate state |
| ------ | ----- | ---------- |
| `a8d9248e3` | Research, locked plan/design, PLAN-EVAL N/A record | Bootstrap/research/plan complete |
| `601a53e04` | S1-S3 product/config/workflows/docs/skills plus full-lint remediation | Full generator gate set and both live canaries PASS |

Published GitHub mapping (connector-authored commit metadata changes hashes; trees are identical):

| Local commit | Published commit | Tree |
| ------------ | ---------------- | ---- |
| `601a53e04` | `1e659932f4` | `de5127fe74b044c05c531aa992ff893b5623f00a` |
| `fe2416919` | `9937705b5d` | `038df88d417893753ad26aca61f0ffe0016329e9` |

## Handoff Notes

- Evaluator must inspect active-vs-persisted preset boundaries first, then canary identity/budget/
  content evidence, formal-route parity, OpenHands no-effort-attestation wording, residue audit, and
  `deno.lock` proof.
