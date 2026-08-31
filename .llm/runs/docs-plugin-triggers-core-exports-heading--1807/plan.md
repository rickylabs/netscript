# Plan

## Profile

- Subject: docs for `packages/plugin-triggers-core`, Archetype 3 (runtime/behavior), doctrine verdict **Keep**.
- Overlay: `SCOPE-docs`.
- In-scope doctrine: A1/A14 and public-surface/doc coverage gates F-5/F-7.
- Known debt: none created or deepened by this docs-only slice.

## Locked decisions

1. Rename only `## Entrypoints` to `## Exports`; preserve all table rows and remaining page content.
2. Add one authoritative mapping with no excluded entrypoints.
3. Use `symbolCoverage.mode: 'entrypoints-only'` because the measured page-wide audit finds 157 deduplicated real symbols absent from the page.
4. Regenerate the docs corpus in the assignment's exact order.

## Open-decision sweep

No decisions remain open. Expanding the symbol tables or adopting the other #1777 packages is explicitly deferred and out of scope.

## Commit slice

1. **Recognize and police the existing export table.** Touch the reference heading, mapping, derived corpus, and run artifacts; prove with the complete assignment gate set.

## Risk register

| Risk | Mitigation |
| --- | --- |
| False `complete` claim | Per-entrypoint `deno doc --json` audit with page-wide deduplication. |
| Generated corpus drift | Run all three generators in the mandated order, then all derived checks. |
| Lock churn | Compare `deno.lock` directly with `origin/main`; do not accept changes. |
| Acceptance mismatch | Fetch issue #1807 live and copy each checkbox text exactly into the PR evidence block. |

## Gates

All commands listed in issue #1807 and the assignment, including docs build/link/accuracy/snippet checks, derived corpus checks, targeted generated-file check, diff/status/lock checks, and provenance ancestry.

## Deferred scope

Package source, symbol-table expansion, and the other #1777 packages.
