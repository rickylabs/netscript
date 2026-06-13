# Plan: 5d2 builders — `definePage` DSL decomposition

## Run Metadata

| Field          | Value                                                |
| -------------- | ---------------------------------------------------- |
| Run ID         | `feat-package-quality-wave5-apps--5d2-builders`      |
| Branch         | `feat/package-quality-wave5-apps-5d2-builders`       |
| PR             | #35                                                  |
| Phase          | `plan`                                               |
| Target         | `packages/fresh/builders`                            |
| Archetype      | A3 Runtime/Behavior + A4 DSL/Builder + SCOPE-frontend |
| Scope overlays | frontend                                             |

## Archetype

Primary **Archetype 3 — Runtime/Behavior** with **SCOPE-frontend** overlay.  
`definePage` itself is a public DSL/Builder, so A4 design vocabulary applies for builder state, factory, validation, and type catalog splits.  
Browser validation is required because the DSL drives Fresh route output.

## Current Doctrine Verdict

TODO: read `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`

## Axioms in Play

TODO: read doctrine axioms and map A1, A2, A3, A6, A8, A9, A10, A11, A14

## Goal

Decompose the over-cap `./builders` cluster into a layered folder shape that honors the umbrella architecture, preserves every public export specifier/type name, and clears doc-lint private-type-ref + file-size debt — without any behavior change.

## Scope

- `packages/fresh/builders/` folder restructuring under 20K source caps.
- Public surface unchanged (same exports from `builders/mod.ts`).
- Move builder/runtime/navigation/search-params internal helpers to `_internal/` or role-named subfolders.
- Split `define-page.test.tsx` along the same seams.
- Clear doc-lint errors from `builders/mod.ts` combined export.
- Update `deno.json` tasks if required for new paths.
- Add/update browser-validation fixture route(s) in `apps/playground` (or a dedicated fixture) to exercise SSR, navigation, pending states, error boundaries.

## Non-Scope

- No new DSL features (`definePage` signature stays identical).
- No new public subpaths (umbrella allows only `./testing` as growth).
- No RFC 14 unified-mode implementation (only protection seams).
- No streaming primitive changes (streaming lives in `packages/fresh/server/stream.ts`; 5d4 owns it).
- No query/island-bridge implementation (5d6 owns it).
- No form-field/validation changes (5d5 owns them; leak fixes are limited to doc-lint surface).

## Hidden Scope

- Internal import re-targeting after moves.
- Test file imports and test-name prefixes must follow the new file paths.
- `deno publish --dry-run` must remain clean after re-exports move.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| L-1 | Keep public surface identical | Umbrella plan F-16/F-18 and handover require zero export/type-name change. |
| L-2 | Use role-named subfolders inside `define-page/` | A4 minimum folder shape: builder / runtime / navigation / types / internal. |
| L-3 | Split by cohesion, not byte target alone | Each new file owns one concern; avoids folder bloat and satisfies F-16. |
| L-4 | Test decomposition mirrors source seams | Easier gate-per-slice and keeps test files under cap. |
| L-5 | Browser validation uses `apps/playground` fixture routes | Handover A4-Browser obligation; existing playground is the canonical target. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| One plan or two plans | must resolve now | Umbrella permits two if ≥30 slices; re-measure after design lock. |
| Whether `types.ts` can be split into `types/*.ts` | safe to defer | Must not change public type names; internal grouping only. |
| Exact fixture route set | safe to defer | Chosen during implementation; design names the categories. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Private-type-refs propagate through re-export moves | jsr-audit gate at each slice; fix by re-exporting referenced types publicly. |
| Navigation hook tests depend on preact context | Keep `navigation/context.ts` public but thin; tests import same barrel. |
| Runtime response assembly tightly coupled with builder | Split by extracting `runtime/render.tsx` and `runtime/handlers.ts` behind stable types. |
| Fixture browser tests flaky in CI | Use Playwright if present; otherwise record manual verification gate. |
| Merge conflicts with 5d1 support branch | Plan states 5d1 dependencies explicitly; implementation waits for 5d1 merge. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-1 builder barrel monolith | existing | Split into `builder/*.ts`. |
| AP-7 long positional args | existing risk | Preserve current options shape; no new positional APIs. |
| AP-9 premature typestate | risk | Do not add typestate; keep current generic-only builder. |
| AP-11 hidden globals | risk | Runtime context remains explicit argument. |
| AP-14 re-export upstream DSL | existing | `zod` schemas are exported from `search-params.ts`; keep, do not expand. |
| AP-15 impl-role names | existing risk | New files use caller vocabulary (`render`, `handlers`, `link`). |

## Fitness Gates

TODO: map matrix selections

## Arch-Debt Implications

TODO: read `debt/arch-debt.md`

## Validation Plan

TODO: enumerate gates and commands

## Dependencies

- 5d1 support branch (PR #34): error taxonomy, telemetry convention, `./testing` entrypoint, docs scaffold are binding.
- `packages/fresh/server/stream.ts`: streaming primitives consumed as-is.
- `packages/fresh/defer/DeferPage.tsx`: imported by builder; no change.
- `packages/fresh/form/types.ts`: private-type-ref leak from form must be fixed in 5d5 or with umbrella drift.

## Drift Watch

- Any public export change.
- Any new dependency added to `builders/`.
- Any file that remains >20K after decomposition.
- Form-package private-type-ref leak discovered to require a form change.

---

## Review map · Assumptions · Questions for supervisor · Dependencies & merge impact · Side-effect ledger

TODO: required final section
