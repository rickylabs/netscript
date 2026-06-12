# fresh-ui Final Package Architecture — Doctrine Plan

Status: PLAN (no implementation in this session). Author: Run 2 generator
session, 2026-06-12. Authority: netscript-doctrine SKILL + Harness v2
archetype profiles. This is the follow-up the user requested after Run 2
("the package looks still a mess with bunch of legacy that should go
away"); execute as its own harnessed run with its own slice lock.

## Archetype classification

`packages/fresh-ui` is **Archetype 3 — Runtime/Behavior** with the
**SCOPE-frontend** overlay:

- it owns stateful interactive lifecycle (focus trap, dismissable layers,
  controllable signals) → Archetype 3 gates F-1..F-15 apply;
- it additionally publishes copy-source registry artifacts, which no other
  archetype models — the registry is treated as *data* (published files +
  manifest), not API surface, and is governed by the L0 contract docs
  rather than slow-types gates.

Public surface (locked by Run 2): `.` (cn + toast helpers),
`./interactive` (7 compound namespaces), `./primitives` (Show,
VisuallyHidden, SrOnly). Everything else is either copy-source
(`registry/`) or internal (`runtime/_internal`, `scripts/`, `tokens/`).

## Target folder shape

```
packages/fresh-ui/
  deno.json            # single config (see C-1)
  mod.ts interactive.ts primitives.tsx
  runtime/             # L1 (imported)
  registry/            # copy-source payload ONLY (see C-3)
    components/ui/ islands/ lib/ styles/ theme/
  registry.manifest.ts # manifest + schema OUT of the payload dir
  tokens/              # DTCG source (input to tokens:build)
  scripts/             # build-tokens.ts
  docs/                # l0-conventions.md, theme-authoring.md
  tests/               # *.test.ts(x) consolidated (see C-5)
```

## Cleanup slices (proposed lock for the next run)

- **C-1 Config unification.** `deno.gates.json` exists only because the
  package config and root workspace config disagree. Decide one config:
  fold gate settings into `packages/fresh-ui/deno.json`, delete
  `deno.gates.json`, and remove `--no-lock` once C-2 lands. Gate: package
  check/test pass with the single config.
- **C-2 Lock decision.** `packages/fresh-ui/deno.lock` is untracked in
  both repos while tasks run `--no-lock`. Either track it (preferred for a
  publishable package) or add it to .gitignore explicitly; never leave it
  ambient. Requires user approval per never-delete-locks rule.
- **C-3 Manifest out of the payload.** `registry/manifest.ts` and
  `registry/schema.ts` are package support code living inside the
  copy-source payload directory; `ui:add` must special-case them. Move to
  package root (`registry.manifest.ts`, `registry.schema.ts`) and update
  the CLI kernel reference (check netscript-cli SKILL first).
- **C-4 Dead registry items.** `sheet-styles` and `floating-styles` are
  published but not installed by any consumer, and `floating.css`/
  `sheet.css` have no playground copies. Either wire them into the gallery
  (preferred — Sheet runtime needs its CSS story documented) or mark them
  `status: incubating` in the manifest. Evidence: slice-9 sweep.
- **C-5 Test layout.** `consumer-render.test.tsx`, `primitives.test.tsx`,
  and `registry/components/ui/foundation.test.tsx` sit beside sources with
  publish-exclude globs. Consolidate under `tests/` so the publish exclude
  is structural, not pattern-based. Registry item tests stay beside their
  item only if `ui:add` should copy them (decide; today it does not).
- **C-6 Version coherence.** Package version `0.0.1-alpha.0` vs registry
  manifest `0.1.0`. Adopt one versioning policy: manifest version tracks
  package minor. Bump package to `0.1.0` at publish.
- **C-7 fmt ownership.** Root fmt excludes the package; package fmt covers
  only ts/tsx. Extend package fmt include to css/md (matching the
  `--indent-width 2 --line-width 100 --single-quote` house flags used in
  Run 2) and delete the root exclusion, so the slice-9/11 normalization
  cannot regress. Gate: `deno fmt --check` clean from package root.
- **C-8 Fitness gate relocation.** `check-ds-no-raw-hex.ts` and
  `check-ds-color-utilities.ts` live in `.llm/tools/fitness/` (root lint
  skips them). Promote into the `arch:check` composite once Phase B lands;
  until then add them to CI command list in the package README (done in
  Run 2 slice 10).
- **C-9 Backlog: `ns-responsive-table`** (drift D-5c2-5) — stacked-card
  responsive table as a new L3 registry block.
- **C-10 Repo hygiene.** `netscript-standards` skill is a legacy shim —
  confirm nothing references it, then delete (repo-level, not package).
  Playground `islands/Toast.tsx` thin L4 wrapper is intentional (keep,
  documented in l0-conventions copy-fidelity rule).

## Doc revamp status

Run 2 slice 10 already delivered the final-form README,
`docs/l0-conventions.md`, and `docs/theme-authoring.md`. The only doc work
remaining in this plan is C-3/C-5/C-6 follow-through edits.

## Gates for the cleanup run

Archetype 3 matrix (F-1..F-15 per
`.llm/harness/gates/archetype-gate-matrix.md`) plus: ds-no-raw-hex,
ds-color-utilities, package check/test/tokens:check, JSR dry-run, browser
validation on `/design/*`, copy-fidelity sweep (`diff --strip-trailing-cr`).

## Addendum (2026-06-12, user review)

- **C-11 Docs scaffold + doctests.** Per
  `.llm/harness/lessons/package-quality-archetype.md` items 6-7, the
  package is missing `docs/getting-started.md`, `docs/architecture.md`,
  `docs/concepts.md` (l0-conventions/theme-authoring slot under concepts/
  reference), `docs/recipes/` where earned, AND a doctest fixture
  (`tests/_fixtures/docs-examples_test.ts`) that executes the exact
  README/getting-started flow so documentation cannot rot silently.
  Docs join the publish include set.
- **C-12 Zag adoption ADR (spike, not migration).** Decision proposal:
  do NOT migrate the existing seven interactive components — Dialog/
  Drawer/Sheet are native <dialog>-backed and Popover/Tooltip wrap the
  platform Popover API; replacing platform behavior with JS state
  machines regresses the native-first axiom. Adopt @zag-js selectively
  for complex widgets with no platform backing (combobox, menu, custom
  select, slider, date picker, tags-input) as they enter the registry.
  Spike first: validate @zag-js/react via preact/compat inside Fresh
  islands (SSR + hydration + bundle size), record the verdict as an ADR
  in docs/architecture.md. If the spike fails, the fallback is
  hand-rolled hooks following the existing runtime/_internal patterns.
