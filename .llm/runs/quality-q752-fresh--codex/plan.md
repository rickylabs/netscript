# Plan: properly type code-quality boundaries in `packages/fresh`

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `quality-q752-fresh--codex` |
| Branch | `quality/q752-fresh-h` |
| Phase | `plan` |
| Target | `packages/fresh` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Archetype

Archetype 4 is authoritative because the doctrine inventory classifies `@netscript/fresh` by its
public builder/definition DSL. The frontend overlay applies because findings include Preact link,
form, island-query, and Fresh route contracts. This slice does not restructure the package.

## Current Doctrine Verdict

`Restructure`: the long-term headline is splitting builder concerns and subpath exports. Existing
debt entries track that broader work; this slice must not deepen it and is limited to type erasure.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A1 | Public route, builder, form, query, and stream types drive implementation signatures. |
| A2 | Callers keep the existing simple façade without hidden unsound casts. |
| A9 | The existing DSL shape is preserved; no speculative adapter hierarchy is added. |
| A14 | Scanner, scoped wrappers, tests, docs, and publish dry-run prove the typing. |

## Goal

Reach zero scanner findings and at most six allowances—target zero—by expressing real generic
relationships, input/output variance, and runtime narrowing while preserving Fresh behavior and the
published API.

## Scope

- Type route/builder promotion and compatibility façades through their implementation generics.
- Replace Preact link-prop erasure with an explicitly constructed typed prop object.
- Type form error-map writes and narrow Zod internals without double assertions.
- Align TanStack Query options/results with upstream generic types or explicit structural adapters.
- Align the StreamDB factory input/output generic with upstream generated types.
- Add or adjust focused tests/types where needed to prove inference and runtime behavior.
- Maintain the run artifacts, commit, and force-push the branch.

## Non-Scope

- No package restructure, dependency/version change, export rename, visual redesign, or release cut.
- No PR or GitHub issue mutation, per owner directive.
- No `deno.lock` changes, cache reloads, lint suppressions, or generic `quality-allow` reasons.

## Hidden Scope

- Source types adjacent to the nine scanner files may need changes so the implementations return the
  correct generic type instead of relying on a façade cast.
- Type-level regression tests may be necessary even when runtime output is unchanged.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | Push generics into implementation/factory signatures; do not post-cast façade results. | The factory is where the relationship is created. |
| D2 | Model schema input and output independently with `z.input`/`z.output` or equivalent schema-associated types. | Defaults/transforms make Zod input/output variance real. |
| D3 | Build Preact props explicitly and use typed handlers/signals/refs. | Object construction preserves required/omitted keys without an assertion. |
| D4 | Narrow `unknown`/private runtime data with property and class guards. | Runtime evidence must justify member access. |
| D5 | Derive TanStack and StreamDB boundaries from upstream public types where possible; otherwise adapt fields explicitly. | Package-owned façades must be structurally honest. |
| D6 | Assume zero allowances. A survivor requires a concrete failed typing attempt and member-level upstream incompatibility. | Six is a ceiling, not the target. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Exact helper/type names | safe to defer | Local naming does not force API rework. |
| Whether any allowance survives | must resolve now | Resolved: none is pre-approved; implementation must prove necessity and target zero. |
| Browser run | safe to defer | No rendered behavior or styling changes; focused route/form/query tests and consumer type checks are the frontend contract evidence. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Generic tightening changes inference | Add type-level/public consumer cases and run the full package tests. |
| Upstream types are invariant | Inspect public signatures with `deno doc`; preserve separate input/output/page/context generics; adapt results field-by-field if needed. |
| Zod private layouts vary | Prefer class methods/public definitions and `in`/array guards; do not assert an aggregate internal shape. |
| Runtime wrappers silently change | Keep behavior-focused package tests green and add narrow regressions for changed helpers. |
| Slow types/private type refs appear | Re-run full-export doc-lint and package-local publish dry-run. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-9 | risk | Avoid speculative generic wrappers; add only relationships exercised by current boundaries. |
| AP-14 | risk | Do not re-export upstream Zod/TanStack types as the package API. |
| AP-15 | risk | Keep caller vocabulary and existing public names. |
| AP-20 | risk | Preserve explicit package-owned public surface and examples. |
| AP-25 | risk | Do not add effects while changing pure definition/narrowing code. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-1–F-5, F-8–F-19 | yes | `deno task arch:check` plus scoped wrapper/manual review evidence |
| F-6 | yes | package-local `deno publish --dry-run --allow-dirty` |
| F-7 | yes | `deno task doc:lint --root packages/fresh --pretty` |
| Code quality | yes | scanner `--max-allow 6` returns `ok:true`; target allowCount 0 |
| Frontend contract | yes | package tests and type checks for route/form/query consumers |
| Browser visual gate | N/A | no view, styling, or browser workflow behavior changes |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| Doctrine `packages/fresh` Restructure verdict | none | The former AP-1 builder split debt is resolved; the broader doctrine verdict is not deepened or closed. |
| Any new type allowance | none planned | A survivor would require an explicit worklog justification, not silent debt. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | code quality | scanner with `--root packages/fresh --max-allow 6` | `ok:true`, allowCount as low as possible |
| 2 | check | scoped check wrapper, root `packages/fresh`, `--ext ts,tsx` | exit 0 |
| 3 | lint | scoped lint wrapper, same root/extensions | exit 0; no new ignore |
| 4 | format | scoped fmt wrapper, same root/extensions | exit 0 |
| 5 | tests | package-local `deno task test` | exit 0 |
| 6 | docs | root `deno task doc:lint --root packages/fresh --pretty` | 0 diagnostics |
| 7 | publish | package-local `deno publish --dry-run --allow-dirty` | green, no slow types |
| 8 | doctrine | root `deno task arch:check` | exit 0 or attributable baseline debt recorded |
| 9 | lock | compare `sha256sum deno.lock` to baseline | unchanged |

## Dependencies

- Fresh 2.3, Preact 10, Zod 4.4, TanStack Query/DB, and durable-streams public types already in the
  workspace graph; no dependency edits are authorized.

## Drift Watch

- Any public signature change, dependency/lock change, nonzero allowance, or need for visual/runtime
  browser verification is significant and must be logged before continuing.
