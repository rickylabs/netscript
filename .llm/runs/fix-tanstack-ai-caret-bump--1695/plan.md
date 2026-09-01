# Plan: keep the TanStack AI dependency family current and coherent

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-tanstack-ai-caret-bump--1695` |
| Branch | `deps/tanstack-ai-caret-bump` |
| Phase | `plan` |
| Target | `packages/ai` plus root `deno.lock` |
| Archetype | `4 - Public DSL / Builder` |
| Scope overlays | `none` |

## Archetype

Archetype 4 is selected because the current doctrine census explicitly classifies `packages/ai` as
4. Although this slice touches dependency-backed adapters, it does not change the package's public
builder/engine shape or create a second archetype.

## Current Doctrine Verdict

`Keep` — preserve the engine/port/composition split. This slice changes only internal dependency
bindings (and source only if the new upstream API objectively requires an adapter-boundary fix).

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A2 | The published NetScript boundary must stay provider-neutral despite upstream changes. |
| A9 | The package remains in its doctrine-assigned Archetype 4 shape. |
| A11 | Provider technology variation remains named and confined to adapters. |
| A14 | Type-check, tests, dependency evidence, publishability, and doctrine gates prove the move. |

## Goal

Move `@tanstack/ai`, `@tanstack/ai-anthropic`, `@tanstack/ai-mcp`, and
`@tanstack/ai-openai` together to the stable releases reported by `deps:latest`, update the lock
closure without wholesale regeneration, and prove no unhandled breaking change reaches NetScript.

## Scope

- Update exactly the four imports in `packages/ai/deno.json` to caret ranges rooted at the current
  stable versions (`^0.52.0`, `^0.18.3`, `^0.3.8`, `^0.22.3`).
- Update the root `deno.lock` closure produced by normal Deno resolution.
- Adapt existing `packages/ai` TanStack call sites only if required by the new typed/runtime contract.
- Preserve and update all mandatory harness artifacts in this run directory.
- Merge `origin/main` exactly once at final freeze, then rerun the complete gate set.

## Non-Scope

- `packages/plugin-workers-core/deno.json` and `plugins/triggers/deno.json` are owned by sibling leaf
  #1543 and must not be touched.
- `packages/fresh/deno.json`, `@tanstack/ai-preact`, and `packages/fresh-ui/deno.lock` are outside the
  four-package family locked by #1695.
- Existing JSR/doc/cardinality warnings are not remediated here; the change must not deepen them.
- No cache deletion, wholesale lock regeneration, or `deno cache --reload`.

## Hidden Scope

- Peer dependency alignment across all four TanStack packages in the root lock.
- Call-site and model-catalog audit for 0.x breaking minors.
- Verification against the OpenAI Responses mapper already landed on current `origin/main`.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | `deps:latest` output is the sole stable-version authority. | Required by the dependency toolchain and owner. |
| D2 | Move all four package pins in one slice. | A piecemeal 0.x family creates incompatible peer ranges. |
| D3 | Use caret ranges rooted at each reported stable release. | Fixes the frozen-minor problem while retaining same-minor patch drift semantics for 0.x. |
| D4 | Keep upstream types behind the existing adapter/owned-port boundary. | Preserves the doctrine `Keep` verdict and public surface. |
| D5 | Integrate `origin/main` once, only after intermediate gates, then invalidate and rerun evidence. | Owner's final-freeze rule prevents repeated integration churn and stale evidence. |
| D6 | PLAN-EVAL is N/A. | The issue, stable-version authority, scope, acceptance criteria, and gates fully determine a single mechanical dependency slice; API research found no unresolved architecture or trade-off decision. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Source adaptation required? | safe to defer | The plan fixes its boundary and gate; compiler/tests determine whether an in-boundary adaptation is necessary without changing architecture. |
| Move `ai-preact` too? | safe to defer | Explicitly excluded: it belongs to `packages/fresh`, not the four-package family named by #1695. |
| Existing JSR/doc warnings remediation | safe to defer | Baseline debt is unrelated and must not be deepened. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| 0.x minors remove or reshape imported APIs. | Old/new `deno doc`, upstream changelog review, call-site audit, package check/tests, and source adaptation inside adapters if needed. |
| Provider peers resolve against different core minors. | Upgrade all four direct pins together and inspect exact lock version lines. |
| MCP `/stdio` declaration resolution regresses. | Run package check plus MCP-focused tests after the new graph resolves; treat failure as implementation work, not a skipped gate. |
| Current main changes invalidate evidence. | One final merge of current `origin/main`, then rerun every gate at the integrated head. |
| Lock churn overlaps sibling #1543. | Touch no sibling `deno.json`; inspect and record only this leaf's lock delta. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-9 | risk | Avoid new flags/abstractions; adapt the existing four provider/MCP seams only. |
| AP-14 | risk | Do not re-export any new TanStack surface. |
| AP-25 | risk | Keep dependency IO/dynamic import behavior in existing adapter/edge files. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1..F-5, F-7..F-19 | yes | `quality:gate`, scoped wrappers, doc lint, and manual no-surface-diff review; baseline exceptions called out honestly. |
| F-6 | yes | Package publish dry-run and JSR fitness audit; no new warning class. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `packages/ai` existing JSR/doc/cardinality baseline | none | Do not create or deepen debt in this dependency-only leaf; record exact before/after results. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | stable versions | `deno task deps:latest --filter '@tanstack/ai*'` | RC 0; four owned pins match reported stable versions after change. |
| 2 | package check | structured `run-deno-check.ts --root packages/ai --ext ts,tsx` | RC 0 with `--unstable-kv` via wrapper configuration. |
| 3 | package tests | structured `run-deno-test.ts -- --allow-all packages/ai/tests` | RC 0. |
| 4 | lint/fmt | structured scoped lint and fmt wrappers | RC 0. |
| 5 | dependency/JSR | `deps:audit`, JSR audit, doc lint, publish dry-run | No new failure/warning beyond recorded baseline. |
| 6 | doctrine | `deno task quality:gate` | RC 0 or honestly attributed pre-existing baseline. |
| 7 | lock review | `git diff --stat -- deno.lock` plus exact TanStack version lines | Only coherent family/closure movement. |
| 8 | final freeze | merge `origin/main` once; repeat orders 1–7 | Integrated-head evidence is authoritative. |

## Risks

- The final merge may introduce an API consumer added since the base. The final full rerun and
  origin/main call-site audit cover it; no intermediate merge is allowed.

## Dependencies

- npm packages `@tanstack/ai`, `@tanstack/ai-anthropic`, `@tanstack/ai-mcp`, and
  `@tanstack/ai-openai`.

## Drift Watch

- Stable versions changing between research and final freeze.
- A new TanStack call site arriving from `origin/main`.
- Any touched sibling-leaf config or lock movement not attributable to this family.
