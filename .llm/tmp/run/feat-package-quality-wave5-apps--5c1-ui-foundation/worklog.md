# Worklog — Run 5c1 Composition foundation

> Implementation session for locked Wave 5c Run 1. Branch:
> `feat/package-quality-wave5-apps-5c1-ui-foundation` Base planning commit:
> `cda1c60` Date: 2026-06-11

## Design

### Public Surface

- `@netscript/fresh-ui`: package tasks, token artifacts, registry
  schema/manifest, L0 primitives, runtime hook internals for
  accordion/popover/tooltip, README/JSR publish surface.
- `@netscript/cli`: public commands `ui:init` and `ui:add <item|collection>`
  only in slices 13-14.
- Registry overlay: v2 item definitions with target placeholders,
  `registryDependencies`, `dependencies`, per-item CSS, `cssVars?`, and
  `author?`.

### Domain Vocabulary

- `RegistryItemKind`, `RegistryFileDefinition`, `RegistryCssContribution`,
  `RegistryCssVars`, `RegistryItemDefinition`, `RegistryCollectionDefinition`,
  `RegistryManifest`.
- Token source groups: primitives, semantic aliases, dark theme bindings, light
  theme overrides.
- Distribution targets: `@ui/`, `@islands/`, `@assets/`, `@lib/`, `~/`.
- Runtime tiers: Tier P platform engines, Tier Z Zag-backed machines.

### Ports

- File system and Deno JSON edits are owned by CLI adapters/use cases in slices
  13-14.
- Token generation consumes Style Dictionary v5 through a run-local/package
  task.
- Fitness gates execute raw `deno`/`git` commands and write no root lock state.

### Constants

- Run directory:
  `.llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/`.
- Package unit: `packages/fresh-ui`.
- CLI unit: `packages/cli`.
- Fitness gates introduced here: `tokens-drift`, `manifest-integrity`.

### Commit Slices

1. Package task block + file-list cleanup in fresh-ui `deno.json`.
2. DTCG 2025.10 token source with current hex parity.
3. Style Dictionary v5 build task and generated `tokens.css` parity proof.
4. Generated `theme-bridge.css` and `tokens.json`.
5. `tokens-drift` fitness gate.
6. Registry schema v2 types and manifest migration.
7. `manifest-integrity` fitness gate.
8. Per-item CSS extraction, move-only.
9. L0 conventions doc and primitives module.
10. Throwaway Zag x Fresh combobox spike evidence.
11. Accordion internals to native `<details name>` with public hook shape
    preserved.
12. Popover/tooltip internals to Popover API + anchor positioning + CSS fixed
    fallback.
13. `ui:init` command in `packages/cli`.
14. `ui:add <item|collection>` command in `packages/cli`.
15. OKLCH ramp re-derivation in token source.
16. README/docs/JSR dry-run sweep.

### Deferred Scope

- Run 2 owns playground conversion, living `/design`, and broader design-system
  reconciliation.
- Run 3 owns `netscript init` integration and generated starter app replacement.
- `block:add` contract-driven generation remains post-5c.

### Contributor Path

Start at `packages/fresh-ui/registry/schema.ts` for item contract changes, then
`packages/fresh-ui/registry/manifest.ts` for item inventory, then the fitness
gates under `.llm/tools/fitness/` for registry/token invariants. CLI
installation behavior lives under `packages/cli/src/public/features/ui/` once
slices 13-14 land.

## Baseline

Baseline saved to `measure-5c1.json`.

| Gate                | Command                                                                                                                             | Result                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Package-local check | `deno task --cwd packages/fresh-ui --frozen check`                                                                                  | PASS_WITH_WEAK_SIGNAL: exit 0, but `No matching files found`                  |
| Scoped check        | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh-ui --ext ts,tsx --pretty`                     | PASS: 77 files, 0 occurrences                                                 |
| Lint                | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh-ui --ext ts,tsx --pretty`                      | FAIL: exit 1 with 0 reported occurrences                                      |
| Fmt                 | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh-ui --ext ts,tsx --ignore-line-endings --pretty` | FAIL: exit 1 with 0 reported findings                                         |
| Test                | `deno task --cwd packages/fresh-ui --frozen test`                                                                                   | FAIL: no test modules found                                                   |
| Doc-lint            | `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/fresh-ui --pretty`                               | PASS: 0 combined doc-lint errors                                              |
| JSR dry-run         | `deno publish --dry-run --allow-dirty` from `packages/fresh-ui`                                                                     | FAIL: 39 problems, including excluded exported modules and 6 slow-type errors |

LOC/census: 6,861 TS/TSX/CSS LOC; 46 registry source files; 33 manifest items
across 6 collections (`theme`: 1, `component`: 28, `island`: 3, `support`: 1).
Root `deno.lock` remained clean.

## Slice Evidence

### Slice 1 — Package task block + file-list cleanup

Commit: `047558c`.

Changed:

- Replaced the brittle explicit `deno task check` file list in
  `packages/fresh-ui/deno.json` with glob-based `check` and `test` tasks.
- Added `packages/fresh-ui/deno.gates.json` so package-local tasks keep
  Fresh/Preact JSX and import settings without inheriting the root workspace
  exclude for `packages/fresh-ui`.
- Expanded only the run-local lock under this run directory; root `deno.lock`
  stayed untouched.

Evidence:

- `deno task --cwd packages/fresh-ui check` → PASS/exit 0, no
  `No matching files found`.
- `deno task --cwd packages/fresh-ui test` → PASS/exit 0, 30 passed / 0 failed.
- `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/fresh-ui --pretty`
  → PASS/exit 0, totalErrors 0.

Drift: none.

### Slice 5 — `tokens-drift` fitness gate

Commit: `42b9b92`.

Changed:

- Added `.llm/tools/fitness/check-token-drift.ts`.
- The gate runs raw `deno task --cwd packages/fresh-ui tokens:build`, verifies
  all generated token artifacts are tracked, then runs raw
  `git diff --exit-code` over `tokens.css`, `theme-bridge.css`, and
  `tokens.json`.

Evidence:

- `deno run --allow-run=deno,git .llm/tools/fitness/check-token-drift.ts` →
  PASS/exit 0, `tokens-drift: PASS 3 generated artifacts stable`.
- `deno task --cwd packages/fresh-ui check` → PASS/exit 0.
- `deno task --cwd packages/fresh-ui test` → PASS/exit 0, 30 passed / 0 failed.
- `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/fresh-ui --pretty`
  → PASS/exit 0, totalErrors 0.
- `deno fmt --check --no-config .llm/tools/fitness/check-token-drift.ts` →
  PASS/exit 0.
- `deno lint --no-config .llm/tools/fitness/check-token-drift.ts` → PASS/exit 0.

Drift: none.

### Slice 4 — Generated `theme-bridge.css` + `tokens.json`

Commit: `15a13e0`.

Changed:

- Extended `packages/fresh-ui/scripts/build-tokens.ts` to generate
  `registry/theme/theme-bridge.css` and `registry/theme/tokens.json` in addition
  to `tokens.css`.
- Moved Tailwind theme declarations out of `registry/theme/styles.css` and into
  generated `theme-bridge.css`, imported immediately after `tokens.css`.
- Generated the Tailwind bridge with `@theme inline`, preserving existing
  `--color-ns-*`, `--font-*`, `--radius-*`, and `--shadow-*` utility meanings
  while adding explicit `input-border`, spacing, radius-ns, and shadow-ns bridge
  entries.
- Added `registry/**/*.json` to package publish include so the generated
  `tokens.json` artifact is publishable.
- Added run-local bridge/token JSON integrity evidence.

Evidence:

- `deno task --cwd packages/fresh-ui tokens:check` → PASS/exit 0 after staging
  generated artifacts; build completed and generated outputs were stable.
- `deno run --allow-read --allow-write .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/verify-slice-04-theme-outputs.ts`
  → PASS/exit 0; stylesImportsBridge true, stylesInlineThemeBlocks 0,
  bridgeUsesThemeInline true, missingBridgeLines 0, rootTokenCount 134,
  lightTokenCount 27.
- `deno task --cwd packages/fresh-ui check` → PASS/exit 0, including
  `scripts/build-tokens.ts`.
- `deno task --cwd packages/fresh-ui test` → PASS/exit 0, 30 passed / 0 failed.
- `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/fresh-ui --pretty`
  → PASS/exit 0, totalErrors 0.
- `deno fmt --check --no-config ...` over changed package/run files → PASS/exit
  0, checked 7 files.
- `deno lint --no-config packages/fresh-ui/scripts/build-tokens.ts .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/verify-slice-04-theme-outputs.ts`
  → PASS/exit 0.

Drift: none.

### Slice 3 — Style Dictionary v5 build task + generated `tokens.css`

Commit: `bf4465f`.

Changed:

- Added `packages/fresh-ui/scripts/build-tokens.ts`, pinned to
  `npm:style-dictionary@5.4.4`.
- Added package tasks `tokens:build` and `tokens:check`.
- Excluded internal `scripts/**` from publish output so the Style Dictionary
  build helper does not become part of the public JSR package surface.
- Added run-local parity verifier and evidence at
  `slice-03-token-build-parity.json`.
- Regenerated `registry/theme/tokens.css`; it remained byte-identical to `HEAD`,
  so no CSS content diff was committed.

Evidence:

- `deno task --cwd packages/fresh-ui tokens:check` → PASS/exit 0; build
  completed and `git diff --exit-code registry/theme/tokens.css` found no CSS
  diff.
- `deno run --allow-read --allow-write --allow-run=git .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/verify-slice-03-token-build.ts`
  → PASS/exit 0; byte parity true, matching SHA-256
  `e0e53f0e63ae2bf0b7a0d8507bfdf76ec1761550aae251abf41452c85fc567df`, root 134
  declarations, light 27 declarations.
- `deno task --cwd packages/fresh-ui check` → PASS/exit 0, including
  `scripts/build-tokens.ts`.
- `deno task --cwd packages/fresh-ui test` → PASS/exit 0, 30 passed / 0 failed.
- `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/fresh-ui --pretty`
  → PASS/exit 0, totalErrors 0.
- `deno fmt --check --no-config ...` over the package task file, build script,
  verifier, and evidence JSON → PASS/exit 0, checked 4 files.
- `deno lint --no-config packages/fresh-ui/scripts/build-tokens.ts .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/verify-slice-03-token-build.ts`
  → PASS/exit 0.

Drift: none.

### Slice 2 — DTCG 2025.10 token source

Commit: `4ea5103`.

Changed:

- Added the DTCG token source layout under `packages/fresh-ui/tokens/`:
  `primitives.tokens.json`, `semantic.tokens.json`, `themes/dark.tokens.json`,
  and `themes/light.tokens.json`.
- Transcribed the current `registry/theme/tokens.css` root custom properties
  into 94 primitive tokens and 40 default semantic tokens, with light theme
  overrides for 27 custom properties.
- Recorded `color-scheme` as theme metadata so slice 3 generation can preserve
  the non-token CSS block property without hard-coding it.
- Added a run-local verifier and JSON evidence files for source-to-CSS parity.

Evidence:

- `deno run --allow-read --allow-write .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/verify-slice-02-token-source.ts`
  → PASS/exit 0, root 134/134 and light 27/27 with no missing, extra, or
  mismatched values.
- `deno task --cwd packages/fresh-ui check` → PASS/exit 0.
- `deno task --cwd packages/fresh-ui test` → PASS/exit 0, 30 passed / 0 failed.
- `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/fresh-ui --pretty`
  → PASS/exit 0, totalErrors 0.
- `deno fmt --check --no-config ...` over the token JSON and verifier files →
  PASS/exit 0, checked 7 files.
- `deno lint --no-config .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/verify-slice-02-token-source.ts`
  → PASS/exit 0.

Drift: none.
