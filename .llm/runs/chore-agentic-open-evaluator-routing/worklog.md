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

## Gate Results

| Gate | Result | Evidence / notes |
| ---- | ------ | ---------------- |
| OpenRouter catalog existence | PASS | Public catalog query at 2026-08-30T21:11:02Z; both IDs true; no Qwen Flash Next. |
| PLAN-EVAL | N/A | Owner decision and complete issue contract; recorded before source edits. |
| Remaining implementation gates | NOT_RUN | Run after the relevant slice; final full set before IMPL-EVAL. |

## Handoff Notes

- Evaluator must inspect active-vs-persisted preset boundaries first, then canary identity/budget/
  content evidence, formal-route parity, OpenHands no-effort-attestation wording, residue audit, and
  `deno.lock` proof.
