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
