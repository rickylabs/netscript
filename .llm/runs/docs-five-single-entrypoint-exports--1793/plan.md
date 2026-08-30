# Plan

## Scope and doctrine

- Profile: `SCOPE-docs`; the pages describe existing package public surfaces.
- Doctrine: A1/A2/A14 and `02-public-surface.md`; published entrypoints and their reference mapping
  must remain explicit and mechanically checked.
- Package archetypes are descriptive context only because no package source or export map changes.
- Current doctrine verdict and debt are unchanged; no new or deepened debt is expected.

## Locked decisions

1. Add exactly one `## Exports` table and root row to each named page without other prose changes.
2. Add only the five named packages to `AUTHORITATIVE_MAPPING`.
3. Use the per-package coverage decisions recorded in `research.md`.
4. Regenerate the three derived corpora in the issue-specified order.

## Open-decision sweep

No open decision remains. All other #1777 packages and all package source changes are deferred and
out of scope.

## Slice

S1 proves the five single-entrypoint pages are checker-visible and their generated corpora are
current. It changes the five pages, the mapping, generated outputs, and this run directory; the
issue-specified docs and generated-corpus gates prove it.

## Risks

| Risk | Mitigation |
| --- | --- |
| Overclaiming complete symbol coverage | Compare each page with `deno doc --json` before selecting its mode. |
| Generator drift | Run the three generators in the exact required order, then all check tasks. |
| Scope creep | Inspect the final diff and reject changes outside the named pages, mapping, generated outputs, and run artifacts. |

## PLAN-EVAL

N/A — this is a mechanical, uniform-shape fix with scope, contract, acceptance, and gates locked by
issue #1793; only the evidence-based per-package coverage classification required research.
