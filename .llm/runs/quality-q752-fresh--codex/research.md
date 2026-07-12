# Research — quality-q752-fresh--codex

## Re-baseline

- Carried-in source: rejected dangling commit `cb538f4008c5f3a6af6f309db5408aef9f535f6e`.
- Re-derived against `3b3d615bb535d985e49a4d2dcdcce5e03097babc` on 2026-07-12 after the
  owner-mandated hard reset.
- The rejected commit placed one `quality-allow` on each of the 25 original unsafe casts. The clean
  base instead reports 25 findings and zero allowances, so the implementation must change types and
  runtime narrowing rather than annotate the casts.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | Baseline is exactly 25 findings / 0 allowances across eight finding-bearing Fresh files; `query-types.ts` is a ninth supporting type file likely to change. | `deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/fresh` |
| 2 | The rejected pass used exactly 25 allowances. | `git grep -n 'quality-allow:' cb538f4 -- packages/fresh` |
| 3 | Findings cluster into route/builder façades (12), form/Zod narrowing (4), TanStack Query wrappers (5), and StreamDB adaptation (2), with two additional route-promotion casts. | scanner JSON and the nine named source files |
| 4 | Several façades duplicate already-generic implementations: `definePartialImpl`, route contract runtime factories, and route promotion helpers can carry the public generics directly. | `packages/fresh/src/application/{builders,route}/**` |
| 5 | Query wrappers currently maintain reduced package-owned option/result interfaces and erase the upstream overloads with `never`; the real fix must derive compatible upstream generics or structurally adapt results without claiming identity. | `packages/fresh/src/application/query/{hooks,query-types}.ts` |
| 6 | Zod internals are read as a made-up aggregate `_def` type. Public class narrowing plus property guards can replace the double casts; no private-layout assertion is pre-approved. | `packages/fresh/src/application/form/schema-adapter/zod-internals.ts` |
| 7 | All 14 export entrypoints are currently doc-lint clean and publish dry-run reports no slow-type failure. | `deno task doc:lint --root packages/fresh --pretty`; package-local `deno publish --dry-run --allow-dirty` |
| 8 | `deno.lock` baseline SHA-256 is `da85900f95ea01eaa44a8bfc6f3f3aabdf7ce65806d16225fd6a2cb1901ec1f5`. | `sha256sum deno.lock` |

## jsr-audit surface scan

- Surface scanned: all 14 exports in `packages/fresh/deno.json`, with `deno doc packages/fresh/mod.ts`,
  structured doc-lint, and package-local publish dry-run.
- Current state: metadata, exports, module docs, and slow-type check are green.
- Risks: public wrapper return annotations must remain explicit; exposing upstream private/internal
  types would create `private-type-ref`; generic factory changes must preserve the published
  signatures and all subpath imports.

## Open questions

- None that require deferral. If an upstream invariant type proves irreducible, the implementation
  must first document the exact conflicting members and attempted generic signature, then seek the
  lowest possible allowance count; the plan assumes zero allowances.
