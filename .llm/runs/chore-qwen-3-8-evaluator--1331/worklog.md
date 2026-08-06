# Worklog: phase-specific formal evaluator defaults

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-qwen-3-8-evaluator--1331` |
| Branch | `chore/qwen-3-8-evaluator` |
| Archetype | N/A — maintainer harness/tooling/configuration |
| Scope overlays | docs |

## Design

### Public Surface

- `OPENROUTER_MODEL_IDS.qwen` — canonical OpenRouter Qwen model id.
- `OPEN_EVALUATOR_MODEL_IDS` — approved open-only formal evaluator models.
- `OPENROUTER_PRESET_IDS` / `OPENROUTER_PRESETS` — finite provider preset identity and capability
  contract.
- `CANONICAL_ROUTE_POLICY` / phase-aware formal route resolver — PLAN/IMPL evaluator bindings and
  enforcement.
- `agentic:provider-canary` — static and explicitly opted-in live provider proof.
- Harness evaluator protocols, lane policy, canonical skills, and generated mirrors — operator
  contract describing the executable route.

### Domain Vocabulary

- `minimax/minimax-m3` — canonical PLAN-EVAL default.
- `qwen/qwen3.8-max` — canonical IMPL-EVAL default.
- `qwen/qwen3.7-max` — stale id permitted only in an explicit rejection/migration/history fixture.
- `claude-evaluator-qwen-3-8-max` — canonical formal evaluator preset id.
- `formal_plan_evaluation` / `formal_impl_evaluation` — phase-specific canonical lanes.
- `open_only` — cost-protection policy for formal evaluator transports.
- PLAN-EVAL / IMPL-EVAL / ordinary slice review — distinct session roles.

### Ports

- Claude Code + OpenRouter `claude-openrouter` / `claude-print` — formal evaluator transport.
- OpenRouter provider canary — bounded availability/capability evidence.
- GitHub draft PR — commit trail, phase comments, labels, milestone, and close-gate surface.
- Skill and consumer generators — canonical generated-surface writers.

### Constants

- `OPENROUTER_MODEL_IDS.qwen` — `qwen/qwen3.8-max` after S1.
- `OPEN_EVALUATOR_MODEL_IDS` — Minimax M3 plus Qwen 3.8 approved set.
- `OPENROUTER_PRESET_IDS` — includes `claude-evaluator-qwen-3-8-max`, excludes active 3.7 slug.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Phase-specific model/preset/route contract and stale/cross-phase rejection | Focused config/provider/routing tests + scoped wrappers + review | Central config, provider profiles, routing policy, focused tests, run artifacts |
| 2 | Runtime/canary/current-fixture exact-model proof | Focused runner/canary tests + full agentic suite + static/live canary + review | Canary/runner modules and tests, current-output fixtures, run artifacts |
| 3 | Harness/docs/skills/generated convergence and exact residue audit | Sync/Claude/consumer/docs gates + exact audit + review | Harness/operator docs, canonical skills, generated mirrors, classified history, run artifacts |

### Deferred Scope

- Package/plugin/public CLI changes — outside this maintainer tooling slice.
- Merge, release, and publish — milestone orchestrator authority.
- Unrelated historical run-artifact normalization.

### Contributor Path

Future formal evaluator migrations start in `.llm/tools/agentic/config/models.ts`, follow the
typed preset in `runtime/provider-profiles.ts` into `runtime/routing-policy.ts`, update focused
contract tests, run provider canaries, then update canonical harness/skill prose and regenerate
mirrors. Never patch generated mirrors or duplicate model literals in executable code.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-08-06 | Bootstrap | Re-baseline | Fetched `origin/main`; HEAD and baseline match `57c9b5ab3`. |
| 2026-08-06 | Bootstrap | Issue audit | Issue #1331 live scope/acceptance verified; milestone id 23. |
| 2026-08-06 | Plan | Search audit | Found 30 direct 3.7 spellings in 17 tracked files plus active hyphenated preset ids. |
| 2026-08-06 | Plan | Design checkpoint | Locked three test/generation-aware implementation slices; implementation not started. |
| 2026-08-06 | Plan | Reconcile | Owner corrected canonical routing to PLAN→Minimax and IMPL→Qwen 3.8; plan revised before PLAN-EVAL. |
| 2026-08-06 | PLAN-EVAL | Formal gate | Separate OpenRouter Minimax M3 session `815534c7-6c02-4aa5-ab86-a905a0bade6f` returned `PASS`; prompt, raw transcript, and verbatim verdict recorded. |
| 2026-08-06 | S1 | Implement | Split formal lanes and presets, migrated Qwen to 3.8, added typed preset identity, and rejected cross-phase/stale routes. |
| 2026-08-06 | S1 | Gate | Focused config/provider/routing/runner/state set passed 52/52; volatile-value guard passed. |
| 2026-08-06 | S1 | Review | OpenRouter Grok 4.5 found preset shadowing and two missed tests; fixes applied; re-review `PASS` with no remaining findings. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Canonical PLAN defaults to Minimax; canonical IMPL defaults to Qwen 3.8 | Latest owner correction | issue #1331 comment 5204854699 |
| This run uses a separate Minimax M3 PLAN-EVAL and later Qwen 3.8 IMPL-EVAL | Current owner correction and evaluator separation | issue #1331 correction / current user directive |
| Use Codex Sol low generator with full access | Owner directive and observed launch identity | `supervisor.md`; `codex-thread-ids.md` |
| Use Kimi K3 or Grok 4.5 only for ordinary adversarial review | Anthropic subscription temporarily exhausted | owner directive |
| Preserve unrelated lockfile diff | Worktree hygiene | raw Git status/diff |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Run routing differs from stale phase-agnostic lane policy because #1331 introduces phase defaults and Anthropic is unavailable | significant, owner-authorized | yes |
| Owner corrected the canonical defaults after bootstrap to PLAN→Minimax and IMPL→Qwen 3.8 | significant, reconciled before PLAN-EVAL | yes |
| Pre-existing `deno.lock` modification is unrelated | minor | yes |

## Gate Results

### Plan Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Re-baseline | PASS | `origin/main` and HEAD `57c9b5ab3`; issue fetched live | Current as of 2026-08-06. |
| Research | PASS (generator evidence) | `research.md` | Awaits independent PLAN-EVAL. |
| Design checkpoint | PASS (generator evidence) | this `## Design` | Awaits independent PLAN-EVAL. |
| PLAN-EVAL | PASS | `plan-eval.md`, `plan-eval-raw.txt`, session `815534c7-6c02-4aa5-ab86-a905a0bade6f` | Separate OpenRouter `minimax/minimax-m3`; implementation may begin. |

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Raw Git baseline | direct Deno-spawned `git status --short --branch` | PASS_WITH_UNRELATED_DIRTY | Only run dir plus pre-existing `deno.lock`; lock excluded from staging. |
| Implementation tests | See `plan.md` | NOT_RUN | Post-PLAN-EVAL only. |
| S1 focused contract set | five focused test modules, `deno test --no-lock -A` | PASS (52/52) | Includes phase routes, runner guard, routing state, stale/cross-phase rejection, volatile guard. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Package/plugin quality | N/A | No package/plugin code planned | Rescope if that changes. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Exact live Qwen 3.8 canary | NOT_RUN | Planned S2 | Requires explicit live opt-in after implementation. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| Claude skill mirror | NOT_RUN | Planned S3 | Generator-owned. |
| Dogfood consumer bundle | NOT_RUN | Planned S3 | Currently contains no formal evaluator binding. |

## Handoff Notes

- PLAN-EVAL should first spot-check `OPENROUTER_MODEL_IDS.qwen`, the versioned preset id, and the
  formal route guard against the baseline findings.
- Confirm stale-3.7 negative coverage and generated-surface commands are explicit before PASS.
- Do not inspect implementation: none exists. `deno.lock` is unrelated and must remain excluded.
