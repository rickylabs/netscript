# Research — fix-773-beta10-stabilization--render-ui-recursion

## Re-baseline

- Carried-in source: GitHub issue #773, read in full through the GitHub API on 2026-07-16.
- Re-derived against `feat/beta10-integration` @ `0daa575ba50b1c6b98181b7e1e24d79b7b5a1248`.
- What changed vs the carried-in version:
  - No scope change. The issue's source/embed mismatch is present at the stated baseline.
  - The repository already has a regeneration/diff task named `check:assets-barrel`, but CI does
    not invoke it.
  - A source-level nested-array behavior test already exists and passes against the correct source;
    the missing regression is at the generated copy-source layer.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `renderNode` in source increments array recursion with `depth + 1`. | `packages/fresh-ui/src/ai/render-ui.tsx` array branch |
| 2 | The shipped registry embed calls nested arrays with unchanged `depth`, so `maxDepth` cannot trip for array-only nesting. | `packages/fresh-ui/registry.generated.ts`, embedded `src/ai/render-ui.tsx` |
| 3 | Source already has a 50-level nested-array behavior test, which proves source behavior but not copied registry behavior. | `packages/fresh-ui/tests/ai/render-ui.test.tsx` |
| 4 | `deno task check:assets-barrel` regenerates all embedded barrels and fails on a tracked diff. | root `deno.json`; `.llm/tools/generate-cli-assets-barrel.ts` |
| 5 | Core CI runs check/test and quality lanes but never runs `check:assets-barrel`. | `.github/workflows/ci.yml` |
| 6 | The root cause is generated-artifact drift: #565 corrected the owning source, but no CI freshness gate protected the committed copy-source embed. | issue #773 plus findings 1–5 |
| 7 | `@netscript/fresh-ui` is Doctrine Archetype 4 with current verdict `Keep`; no relevant architecture-debt entry exists. | doctrine files 06 and 10; debt registry search |
| 8 | The frontend overlay references `.claude/05-frontend.md`, which is absent in this checkout. | focused filesystem search |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/fresh-ui/deno.json` exports and `deno doc packages/fresh-ui/mod.ts`.
- Planned public API change: none. The copy-source registry content changes, but no export name,
  signature, dependency, or package metadata changes.
- Slow-type / surface risks: no new risk introduced by this slice. Existing package documentation
  and publishability remain validation concerns and will be checked without widening scope.

## Open questions

- None. The owning generator, failing artifact, regression seam, and CI insertion point are all
  identified.

