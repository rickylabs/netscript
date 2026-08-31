# Plan

## Scope and doctrine

- Surface: docs/tooling describing `packages/plugin-streams-core` (Archetype 3, Keep).
- Overlay: `SCOPE-docs.md`.
- In-scope doctrine: A1/A14 public-surface documentation accuracy; no package architecture change.
- Debt: no new or deepened architecture debt.

## Locked decisions

1. Rename only `## Entrypoints` to `## Exports`; preserve all table rows and other page content.
2. Add one authoritative mapping with `entrypoints-only`, justified by measured per-entrypoint omissions.
3. Regenerate the three derived corpora in the assigned order.

## Open-decision sweep

None. Symbol coverage was resolved from real `deno doc --json` evidence before implementation.

## Slice

1. Heading + mapping + derived corpus + harness evidence. Proved by the complete assigned gate list. Files: the reference page, drift checker, generated corpora, and this run directory.

## Risks

- Accidental page/table edits: inspect the focused diff.
- False completeness: retain measured `entrypoints-only` evidence.
- Generator drift or lock churn: run checks and compare `deno.lock` to `origin/main`.

## Deferred scope

Package source, symbol-table expansion, and the other #1777 packages.
