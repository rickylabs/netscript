# Evaluate — `@netscript/fresh-ui`

> Wave: **5** · Archetype: **A4 — DSL/Builder** · Pattern: **Function family + Components**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__fresh-ui.json` · `audit/dry-run/fresh-ui.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 1 | 2 | — |
| Doctrine | 0 | 2 | 1 |
| Standards | 1 | 8 | 2 |

`deno publish --dry-run`: **❌ FAIL** · slow-type problems: **6**

## 2. Package facts

- **Name:** `@netscript/fresh-ui` @ `0.1.0`
- **Description:** "Fresh UI registry seams and interactive foundations for NetScript."
- **Files / LOC:** 38 `.ts` files, 2949 lines
- **Exports:** `.`, `./interactive`
- **README:** 279 lines
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓, ./interactive: ✗
- **Test files:** 8
- **Public surface size:** .=5, ./interactive=7

## 3. Current folder tree (`packages/fresh-ui/`, depth 4, capped at 80 entries)

```
README.md
registry/
  manifest.ts
  islands/
    ThemeToggle.tsx
    SidebarToggle.tsx
    Toast.tsx
  components/
    ui/
      label.tsx
      input.tsx
      stats-grid.tsx
      breadcrumb.tsx
      empty-state.tsx
      pagination.tsx
      data-table.tsx
      button.tsx
      select.tsx
      progress.tsx
      alert.tsx
      card.tsx
      foundation.test.tsx
      spinner.tsx
      section-divider.tsx
      panel.tsx
      badge.tsx
      control-props.ts
      detail-layout.tsx
      filter-form.tsx
      separator.tsx
      icon-button.tsx
      form-field.tsx
      skeleton.tsx
      textarea.tsx
      switch.tsx
      page-header.tsx
      sidebar-shell.tsx
      checkbox.tsx
      inline-notice.tsx
  schema.ts
  lib/
    public-types.ts
    cn.ts
    toast.ts
    toast.test.ts
  theme/
    tokens.css
    components/
      forms.css
      surfaces.css
      actions.css
      feedback.css
    layouts.css
    styles.css
runtime/
  tooltip/
    Tooltip.tsx
    tooltip.types.ts
    use-tooltip.ts
    tooltip.test.ts
  tabs/
    use-tabs.ts
    tabs.utils.test.ts
    Tabs.tsx
    tabs.utils.ts
    tabs.types.ts
  sheet/
    sheet.types.ts
    Sheet.tsx
    use-sheet.ts
  dialog/
    use-dialog.ts
    dialog.test.ts
    dialog.types.ts
    Dialog.tsx
  drawer/
    drawer.types.ts
    use-drawer.ts
    drawer.test.ts
    Drawer.tsx
```

## 4. `deno publish --dry-run` output (tail)

```
  info: all functions in the public API must have an explicit return type
  docs: https://jsr.io/go/slow-type-missing-explicit-return-type

error[missing-explicit-return-type]: missing explicit return type in the public API
  --> /home/runner/work/netscript-start/netscript-start/packages/fresh-ui/runtime/sheet/Sheet.tsx:51:10
   | 
51 | function SheetClose({ children, ...props }: SheetCloseProps) {
   |          ^^^^^^^^^^ this function is missing an explicit return type
   | 
   = hint: add an explicit return type to the function

  info: all functions in the public API must have an explicit return type
  docs: https://jsr.io/go/slow-type-missing-explicit-return-type

This package contains errors for slow types. Fixing these errors will:

  1. Significantly improve your package users' type checking performance.
  2. Improve the automatic documentation generation.
  3. Enable automatic .d.ts generation for Node.js.

Don't want to bother? You can choose to skip this step by
providing the --allow-slow-types flag.

error: Found 6 problems

```

## 5. Top JSR audit findings

- **FAIL** `F-JSR-2 module-tag` — export ./interactive (./interactive.ts) lacks @module JSDoc tag (`./interactive.ts`)
- **WARN** `F-DOCT-4 vocabulary` — forbidden folder name 'lib' (utils/helpers/common/lib/interfaces) — needs migration plan + debt entry (`registry/lib`)
- **WARN** `F-DOCT-5 cardinality` — directory has 30 immediate children; doctrine cap is 12 (`registry/components/ui`)

## 6. Top doctrine findings

- **WARN** `AP-7/F-DOCT-4` — forbidden folder name 'lib' — split into domain/, application/, or adapters/ aligned to a real concern (`registry/lib`)
- **WARN** `F-DOCT-5` — directory has 30 immediate children; doctrine cap is 12 (`registry/components/ui`)
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25

## 7. Top standards findings

- **WARN** `NS-S-1.version` — version is '0.1.0'; alpha cadence requires '0.0.1-alpha.0'
- **FAIL** `NS-S-1.strict` — deno.json compilerOptions.strict must be true
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.barrel-only` — mod.ts has 7 non-export/non-comment lines — barrels must be export-only
- **WARN** `NS-S-4.fn-prefix` — exported function 'stripToastFromUrl' uses non-standard prefix 'strip' — consult STANDARDS § 4.1 (`registry/lib/toast.ts:68`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'requireFreshUiContext' uses non-standard prefix 'require' — consult STANDARDS § 4.1 (`runtime/_internal/context-error.ts:23`)
- **WARN** `NS-S-6.sections` — README missing 10/12 mandated sections (Overview, Quickstart, Mental model, API, Recipes, Configuration, Testing, Observability, Architecture, Stability, Compatibility, License)
- **WARN** `NS-S-8.location` — 8 inline *_test.ts files outside tests/ — consolidate under tests/<layer>/
- **WARN** `NS-S-9.logger` — package owns runtime/adapters but does not import @netscript/logger
- **INFO** `NS-S-9.telemetry` — package owns runtime/adapters but does not import @netscript/telemetry — verify spans/metrics emitted
- **INFO** `NS-S-10` — mod.ts does not export an `inspect<Noun>()` diagnostic — recommended discoverability axis

## 8. Code-quality verdict

**Small slow-type refactor (6 problems).** Add explicit return types on the published functions. Some entrypoints lack `@module` JSDoc — required for JSR scoring. Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.task`, `NS-S-3.barrel-only`.

## 9. Test coverage assessment

8 test files today. Audit them for: (a) names use behavioural sentences, (b) no imports from `src/internal/`, (c) no Jest globals, (d) port contracts shared via `./testing` entrypoint. Promote/rewrite as the plan's § 4 dictates.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
