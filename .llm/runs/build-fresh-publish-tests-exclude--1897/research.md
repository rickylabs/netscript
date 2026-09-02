# Research

## Baseline

- Branch and `origin/main` both resolved to `77ad823dcb1874ccfc8964b4679ad92a3a145e0b` at bootstrap.
- `deno.lock` SHA-256 before the slice: `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`.
- `@netscript/fresh` is doctrine Archetype 4 with a current **Keep** verdict.

## Publish surface

- Pre-change `deno publish --dry-run --allow-dirty` exited 0 and listed 155 files on stderr.
- Exactly 19 listed paths began with `tests/`: 17 fixture files, `tests/form-navigation_browser.ts`, and `tests/runtime-catalog-dependencies.ts`.
- `deno doc` exited 0 across all 17 paths in the package export map.
- A targeted `rg 'tests/'` across those 17 entrypoint modules returned no matches (exit 1).

## Decision

Choose issue option 1: exclude bare `tests/`. Nothing in that directory is a published entrypoint or imported by an export-map entry module; every current entry is test-only material. No negated allowlist is needed.

## JSR surface scan

This is a publish-filter-only change. Metadata and exports remain unchanged; the relevant JSR risk is accidental package contents, directly covered by before/after dry-run enumeration.
