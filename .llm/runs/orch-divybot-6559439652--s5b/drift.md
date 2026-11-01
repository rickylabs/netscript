# Drift

- Owner explicitly requires Refs #2568 and no labels; generic delivery template closing-keyword/label instructions do not apply. Parents stay open.
- RTK not installed; use native tools with scoped structured wrapper verdicts.
- Add `.github/workflows/figma-component-library.yml` to declared write surface for dedicated tool validation; root wrappers exclude tools and existing plugin entry/tasks remain untouched.

- Tool source imports follow existing tools/figma-plugin's npm:zod@^4.6.5 (the unchanged root catalog range). Deno 2.9.7 rejects direct npm:zod@catalog: source specifiers in this nonmember tools directory. No dependency or lock changes.
- default-sources.ts moved into generator slice so integration tests use actual code-owned inventory immediately.

- Executable inventory re-derivation corrects the review's prose count: style-utility has 52 eligible visual source items, 2,046 variants; 35 unregistered contracts comprise 14 shipped runtime-only and 21 planned contracts. Counts come from resolveInventory, not a hardcoded allowlist. The plan's earlier 22 count was inaccurate.

- Slice review required explicit root anatomy and one contract per logical registry item. Added complete registry/style membership rejection and tests so a missing style-map entry cannot silently reduce generated coverage. Planned default values now lead the native variant order.

- Native side-effect modules will live in src/native/ (port, import, export), rather than adding three more flat source entries. Same planned concern/scope, bounded folder cardinality.
