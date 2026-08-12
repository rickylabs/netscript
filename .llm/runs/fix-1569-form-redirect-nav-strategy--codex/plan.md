# Plan: managed form redirect navigation strategy

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1569-form-redirect-nav-strategy--codex` |
| Branch | `fix/1569-form-redirect-nav-strategy` |
| Phase | `plan` |
| Target | `packages/fresh` published `./form` surface |
| Archetype | `4 - Public DSL / Builder` |
| Scope overlays | `frontend` |

## Archetype

Archetype 4 is authoritative for `packages/fresh`. This slice changes the caller-facing managed form
DSL without adding runtime ownership, adapters, or a new extension axis.

## Current Doctrine Verdict

`packages/fresh`: **Keep** — preserve per-concern builders and route contracts. The form component
and enhancement seam remain inside the existing `application/form` concern.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The public strategy union/object is defined before its renderer mapping. |
| A2 | Callers choose document/client semantics without knowing Fresh attribute syntax. |
| A3 | The common default remains a zero-configuration `<Form state={state}>`. |
| A11 | The named variability is navigation mode, with exactly two current variants. |
| A14 | SSR, state, and real-browser tests preserve the contract. |

## Goal

Expose a documented typed managed-form navigation strategy that reliably opts a redirecting form
out of inherited Fresh client navigation, while leaving default/error-state client behavior intact.

## Scope

- Add the public `FormNavigationMode` / `FormNavigationStrategy` contract.
- Resolve the contract through the existing form enhancement concern to Fresh transport attrs.
- Accept the strategy on managed `Form` and progressive enhancement options.
- Document client versus document use.
- Add SSR/behavior tests and a real-browser redirect fixture under an ancestor opt-in.

## Non-Scope

- No changes under `application/builders/**`, `application/route/**`, `runtime/ai/**`,
  `src/internal/**`, or `application/defer/**`.
- No Fresh dependency upgrade, cache suppression, generated scaffold change, CLI E2E, evaluator,
  ready-for-review transition, merge, or release action.

## Hidden Scope

- Prove plain Preact and actual Fresh SSR behavior separately; they are intentionally different.
- Preserve legacy `clientNav?: boolean` enhancement input for compatibility while preferring the
  typed strategy.
- Test invalid POST state separately so the fix cannot become a global document-navigation default.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Public shape is `{ navigation: 'client' | 'document' }`. | It names caller intent and leaves room for other form strategy fields without exposing transport attributes. |
| D2 | No strategy means no root attribute override. | Preserves current inheritance/default behavior exactly. |
| D3 | `document` resolves to literal `'false'`; `client` resolves to boolean `true`. | Literal false is reliable in plain Preact and exactly matches the Fresh client lookup. |
| D4 | Progressive enhancement accepts the same strategy; legacy `clientNav` remains compatible. | One strategy vocabulary across `Form` and its enhancement seam, without a breaking removal. |
| D5 | PLAN-EVAL is N/A and final evaluation is orchestrator-owned. | Owner explicitly prohibits local evaluation; scope and acceptance are already fully specified. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Strategy naming | resolved now | `navigation` with `client`/`document`. |
| Raw attribute type | resolved now | Internal mapping may carry literal `'false'`; caller uses strategy. |
| Default | resolved now | Omit override. |
| Browser runner | resolved now | Dedicated Deno browser test invokes the available Playwright CLI against a real Fresh fixture. |
| Future redirect-response protocol | safe to defer | No upstream/custom response header is introduced in this bounded fix. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Static opt-out also affects invalid submits on a form that explicitly chooses `document`. | Keep default inherited client navigation and prove invalid POST state in the default strategy; document that `document` selects native navigation for that form. |
| Caller raw props override the strategy. | Apply the resolved strategy after forwarded props when explicitly present. |
| Browser test silently becomes a unit test. | Use real Fresh server runtime + Chromium/Playwright CLI and capture page/runtime errors. |
| Published surface acquires slow or undocumented types. | Explicit annotations, JSDoc, doc-lint, publish dry-run, and targeted JSR audit. |
| Lock churn from gates. | Compare `deno.lock` to baseline after every dependency-sensitive gate; stop if it moves. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-2 | risk | Keep the mapping as framework policy, not a generic DOM helper. |
| AP-9 | risk | Two-value closed union only; no speculative registry/typestate. |
| AP-15 | risk | Caller vocabulary is navigation semantics, not Fresh implementation naming. |
| AP-25 | risk | Browser effects stay in tests/fixture edges. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1..F-19 (Arch 4 applicable set) | yes | `quality:gate` plus explicit `quality:scan --root packages/fresh/src`; manual diff review for uncovered rules. |
| F-5/F-7 | yes | `deno task doc:lint --root packages/fresh --pretty` and publish dry-run. |
| Browser validation | yes | named real-browser Deno test using Playwright CLI. |
| Consumer contract | yes | package check and form SSR tests. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Existing `packages/fresh` entries | none | This slice does not deepen or close them. |
| New debt | none expected | Any uncovered browser limitation is reported rather than hidden. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Red SSR tests | focused `deno test` through package task/filter | New strategy tests fail before implementation. |
| 2 | Red browser test | explicit browser test task | Document strategy test fails before implementation. |
| 3 | Package static | requested scoped check/lint/fmt wrappers | PASS. |
| 4 | Package tests | `deno task --cwd packages/fresh test` | PASS. |
| 5 | Browser | dedicated browser task | PASS with no page/runtime errors. |
| 6 | Quality | `deno task quality:gate` and explicit target scan | PASS or baseline attribution. |
| 7 | JSR | doc-lint + package publish dry-run | PASS, no new slow types. |

## Dependencies

- Existing Fresh 2.3.3, Preact 10.29.2, and environment-provided Playwright CLI. No package
  dependency is planned.

## Drift Watch

- Fresh SSR serialization differing from the pinned 2.3.3 source.
- Browser fixture demonstrating the redirect fallback without the new strategy.
- `deno.lock` movement, unavailable Chromium, or boundary-file pressure.

