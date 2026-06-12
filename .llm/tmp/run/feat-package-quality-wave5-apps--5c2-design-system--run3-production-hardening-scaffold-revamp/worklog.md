# Worklog: Run 3 production hardening + scaffold revamp

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-package-quality-wave5-apps--5c2-design-system--run3-production-hardening-scaffold-revamp` |
| Branch | `feat/package-quality-wave5-apps-5c2-design-system` |
| Archetype | `3 - Runtime/Behavior` for fresh-ui; `6 - CLI/Tooling` for scaffold revamp |
| Scope overlays | `frontend`, `docs` |

## Design

### Public Surface

- `@netscript/fresh-ui` root helpers: `cn`, `withToast`, `getToast`, `stripToastFromUrl`.
- `@netscript/fresh-ui/interactive`: Accordion, Dialog, Drawer, Popover, Sheet, Tabs, Tooltip.
- `@netscript/fresh-ui/primitives`: Show, VisuallyHidden, SrOnly.
- Copy-source registry payload installed through NetScript CLI `ui:init` / `ui:add`.
- CLI scaffold path: `netscript-dev init`, `ui:init`, `ui:add`, generated Fresh routes and app pages.

### Domain Vocabulary

- Registry item - copy-source unit with kind, layer, files, dependencies, collections, and docs.
- L0/L1/L2/L3/L4 - layer ownership model from `docs/l0-conventions.md`.
- Theme seed - NS One token artifacts and Tailwind bridge.
- Design route - living reference route for tokens, components, and composition.
- Scaffolded app - generated NetScript Fresh app that consumes the fresh-ui registry.
- Zag spike - evidence-only validation of a Preact/Fresh island using a Zag machine.

### Ports

- File-system/template port - existing CLI scaffold machinery that writes generated app files.
- Browser validation port - Playwright/browser tooling against real local routes.
- Registry install port - CLI path that resolves fresh-ui registry items and copies files.
- No new package-owned abstraction is planned until a slice proves it is needed.

### Constants

- `RUN_ID` - `feat-package-quality-wave5-apps--5c2-design-system--run3-production-hardening-scaffold-revamp`.
- `FRESH_UI_VERSION_TARGET` - `0.1.0`.
- `DESIGN_ROUTES` - `/design/tokens`, `/design/components`, `/design/composition`.
- `BROWSER_VIEWPORT_MOBILE` - `390x844`.
- `LOCKED_SLICES` - slices 1 through 16 exactly as recorded in `plan.md`.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | C-1 single deno config | package `deno task check` + `test` | `packages/fresh-ui/deno.json`, `packages/fresh-ui/deno.gates.json` |
| 2 | C-2 package lock policy | approved policy + package gates | `packages/fresh-ui/deno.lock` or ignore/config files |
| 3 | C-3 manifest/schema moved out of payload | package + CLI ui gate | `packages/fresh-ui/registry*`, CLI registry references |
| 4 | C-4 sheet/floating styles gallery wiring | browser `/design/components` | registry styles, playground copies/gallery |
| 5 | C-5 tests consolidated + C-6 version `0.1.0` | package test/check | `packages/fresh-ui/tests/**`, `deno.json`, registry manifest |
| 6 | C-7 fmt ownership + C-8 DS gates in arch check | fmt + `arch:check` + negative tests | package/root config, `.llm/tools/fitness/**`, task wiring |
| 7 | C-12 Zag ADR spike | Fresh island SSR/hydration/bundle evidence | spike island/route, `docs/architecture.md` |
| 8 | C-9 `ns-responsive-table` L3 block | full horizontal loop + browser | registry block/css/manifest, playground copies/gallery/tests |
| 9 | C-11 docs scaffold + doctests | doctest fixture + publish include | `packages/fresh-ui/docs/**`, tests fixture, README/publish config |
| 10 | C-10 remove `netscript-standards` shim | reference check + repo gate | `.agents/skills/netscript-standards/**` or references |
| 11 | JSR release readiness | clean `deno publish --dry-run`, jsr-audit | README/docs/final package config |
| 12 | Scaffold audit gap report | audit artifact + no source behavior change unless needed | CLI scaffold templates, run artifact |
| 13 | Scaffold consumes ui init/add | generated app typecheck | CLI scaffold/ui install integration |
| 14 | Scaffold design routes | browser design routes | CLI templates/routes/assets |
| 15 | Scaffold app pages on registry components | generated app gates | CLI templates/routes/components |
| 16 | E2E proof | `scaffold.runtime` + browser evidence | generated app evidence/run artifacts |

### Deferred Scope

- Existing seven interactive components are not migrated to Zag.
- Public JSR-backed `netscript` validation after all packages publish is release-program scope, not
  this local-source maintainer scaffold run.
- Full CLI doctrine debt closure is not implied by scaffold revamp.

### Contributor Path

To add a registry component after this run, start in `packages/fresh-ui/registry/`, follow
`docs/l0-conventions.md`, register the item, run package and DS gates, copy into
`apps/playground`, add a real design route example, browser-gate it, then update scaffold templates
only if the generated app should ship it by default.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-06-12 | bootstrap | skills/read order | Read harness, doctrine, fresh-ui horizontal, design, impeccable text, netscript-cli, jsr-audit, deno-fresh, plan of record, L0/theme/README, frontend overlay, doctrine files, and curated docs. |
| 2026-06-12 | bootstrap | run artifact lock | Created Run 3 artifacts and locked the 16-slice table before code edits. |
| 2026-06-12 | blocked | plan-gate | No Run 3 `plan-eval.md` found; implementation must wait for separate evaluator `PASS` or explicit waiver. |
| 2026-06-12 | plan context | Zag evidence | User clarified Zag has already been proved working in a previous commit and mentioned in PR #32; Slice 7 should cite that evidence in the ADR. |
| 2026-06-12 | plan-gate | evaluator | OpenHands PLAN-EVAL wrote `plan-eval.md` with `PASS`; implementation began after this point. |
| 2026-06-12 | Slice 1 | implementation | Folded `packages/fresh-ui/deno.gates.json` into `deno.json`, removed `--config deno.gates.json` from package tasks, preserved `--no-lock` for C-2, and synced the same config ownership change to repo-genesis. |
| 2026-06-12 | Slice 1 | gates | Framework package check/test/tokens and both DS fitness gates passed; repo-genesis package check/test passed. |
| 2026-06-12 | Slice 2 | decision | User approved continuing without interruption; applied the package-lock policy as tracked package-local `packages/fresh-ui/deno.lock` with explicit `--lock=deno.lock` tasks. |
| 2026-06-12 | Slice 2 | implementation | Removed `--no-lock` from package tasks, added explicit package-local lock usage, tracked `packages/fresh-ui/deno.lock`, and synced the same policy to repo-genesis. An initial root `deno.lock` mutation was restored before gates. |
| 2026-06-12 | Slice 2 | gates | Framework package check/test/tokens and both DS fitness gates passed; repo-genesis package check/test passed. |
| 2026-06-12 | Slice 3 | implementation | Moved `registry/manifest.ts` and `registry/schema.ts` to package-root `registry.manifest.ts` and `registry.schema.ts`; updated package tests and CLI `ui:add` manifest lookup to root support files. |
| 2026-06-12 | Slice 3 | negative test | Added a CLI registry test proving the manifest URL resolves to package-root `registry.manifest.ts` and not payload-local `registry/manifest.ts`. |
| 2026-06-12 | Slice 3 | gates | CLI registry test/check passed; framework package check/test/tokens and both DS fitness gates passed; repo-genesis package check/test passed. |
| 2026-06-12 | Slice 4 | implementation | Copied `sheet.css` and `floating.css` into the repo-genesis playground, imported them from `assets/styles.css`, and added a Fresh island demo for Sheet, Popover, and Tooltip on `/design/components`. |
| 2026-06-12 | Slice 4 | gates | Framework package check/test/tokens and both DS fitness gates passed; focused playground fmt/lint/check passed; browser report passed with desktop, popover, tooltip, sheet, mobile 390x844, reduced-motion, and theme-flip screenshots. |
| 2026-06-12 | Slice 5 | implementation | Moved all 11 fresh-ui tests under `packages/fresh-ui/tests/`, retargeted imports to source files, changed publish exclusion to structural `tests/**`, narrowed the package test task to `tests/**/*.ts(x)`, and aligned framework package version to `0.1.0`. |
| 2026-06-12 | Slice 5 | gates | Framework package check/test/tokens and both DS fitness gates passed; repo-genesis fresh-ui package check/test passed. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Stop before implementation pending Plan-Gate | Harness run-loop hard stop applies; no Run 3 plan-eval artifact found. | `.llm/harness/workflow/run-loop.md` |
| Treat missing `.claude/skills/netscript-doctrine` as drift, not blocker | Equivalent `.agents/skills/netscript-doctrine` exists and was read. | prompt + filesystem |
| Use checked-in `.llm/tmp/docs/` before web | User instruction; sufficient curated notes exist for planned slices. | prompt |
| Treat Zag as prior proof to cite, not an unknown viability question | User says Zag already works in a previous commit and is mentioned in PR #32. | user clarification |
| Track package-local fresh-ui lock | User approved Slice 2 continuation; local package lock gives publish-readiness determinism while avoiding root lock ownership. | user approval + C-2 |
| Keep registry support code outside copy payload | C-3 requires `registry/` to contain copy-source payload only; `ui:add` now imports `registry.manifest.ts` from the package root. | plan of record C-3 |
| Use repo-genesis playground as the gallery worktree for visual slices | The framework repo has no `apps/` directory; the real playground app lives in the outer repo-genesis worktree. | filesystem + prior run context |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| `.claude/skills/netscript-doctrine/SKILL.md` absent; `.agents` equivalent used. | minor | yes |
| Impeccable helper scripts/references absent at repo-local skill path; skill text used. | minor | yes |
| `.resources/deps-docs/` absent; `.llm/tmp/docs/` used. | minor | yes |
| No Run 3 Plan-Gate artifact found. | significant | yes |
| `rg`/`rtk grep` unavailable in shell. | minor | yes |
| repo-genesis fresh-ui copy has broader pre-existing package drift; Slice 1 synced only config ownership. | minor | yes |
| repo-genesis package lock captures a broader workspace dependency closure than the framework worktree lock. | minor | yes |
| repo-genesis worktree lacks the CLI source path, so Slice 3 CLI lookup changes sync only in the framework repo. | minor | yes |
| framework repo lacks `apps/playground`; visual gallery changes live in repo-genesis only. | minor | yes |
| Playwright MCP profile locked; isolated Playwright Core script used installed Chrome for browser evidence. | minor | yes |
| Full playground `deno task check` blocked by unrelated CRLF-only fmt drift in existing copied files. | minor | yes |
| Bare package `deno fmt --check` finds no targets under current fmt ownership. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Plan-Gate presence | `Get-ChildItem -Recurse .llm/tmp/run -Filter plan-eval.md` | FAIL_BLOCKED | No Run 3 plan-eval artifact. |
| Git status | `rtk git status --short --branch` | PASS_WITH_UNTRACKED | Existing untracked `.playwright-mcp/` and `packages/fresh-ui/deno.lock`; not touched. |
| Plan-Gate verdict | `.llm/tmp/run/.../plan-eval.md` | PASS | OpenHands PLAN-EVAL allowed implementation under the locked 16-slice table. |
| Slice 1 package check | `deno task check` from `packages/fresh-ui` | PASS | Unified package config resolved without `deno.gates.json`. |
| Slice 1 package test | `deno task test` from `packages/fresh-ui` | PASS | 36 passed, 0 failed. |
| Slice 1 tokens | `deno task tokens:check` from `packages/fresh-ui` | PASS | Generated token artifacts had no diff. |
| Slice 1 repo-genesis check | `deno task check` from outer `packages/fresh-ui` | PASS | Targeted copy validation. |
| Slice 1 repo-genesis test | `deno task test` from outer `packages/fresh-ui` | PASS | 30 passed, 0 failed. |
| Slice 2 package check | `deno task check` from `packages/fresh-ui` | PASS | Explicit package-local `--lock=deno.lock`; root lock clean afterward. |
| Slice 2 package test | `deno task test` from `packages/fresh-ui` | PASS | 36 passed, 0 failed. |
| Slice 2 tokens | `deno task tokens:check` from `packages/fresh-ui` | PASS | Generated token artifacts had no diff. |
| Slice 2 repo-genesis check | `deno task check` from outer `packages/fresh-ui` | PASS | Explicit package-local lock in outer copy. |
| Slice 2 repo-genesis test | `deno task test` from outer `packages/fresh-ui` | PASS | 30 passed, 0 failed. |
| Slice 3 CLI registry test | `deno test --no-lock packages/cli/src/public/features/ui/registry.test.ts` | PASS | 6 passed, including root manifest URL negative/path test. |
| Slice 3 CLI registry check | `deno check --no-lock --unstable-kv packages/cli/src/public/features/ui/registry.ts packages/cli/src/public/features/ui/registry.test.ts` | PASS | Targeted check for `ui:add` manifest lookup. |
| Slice 3 package check | `deno task check` from `packages/fresh-ui` | PASS | Manifest/schema support files checked from package root. |
| Slice 3 package test | `deno task test` from `packages/fresh-ui` | PASS | 36 passed, 0 failed. |
| Slice 3 tokens | `deno task tokens:check` from `packages/fresh-ui` | PASS | Generated token artifacts had no diff. |
| Slice 3 repo-genesis check | `deno task check` from outer `packages/fresh-ui` | PASS | Explicit outer check list updated for root manifest/schema files. |
| Slice 3 repo-genesis test | `deno task test` from outer `packages/fresh-ui` | PASS | 30 passed, 0 failed. |
| Slice 4 package check | `deno task check` from `packages/fresh-ui` | PASS | No framework package code changed; required per-slice package gate. |
| Slice 4 package test | `deno task test` from `packages/fresh-ui` | PASS | 36 passed, 0 failed. |
| Slice 4 tokens | `deno task tokens:check` from `packages/fresh-ui` | PASS | Generated token artifacts had no diff. |
| Slice 4 playground focused fmt | `deno fmt --check assets/styles.css assets/design.css islands/design/FloatingSurfaceDemo.tsx routes/(design)/design/components.tsx` | PASS | Touched visual files only. |
| Slice 4 playground focused lint | `deno lint islands/design/FloatingSurfaceDemo.tsx routes/(design)/design/components.tsx` | PASS | Touched TSX files only. |
| Slice 4 playground focused check | `deno check --no-lock --unstable-kv islands/design/FloatingSurfaceDemo.tsx routes/(design)/design/components.tsx` | PASS | Root lock clean after restore. |
| Slice 4 playground full check | `deno task check` from outer `apps/playground` | FAIL_DRIFT | Pre-existing CRLF-only fmt drift in unrelated copied files; logged in drift.md and not normalized. |
| Slice 5 package check | `deno task check` from `packages/fresh-ui` | PASS | Checks source and relocated `tests/` files. |
| Slice 5 package test | `deno task test` from `packages/fresh-ui` | PASS | 36 passed from `tests/`. |
| Slice 5 tokens | `deno task tokens:check` from `packages/fresh-ui` | PASS | Generated token artifacts had no diff. |
| Slice 5 repo-genesis check | `deno task check` from outer `packages/fresh-ui` | PASS | Explicit source list unchanged; tests compile through `deno task test`. |
| Slice 5 repo-genesis test | `deno task test` from outer `packages/fresh-ui` | PASS | 36 passed from `tests/`. |
| Slice 5 package fmt probe | `deno fmt --check` from `packages/fresh-ui` | FAIL_DRIFT | No target files found; fmt ownership is locked to Slice 6. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| F-1..F-18 | NOT_RUN | Plan-Gate blocked | Superseded by Slice 1 gate rows where applicable; full `arch:check` remains due in the promoted-gate slice. |
| DS no raw hex | NOT_RUN | Plan-Gate blocked | Run after relevant slice edits. |
| DS color utilities | NOT_RUN | Plan-Gate blocked | Run after relevant slice edits. |
| DS no raw hex | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-no-raw-hex.ts` | 93 files clean. |
| DS color utilities | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-color-utilities.ts` | 93 files clean. |
| DS no raw hex | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-no-raw-hex.ts` | Slice 2; 93 files clean. |
| DS color utilities | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-color-utilities.ts` | Slice 2; 93 files clean. |
| DS no raw hex | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-no-raw-hex.ts` | Slice 3; 93 files clean. |
| DS color utilities | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-color-utilities.ts` | Slice 3; 93 files clean. |
| DS no raw hex | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-no-raw-hex.ts` | Slice 4; 93 files clean. |
| DS color utilities | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-color-utilities.ts` | Slice 4; 93 files clean. |
| DS no raw hex | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-no-raw-hex.ts` | Slice 5; 93 files clean. |
| DS color utilities | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-color-utilities.ts` | Slice 5; 93 files clean. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Browser validation | NOT_RUN | Plan-Gate blocked | Required for visual slices. |
| Slice 4 browser validation | PASS | `deno run -A --no-lock .../slice4-browser-check.ts` | `slice4-browser-report.json`: SSR 200, no console/page errors, sheet/floating items and CSS loaded, popover/tooltip/sheet screenshots, theme flip, 390x844 no overflow, reduced motion matched. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| apps/playground | NOT_RUN | Plan-Gate blocked | Required after visual/package integration edits. |
| generated scaffold | NOT_RUN | Plan-Gate blocked | Required in slices 13-16. |

## Handoff Notes

- Evaluator should inspect `plan.md`, this `## Design` section, `research.md`, and `drift.md`
  first.
- Slice 1 implementation commits: framework `52a9ab24ed4dd32801a8422bf85b591367d62999`;
  repo-genesis `a76b344600de529c00d3d707db4f61be8997201a`.
- Slice 2 implementation commits: framework `17f410390396f079c8abd184522871a46abd95fc`;
  repo-genesis `808a6bd3d24a4f2ad4e1b622f48ea2f8a9d1792f`.
- Slice 3 implementation commits: framework `84558e0e2eab6d314763fa1d339a173786e15a34`;
  repo-genesis `5137ec90f7e3a758601d2ce3cf6373c5768cae37`.
- Slice 4 implementation commit: repo-genesis `84748b56be0199a193bf556a454d62fd55937c02`.
- Slice 5 implementation commits: framework `c7014af6d3cea8f28cebd78c929765dc9234202e`;
  repo-genesis `c83d2e1639b1ffd846b934ec156513a34a11a093`.

## 2026-06-12 - Slice 6: C-7 fmt ownership + C-8 arch gate promotion

### Changed

- Expanded `packages/fresh-ui` formatter ownership to CSS and Markdown through the package
  `deno.json`.
- Removed the root fmt exclusion for `packages/fresh-ui/` while leaving root check/lint package
  exclusions unchanged.
- Added `.llm/tools/fitness/check-architecture-gates.ts` and wired root `deno task arch:check`
  to run doctrine for `packages/fresh-ui` plus both DS fitness gates.
- Added `--root` support to `check-ds-no-raw-hex.ts` and `check-ds-color-utilities.ts`.
- Added negative fixture tests proving both DS gates fail on raw color/off-vocabulary utility input.
- Updated the token generator to write a trailing newline so generated CSS passes package fmt and
  `tokens:check` together.
- Synced package fmt/token changes to repo-genesis.

### Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| DS negative fixtures | PASS | `deno test --allow-read --allow-write --allow-run .llm/tools/fitness/check-ds-gates_test.ts` | 2 tests passed; raw hex and stock palette utility fixtures fail their gates. |
| package fmt | PASS | `deno fmt --check` from `packages/fresh-ui` | 111 files checked. |
| scoped package fmt wrapper | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh-ui --ext ts,tsx,css,md --pretty` | 111 selected; 0 findings. |
| package check | PASS | `deno task check` from `packages/fresh-ui` | Includes `--unstable-kv`; checked exported package files, scripts, and tests. |
| package test | PASS | `deno task test` from `packages/fresh-ui` | 36 tests passed. |
| package tokens | PASS | `deno task tokens:check` from `packages/fresh-ui` | Passed after staging the intentional generated `tokens.css` newline update. |
| DS no raw hex | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-no-raw-hex.ts` | 93 files clean. |
| DS color utilities | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-color-utilities.ts` | 93 files clean. |
| arch:check | PASS | `deno task arch:check` | Doctrine scoped to `packages/fresh-ui`: 0 fail, 1 warn, 1 info; DS gates passed. |
| repo-genesis package fmt | PASS | `deno fmt --check` from outer `packages/fresh-ui` | 111 files checked after package line-ending normalization. |
| repo-genesis package check | PASS | `deno task check` from outer `packages/fresh-ui` | Existing outer task shape; check passed. |
| repo-genesis package test | PASS | `deno task test` from outer `packages/fresh-ui` | 36 tests passed. |

### Commits

- Framework: `b9ccc7bf90a4a14852c612f04ff0c1a9a2650770`
- Repo-genesis: `f0ac62694914fa90361752fa572f8888d5ef9037`

## 2026-06-12 - Slice 7: C-12 Zag ADR spike verdict

### Changed

- Added `packages/fresh-ui/docs/architecture.md`.
- Recorded ADR 0001: Tiered Interactivity And Zag Adoption.
- Used prior Run 5c1 Slice 10 and closeout evidence instead of rerunning the spike:
  `@zag-js/preact@1.41.2` + `@zag-js/combobox@1.41.2` type-check, Fresh SSR returns 200,
  short-path Vite hosting proves hydrated interaction, and the prior blocker was Windows MAX_PATH.
- Locked policy: keep the existing seven native-backed components (`dialog`, `sheet`, `drawer`,
  `accordion`, `popover`, `tooltip`, `tabs`) on platform-backed runtimes; adopt Zag only for
  future machine-class widgets.
- Synced the ADR doc to repo-genesis.

### Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| package fmt | PASS | `deno fmt --check` from `packages/fresh-ui` | 112 files checked. |
| package check | PASS | `deno task check` from `packages/fresh-ui` | Includes `--unstable-kv`. |
| package test | PASS | `deno task test` from `packages/fresh-ui` | 36 tests passed. |
| package tokens | PASS | `deno task tokens:check` from `packages/fresh-ui` | Generated token artifacts stable. |
| DS no raw hex | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-no-raw-hex.ts` | 93 files clean. |
| DS color utilities | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-color-utilities.ts` | 93 files clean. |
| arch:check | PASS | `deno task arch:check` | Doctrine: 0 fail, 1 existing manifest-size warn, 0 info; DS gates passed. |
| repo-genesis package fmt | PASS | `deno fmt --check` from outer `packages/fresh-ui` | 112 files checked. |
| repo-genesis package check | PASS | `deno task check` from outer `packages/fresh-ui` | Existing outer task shape; check passed. |
| repo-genesis package test | PASS | `deno task test` from outer `packages/fresh-ui` | 36 tests passed. |

### Drift

- None.

### Commits

- Framework: `c4ac8ff14994256b39655b0ff237a982e3c0dba1`
- Repo-genesis: `00a29027915283a52ae56e2c06adbc3287ebc7a6`

## 2026-06-12 - Slice 8: C-9 responsive table L3 block

### Changed

- Added `responsive-table` as a Layer-3 registry block with semantic table markup, mobile labeled
  cells, and CSS constrained to the `ns-responsive-table` vocabulary.
- Registered the item in `packages/fresh-ui/registry.manifest.ts` and included it in the
  foundation and dashboard block collections.
- Added package tests proving the component root class and manifest exposure.
- Synced the package copy into repo-genesis, including the newer package `deno.json` required for
  copy-fidelity check coverage.
- Copied the component into `apps/playground/components/ui/`, copied CSS into
  `apps/playground/assets/ui/`, added the CSS import, exported the component from the app UI
  barrel, and added a live `/design/components` demo.
- Updated the playground design catalog snapshot from 43 to 44 items so the gallery renders the
  new block.

### Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| package fmt | PASS | `deno fmt --check packages/fresh-ui/...` and `deno task fmt:check` from framework package | Targeted new files plus existing root fmt wrapper path passed. |
| package check | PASS | `deno task check` from `packages/fresh-ui` | Includes `--unstable-kv`; checked `responsive-table.tsx`. |
| package test | PASS | `deno task test` from `packages/fresh-ui` | 37 tests passed. |
| package tokens | PASS | `deno task tokens:check` from `packages/fresh-ui` | Generated token artifacts stable. |
| DS no raw hex | PASS | `deno run --allow-read --allow-run .llm/tools/fitness/check-ds-no-raw-hex.ts --root packages/fresh-ui/registry` | 60 files clean; `arch:check` composite also passed 95 files. |
| DS color utilities | PASS | `deno run --allow-read --allow-run .llm/tools/fitness/check-ds-color-utilities.ts --root packages/fresh-ui/registry` | 60 files clean; `arch:check` composite also passed 95 files. |
| arch:check | PASS | `deno task arch:check` from framework root | 0 fail, 1 existing manifest-size warn; DS gates passed. |
| copy fidelity | PASS | `git diff --no-index --ignore-cr-at-eol` | New TSX/CSS files matched package copy and playground app-owned copy. |
| repo-genesis package fmt | PASS | `deno fmt --check packages/fresh-ui/...` | Targeted package files passed. |
| repo-genesis package check | PASS | `deno task check` from outer `packages/fresh-ui` | Passed after syncing package `deno.json`; includes `responsive-table.tsx`. |
| repo-genesis package test | PASS | `deno task test` from outer `packages/fresh-ui` | 37 tests passed. |
| repo-genesis package tokens | PASS | `deno task tokens:check` from outer `packages/fresh-ui` | Root `deno.lock` restored afterward. |
| playground focused fmt/lint/check | PASS | `deno fmt --check`, `deno lint`, `deno check --unstable-kv` on touched files | Covers app-owned component, CSS import, catalog, and real route. |
| playground full check | FAIL (drift) | `deno task check` from `apps/playground` | Blocked by pre-existing CRLF-only fmt drift in eight unrelated copied UI files. |
| browser validation | PASS | `slice8-browser-check.ts` against `http://127.0.0.1:5175/design/components` | HTTP 200, zero console errors, theme flip dark->light->dark, 390x844 no overflow, reduced motion rendered; screenshots and report recorded. |

### Drift

- Full playground `deno task check` remains blocked by unrelated CRLF-only drift in existing copied
  UI files; focused fmt/lint/check for touched files passed.
- `git diff --strip-trailing-cr` is not supported by the installed Git; used
  `git diff --no-index --ignore-cr-at-eol` for equivalent copy-fidelity checks.
- The impeccable context helper referenced by the skill is absent in this checkout; design review
  used local package docs, tokens, and real-browser validation instead.

### Commits

- Framework: `95b5d0cdf40d9b028d68caa25ab7f72ce505313e`
- Repo-genesis: `46520db8296e8149b7dc12f4d3fd0c7ed0d73d9d`

## 2026-06-12 - Slice 9: C-11 docs scaffold and doctests

### Changed

- Added `docs/getting-started.md` with the supported `ui:init` / `ui:add` flow, runtime import
  setup, and the README-matched runtime helper example.
- Added `docs/concepts.md` covering themes, copy-source registry ownership, runtime behavior,
  layer boundaries, and validation expectations.
- Added earned recipe `docs/recipes/living-design-routes.md` for `/design/tokens`,
  `/design/components`, and `/design/composition` browser proof routes.
- Updated `README.md` for the Slice 8 registry count (`44` items, `11` L3 blocks), added
  `responsive-table`, replaced quick start with the doctested helper/runtime flow, and linked the
  docs scaffold.
- Added `tests/_fixtures/docs-examples_test.ts` executing the README/getting-started helper and
  runtime component flow against local package entrypoints.
- Verified the package publish include already carries `docs/**/*.md` and excludes `tests/**`.
- Synced README/docs/doctest fixture to repo-genesis.

### Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| package Markdown fmt | PASS | `deno fmt --check` from `packages/fresh-ui` | 118 files checked, including Markdown docs. |
| package fmt wrapper | PASS | `deno task fmt:check` from framework package path | Existing root wrapper path passed. |
| package check | PASS | `deno task check` from `packages/fresh-ui` | Includes `--unstable-kv`; checked `tests/_fixtures/docs-examples_test.ts`. |
| package test | PASS | `deno task test` from `packages/fresh-ui` | 39 tests passed, including 2 doctest fixture cases. |
| package tokens | PASS | `deno task tokens:check` from `packages/fresh-ui` | Generated token artifacts stable. |
| DS no raw hex | PASS | `check-ds-no-raw-hex.ts --root packages/fresh-ui/registry` | 60 files clean; `arch:check` composite also passed 95 files. |
| DS color utilities | PASS | `check-ds-color-utilities.ts --root packages/fresh-ui/registry` | 60 files clean; `arch:check` composite also passed 95 files. |
| arch:check | PASS | `deno task arch:check` from framework root | 0 fail, 1 existing manifest-size warn; DS gates passed. |
| publish include check | PASS | `Select-String packages/fresh-ui/deno.json` | `docs/**/*.md` and `README.md` included; `tests/**` excluded. |
| copy fidelity | PASS | `git diff --no-index --ignore-cr-at-eol` | README, new docs, recipe, and doctest fixture matched repo-genesis package copy. |
| repo-genesis package fmt | PASS | `deno fmt --check` from outer `packages/fresh-ui` | 118 files checked. |
| repo-genesis package check | PASS | `deno task check` from outer `packages/fresh-ui` | Includes doctest fixture. |
| repo-genesis package test | PASS | `deno task test` from outer `packages/fresh-ui` | 39 tests passed. |
| repo-genesis package tokens | PASS | `deno task tokens:check` from outer `packages/fresh-ui` | Generated token artifacts stable. |

### Drift

- None.

### Commits

- Framework: `da7091fa14551fdbe8168a12365f4b2608f04970`
- Repo-genesis: `12fcebaeea9d401adb9d3f8d284f2224091bee32`

## 2026-06-12 - Slice 10: C-10 standards shim removal

### Changed

- Removed the legacy `.agents/skills/netscript-standards` skill shim from the framework worktree.
- Removed the legacy `.agents/skills/netscript-standards` and
  `.claude/skills/netscript-standards` shim copies from repo-genesis.
- Removed the legacy skill row from the framework `.agents/skills/README.md`.
- Removed repo-genesis live instruction-file mentions that named the removed shim; doctrine remains
  the only package/plugin architecture guidance path.

### Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| active shim file check | PASS | `Test-Path .agents/skills/netscript-standards/SKILL.md` | Framework returned `False`; repo-genesis `.agents` and `.claude` returned `False`. |
| active instruction reference check | PASS | `Select-String AGENTS.md,CLAUDE.md,.claude/README.md` | Repo-genesis live instruction files no longer mention the removed shim. |
| framework skill index reference check | PASS | `Select-String .agents/skills/README.md` | No `netscript-standards` row remains. |
| markdown fmt | PASS | `deno fmt --check` on touched instruction/index files | Framework and repo-genesis files passed after formatting. |
| package check | PASS | `deno task check` from framework `packages/fresh-ui` | Includes `--unstable-kv`. |
| package test | PASS | `deno task test` from framework `packages/fresh-ui` | 39 tests passed. |
| package tokens | PASS | `deno task tokens:check` from framework `packages/fresh-ui` | Generated token artifacts stable. |
| DS no raw hex | PASS | `check-ds-no-raw-hex.ts --root packages/fresh-ui/registry` | 60 files clean; `arch:check` composite also passed 95 files. |
| DS color utilities | PASS | `check-ds-color-utilities.ts --root packages/fresh-ui/registry` | 60 files clean; `arch:check` composite also passed 95 files. |
| arch:check | PASS | `deno task arch:check` from framework root | 0 fail, 1 existing manifest-size warn; DS gates passed. |
| repo-genesis package check/test/tokens | PASS | outer `packages/fresh-ui` gates | Check passed, 39 tests passed, tokens stable. |

### Drift

- Remaining framework matches for `netscript-standards` are the separate
  `.llm/tools/fitness/check-netscript-standards.ts` tool, `release-readiness.ts` references to that
  tool, and `packages/contracts/README.md` command text. They are not the removed skill shim and
  were left unchanged for this slice.

### Commits

- Framework: `097423042153d556d27e96ba1dc5137ec1916f7b`
- Repo-genesis: `e18027e4470306149b605a46c22d5360dcb15c9b`

## 2026-06-12 - Slice 11: JSR release readiness

### Changed

- Added the missing `@module` JSDoc tag to `packages/fresh-ui/interactive.ts`, the only JSR audit
  failure found in the public entrypoint scan.
- Synced the public entrypoint doc fix to repo-genesis.
- Added `slice11-jsr-audit.json` as the JSR audit artifact.
- Added a local-only Git exclude for the pre-existing untracked `.playwright-mcp/` directory so
  Deno's no-`--allow-dirty` publish dry-run could run against a clean worktree without deleting or
  editing that directory.

### Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| clean status before final dry-run | PASS | `git status --short` | Framework and repo-genesis were clean after code commits; `.playwright-mcp/` ignored locally only. |
| publish dry-run | PASS | `deno publish --dry-run` from `packages/fresh-ui` | Ran without `--allow-dirty`; no slow types; docs included; tests excluded. |
| JSR audit | PASS | `deno run -A .llm/tools/fitness/audit-jsr-package.ts --root packages/fresh-ui --out .../slice11-jsr-audit.json` | 0 FAIL; all exported entrypoints have `@module`; `slowTypes.ok=true`. |
| doc lint | PASS | `deno doc --lint mod.ts interactive.ts primitives.tsx` | 3 public entrypoints checked. |
| package check | PASS | `deno task check` from framework `packages/fresh-ui` | Includes `--unstable-kv`. |
| package test | PASS | `deno task test` from framework `packages/fresh-ui` | 39 tests passed. |
| package tokens | PASS | `deno task tokens:check` from framework `packages/fresh-ui` | Generated token artifacts stable. |
| DS no raw hex | PASS | `check-ds-no-raw-hex.ts --root packages/fresh-ui/registry` | 60 files clean; `arch:check` composite also passed 95 files. |
| DS color utilities | PASS | `check-ds-color-utilities.ts --root packages/fresh-ui/registry` | 60 files clean; `arch:check` composite also passed 95 files. |
| arch:check | PASS | `deno task arch:check` from framework root | 0 fail, 1 existing manifest-size warn; DS gates passed. |
| repo-genesis package check/test | PASS | outer `packages/fresh-ui` | Check passed; 39 tests passed. |
| README/docs final check | PASS | `Select-String` sanity checks | README shows 44 items, `responsive-table`, and docs links; docs scaffold headings present. |

### Drift

- The first no-`--allow-dirty` dry-run failed because the pre-existing untracked `.playwright-mcp/`
  directory made Deno treat the worktree as dirty. The directory was not touched; a local Git
  exclude entry was added outside tracked files, then the final dry-run passed from clean status.
- The repo-native JSR audit emits a WARN gate for Deno's informational "Checking for slow types in
  the public API..." line even when `slowTypes.ok=true`; treated as audit pass because there are 0
  FAIL gates and the actual publish dry-run passed.

### Commits

- Framework: `3f3db55ca8be163f2bf5f4e888d3ec038ba0e517`
- Repo-genesis: `189fa782fd0a4b72c8f1e8101b8e3f6a6ee2aa61`

## 2026-06-12 - Slice 12: scaffold revamp audit

### Changed

- Added `slice12-scaffold-fresh-ui-gap-report.md` to the run artifacts.
- Audited the current CLI Fresh app scaffold templates against the fresh-ui registry manifest,
  `ui:init` / `ui:add` installer, and playground design routes.
- Locked concrete follow-ups for Slices 13-16 without changing the approved slice table:
  registry-backed init, design route port, registry-only app pages, and generated-app browser proof.

### Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| package check | PASS | `deno task check` from framework `packages/fresh-ui` | Includes `--unstable-kv`. |
| package test | PASS | `deno task test` from framework `packages/fresh-ui` | 39 tests passed. |
| package tokens | PASS | `deno task tokens:check` from framework `packages/fresh-ui` | Generated token artifacts stable; Git emitted CRLF warning only. |
| DS no raw hex | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-no-raw-hex.ts` | 95 files clean. |
| DS color utilities | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-color-utilities.ts` | 95 files clean. |
| CLI scaffold/UI focused tests | PASS | `deno test --allow-read --allow-write --allow-env --allow-run packages/cli/src/public/features/ui/registry.test.ts packages/cli/src/kernel/templates/app/route-templates_test.ts` | 7 tests passed, 14 BDD steps passed. |
| browser validation | N/A | Audit-only slice | Real generated-app browser proof is locked to Slice 16. |
| copy fidelity | N/A | No registry/app copies changed | Repo-genesis had no Slice 12 source changes. |

### Drift

- `floating-styles` is required by the playground design component demo but is outside both
  `DEFAULT_UI_INIT_ITEMS` and the `foundation` collection. This is recorded as a Slice 13/14
  scaffold install follow-up, not fixed in the audit slice.
- The Impeccable helper script remains absent in this checkout; existing drift entry from Slice 8
  still applies.

### Commits

- Framework: `c424dd6ee58d952400fdd1d39ca7bb1e1b543574`
- Repo-genesis: N/A, audit-only slice.

## 2026-06-12 - Slice 13: scaffold consumes fresh-ui registry install

### Changed

- Moved the CLI `ui:init` / `ui:add` registry installer into kernel application code and kept the
  public feature module as a re-export.
- Replaced the scaffold's bespoke Fresh app design CSS and local Button/Card/ThemeToggle templates
  with a real `installUiRegistryItems()` call against `DEFAULT_UI_INIT_ITEMS`.
- Seeded the generated app with `foundation`, `floating-styles`, and `control-props`, including
  app `deno.json` import merging and the fresh-ui styles aggregator.
- Updated generated app UI exports and ThemeToggle imports to use the registry copy locations.
- Taught the dry-run file-system adapter to read its latest recorded write before falling back to
  the host file system, which lets the registry installer patch scaffold-created `deno.json` during
  dry runs.
- Added `slice13-scaffold-ui-init-smoke.md` with generated-app smoke evidence.

### Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| focused CLI fmt | PASS | `deno fmt --no-config --check` on touched TS files | Re-run after implementation; no formatting drift. |
| focused CLI lint | PASS | `deno lint --no-config` on touched TS files | Registry/scaffold/dry-run/template tests targets clean. |
| targeted check | PASS | `deno check --unstable-kv` on scaffold writer and registry modules | Covers the moved installer and scaffold integration. |
| focused CLI tests | PASS | `deno test --allow-read --allow-write --allow-env --allow-run ...` | 16 tests / 54 steps passed across registry, dry-run FS, route templates, generator config, template registry, orchestrate init, and scaffolder tests. |
| generated scaffold smoke | PASS | `deno run -A packages/cli/bin/netscript-dev.ts init slice13-ui ...` | Created 93 files / 17 directories; copied 21 local packages. |
| generated app check | PASS | `deno check --unstable-kv apps/dashboard` from generated workspace | Real generated app checked after rejecting a root-relative no-match run as non-evidence. |
| package check | PASS | `deno task check` from framework `packages/fresh-ui` | Includes `--unstable-kv`. |
| package test | PASS | `deno task test` from framework `packages/fresh-ui` | 39 tests passed. |
| package tokens | PASS | `deno task tokens:check` from framework `packages/fresh-ui` | Generated token artifacts stable; Git emitted CRLF warning only. |
| DS no raw hex | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-no-raw-hex.ts` | 95 files clean. |
| DS color utilities | PASS | `deno run --allow-read .llm/tools/fitness/check-ds-color-utilities.ts` | 95 files clean. |
| arch:check | PASS | `deno task arch:check` from framework root | 0 fail, 1 existing manifest-size warn. |
| browser validation | N/A | Non-visual integration slice | Full generated app browser proof remains locked to Slice 16. |
| copy fidelity | N/A | CLI package absent from repo-genesis | No outer-worktree sync target for this slice. |

### Drift

- The first generated-app check command was root-relative and produced Deno's "No matching files
  found" message with exit 0. It was rejected as evidence; the command was re-run from the generated
  workspace against `apps/dashboard` and passed.
- `control-props` needed to join the default scaffold install set because the app-owned UI barrel
  exports the registry helper; this is an in-scope Slice 13 correction.

### Commits

- Framework: `cd30ffdf2bfb66557191b70b275614659e5a378f`
- Repo-genesis: N/A, CLI package absent from outer worktree.
