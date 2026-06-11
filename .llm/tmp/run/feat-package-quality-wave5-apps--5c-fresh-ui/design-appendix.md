# Design Deepening — Appendix to design.md

> Written by PLAN-EVAL session. These sections are implementation-grade specs
> that amend the PROPOSED design.md. They become part of the locked design.

---

## A. Scaffolded App — Full Spec (D-11 implementation detail)

### A.1 Generated file tree (every file `netscript init` writes)

```
<app-root>/
  deno.json                    ← imports block: @netscript/fresh, @netscript/sdk,
                                 @netscript/fresh-ui (for runtime/primitives), preact,
                                 @preact/signals, tailwindcss
  main.ts                      ← App instance, staticFiles, router load
  router.ts                    ← route manifest (generated from routes/)
  vite.config.ts               ← @fresh/plugin-vite, tailwindcss plugin
  lib/
    example-service.ts         ← createServiceClient + createQueryFactories
                                 (post-5b surface: defineServices())
  routes/
    _layout.tsx                ← sidebar-shell + page-header + theme-toggle
    index.tsx                  ← welcome map (services, routes, links)
    dashboard/
      index.tsx                ← resource page: data-table + filter-form + pagination
      live.tsx                 ← SSE widget island (jobs/heartbeat)
    health.ts                  ← content-negotiated health check
    forms/
      index.tsx                ← form-field + validation demo
  components/
    ui/                        ← pure components (copied by ui:init starter collection)
      button.tsx
      card.tsx
      badge.tsx
      input.tsx
      select.tsx
      form-field.tsx
      alert.tsx
      spinner.tsx
      skeleton.tsx
      data-table.tsx
      empty-state.tsx
      pagination.tsx
      page-header.tsx
      sidebar-shell.tsx
      theme-toggle.tsx
      toast.tsx
    blocks/                    ← composed blocks (copied by ui:init)
      stats-grid.tsx
      filter-form.tsx
  islands/
    ui/                        ← interactive components (islands)
      ThemeToggle.tsx
      Toast.tsx
      SidebarToggle.tsx
    blocks/
      LiveWidget.tsx           ← SSE island (client-only via IS_BROWSER)
  assets/
    styles.css                 ← aggregator: @import tailwindcss;
                                 @import './tokens.css';
                                 @import './theme-bridge.css';
                                 @import './ui/*.css';
    tokens.css                 ← copied from fresh-ui registry/theme/tokens.css
    theme-bridge.css           ← copied from fresh-ui registry/theme/theme-bridge.css
    ui/                        ← per-item CSS files (copied by ui:add)
      button.css
      card.css
      ...
```

### A.2 Route table

| Path | Purpose | definePage layers | Data source | Islands | Registry items |
|------|---------|-------------------|-------------|---------|----------------|
| `/` | Welcome + workspace map | meta only | static | ThemeToggle | page-header, card, badge, button |
| `/dashboard` | Resource page for example service | `delivery: 'defer'`, `partial: '/partials/dashboard/table'`, skeleton fallback | sdk query factories (`list` procedure) | Toast (for actions) | sidebar-shell, page-header, data-table, filter-form, pagination, empty-state, spinner, skeleton |
| `/dashboard/live` | SSE live widget | none (client-only) | `EventSource` → `/api/sse` | LiveWidget | sidebar-shell, page-header |
| `/forms` | Forms + validation demo | none | static (form submission) | Toast | form-field, input, select, alert, button |
| `/health` | Health check | none | static | none | none |

### A.3 Dynamic contract (scaffold-time introspection)

Everything service-specific derives from workspace config:

1. **Service name**: read from `netscript.config.ts` → `services[0].name` (example service).
2. **List procedure**: introspect the service's oRPC router for a `list` query procedure (convention: `resource.list`). If missing, data-table renders empty-state with setup instructions.
3. **Column inference**: the data-table block receives `columns` prop typed as `ColumnDef<unknown>[]`. At scaffold time, we generate a SKELETON array with `{ key: 'id', header: 'ID' }` plus a comment: "Replace with actual columns from your contract schema."
4. **SDK imports**: written against post-5b surface (`defineServices()`, folded subpaths). Run 3 is gated on 5b merge; template imports use the locked 5b API.

### A.4 Starter collection (exact list `ui:init` installs)

```
button, card, badge, form-field, input, select, alert, spinner, skeleton,
page-header, sidebar-shell, theme-toggle, toast, data-table, empty-state,
pagination, filter-form, stats-grid
```

(18 items; `stats-grid` is a block, rest are components/islands.)

### A.5 Styles aggregation file shape

```css
/* assets/styles.css */
@import "tailwindcss";
@import "./tokens.css";
@import "./theme-bridge.css";

/* Per-item CSS — ui:init writes these @import lines */
@import "./ui/button.css";
@import "./ui/card.css";
/* ... one per installed component */

/* App-specific custom styles below */
```

### A.6 Playground-parity checklist

| Playground surface | Registry item | Run |
|--------------------|--------------|-----|
| Sidebar-shell chrome | sidebar-shell, page-header, theme-toggle | 1 (items) + 3 (scaffold) |
| Data-table with defer/partial | data-table, filter-form, pagination, empty-state, skeleton | 3 |
| SSE live widget | LiveWidget (island block, app-specific) | 3 |
| Forms + validation | form-field, input, select, alert, button | 1 |
| Toast notifications | toast, toast-support | 1 |
| Theme toggle | theme-toggle | 1 |
| Stats cards | stats-grid | 2 |

### A.7 Glue whitelist (files that remain .template after revamp)

| Template | Why it stays templated |
|----------|----------------------|
| `main.ts.template` | App bootstrap wiring (fresh, router, staticFiles) |
| `router.ts.template` | Route manifest loader (app-specific routes) |
| `vite.config.ts.template` | Vite + Tailwind plugin config |
| `lib/example-service.ts.template` | SDK client wiring (service name interpolation) |
| `routes/_layout.tsx.template` | Shell composition (imports app-local components) |
| `routes/index.tsx.template` | Welcome page (service list introspection) |
| `routes/dashboard/index.tsx.template` | Resource page (procedure name interpolation) |
| `routes/dashboard/live.tsx.template` | SSE island wrapper (endpoint URL interpolation) |
| `routes/health.ts.template` | Health check (static, but app-specific path) |
| `routes/forms/index.tsx.template` | Form demo (static, but app-specific path) |

---

## B. Registry v2 Concrete

### B.1 TypeScript schema draft (full interface)

```ts
export type RegistryItemKind =
  | 'theme'
  | 'style'
  | 'component'
  | 'island'
  | 'block'
  | 'lib'
  | 'hook'
  | 'support';

export interface RegistryFileDefinition {
  source: string;      // path within package (e.g. "registry/components/ui/button.tsx")
  target: string;      // placeholder path (e.g. "@ui/button.tsx")
}

export interface RegistryCssContribution {
  layer?: 'base' | 'components' | 'utilities';
  content: string;     // CSS text, or @import rule
}

export interface RegistryCssVars {
  theme?: Record<string, string>;
  light?: Record<string, string>;
  dark?: Record<string, string>;
}

export interface RegistryItemDefinition {
  name: string;
  kind: RegistryItemKind;
  title?: string;
  description: string;
  author?: string;
  tags: string[];
  files: RegistryFileDefinition[];
  registryDependencies?: string[];   // bare = same registry; '@ns/x' reserved
  dependencies?: string[];           // jsr:/npm: specifiers
  css?: RegistryCssContribution[];
  cssVars?: RegistryCssVars;
  docs?: string;
  categories?: string[];
  meta?: Record<string, unknown>;
}

export interface RegistryCollectionDefinition {
  name: string;
  description: string;
  items: string[];
}

export interface RegistryManifest {
  name: string;
  version: string;
  packageName: string;
  homepage?: string;
  items: RegistryItemDefinition[];
  collections: RegistryCollectionDefinition[];
}
```

### B.2 Worked item examples

**Example 1: Component with per-item CSS (`button`)**

```json
{
  "name": "button",
  "kind": "component",
  "title": "Button",
  "description": "Interactive button with variants.",
  "tags": ["foundation", "interactive"],
  "files": [
    { "source": "registry/components/ui/button.tsx", "target": "@ui/button.tsx" },
    { "source": "registry/components/ui/button.css", "target": "@assets/ui/button.css" }
  ],
  "registryDependencies": [],
  "dependencies": [],
  "css": [
    { "layer": "components", "content": "@import './ui/button.css';" }
  ]
}
```

**Example 2: Block with npm dependency (`data-table`)**

```json
{
  "name": "data-table",
  "kind": "block",
  "title": "Data Table",
  "description": "Sortable, paginated data table.",
  "tags": ["dashboard", "block"],
  "files": [
    { "source": "registry/components/ui/data-table.tsx", "target": "@ui/data-table.tsx" },
    { "source": "registry/components/ui/data-table.css", "target": "@assets/ui/data-table.css" }
  ],
  "registryDependencies": ["button", "pagination", "empty-state", "spinner", "skeleton"],
  "dependencies": ["npm:@tanstack/table-core@^8"],
  "css": [
    { "layer": "components", "content": "@import './ui/data-table.css';" }
  ]
}
```

### B.3 `ui:add` resolution algorithm

```
Input: itemName, manifest, appRoot

1. RESOLVE item from manifest by name. Error if missing.
2. TOPOSORT registryDependencies (DFS, cycle = error).
3. For each item in sorted order (deps first):
   a. For each file in item.files:
      i.   Resolve target placeholder → real path:
           @ui/      → appRoot/components/ui/
           @islands/ → appRoot/islands/ui/
           @assets/  → appRoot/assets/
           @lib/     → appRoot/lib/
           ~/        → appRoot/
      ii.  Copy source → target (mkdir -p).
      iii. Rewrite import specifiers inside .tsx/.ts files:
           - "@netscript/fresh-ui/registry/..." → relative path to copied file
           - "@netscript/fresh-ui/runtime/..."  → "@netscript/fresh-ui/runtime"
           - Other @netscript/*                    → keep (package import)
   b. For each dependency in item.dependencies:
      i.   Parse specifier (jsr: or npm:).
      ii.  Add to appRoot/deno.json imports (merge, no dupes).
   c. For each css contribution:
      i.   Append @import line to appRoot/assets/styles.css
           (or a generated appRoot/assets/ui-imports.css if we want isolation).
4. REPORT: list of files written, dependencies added, CSS imports appended.
```

---

## C. Token Pipeline Concrete

### C.1 tokens/ file layout

```
tokens/
  primitives.tokens.json       # color ramps (OKLCH), type scale, space, radius, shadow, motion, z
  semantic.tokens.json         # bg/fg/primary/success/... aliases
  themes/
    dark.tokens.json           # default theme (dark-first)
    light.tokens.json          # light overrides
```

### C.2 SD v5 config draft

```js
// sd.config.mjs
export default {
  source: ['tokens/**/*.tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'registry/theme/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: true,
            selector: ':root',
            // Custom: append [data-theme='light'] block
          },
        },
      ],
    },
    'theme-bridge': {
      transformGroup: 'css',
      buildPath: 'registry/theme/',
      files: [
        {
          destination: 'theme-bridge.css',
          format: 'tailwind-theme-bridge',
        },
      ],
    },
    json: {
      transformGroup: 'web',
      buildPath: 'registry/theme/',
      files: [
        {
          destination: 'tokens.json',
          format: 'json/flat',
        },
      ],
    },
  },
};
```

**Custom format: `tailwind-theme-bridge`**

```js
StyleDictionary.registerFormat({
  name: 'tailwind-theme-bridge',
  format: ({ dictionary }) => {
    const lines = dictionary.allTokens
      .filter(t => t.attributes.category === 'color')
      .map(t => `  --color-${t.name}: var(--${t.name});`);
    return `@theme inline {\n${lines.join('\n')}\n}`;
  },
});
```

### C.3 deno task wiring

```json
{
  "tasks": {
    "tokens:build": "node --input-type=module -e \"import sd from 'style-dictionary'; sd.extend('sd.config.mjs').buildAll();\"",
    "tokens:check": "deno task tokens:build && git diff --exit-code registry/theme/"
  }
}
```

(Note: `npm:style-dictionary` under Deno may need `deno run -A npm:style-dictionary/build` instead of Node. The exact command is a run-1 implementation detail.)

### C.4 tokens-drift gate behavior

```ts
// .llm/tools/fitness/tokens-drift.ts
// 1. Run deno task tokens:build
// 2. Normalize whitespace in generated files
// 3. git diff registry/theme/
// 4. If diff non-empty → FAIL (drift detected)
// 5. If diff empty → PASS
```

### C.5 Phase-1 parity proof method

1. Transcribe current `tokens.css` 1:1 into DTCG source (hex values).
2. Run SD build.
3. Normalize both CSS files (sort properties, strip comments).
4. Diff. Zero diff = parity proven.

---

## D. Runtime Tier Matrix

| Component | Engine | Evidence | Migration Risk | Hook Shape Preservation |
|-----------|--------|----------|----------------|------------------------|
| dialog | P (native `<dialog>`) | Already uses showModal | None | `useDialog` shape unchanged |
| drawer | P (native `<dialog>`) | Already uses showModal | None | `useDrawer` shape unchanged |
| sheet | P (native `<dialog>`) | Already uses showModal | None | `useSheet` shape unchanged |
| accordion | P (`<details name>`) | Native exclusive accordion is Baseline | Low | `useAccordion` → new hook returning `getTriggerProps`/`getContentProps` |
| popover | P (Popover API) | Baseline; anchor positioning fallback | Medium | `usePopover` shape preserved; internals swap |
| tooltip | P (Popover API + interest invokers) | `interestfor` attribute | Medium | `useTooltip` shape preserved |
| tabs | P (hand-rolled roving tabindex) | No platform primitive yet; tiny hook | None | Keep current `useTabs` |
| combobox | Z (`@zag-js/combobox`) | Spike slice 10 validates | High if spike fails | New hook `useCombobox` matching Zag connect API |
| date-picker | Z (`@zag-js/date-picker`) | Post-spike | High if spike fails | New hook post-spike |
| select-rich | Z (`@zag-js/select`) | Post-spike | High if spike fails | New hook post-spike |

### D.1 Popover fallback decision (D-2, R2)

**Decision**: CSS `position: fixed` + `inset` fallback. **OddBird polyfill is NOT used.**

Rationale:
- Polyfill only affects elements present at run time; Fresh partials inject dynamic content.
- Polyfill adds tens of KB; CSS fallback is ~zero bytes.
- Firefox users get centered/fixed-position popovers instead of anchored — acceptable degradation.

CSS fallback snippet:
```css
@supports not (anchor-name: --a) {
  [popover] {
    position: fixed;
    inset: auto;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}
```

Record as accepted debt in `drift.md`.

---

## E. Runs 2–3 Re-Slice

### E.1 Run 2 — Official design system (`feat/...-5c2-design-system`)

| # | Slice | Gate evidence | Notes |
|---|-------|---------------|-------|
| 1 | CSS corpora reconciliation: playground 2,264L → registry homes | visual diff, manifest-integrity | move-only; no renames |
| 2 | layout-objects style item (Stack, Cluster, Grid, Toolbar, Section, Split, ScrollRegion) | check + lint | CSS-only, zero JS |
| 3 | Playground converted to `ui:add` consumer | playground check passes | replaces deep relative imports |
| 4 | `/design` route group: tokens browser | browser validation | reads tokens.json |
| 5 | `/design` route group: component gallery | browser validation | per registry item |
| 6 | `/design` route group: composition-rules page | browser validation | static docs route |
| 7 | DS lint gates: no raw hex in components | lint rule | PENDING_SCRIPT |
| 8 | DS lint gates: no off-vocabulary color utilities | lint rule | PENDING_SCRIPT |
| 9 | Component completion: toast, data-table reconciliation | check + tests | reconcile playground vs registry |
| 10 | Run 2 README/docs sweep | doc-lint | |
| 11 | Run 2 check:packages + lint + fmt | raw deno | |
| 12 | JSR dry-run from package dir | raw deno publish --dry-run | |

### E.2 Run 3 — Generated app revamp (`feat/...-5c3-scaffold-revamp`)

| # | Slice | Gate evidence | Notes |
|---|-------|---------------|-------|
| 1 | `ui:init` integration into `netscript init` app phase | e2e: `netscript init` green | delegates to existing ui:init code path |
| 2 | Delete forked component/CSS templates from CLI | manifest-integrity | ~10 template files |
| 3 | Template glue whitelist update (A.7) | e2e: init green | main/router/vite/lib/routes |
| 4 | Starter route: `/` welcome map | check + browser | static, service list introspection |
| 5 | Starter route: `/dashboard` resource page | check + browser | defer + partial + skeleton |
| 6 | Starter route: `/dashboard/live` SSE widget | check + browser | EventSource island |
| 7 | Starter route: `/forms` validation demo | check + browser | form-field + schema validation |
| 8 | Starter route: `/health` | check | content-negotiated |
| 9 | Scaffolded app deno.json imports block | check | auto-merged from registry items |
| 10 | `netscript init` e2e green | deno task e2e:cli | full scaffold.runtime suite |
| 11 | Generated-app check/lint/fmt green | raw deno | |
| 12 | Visual parity review vs playground | manual | browser screenshots |
| 13 | Run 3 README/docs sweep | doc-lint | |
| 14 | JSR dry-run from package dir | raw deno publish --dry-run | |
| 15 | Template manifest/loader cleanup | check | remove dead manifest keys |
| 16 | Route doc-headers | lint | "what this demonstrates / where to edit" |
