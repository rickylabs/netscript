# W5-B preflight — DB-backed contract flow and complete capability argument

Observed on 2026-08-06 before dispatch:

- Current contract teaching begins with hand-written Zod even when `db generate` already emits
  `@database/zod`; Wave 6 Loom mirrored persistence shapes while eis-chat reused generated schemas.
- #1254 shipped the multi-model generated schema barrel, so this lane owns activation/documentation,
  not a new generator.
- The homepage's argument ends around typesafety/durable runtime and omits major server-first UI,
  Fresh-UI/forms/cache/partials, generated data, auth, plugin, observability/Scalar, and MCP
  outcomes.
- The page must remain a concise argument with one-click task routes, not become an API catalog, and
  must inherit W4's visual language.

## Required supervisor mission

1. Inspect current generated DB exports and contract/route/server/builder public entrypoints with
   `deno doc`. Create a type-checked multi-model relation fixture that imports `@database/zod`,
   deliberately omits private/persistence-only fields, and narrows/extends into a versioned API
   schema.
2. Add the optional DB-backed predecessor to the type-flow diagram and an optional Tab 0 containing
   exact `db generate` plus import flow. Preserve the legitimate DB-less contract-first path and
   state the DB-backed norm when generated schemas exist.
3. Add bidirectional links between database generation and contracts/route/server/builder guidance,
   plus a fixture/docs guard that fails when the generated import path or multi-model example
   drifts.
4. Extend the homepage with concrete outcomes and canonical one-click task links for server-first
   UI, data generation/cache, auth, plugins, observability/Scalar, MCP, contracts, and durable
   workflows. Use current code/diagrams/exports; reject marketing-only claims.
5. Preserve progressive hierarchy and the homepage's single argument. Apply W4's tokens/type/layout
   and one signature interaction; do not introduce a competing generic design or detailed catalog.
6. Run example compilation, generated-export guard, docs links/accuracy/build, source alignment,
   responsive light/dark diagram/tab screenshots, keyboard/accessibility/reduced-motion checks, and
   Playwright one-click navigation to every claimed task page.
7. Coordinate evidence with #1277 without absorbing its unrelated rendering defects. Record any
   baseline defect rather than silently broadening this PR.
8. Open a draft PR with `Closes #1332` and `Closes #1334` only after all fifteen rows are evidenced;
   leave it at `status:impl-eval` for separate Qwen evaluation.

The DB example must compile against generated exports, and each homepage claim must resolve to a
real task/code path. Copy alone cannot satisfy either issue.
