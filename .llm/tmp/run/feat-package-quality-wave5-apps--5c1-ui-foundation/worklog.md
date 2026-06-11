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

### Slice 15 — OKLCH ramp re-derivation

Commit: pending.

Changed:

- Re-derived the existing primitive color token names as DTCG OKLCH color
  objects with populated hex fallbacks.
- Updated the token builder to emit CSS fallback declarations followed by
  `oklch()` declarations for OKLCH-backed tokens.
- Regenerated `registry/theme/tokens.css` and `registry/theme/tokens.json`;
  `theme-bridge.css` remained stable after rebuild.
- Added run-local derivation and verification scripts:
  `derive-slice-15-oklch.ts` and `verify-slice-15-oklch.ts`.
- Recorded ramp evidence in `slice-15-oklch-ramp-evidence.json`, verification
  evidence in `slice-15-oklch-verification.json`, and visual review artifacts in
  `slice-15-oklch-visual-review.html` plus `slice-15-oklch-visual-review.png`.

Evidence:

- `deno run --allow-read --allow-write .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/derive-slice-15-oklch.ts`
  → PASS/exit 0; generated OKLCH source values, hex fallbacks, JSON evidence,
  and visual review HTML.
- `deno task --cwd packages/fresh-ui tokens:build` → PASS/exit 0.
- `deno run --allow-run=deno,git .llm/tools/fitness/check-token-drift.ts` →
  PASS/exit 0, 3 generated artifacts stable after rebuild.
- `deno run --allow-read --allow-write .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/verify-slice-15-oklch.ts`
  → PASS/exit 0, 41 color tokens verified with OKLCH source, hex fallback, CSS
  fallback declaration, CSS OKLCH declaration, and visual artifacts.
- Browser visual review: served `slice-15-oklch-visual-review.html` over
  localhost and captured `slice-15-oklch-visual-review.png` (109524 bytes).
- `deno task --cwd packages/fresh-ui check` → PASS/exit 0.
- `deno task --cwd packages/fresh-ui test` → PASS/exit 0, 35 passed / 0 failed.
- `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/fresh-ui --pretty`
  → PASS/exit 0, totalErrors 0.
- `deno lint --no-config packages/fresh-ui/scripts/build-tokens.ts .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/derive-slice-15-oklch.ts .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/verify-slice-15-oklch.ts`
  → PASS/exit 0.
- `deno fmt --check --no-config ...` over the builder, token JSON, generated
  token JSON, derivation/verification scripts, and JSON evidence → PASS/exit 0.
- `git diff -- deno.lock packages/fresh-ui/deno.lock .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/gates/deno.lock`
  → PASS/exit 0, no lock-file diff.

Drift: none.

### Slice 14 — `ui:add <item|collection>` command

Commit: `b03f590`.

Changed:

- Added the public root command `ui:add <item|collection>`.
- Reused the Slice 13 registry installer for the locked resolution algorithm:
  manifest item/collection lookup, dependency topological sort, target
  placeholder mapping, source copy, copied relative import rewrite, dependency
  import-map merge, and CSS aggregator rewrite.
- Added command-tree assertion coverage for the new public command.
- Recorded item and collection smoke evidence in
  `slice-14-ui-add-evidence.json`.

Evidence:

- `deno task --cwd packages/cli check` → PASS/exit 0.
- `deno lint --no-config ...` over the UI feature files, touched root wiring
  files, and command-tree assertion → PASS/exit 0, checked 8 files.
- `deno fmt --check --config .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/gates/deno.fmt.json ...`
  over the UI feature files → PASS/exit 0, checked 5 files.
- `deno run --allow-all packages/cli/bin/netscript.ts ui:add button --project-root <run-local scratch app> --force`
  → PASS/exit 0; installed 5 dependency-resolved items, copied 11 files,
  merged 4 imports, wrote 2 per-item CSS imports, scratch file count 12.
- `deno run --allow-all packages/cli/bin/netscript.ts ui:add forms-core --project-root <run-local scratch app> --force`
  → PASS/exit 0; installed 15 dependency-resolved items, copied 26 files,
  merged 4 imports, wrote 9 per-item CSS imports, scratch file count 27.
- `deno test --allow-all packages/cli/src/local/composition/local-contributor-command-tree_test.ts`
  → PASS/exit 0.
- `git diff -- deno.lock packages/cli/deno.lock .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/gates/deno.lock`
  → PASS/exit 0, no lock-file diff.

Drift: none.

### Slice 13 — `ui:init` command

Commit: `9c2a38b`.

Changed:

- Added the public root command `ui:init` to the CLI command tree.
- Added a Fresh UI registry installer under
  `packages/cli/src/public/features/ui/` that resolves manifest items and
  collections, topologically includes `registryDependencies`, maps target
  placeholders (`@ui/`, `@islands/`, `@assets/`, `@lib/`, `~/`), copies
  registry files, rewrites copied relative registry imports, writes an
  `assets/styles.css` aggregator, and merges required `deno.json` imports.
- `ui:init` installs the locked starter item set from the plan. Dependencies
  resolve it to 27 installed registry items, 40 copied registry files, 12
  per-item CSS imports, and four import-map entries in the smoke app.
- Updated the local contributor command-tree assertion to include the current
  command surface, including `ui:init`.
- Recorded durable evidence in `slice-13-ui-init-evidence.json`.

Evidence:

- `deno task --cwd packages/cli check` → PASS/exit 0.
- `deno lint --no-config ...` over the new UI feature files, touched root
  wiring files, and command-tree assertion → PASS/exit 0, checked 6 files.
- `deno fmt --check --config .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/gates/deno.fmt.json ...`
  over the new UI feature files → PASS/exit 0, checked 3 files. The root repo
  fmt config excludes `packages/cli`, so pre-existing CLI root wiring files were
  left in their legacy style.
- `deno run --allow-all packages/cli/bin/netscript.ts ui:init --project-root <run-local scratch app> --force`
  → PASS/exit 0; installed 27 items, copied 40 files, wrote
  `assets/styles.css`, merged 4 imports, scratch file count 41.
- `deno run --allow-all packages/cli/bin/netscript.ts init slice13-init-smoke --path <run-local scratch> --ci --yes --no-git --no-aspire`
  → PASS/exit 0; existing `netscript init` path scaffolded successfully with 39
  files and 19 directories.
- `deno test --allow-all packages/cli/src/local/composition/local-contributor-command-tree_test.ts`
  → PASS/exit 0.
- Informational only: `deno task --cwd packages/cli test` → FAIL/exit 1 with
  unrelated existing failures in config/deploy tests, Vite fixture version
  expectations, and maintainer plugin copy fixtures. The slice-induced
  command-tree failure was fixed and passes focused test.
- `git diff -- deno.lock packages/cli/deno.lock .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/gates/deno.lock`
  → PASS/exit 0, no lock-file diff.

Drift: none.

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

### Slice 8 — Per-item CSS extraction

Commit: `097fde8`.

Changed:

- Moved aggregate CSS from
  `registry/theme/components/{actions,forms,surfaces,feedback}.css` into
  per-item/support CSS files under `registry/components/ui/`.
- Removed component aggregate imports from `registry/theme/styles.css`.
- Added registry style-support items for exact grouped CSS blocks:
  `form-control-styles`, `choice-styles`, `surface-styles`, `sheet-styles`, and
  `alert-styles`.
- Added per-item CSS files and `css` import contributions for button, form
  controls, surfaces, feedback, toast, progress, spinner, and skeleton seams.
- Updated registry dependencies exposed by extraction: `button` depends on
  `spinner`, `filter-form` depends on `card`, `sidebar-toggle` depends on
  `button`, and the foundation collection includes `sheet-styles`.

Evidence:

- `deno run --allow-read --allow-write --allow-run=git .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/verify-slice-08-css-move-only.ts --base-ref 91a01ee --json-out .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-08-css-move-only.json`
  → PASS/exit 0; 161/161 top-level CSS statements preserved, missing 0, extra 0.
- `deno run --allow-read --allow-write .llm/tools/fitness/check-manifest-integrity.ts --json-out .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-08-manifest-integrity.json`
  → PASS/exit 0; 61/61 registry files claimed, 4 excluded, no missing or
  unclaimed files.
- `deno task --cwd packages/fresh-ui check` → PASS/exit 0.
- `deno task --cwd packages/fresh-ui test` → PASS/exit 0, 30 passed / 0 failed.
- `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/fresh-ui --pretty`
  → PASS/exit 0, totalErrors 0.
- `deno fmt --check --config packages/fresh-ui/deno.gates.json packages/fresh-ui/registry/manifest.ts packages/fresh-ui/registry/theme/styles.css packages/fresh-ui/registry/components/ui/*.css`
  → PASS/exit 0.
- `deno fmt --check --no-config .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/verify-slice-08-css-move-only.ts .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-08-css-move-only.json .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-08-manifest-integrity.json`
  → PASS/exit 0.
- `deno lint --no-config .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/verify-slice-08-css-move-only.ts`
  → PASS/exit 0.

Drift: none.

### Slice 9 — L0 conventions doc and primitives module

Commit: `c256bdb`.

Changed:

- Added `@netscript/fresh-ui/primitives` as a package export.
- Added `VisuallyHidden`, `SrOnly`, and `Show` with package-owned public
  structural render types so `deno doc --lint` does not expose Preact private
  JSX internals.
- Added `packages/fresh-ui/docs/l0-conventions.md` documenting L0 layer rules,
  data/ARIA attribute conventions, native-first behavior, and token consumption.
- Updated README entrypoint/features/usage/architecture docs for L0 primitives.
- Added primitive tests, including JSX component usage for `VisuallyHidden`.
- Captured `deno doc` before/after and per-symbol snapshots in the run dir.

Evidence:

- `deno task --cwd packages/fresh-ui check` → PASS/exit 0.
- `deno task --cwd packages/fresh-ui test` → PASS/exit 0, 35 passed / 0 failed.
- `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/fresh-ui --pretty`
  → PASS/exit 0, totalErrors 0.
- `deno lint --config packages/fresh-ui/deno.gates.json packages/fresh-ui/primitives.tsx packages/fresh-ui/primitives.test.tsx`
  → PASS/exit 0.
- `deno fmt --check --config packages/fresh-ui/deno.gates.json packages/fresh-ui/deno.json packages/fresh-ui/primitives.tsx packages/fresh-ui/primitives.test.tsx packages/fresh-ui/README.md packages/fresh-ui/docs/l0-conventions.md`
  → PASS/exit 0.
- `deno doc --json packages/fresh-ui/mod.ts` before/after captured at
  `slice-09-deno-doc-mod-before.json` and `slice-09-deno-doc-mod-after.json`.
- `deno doc --json packages/fresh-ui/primitives.tsx` captured at
  `slice-09-deno-doc-primitives-after.json`; `deno doc --filter` snapshots
  captured for `VisuallyHidden`, `SrOnly`, and `Show`.

Drift: none.

### Slice 10 — Zag x Fresh combobox spike

Commit: `ac0e1a3`.

Changed:

- Added a throwaway Fresh 2 scratch app under
  `.llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-10-zag-fresh-spike/`.
- Implemented a combobox island probe using current `@zag-js/combobox@1.41.2`
  and `@zag-js/preact@1.41.2` APIs: `combobox.collection`, `combobox.machine`,
  `combobox.connect`, `useMachine`, and `normalizeProps`.
- Captured direct Fresh SSR HTML and summary evidence at `slice-10-ssr.html` and
  `slice-10-ssr-summary.json`.
- Captured the Fresh Vite hydration startup failure in
  `slice-10-dev-server.stderr.log`.
- Recorded run-local drift D-5c1-1 and D-5c1-2.

Evidence:

- `deno task check` from the scratch app → PASS/exit 0, with
  `deno check --no-lock --unstable-kv main.tsx client.ts vite.config.ts routes/**/*.tsx islands/**/*.tsx`.
- `deno lint main.tsx client.ts vite.config.ts routes/_app.tsx routes/index.tsx islands/ZagComboboxSpike.tsx`
  from the scratch app → PASS/exit 0, checked 6 files.
- `deno fmt --check deno.json main.tsx client.ts vite.config.ts routes/_app.tsx routes/index.tsx islands/ZagComboboxSpike.tsx`
  from the scratch app → PASS/exit 0, checked 7 files.
- `deno run -A --no-lock main.tsx` plus GET `http://127.0.0.1:8071/` → PASS/HTTP
  200; SSR marker true, Zag combobox scope true, selected city true, hydration
  script false.
- `deno run -A --no-lock npm:vite@7.3.5 --host 127.0.0.1 --port 8071` → FAIL
  before serving a page with
  `TypeError: Cannot read properties of undefined (reading 'unref')` in
  `esbuild@0.27.7` while Vite loads `vite.config.ts`.
- `deno task --cwd packages/fresh-ui check` → PASS/exit 0.
- `deno task --cwd packages/fresh-ui test` → PASS/exit 0, 35 passed / 0 failed.
- `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/fresh-ui --pretty`
  → PASS/exit 0, totalErrors 0.
- `deno fmt --check --no-config` over drift/evidence/SSR summary files →
  PASS/exit 0.

Diagnostics:

- `deno task --cwd packages/fresh-ui lint` and
  `deno task --cwd packages/fresh-ui fmt:check` still fail before checking code
  because the package aliases resolve `.llm/tools/*` relative to
  `packages/fresh-ui`.
- Root scoped lint/fmt wrappers reproduce the baseline quirk: exit 1 with zero
  reported findings.
- Direct package-wide lint/fmt diagnostics fail on pre-existing package debt
  outside the Slice 10 scratch artifact.

Drift:

- D-5c1-1: scratch app hosting used because the playground app is outside this
  framework worktree.
- D-5c1-2: Fresh Vite hydration blocked by the Deno/Vite/esbuild `unref`
  failure; Tier Z shipping remains no-go until builder-backed hydration evidence
  passes in a reachable app environment.

### Slice 11 — Accordion internals to native details

Commit: `bdaebad`.

Changed:

- `Accordion.Root` now renders the existing root data contract instead of only a
  context provider.
- `Accordion.Item` now renders native `details` while preserving the item data
  attributes.
- `useAccordion().getItemProps` adds controlled `open` and grouped `name` for
  non-multiple accordions, preserving the public return type.
- `Accordion.ItemTrigger` now renders `summary`, strips button-only `type` and
  `disabled` from the DOM, maps disabled state to `aria-disabled`, and delegates
  clicks through the existing hook event pipeline.
- Captured before/after `deno doc` snapshots for the interactive entrypoint,
  accordion module, and `useAccordion` module.

Evidence:

- `deno task --cwd packages/fresh-ui check` → PASS/exit 0.
- `deno task --cwd packages/fresh-ui test` → PASS/exit 0, 35 passed / 0 failed.
- `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/fresh-ui --pretty`
  → PASS/exit 0, totalErrors 0.
- `deno lint --config packages/fresh-ui/deno.gates.json packages/fresh-ui/runtime/accordion/Accordion.tsx packages/fresh-ui/runtime/accordion/use-accordion.ts packages/fresh-ui/runtime/accordion/accordion.test.ts`
  → PASS/exit 0, checked 3 files.
- `deno fmt --check --config packages/fresh-ui/deno.gates.json packages/fresh-ui/runtime/accordion/Accordion.tsx packages/fresh-ui/runtime/accordion/use-accordion.ts`
  → PASS/exit 0, checked 2 files.
- `slice-11-public-shape-preservation.json` reports `publicShapePreserved: true`
  for `interactive`, `accordion-module`, and `use-accordion-module`.

Drift: none.

### Slice 12 — Popover API and CSS anchor positioning

Commit: `802e001`.

Changed:

- Added internal `platform-popover` helpers for native popover synchronization,
  anchor-name generation, placement-to-position-area mapping, and style merging.
- Updated popover trigger/content props with `popovertarget`,
  `popovertargetaction`, `popover="auto"`, native toggle synchronization, and
  anchor-positioning style hooks.
- Updated tooltip trigger/content props with `interestfor`, `popover="manual"`,
  native popover synchronization, and anchor-positioning style hooks.
- Replaced touched tooltip `window.setTimeout` calls with `globalThis` while
  preserving existing delay behavior.
- Added `registry/components/ui/floating.css` with fixed/inset fallback and
  anchor positioning under `@supports`.
- Added the `floating-styles` manifest item so the new registry CSS source is
  claimed by manifest-integrity.
- Captured before/after `deno doc` snapshots for the interactive entrypoint and
  both hook modules.

Evidence:

- `deno task --cwd packages/fresh-ui check` → PASS/exit 0.
- `deno task --cwd packages/fresh-ui test` → PASS/exit 0, 35 passed / 0 failed.
- `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/fresh-ui --pretty`
  → PASS/exit 0, totalErrors 0.
- `deno lint --config packages/fresh-ui/deno.gates.json packages/fresh-ui/runtime/_internal/platform-popover.ts packages/fresh-ui/runtime/popover/use-popover.ts packages/fresh-ui/runtime/tooltip/use-tooltip.ts packages/fresh-ui/registry/manifest.ts packages/fresh-ui/runtime/popover/popover.test.ts packages/fresh-ui/runtime/tooltip/tooltip.test.ts`
  → PASS/exit 0, checked 6 files.
- `deno fmt --check --config packages/fresh-ui/deno.gates.json packages/fresh-ui/runtime/_internal/platform-popover.ts packages/fresh-ui/runtime/popover/use-popover.ts packages/fresh-ui/runtime/tooltip/use-tooltip.ts packages/fresh-ui/registry/manifest.ts`
  → PASS/exit 0, checked 4 files.
- `deno fmt --check --no-config packages/fresh-ui/registry/components/ui/floating.css .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-12-manifest-integrity.json`
  → PASS/exit 0.
- `deno run --allow-read --allow-write .llm/tools/fitness/check-manifest-integrity.ts --json-out .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-12-manifest-integrity.json`
  → PASS/exit 0, 62/62 registry files claimed, 4 excluded.
- `slice-12-public-shape-preservation.json` reports `publicShapePreserved: true`
  for `interactive`, `use-popover-module`, and `use-tooltip-module`.

Drift: none; this follows parent D-7 with CSS fallback and no polyfill.

### Slice 7 — `manifest-integrity` fitness gate

Commit: `6977b9b`.

Changed:

- Added `.llm/tools/fitness/check-manifest-integrity.ts`.
- Added run-local evidence at `slice-07-manifest-integrity.json`.
- Claimed shared registry support files as manifest items: `cn`, `public-types`,
  and `control-props`.
- Added `theme-seed` registry dependencies on `cn` and `public-types` so future
  `ui:add` dependency resolution has manifest-owned copy targets for shared
  support files.

Evidence:

- `deno run --allow-read --allow-write .llm/tools/fitness/check-manifest-integrity.ts --json-out .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-07-manifest-integrity.json`
  → PASS/exit 0; 44/44 registry files claimed, 4 verification/manifest files
  excluded, no missing files, unclaimed files, duplicate items, duplicate
  sources, invalid targets, unknown dependencies, or authorless items.
- `deno task --cwd packages/fresh-ui check` → PASS/exit 0.
- `deno task --cwd packages/fresh-ui test` → PASS/exit 0, 30 passed / 0 failed.
- `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/fresh-ui --pretty`
  → PASS/exit 0, totalErrors 0.
- `deno fmt --check --config packages/fresh-ui/deno.gates.json packages/fresh-ui/registry/manifest.ts`
  → PASS/exit 0.
- `deno fmt --check --no-config .llm/tools/fitness/check-manifest-integrity.ts .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-07-manifest-integrity.json`
  → PASS/exit 0.
- `deno lint --no-config .llm/tools/fitness/check-manifest-integrity.ts` →
  PASS/exit 0.

Drift: none.

### Slice 6 — Registry schema v2 types + manifest migration

Commit: `999fdf9`.

Changed:

- Expanded `RegistryItemKind` and migrated `RegistryFileDefinition` from
  `destination` to `target`.
- Added v2 fields: `title?`, `author?`, `registryDependencies?`, external
  `dependencies?`, `css?`, `cssVars?`, `docs?`, `categories?`, and `meta?`.
- Set manifest `schemaVersion: 2` and
  `tokenSourceStrategy: 'style-dictionary-dtcg-source'`.
- Migrated manifest file targets to placeholders: `@ui/`, `@islands/`,
  `@assets/`, and `@lib/`.
- Converted registry dependency object arrays to string `registryDependencies`.
- Converted layer-3 UI items to `kind: 'block'`.
- Added `author: 'NetScript'` to all items.
- Updated `theme-seed` to claim `theme-bridge.css` and `tokens.json` and expose
  representative `cssVars` metadata.

Evidence:

- `deno run --allow-read --allow-write .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/verify-slice-06-registry-v2.ts`
  → PASS/exit 0; schemaVersion 2, itemCount 33, blockItemCount 10,
  invalidTargets 0, oldDependencyShape 0, registryDependencyErrors 0,
  authorlessItems 0, themeSeed generated files present, cssVars present.
- `deno task --cwd packages/fresh-ui check` → PASS/exit 0.
- `deno task --cwd packages/fresh-ui test` → PASS/exit 0, 30 passed / 0 failed.
- `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/fresh-ui --pretty`
  → PASS/exit 0, totalErrors 0.
- `deno fmt --check --config packages/fresh-ui/deno.gates.json packages/fresh-ui/registry/schema.ts packages/fresh-ui/registry/manifest.ts`
  → PASS/exit 0.
- `deno fmt --check --no-config .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/verify-slice-06-registry-v2.ts .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-06-registry-v2-integrity.json`
  → PASS/exit 0.
- `deno lint --no-config .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/verify-slice-06-registry-v2.ts`
  → PASS/exit 0.

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
