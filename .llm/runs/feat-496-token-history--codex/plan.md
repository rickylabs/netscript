# Plan: token-budget history strategy

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-496-token-history--codex` |
| Branch | `feat/496-token-budget-history` |
| Phase | `plan` |
| Target | `packages/ai` |
| Archetype | `4 - Public DSL / Builder` |
| Scope overlays | `none` |

## Archetype

Archetype 4 is the package-level profile: this additive factory extends the public agent
configuration DSL through an existing strategy seam. No runtime or external adapter is introduced.

## Current Doctrine Verdict

`@netscript/ai` is not separately listed in doctrine file 10's historical verdict table. New code
is bound immediately by the public-surface, helper, and fitness rules; no restructuring is in scope.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1/A2 | Define a small explicit options/estimator contract at the published boundary. |
| A6 | Keep estimation inline and justified by the actual strategy seam. |
| A11 | Name the estimator extension axis directly. |
| A14 | Lock budget semantics with focused tests and package gates. |

## Goal

Export `tokenBudgetHistory({ budget, estimator? })` from `@netscript/ai/agent`, preserving leading
system messages and selecting the newest remaining messages that fit the estimated token budget.

## Scope

- Public estimator/options contracts, default chars/4 estimator, strategy implementation, export.
- Focused unit tests for budget, system preservation, recency, customization, and tiny budgets.
- JSDoc example and package-quality evidence.

## Non-Scope

- Real tokenizer dependency, turn-pair grouping, provider-specific accounting, or changing the
  default agent-loop strategy.
- Export-map changes, README rewrite, PR creation, or unrelated package refactors.

## Hidden Scope

- Multimodal content needs deterministic character accounting for the default estimator.
- Preserved system messages consume budget when they fit; if system framing alone exceeds budget,
  preservation wins and no non-system messages are retained.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | `TokenEstimator` receives a full readonly `Message`. | Real tokenizers may account for role/metadata, not only content. |
| D2 | Default estimate is `ceil(contentCharacterCount / 4)`. | Avoid undercounting partial tokens while implementing chars/4. |
| D3 | Scan non-system history newest-to-oldest and stop at the first message that does not fit. | Produces a contiguous newest suffix and preserves conversational order. |
| D4 | Leading system messages are always retained; their estimates reduce remaining budget. | Direct acceptance contract; preservation is stronger than tiny-budget enforcement. |
| D5 | Require a finite non-negative budget and normalize estimator results to finite non-negative integers. | Prevent invalid arithmetic while permitting zero-cost custom estimates. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Tokenizer dependency | safe to defer | Explicit estimator seam is this issue's extension point. |
| Turn-pair atomicity | safe to defer | Acceptance asks for newest messages/turns, not paired grouping. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Preserved systems can exceed budget | Document and test the preservation-first tiny-budget rule. |
| Estimator returns fractional/invalid values | Normalize finite positive values with `ceil`; treat non-positive/non-finite as zero. |
| Public surface loses JSR score | Explicit return/types, JSDoc, example, doc-lint, dry-run. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1/AP-16 | risk | Keep the cohesive strategy in existing `history.ts`; create no generic helper/barrel. |
| AP-14 | risk | Export only package-owned contracts, no upstream tokenizer type. |
| AP-19/AP-20 | risk | Explicit return type and public symbol documentation. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1..F-5, F-8..F-19 | yes | Scoped wrappers plus `arch:check`/manual review as applicable. |
| F-6/F-7 | yes | JSR audit, full export doc-lint, package publish dry-run. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none | Additive cohesive strategy introduces no known doctrine debt. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Unit | `deno test --allow-all packages/ai/tests/agent_loop_test.ts` | All focused cases pass. |
| 2 | Check/lint/fmt | Scoped `.llm/tools/run-deno-*.ts --root packages/ai --ext ts,tsx` | Clean. |
| 3 | Docs | `deno task doc:lint --root packages/ai --pretty` | Full export map clean. |
| 4 | Publish | `deno task publish:dry-run` from `packages/ai` | Green, no slow-type regression. |
| 5 | Fitness | `deno task arch:check` | No new violation. |

## Dependencies

- Existing `Message` and `HistoryStrategy` contracts only; no dependency changes.

## Drift Watch

- Any need to change the package export map, Message contract, or default loop strategy.
