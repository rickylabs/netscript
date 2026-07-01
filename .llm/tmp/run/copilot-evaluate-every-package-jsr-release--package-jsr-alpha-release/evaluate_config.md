# Evaluate — `@netscript/config`

> Wave: **1** · Archetype: **A1 — Small Contract** · Pattern: **Function family + Builder**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__config.json` · `audit/dry-run/config.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 2 | 0 | — |
| Doctrine | 0 | 1 | 1 |
| Standards | 5 | 30 | 1 |

`deno publish --dry-run`: **❌ FAIL** · slow-type problems: **35**

## 2. Package facts

- **Name:** `@netscript/config` @ `0.1.0`
- **Description:** *(missing)*
- **Files / LOC:** 9 `.ts` files, 1977 lines
- **Exports:** `.`
- **README:** *(missing)*
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓
- **Test files:** 1
- **Public surface size:** .=49

## 3. Current folder tree (`packages/config/`, depth 4, capped at 80 entries)

```
env.ts
workspace.ts
types.ts
mod.ts
schema.ts
helpers.ts
loader.ts
deno.json
define-config.ts
workspace.test.ts
```

## 4. `deno publish --dry-run` output (tail)

```

  docs: https://jsr.io/go/missing-license

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
  --> /home/runner/work/netscript-start/netscript-start/packages/config/loader.ts:93:31
   | 
93 |   const module = await import(fileUrl);
   |                               ^^^^^^^ the unanalyzable dynamic import
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

error: Found 35 problems

```

## 5. Top JSR audit findings

- **FAIL** `F-JSR-3 readme` — README.md missing
- **FAIL** `F-JSR-4 description` — deno.json lacks `description` (used by JSR discoverability)

## 6. Top doctrine findings

- **WARN** `A8/AP-9` — file is 946 lines (cap 500) — split into smaller single-reason files (`schema.ts`)
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25

## 7. Top standards findings

- **FAIL** `NS-S-1.license` — deno.json `license` field missing (must be `MIT` for alpha)
- **FAIL** `NS-S-1.description` — deno.json `description` missing
- **WARN** `NS-S-1.version` — version is '0.1.0'; alpha cadence requires '0.0.1-alpha.0'
- **FAIL** `NS-S-1.publish-include` — deno.json `publish.include` missing — `deno publish` ships everything by default and that leaks tests/scratch
- **WARN** `NS-S-1.publish-exclude` — deno.json `publish.exclude` should explicitly drop `**/*_test.ts`, `tests/`, `examples/`
- **FAIL** `NS-S-1.strict` — deno.json compilerOptions.strict must be true
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.barrel-only` — mod.ts has 71 non-export/non-comment lines — barrels must be export-only
- **WARN** `NS-S-4.fn-prefix` — exported function 'findWorkspaceRoot' uses non-standard prefix 'find' — consult STANDARDS § 4.1 (`workspace.ts:61`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'discoverWorkspace' uses non-standard prefix 'discover' — consult STANDARDS § 4.1 (`workspace.ts:79`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'findMember' uses non-standard prefix 'find' — consult STANDARDS § 4.1 (`workspace.ts:128`)
- **WARN** `NS-S-4.types` — type 'NetScriptConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`types.ts`)
- **WARN** `NS-S-4.types` — type 'LoggingConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`types.ts`)
- **WARN** `NS-S-4.types` — type 'PathsConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`types.ts`)
- **WARN** `NS-S-4.types` — type 'ServiceConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`types.ts`)
- **WARN** `NS-S-4.types` — type 'AppConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`types.ts`)
- **WARN** `NS-S-4.types` — type 'DatabaseConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`types.ts`)
- **WARN** `NS-S-4.types` — type 'JobConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`types.ts`)
- **WARN** `NS-S-4.types` — type 'ScalingConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`types.ts`)
- **WARN** `NS-S-4.types` — type 'TopicRetentionConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`types.ts`)

## 8. Code-quality verdict

**Heavy restructure (35 slow-type problems).** Indicates the public DSL leaks generic accumulators across chained methods. Move to the abstract-base / DSL-with-explicit-Definition-type pattern (PUBLIC-SURFACE-PATTERNS § 3, § 4). README missing — blocks DX bar. Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.publish-exclude`, `NS-S-1.task`.

## 9. Test coverage assessment

1 test file(s) today — likely insufficient. Doctrine § 8 requires layered coverage (domain → ports → adapters → application). Audit results show the existing tests should be re-evaluated for meaningfulness (no `should work` style names; no internal imports).

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
