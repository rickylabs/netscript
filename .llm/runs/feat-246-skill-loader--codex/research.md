# Research — SkillLoaderPort (#246)

## Re-baseline

- Carried-in source: issue #246 and the slice brief.
- Re-derived against baseline `955b4abf639522c7da50bd15d20c6e999acb808f` on 2026-07-11.
- The issue's older `packages/ai-core` / `packages/plugin-ai-core` wording maps to `packages/ai`:
  root `deno.json` includes `packages/*`, and `packages/ai/deno.json` declares `@netscript/ai` with
  the existing ports, embedding seam, and provider subpaths.

## Findings

| # | Finding                                                                                                                                      | How to verify                                                                          |
| - | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1 | `@netscript/ai` is an established package at `packages/ai`.                                                                                  | `deno doc packages/ai/mod.ts`; `packages/ai/deno.json`                                 |
| 2 | E1 already added a provisional `SkillLoaderPort` with only `loadSkills/getSkill`; #246 owns replacing it with list/load/tag/query semantics. | `packages/ai/src/ports/skill-loader.ts`                                                |
| 3 | `EmbeddingProviderPort.embed` accepts a string or batch and returns ordered vectors.                                                         | `deno doc --filter EmbeddingProviderPort packages/ai/mod.ts`; `src/ports/embedding.ts` |
| 4 | The package supports curated subpath entries; `./skills` maps directly to `src/skills/mod.ts` to preserve root cardinality.                  | `packages/ai/deno.json`, `packages/ai/src/`                                            |
| 5 | Core must stay effect-free. The content source is the I/O boundary, and the shipped adapter stores caller-provided strings only.             | Issue #246 Ships/Out of scope; AP-11/AP-25                                             |

## jsr-audit surface scan

- Planned surface: new `./skills` export mapped to `src/skills/mod.ts`, with fewer than 20
  documented exports and explicit return types.
- Risks: every exported symbol needs JSDoc; the entrypoint needs `@module`; all factory/function
  return types must be explicit for `isolatedDeclarations`; internal package imports must be
  relative; publish dry-run must not use `--allow-slow-types`.
- The new subpath adds no dependency and no filesystem/network permission.

## Open questions

- None that force rework. Matching score weights and tie-breaking are locked in `plan.md`.
