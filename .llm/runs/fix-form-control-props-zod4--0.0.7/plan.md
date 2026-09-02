# Plan: #1249 form control props and Zod 4 constraints

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-form-control-props-zod4--0.0.7` |
| Branch | `fix/form-control-props-zod4` |
| Phase | `plan` |
| Target | `packages/fresh/src/application/form` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` (type/consumer contract only; no visual workflow change) |

## Archetype

`@netscript/fresh` is explicitly Archetype 4 in doctrine. This slice changes the form DSL's public descriptor prop contract and schema-derived metadata without changing runtime ownership, routes, or presentation.

## Current Doctrine Verdict

`Keep` — preserve per-concern builders and route contracts. Historical Fresh builder and doc-lint debt is resolved; unrelated open docs/example and compatibility debt is not touched.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The public `ControlProps` contract is corrected before its implementation assumptions. |
| A2 | The canonical `controlProps()` spread must work without a consumer cast or narrowing helper. |
| A6 | Zod check inspection stays in the existing focused adapter; no new helper layer is invented. |
| A8 | Type, adapter, and regression tests remain in their existing concerns. |
| A14 | RED probes, package gates, doc lint, and consumer type checking preserve the contract. |

## Goal

Make `controlProps()` directly assignable to Preact input/select/textarea elements and derive the issue's regex and inclusive numeric constraints from locked Zod 4.4.3.

## Scope

- Narrow `ControlProps.role` to Preact's JSX-compatible HTML role property type.
- Add a TSX consumer regression covering input, select, and textarea spreads.
- Teach the existing Zod adapter the Zod 4 numeric and regex check shapes.
- Add the five-field full-map regression from issue #1249.
- Preserve the public export map and pass full Fresh doc lint.

## Non-Scope

- `packages/fresh-ui`, CLI/scaffold, catalogs, dependencies, `deno.json`, `deno.lock`, `.github`, and docs-site prose.
- Broad form API redesign, native validation policy, browser UX, or dependency convergence.

## Hidden Scope

- Each defect receives an independent failing probe before its fix.
- S2 admission is conditional on the exact locked family reproducing.
- Full package check/test/lint/fmt plus `quality:gate`, JSR audit, doc lint, and base lock comparison are required before handoff.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Mirror Preact 10.29.2's exported `AriaRole` literals directly on `ControlProps.role`. | The preferred `JSX.HTMLAttributes<HTMLElement>['role']` and imported `AriaRole` both pass consumer checking but fail `deno doc --lint` as private dependency types; the exact inline union preserves assignability without widening, a new public alias, or an upstream re-export. |
| D2 | Map `greater_than`/`less_than` only when `inclusive === true`. | HTML `min`/`max` are inclusive; exclusive constraints have no faithful native attribute and must not receive invented off-by-one values. |
| D3 | Map `multiple_of.value` to `step`. | This is the direct native control constraint represented by the Zod check. |
| D4 | For `string_format` + `format: 'regex'`, read `_zod.def.pattern` and use `RegExp.source`. | This matches the locked Zod 4 representation while retaining legacy regex handling. |
| D5 | Preserve every existing check kind. | The change is additive compatibility, not a migration that drops older supported shapes. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Remove Fresh UI narrowing helpers | Safe to defer | Explicitly outside the ceiling; record as drift/follow-up. |
| Simplify docs-site form prose | Safe to defer | Docs-lane follow-up outside the ceiling. |
| Represent exclusive bounds in HTML | Safe to defer | No faithful native mapping; server validation remains authoritative. |
| Admit S2 | Must resolve now | The S2 RED probe decides. Passing unexpectedly defers the half to 0.0.8. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A Preact-derived public type causes doc/private-type diagnostics. | Run full-export `deno task doc:lint --root packages/fresh --pretty`. |
| Zod internal shapes drift. | Keep legacy branches; add exact locked-family full-map regression. |
| Exclusive bounds are misrepresented. | Omit them from native min/max and document the decision. |
| Test succeeds under the wrong compiler settings. | Place `_test.tsx` inside the package and run the scoped package check wrapper using its config. |
| Validation mutates the lock. | Compare SHA-256 and `git diff 8c549c061 -- deno.lock` before every push/handoff. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-2 | Risk | Extend the existing adapter directly; no wrapper/helper rename. |
| AP-9 | Risk | Add only locked Zod representations proven by RED. |
| AP-14 | Avoid | Import Preact/Zod types internally; do not re-export upstream packages. |
| AP-22 | Avoid | No new barrels. |
| AP-25 | Avoid | Tests and adapter remain side-effect free outside Deno test registration. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1/F-3/F-8/F-10/F-11/F-12/F-14/F-15/F-16/F-17/F-18/F-19 | Yes | `deno task quality:gate` plus scoped wrappers/manual diff review. |
| F-5/F-7 | Yes | `deno doc --filter ControlProps` and full-export `doc:lint`. |
| F-6 | Yes | JSR package audit; no export/config/publish-file change, package audit clean. |
| Consumer contract | Yes | S1 TSX input/select/textarea compile probe. |
| Browser/runtime | N/A | No route, rendered state, or browser workflow changes; semantic adapter behavior is unit-tested. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Fresh historical restructure/doc-lint debt | None | Already resolved; this slice must not reopen it. |
| New debt | None expected | Any new/deepened violation becomes `FAIL_DEBT`. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | S1 RED | Scoped check of the new TSX consumer test | TS2322 on `role`. |
| 2 | S1 GREEN | Scoped Fresh check/test | Exit 0; all three intrinsic spreads compile. |
| 3 | S2 RED | Focused schema-adapter test | Nonzero with missing slug pattern and numeric min/max/step. |
| 4 | S2 GREEN | Focused then scoped Fresh tests | Exit 0; exact full map. |
| 5 | Static | Scoped check/test/lint/fmt wrappers | Exit 0. |
| 6 | Fitness | `deno task quality:gate` | Exit 0. |
| 7 | Public/JSR | full Fresh doc lint and JSR audit | Exit 0, unchanged/improved. |
| 8 | Lock | base/current hash and diff | Byte-identical. |

## Dependencies

- Existing npm Preact `^10.29.2` and catalog npm Zod `^4.4.3`; no dependency mutation.

## Drift Watch

- S2 admission outcome, exact RED output, exclusive-bound omission, Fresh UI narrowing-helper follow-up, docs-site follow-up, any baseline/lock or public-doc diagnostic change.
