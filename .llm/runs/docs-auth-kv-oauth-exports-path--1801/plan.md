# Plan

## Scope and doctrine

- Surface: docs reference plus its export-drift mapping and derived docs corpus.
- Overlay: `SCOPE-docs.md`; no package archetype because package source/public API is unchanged.
- Doctrine: A1/A14 and public-surface F-5 apply because the page maps published entrypoints.
- Current verdict/debt: no new or deepened architecture debt; this slice corrects documentation drift.

## Locked decisions

1. Preserve the eight export names and existing Purpose meanings; add the real path as the second column.
2. Remove only the providers Purpose cell's nested code span so every row matches the same parser shape.
3. Use `entrypoints-only`, naming all 56 measured symbol gaps in the reason.
4. Regenerate the docs corpus in the user-specified order.

## Open-decision sweep

None. Broader symbol documentation and the other #1777 packages are explicitly deferred and safe to defer.

## Slice

1. Correct the table and adopt the package into the drift mapping; regenerate artifacts; prove with every assignment gate. Files: page, checker mapping, generated corpus, and run artifacts.

## Risks

- Parser incompatibility: run `docs:exports-drift` and verify all eight rows have the same shape.
- False symbol completeness: retain the measured 56-symbol gap list in the mapping reason.
- Generator/lock drift: run generators in order and compare `deno.lock` with `origin/main`.

## Deferred scope

Package source, broader page restructuring/symbol coverage, and the other six #1777 packages.

## PLAN-EVAL

N/A — this is a mechanical single-page table/mapping fix; the only judgment call is resolved by evidence from all eight `deno doc --json` entrypoints.

