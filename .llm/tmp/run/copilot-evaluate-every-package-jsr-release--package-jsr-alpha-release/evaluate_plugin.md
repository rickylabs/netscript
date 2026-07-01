# Evaluate — `@netscript/plugin`

> Wave: **3** · Archetype: **A4 — DSL/Builder** · Pattern: **DSL + Registry + Abstract base**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__plugin.json` · `audit/dry-run/plugin.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 0 | 1 | — |
| Doctrine | 0 | 2 | 1 |
| Standards | 1 | 11 | 1 |

`deno publish --dry-run`: **❌ FAIL** · slow-type problems: **33**

## 2. Package facts

- **Name:** `@netscript/plugin` @ `0.1.0`
- **Description:** "Plugin manifest, validation, discovery, and host-context contracts for NetScript."
- **Files / LOC:** 5 `.ts` files, 1956 lines
- **Exports:** `.`, `./types`, `./validator`, `./define`, `./loader`
- **README:** 35 lines
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓, ./types: ✓, ./validator: ✓, ./define: ✓, ./loader: ✓
- **Test files:** 0
- **Public surface size:** .=36, ./types=70, ./validator=9, ./define=5, ./loader=16

## 3. Current folder tree (`packages/plugin/`, depth 4, capped at 80 entries)

```
README.md
types.ts
mod.ts
loader.ts
define.ts
deno.json
validator.ts
```

## 4. `deno publish --dry-run` output (tail)

```
  info: all symbols in the public API must have an explicit type
  docs: https://jsr.io/go/slow-type-missing-explicit-type

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
   --> /home/runner/work/netscript-start/netscript-start/packages/plugin/loader.ts:162:31
    | 
162 |   const module = await import(source);
    |                               ^^^^^^ the unanalyzable dynamic import
    | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

This package contains errors for slow types. Fixing these errors will:

  1. Significantly improve your package users' type checking performance.
  2. Improve the automatic documentation generation.
  3. Enable automatic .d.ts generation for Node.js.

Don't want to bother? You can choose to skip this step by
providing the --allow-slow-types flag.

error: Found 33 problems

```

## 5. Top JSR audit findings

- **WARN** `F-JSR-3 readme` — README.md is only 35 lines; enterprise bar is ≥150 lines

## 6. Top doctrine findings

- **WARN** `A3` — README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
- **WARN** `A8/AP-9` — file is 1006 lines (cap 300) — split into smaller single-reason files (`types.ts`)
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25

## 7. Top standards findings

- **WARN** `NS-S-1.version` — version is '0.1.0'; alpha cadence requires '0.0.1-alpha.0'
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.barrel-only` — mod.ts has 93 non-export/non-comment lines — barrels must be export-only
- **WARN** `NS-S-4.types` — type 'PluginRuntimeConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`types.ts`)
- **WARN** `NS-S-4.types` — type 'PluginRegistryConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`types.ts`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'discoverLocalPlugins' uses non-standard prefix 'discover' — consult STANDARDS § 4.1 (`loader.ts:99`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'findPluginEntryPoint' uses non-standard prefix 'find' — consult STANDARDS § 4.1 (`loader.ts:131`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'sortPluginsByDependencies' uses non-standard prefix 'sort' — consult STANDARDS § 4.1 (`loader.ts:351`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'mergePlugins' uses non-standard prefix 'merge' — consult STANDARDS § 4.1 (`define.ts:139`)
- **WARN** `NS-S-6.length` — README is 35 lines; minimum is 150
- **WARN** `NS-S-6.sections` — README missing 12/12 mandated sections (Overview, Quickstart, Mental model, API, Recipes, Configuration, Testing, Observability, Architecture, Stability, Compatibility, License)
- **FAIL** `NS-S-8.coverage` — no tests/ directory and no inline *_test.ts files — every package needs meaningful tests
- **INFO** `NS-S-10` — mod.ts does not export an `inspect<Noun>()` diagnostic — recommended discoverability axis

## 8. Code-quality verdict

**Heavy restructure (33 slow-type problems).** Indicates the public DSL leaks generic accumulators across chained methods. Move to the abstract-base / DSL-with-explicit-Definition-type pattern (PUBLIC-SURFACE-PATTERNS § 3, § 4). No tests today — meaningful test plan needed (see § 9). Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.task`, `NS-S-3.barrel-only`.

## 9. Test coverage assessment

No tests today. **Required at alpha:** doctest of README examples, port contract suite (if package owns ports), one adapter conformance run per shipped adapter, and one application-layer scenario test. See § 4 of this evaluate doc's plan_ pair for the full test plan.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
