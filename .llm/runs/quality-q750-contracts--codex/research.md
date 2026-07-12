# Research — quality-q750-contracts--codex

## Re-baseline

- Carried-in source: rejected unreachable commit
  `11a2e3fe85beb7125c5916627657b778f4f4211a` from the prior Sol-low pass.
- Re-derived against baseline `3b3d615bb535d985e49a4d2dcdcce5e03097babc` on 2026-07-12 after the
  owner-mandated hard reset.
- What changed vs the carried-in version:
  - The prior pass started with 50 findings, removed the seven application `any` findings, and
    suppressed the remaining schema boundaries with 41 `quality-allow` markers.
  - The rejected worklog records `allowCount = 41`; the fresh baseline has 50 findings and
    `allowCount = 0`.
  - This re-dispatch treats the custom schema facade as the defect to type, not as a boundary to
    suppress.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The baseline scanner reports 50 findings: 43 `unsafe-cast` findings and seven `any`/blanket-ignore findings; no allowances. | `deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/contracts` |
| 2 | The prior rejected pass used 41 allowances. | `git show 11a2e3f:.llm/runs/quality-q750-contracts--codex/worklog.md` |
| 3 | `ContractSchema<TOutput>` records only parsed output, while Zod 4 has distinct `ZodType<Output, Input>` generics and explicitly recommends `z.output<typeof schema>` / `z.input<typeof schema>`. | `packages/contracts/src/domain/schema-types.ts`; `deno doc --filter ZodType jsr:@zod/zod@4.4.3` |
| 4 | `ContractObjectSchema<TOutput>` replaces Zod's shape-preserving `extend`/`merge` generics with `unknown`, which forces every later object composition back through `as unknown as`. | `packages/contracts/src/domain/schema-types.ts`; `deno doc --filter ZodObject jsr:@zod/zod@4.4.3` |
| 5 | Defaults and coercions intentionally make schema input wider or optional while parsed output remains required; the hand-authored value types hide this variance. | `packages/contracts/src/domain/schemas.ts`; `packages/contracts/schemas/pagination.ts` |
| 6 | Schema helper factories return concrete Zod number/string/default/codec classes but annotate them as the lossy custom facade, creating nine avoidable double assertions. | `packages/contracts/src/application/zod-helpers.ts` |
| 7 | CRUD generic composition accepts a minimal facade, then casts it back to `ZodObject`/`ZodTypeAny`; constraining generic parameters to actual Zod schema/object types lets Zod preserve shapes and `z.output<TSchema>`. | `packages/contracts/crud/create-crud-contract.ts:310-332` |
| 8 | The application findings are local erasures: Prisma argument bags can use `Record<string, unknown>`, and transformer composition can use an `unknown` accumulator plus typed object construction. | `packages/contracts/src/application/paginated-query.ts`; `packages/contracts/src/application/transform-helpers.ts` |
| 9 | Doctrine classifies `@netscript/contracts` as Archetype 4 / Keep, not Archetype 1, because its CRUD/query/transform surface is a public builder/DSL. | `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`; `.llm/harness/archetypes/ARCHETYPE-4-dsl-builder.md` |
| 10 | Relevant debt is limited to the accepted root `crud/` subpath; the former slow-type carve-out is closed. | `.llm/harness/debt/arch-debt.md:95-128` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: all four exports in `packages/contracts/deno.json` (`.`, `./crud`, `./query`,
  `./transform`) plus the current `deno doc` surface.
- `deno publish --dry-run --allow-dirty` currently passes without `--allow-slow-types` and publishes
  only the intended README/config/entrypoint/source files.
- `deno task doc:lint --root packages/contracts --pretty` currently exits zero while recording 12
  combined `private-type-ref` diagnostics, all in the established oRPC contract/CRUD surface, and
  zero missing-JSDoc diagnostics.
- Planned risk: replacing facade annotations with native Zod generics can create slow inferred
  exported types. Every exported schema/factory therefore needs an explicit, declaration-safe
  return/value type, and the full publish dry-run is a required final gate.
- Planned risk: deriving value types from schemas may expose the true optional/coerced input shape.
  Output-facing public aliases remain based on `z.output`; input aliases are introduced only where
  a consumer or generic boundary needs them.

## Open questions

- None that would force rework. The implementation may choose between an explicit named Zod shape
  alias and an explicit generic factory return type on a per-schema basis, provided both preserve
  `z.input`/`z.output`, pass isolated-declaration publish analysis, and introduce no cast allowance.

