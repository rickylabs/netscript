# WI-12 — Page-Module Codegen for `.withRoute(...)` and `.withRouteContract({ $route })`

## Summary

Today, every `routes/**/*.tsx` page module must hand-write the route binding call
(`.withRoute(routes.<key>.$route)` for sidecar-discovered contracts, or a manually
written `bindRoutePattern(...)` for inline routes). The hand-written binding is
tedious to maintain when routes are renamed or moved, and the JSR package README
documents the manual `bindRoutePattern` form as the primary example, which
contradicts the playground's actual sidecar-and-codegen flow.

**This WI restores the WI-09-era inline `.withRouteContract({ pathSchema?,
searchSchema?, paths? })` shorthand and extends codegen so that *neither* the
sidecar form *nor* the inline form require the author to write the binding
call. The Vite plugin inserts it.**

## Goals

1. **Restore the inline `.withRouteContract({ pathSchema?, searchSchema?, paths? })`
   builder method** as a first-class type-state-aware method on `definePage()`.
   This is the WI-09-era shorthand that was removed in `388b4161` (2026-03-23).

2. **Make the binding line itself codegen-owned**:
   - For **Form A** (inline `.withRouteContract({...})`): generator inserts the
     `$route:` field based on the page module's path under `routes/`.
   - For **Form B** (sidecar `<page>.route.ts`): generator inserts
     `.withRoute(routes.<key>.$route)` based on the page module's path and the
     sibling sidecar.
   - For **Form C** (no contract): generator inserts
     `.withRoute(routes.<key>.$route)` based on the page module's path alone,
     producing a default `createRouteReference(routePattern)` (no path/search
     schemas).

3. **Both forms coexist**; the user picks where the schema lives (inline vs.
   sidecar). The generator handles binding insertion for both.

4. **Idempotent rewriting** — second run produces no diff.

5. **Vite plugin option** `pageModuleRouteBinding: true | false` (default `true`)
   to disable the new codegen and fall back to current hand-written behavior.
   Required for migration safety and for users who explicitly want no tooling
   touching page modules.

## Why this WI exists

### User pain points today

- Hand-writing `.withRoute(routes.dashboard.orders.$id.$route)` for every page
  module is tedious when routes are renamed/moved. Renaming a route directory
  forces manual edits across every consumer.
- The JSR package README documents the manual `bindRoutePattern(...)` form as
  the *primary* example, which contradicts the playground's actual
  sidecar-and-codegen flow and misleads new users.
- The earlier inline `.withRouteContract({ $route, ... })` shorthand (WI-09-era)
  was removed because it required the user to type the `$route` value. The
  remaining critique from WI-09F (line 13: "legacy page-attached contract
  discovery and the `typedRoutes` alias were removed") was specifically about
  *export-based* contract discovery (reading `export const myContract` from a
  page module's exports) — not about the inline-form authoring shorthand.

### What's been confirmed about the prior state

- The Vite plugin in both `netscript-start` and `netscript` only writes to
  `.generated/manifest.ts` and `.generated/routes.ts`. No page-module writer
  exists today. See `packages/fresh/src/application/vite/vite.ts:212-320` (no
  `transform()` hook) and `packages/fresh/src/application/route/manifest.ts:478,
  483` (the only two `Deno.writeTextFileSync` calls in the package).
- The WI-09-era `.withRouteContract({ $route, pathSchema, ... })` builder method
  existed from `386c412f feat(fresh): finish WI-09C route inference cleanup`
  (2026-03-20) to `388b4161 chore: finalize generated routes migration`
  (2026-03-23). During that window, page modules wrote the inline object and the
  framework bound it. Removed when the framework needed the runtime navigation
  object (Link, getLinkProps) that the inline form did not carry.
- The `.withRoute(boundRoute)` form was introduced in
  `5258ea8a feat-fresh-route-references` (2026-03-22). Page modules were
  migrated from `.withRouteContract({ $route, ... })` to
  `.withRoute(routes.<key>.$route)` in `388b4161` (2026-03-23).

### Rationale for restoring the shorthand

The shorthand is restored not as a duplication of sidecar discovery, but as an
authoring form for pages whose contract is tightly coupled to the page's render
logic. The two forms serve different authoring preferences:

- **Form A (inline)**: contract body lives in the page module, generator fills
  the route binding.
- **Form B (sidecar)**: contract body lives in sibling `<page>.route.ts`,
  generator fills the route binding.
- **Form C (no contract)**: generator fills a default bound route reference.

Both forms converge on the same generator output (`routes.<key>` tree in
`.generated/routes.ts`).

## Design

### Two-tree model

`.generated/manifest.ts` owns the `routePatterns.<key>` tree. Each leaf is the
raw route-pattern string derived from the route file path, and this is the value
passed as the second argument to `bindRoutePattern(contract, routePattern, ...)`.

`.generated/routes.ts` owns the `routes.<key>` tree. Each leaf is a bound route
reference produced by `bindRoutePattern(...)` for schema-backed routes or by
`createRouteReference(routePattern)` for schema-free routes, and this is the
value accepted by `.withRoute(boundRef)`.

That split is intentional: Form A inserts `$route: routePatterns.<key>.$route`
because inline `.withRouteContract({...})` needs the raw pattern for binding,
while Form B and Form C insert `.withRoute(routes.<key>.$route)` because
`.withRoute(...)` consumes an already-bound reference.

### Form A - inline `.withRouteContract({ pathSchema?, searchSchema?, paths? })`

Hand-written by the user in `routes/orders/[id].tsx`:

```ts
import { z } from 'zod';

export const ordersDetailPage = definePage()
  .withRouteContract({
    pathSchema: z.object({ id: z.string().min(1) }),
  })
  .withPolicy('balanced')
  ...
```

Generator rewrites this to:

```ts
import { z } from 'zod';
import { routePatterns } from '@app/.generated/manifest.ts';

export const ordersDetailPage = definePage()
  .withRouteContract({
    $route: routePatterns.dashboard.orders.$id.$route,
    pathSchema: z.object({ id: z.string().min(1) }),
  })
  .withPolicy('balanced')
  ...
```

The user types only the contract body (`pathSchema`, `searchSchema`, `paths`).
The generator inserts the `$route:` field and the import for
`routePatterns` based on the file's path.

The `$route` field is optional in user source. The user may pre-fill
`$route: routePatterns.<key>.$route` for grep-ability; if present, the
generator validates that it matches the file's expected raw pattern, derived
from the route file path, and leaves it alone. If the field is missing, the
generator inserts it. If the field is present but wrong, the build fails with:
"Pre-filled $route does not match the file's expected pattern; remove the line
to let the generator fill it in, or fix the value."

### Form B - sidecar + `.withRoute(routes.<key>.$route)`

Hand-written by the user in `routes/orders/[id].route.ts`:

```ts
import { defineRouteContract } from '@netscript/fresh/route';
import { z } from 'zod';
export default defineRouteContract({
  pathSchema: z.object({ id: z.string().min(1) }),
});
```

Hand-written initially by the user in `routes/orders/[id].tsx`:

```ts
import { z } from 'zod';

export const ordersDetailPage = definePage()
  .withPolicy('balanced')
  ...
```

Generator rewrites this to:

```ts
import { z } from 'zod';
import { routes } from '@app/.generated/routes.ts';

export const ordersDetailPage = definePage()
  .withRoute(routes.dashboard.orders.$id.$route)
  .withPolicy('balanced')
  ...
```

### Form C - no contract (default route reference)

Hand-written by the user in `routes/about.tsx`:

```ts
export const aboutPage = definePage()
  .withMeta(() => ({ title: 'About' }))
  ...
```

Generator rewrites this to:

```ts
import { routes } from '@app/.generated/routes.ts';

export const aboutPage = definePage()
  .withRoute(routes.about.$route)
  .withMeta(() => ({ title: 'About' }))
  ...
```

The default bound route carries no schemas; it resolves to
`createRouteReference(routePattern)` in `.generated/routes.ts`.

### Generator algorithm

```
For each page module file F (apps/<app>/routes/**/*.tsx excluding layout/island/partial/component):

  1. Derive the route key from F's path:
       routes/(dashboard)/dashboard/orders/[id].tsx -> dashboard.orders.$id
       routes/(dashboard)/dashboard/orders/index.tsx -> dashboard.orders
       routes/about.tsx -> about
     The (group) layout prefix is stripped; index.tsx has no segment suffix.

  2. Check for sibling sidecar:
       routes/.../[id].route.ts

  3. AST-scan the page module for `.withRouteContract({...})` and `.withRoute(...)` calls:

     a. If `.withRouteContract({...})` is present (with or without $route):
        Form = A
        Schema fields = inline `pathSchema`, `searchSchema`, `paths`

     b. Else if sibling sidecar exists:
        Form = B
        Schema fields = none (sidecar owns them)

     c. Else:
        Form = C
        Schema fields = none

     d. If both `.withRouteContract({...})` AND sibling sidecar exist:
        Form = A wins. Sidecar is left in place but a build warning is emitted:
        "Page F has both inline .withRouteContract and sibling sidecar.
         Inline form takes precedence. Delete the sidecar to silence this warning."
        Sidecar is NOT deleted automatically - author decides.

     e. If both `.withRoute(...)` AND `.withRouteContract({...})` exist:
        Error build: "Page F has both .withRoute and .withRouteContract. Pick one."

  4. Compute target page module content based on Form:

     Form A target:
       import { routePatterns } from '<alias>/.generated/manifest.ts'; // if missing
       definePage().withRouteContract({
         $route: routePatterns.<key>.$route,
         ...inlineSchemaFields  // preserved as-is from source
       })

     Form B target:
       import { routes } from '<alias>/.generated/routes.ts'; // if missing
       definePage().withRoute(routes.<key>.$route)

     Form C target:
       import { routes } from '<alias>/.generated/routes.ts'; // if missing
       definePage().withRoute(routes.<key>.$route)

  5. Diff against current page module content:
     If different -> write file
     If equal -> no-op (idempotency)

  6. Update .generated/routes.ts:
     Form A: createRouteReference(routePatterns.<key>).
     Form B: bindRoutePattern(<importedSidecarContract>, routePatterns.<key>, {...}).
     Form C: createRouteReference(routePatterns.<key>).

     N (the routeContract<N> import alias for Form B) is the index in the order
     pages are discovered. The index is stable across rebuilds because the
     discovery algorithm sorts by file path.

     RESOLVED (implementation, 2026-06-30): Form A does NOT synthesize a
     `defineRouteContract({ ...inlineSchemaFields })` into `.generated/routes.ts`.
     The inline schema body references page-module-scoped imports (e.g. `z`,
     custom param schemas) that are not in scope in `.generated/routes.ts`, so
     re-emitting the body there would not type-check. Instead, Form A's typed
     runtime binding lives in the page module itself: the generator inserts
     `$route: routePatterns.<key>.$route` and the restored
     `.withRouteContract({ $route, ...schemaBody })` builder method binds the
     contract at runtime (via `bindRoutePattern(defineRouteContract({...}),
     $route)`). The `routes.<key>` leaf for a Form A page is a schema-free
     `createRouteReference(routePatterns.<key>)` — a navigable reference for
     external `Link`/`href` consumers, identical in shape to Form C.

  7. If .generated/routes.ts content changed -> write file
```

### Vite plugin option

#### Option semantics

`createNetScriptVitePlugin({ ..., pageModuleRouteBinding: true | false })`

- `true` (default): generator rewrites page modules per the algorithm above.
- `false`: generator skips step 5. Only `.generated/routes.ts` is updated.
  Existing hand-written `.withRoute(...)` lines continue to work.

#### Dev mode

The `transform()` hook runs on save during Vite dev, with Vite debouncing
file-watcher events. The hook skips rewriting when the file content already
matches the computed target, preserving idempotency. Dev mode does not touch
`.generated/manifest.ts` or `.generated/routes.ts`; those files are owned by
`writeNetScriptRouteManifestSync` during Vite initialization
(`vite.ts:195-197`). Page-module rewriting is a separate post-init pass.

#### Build mode

The `transform()` hook runs once per page module during the Rollup build pass.
The order is manifest writer first during plugin initialization, then
page-module rewrite in `transform()`.

#### HMR safety

The generator never writes a page module while the user has unsaved edits. Its
AST diff is computed against disk, so content already saved into the file is
detected before any write. If the user has hand-written `.withRoute(...)` and
the generator wants to insert the same binding, the diff sees the new content
and skips the write as idempotent.

### Idempotency guarantees

- Generator compares the computed target content against the current page module
  content. If equal, no write.
- For Form A, the `$route:` field is inserted as the literal first property of
  the object. `deno fmt` may reorder it (alphabetical by default), but the AST
  diff sees the same set of keys.
- For Form B and C, the import line and `.withRoute(...)` line have stable text
  representations.
- The generator writes only if content differs. Second run produces no diff.

### Conflict resolution (per author decision 2026-06-26)

| Conflict | Resolution |
|---|---|
| Inline `.withRouteContract` AND sibling sidecar | **Inline wins**. Sidecar stays in place. Build emits warning: "Inline form takes precedence. Delete the sidecar to silence this warning." Sidecar is NOT auto-deleted. |
| `.withRoute(...)` AND `.withRouteContract({...})` in same file | **Build error**. Author must pick one. |
| No inline `.withRouteContract` AND no sibling sidecar | **Form C**: generator inserts default `.withRoute(routes.<key>.$route)` with `createRouteReference(routePattern)`. |
| `.withRoute(...)` line is hand-written and matches generator's target | **No-op** (idempotent). Generator leaves the line in place. |

## Cross-link

- **#181** - this implementation tracking issue (WI-12).
- **#178 / #179** - `InferRoutePatternSegment` EmptyRecord regression fix. WI-12
  depends on #179 because the codegen-emitted `.withRoute(routes.<key>.$route)`
  chain relies on `createRouteReference`'s path-param inference being correct.
  Without #179, playground pages with dynamic segments would surface the same
  `TS2322` from typed `Link`/`href`.

## Primary files

- `packages/fresh/src/application/builders/define-page/builder/mod.tsx` (or
  `route-support.ts`) - add `withRouteContract({ pathSchema?, searchSchema?,
  paths? })` method back with type-state promotion.
- `packages/fresh/src/application/route/manifest.ts` - add inline-contract
  discovery via AST scan; emit synthesized contract into `.generated/routes.ts`.
- `packages/fresh/src/application/vite/vite.ts` - wire manifest writer to
  page-module changes; add `pageModuleRouteBinding` option; implement page-module
  rewriting.
- `packages/fresh/src/application/route/manifest-types.ts` - extend types for
  inline-contract synthesis.
- `packages/fresh/src/application/builders/define-page/tests/builder.test.tsx`
  - append new tests for `.withRouteContract({...})` typing and runtime
  behavior.
- `packages/fresh/src/application/route/manifest.test.ts` - append new tests
  for inline-contract AST discovery.
- `packages/fresh/src/application/vite/vite.test.ts` - append new tests for
  page-module rewriting, idempotency, and the `pageModuleRouteBinding` option
  gate.
- `packages/fresh/README.md` - update example to show Form A/B/C with codegen
  as primary.
- `docs/site/web-layer/builders.md` - document `.withRouteContract({...})`
  alongside `.withRoute(boundRoute)`.
- `.llm/frontend/wi/WI-12-definePage-route-binding-codegen.md` - this WI doc.
- Playground migration happens in CLI scaffold template files, not an
  `apps/playground` tree. There is no `apps/playground` in this repo. The
  scaffold runtime E2E suite creates the real app routes under
  `.llm/tmp/cli-e2e/...` and is the runtime proof.
  - Form A (inline `.withRouteContract({...})`):
    `packages/cli/src/kernel/assets/app/routes/dashboard.tsx.template`
  - Form A (inline `.withRouteContract({...})`):
    `packages/cli/src/kernel/assets/app/routes/examples/index.tsx.template`
  - Form A (inline `.withRouteContract({...})`):
    `packages/cli/src/kernel/assets/app/routes/examples/crud.tsx.template`
  - Form B (sidecar + `.withRoute(...)`):
    `packages/cli/src/kernel/assets/app/routes/index.tsx.template`
  - Form B (sidecar + `.withRoute(...)`):
    `packages/cli/src/kernel/assets/app/routes/examples/telemetry/index.tsx.template`
  - Form B (sidecar + `.withRoute(...)`):
    `packages/cli/src/kernel/assets/app/routes/(design)/design/components.tsx.template`

## Validation

- `deno task check:packages` - must stay green.
- Scaffolded app typecheck from the E2E scaffold suite must stay green.
- Scaffolded app build from the E2E scaffold suite must succeed.
- New unit tests:
  - `.withRouteContract({ pathSchema: ... })` type-state promotion.
  - `.withRouteContract({ searchSchema: ... })` type-state promotion.
  - `.withRouteContract({ paths: [...] })` type-state promotion.
  - Generator inline-contract AST discovery (positive case).
  - Generator inline-contract AST discovery (negative case - non-page module
    with `.withRouteContract` is ignored).
  - Generator page-module rewriting (Form A produces expected target).
  - Generator page-module rewriting (Form B produces expected target).
  - Generator page-module rewriting (Form C produces expected target).
  - Generator idempotency (running twice produces no diff).
  - Generator conflict: inline + sidecar -> warning emitted, inline wins.
  - Generator conflict: `.withRoute` + `.withRouteContract` -> build error.
  - Generator `pageModuleRouteBinding: false` -> page modules not rewritten.
- Migration snapshot: 3 CLI scaffold template routes migrated to Form A
  (inline) and 3 to Form B (sidecar), then scaffolded into real app routes by
  the CLI. The E2E scaffold suite (`.llm/tmp/cli-e2e/...`) is the runtime proof.

## Non-goals

- Re-introducing page-module-export contract discovery
  (`export const myContract = defineRouteContract(...)` from page-module
  exports). This was the genuine duplicate discovery path that WI-09F removed
  and stays removed.
- Changing the sidecar discovery algorithm. Sidecar discovery stays exactly
  as today.
- Removing deprecated builder APIs (`defineListPage`, `defineDetailPage`,
  `defineFormPage`). Out of scope.
- Changing the `withRoute(boundRoute)` API signature. Only its emitter
  (the page-module writer) changes.
- Auto-deleting sidecar files when inline takes precedence. Sidecar files are
  left in place; build emits a warning; author decides.

## Recommended commits

1. **Restore `.withRouteContract({...})` builder method** - adds the method back
   to `definePage()` with type-state promotion.
2. **Generator: synthesize inline contract from page module AST** - adds AST
   scan for `.withRouteContract({ pathSchema?, searchSchema?, paths? })` calls
   and emits a synthesized contract into `.generated/routes.ts`.
3. **Vite plugin: page-module rewriting (Form A/B/C)** - adds the page-module
   rewriting algorithm and the `pageModuleRouteBinding` option.
4. **Generator: Form C (no-contract default)** - emits a default bound route
   reference for page modules with no inline `.withRouteContract` and no
   sibling sidecar.
5. **Generator: conflict resolution** - emits warning for inline+sidecar,
   errors for `.withRoute`+`.withRouteContract`.
6. **Tests** - unit tests for typing, AST discovery, page-module rewriting,
   idempotency, conflict resolution, and the `pageModuleRouteBinding: false`
   option.
7. **Migration: 3 page modules to Form A, 3 to Form B** - proof that both forms
   work end-to-end.
8. **Docs** - update `packages/fresh/README.md` and `docs/site/web-layer/
   builders.md` with Form A/B/C examples.

## Done when

- `.withRouteContract({ pathSchema?, searchSchema?, paths? })` builder method
  exists with type-state promotion.
- Vite plugin rewrites page modules per Form A/B/C algorithm.
- Generator emits a synthesized contract for Form A page modules.
- Generator emits a default bound route for Form C page modules.
- Conflict resolution emits warning for inline+sidecar, errors for
  `.withRoute`+`.withRouteContract`.
- `pageModuleRouteBinding: false` disables page-module rewriting.
- All new unit tests pass.
- `deno task check:packages` and the scaffolded app typecheck/build gates from
  the E2E scaffold suite all stay green.
- At least 3 CLI scaffold template routes migrated to Form A, 3 to Form B.
- README and docs updated with Form A/B/C examples.
- The `.withRoute(...)` line in every migrated scaffold template route is either
  generator-owned (Form A/B/C) or hand-written (Form B with
  `pageModuleRouteBinding: false`).

## Open questions

1. **Sidecar precedence over inline?** - Author decision (2026-06-26):
   inline wins. Sidecar gets a warning, not deletion.
2. **Form C for routes that need schemas?** - If a page module has neither
   inline `.withRouteContract` nor sibling sidecar, Form C emits a default
   `createRouteReference(routePattern)`. If the page needs path/search schemas,
   the author must add either Form A or Form B. Generator does not auto-synthesize
   schemas.
3. **Idempotency with `deno fmt`?** - Generator inserts `$route:` as the first
   property of the object literal. `deno fmt` may reorder to alphabetical; the
   AST diff sees the same set of keys. Validation: run `deno fmt` after generator
   pass and re-run generator; second pass must produce no diff.
4. **Migration of existing playground** - The playground is template-based in
   this repo. The migration lands in the 6 CLI scaffold route templates named
   above, and the scaffold runtime E2E suite proves the generated app routes.
5. **Build warning vs error for inline+sidecar?** - Author decision
   (2026-06-26): warning. Sidecar stays in place. Author decides whether to
   delete.
6. **Where does the synthesized inline contract live?** - RESOLVED
   (implementation, 2026-06-30): it lives in the **page module**, not in
   `.generated/routes.ts`. The page module's restored
   `.withRouteContract({ $route: routePatterns.<key>.$route, ...schemaBody })`
   call binds the inline contract at runtime where its schema imports (`z`,
   custom param schemas) are in scope. `.generated/routes.ts` therefore cannot
   re-emit the inline body (those symbols are not in its scope), so a Form A
   route's `routes.<key>` leaf is a schema-free
   `createRouteReference(routePatterns.<key>)` — same shape as Form C. The
   `routeContract<N>` import-alias naming pattern remains in use for Form B
   sidecar contracts only.

## Status

DRAFT PR. Planning artifact only; the implementation will land in subsequent
commits on this branch by a separate Claude Code (Opus 4.8) session after the
plan-eval approves the design.
