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

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Stop before implementation pending Plan-Gate | Harness run-loop hard stop applies; no Run 3 plan-eval artifact found. | `.llm/harness/workflow/run-loop.md` |
| Treat missing `.claude/skills/netscript-doctrine` as drift, not blocker | Equivalent `.agents/skills/netscript-doctrine` exists and was read. | prompt + filesystem |
| Use checked-in `.llm/tmp/docs/` before web | User instruction; sufficient curated notes exist for planned slices. | prompt |
| Treat Zag as prior proof to cite, not an unknown viability question | User says Zag already works in a previous commit and is mentioned in PR #32. | user clarification |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| `.claude/skills/netscript-doctrine/SKILL.md` absent; `.agents` equivalent used. | minor | yes |
| Impeccable helper scripts/references absent at repo-local skill path; skill text used. | minor | yes |
| `.resources/deps-docs/` absent; `.llm/tmp/docs/` used. | minor | yes |
| No Run 3 Plan-Gate artifact found. | significant | yes |
| `rg`/`rtk grep` unavailable in shell. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Plan-Gate presence | `Get-ChildItem -Recurse .llm/tmp/run -Filter plan-eval.md` | FAIL_BLOCKED | No Run 3 plan-eval artifact. |
| Git status | `rtk git status --short --branch` | PASS_WITH_UNTRACKED | Existing untracked `.playwright-mcp/` and `packages/fresh-ui/deno.lock`; not touched. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| F-1..F-15 | NOT_RUN | Plan-Gate blocked | Implementation gates not run yet. |
| DS no raw hex | NOT_RUN | Plan-Gate blocked | Run after relevant slice edits. |
| DS color utilities | NOT_RUN | Plan-Gate blocked | Run after relevant slice edits. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Browser validation | NOT_RUN | Plan-Gate blocked | Required for visual slices. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| apps/playground | NOT_RUN | Plan-Gate blocked | Required after visual/package integration edits. |
| generated scaffold | NOT_RUN | Plan-Gate blocked | Required in slices 13-16. |

## Handoff Notes

- Evaluator should inspect `plan.md`, this `## Design` section, `research.md`, and `drift.md`
  first.
- Implementation is intentionally blocked pending Plan-Gate.
