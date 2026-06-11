# Context pack — Run 5c1 Composition foundation

## Scope

Implementation session for locked Wave 5c Run 1: composition foundation. Work is
limited to `packages/fresh-ui` except slices 13-14, which touch `packages/cli`
for `ui:init` and `ui:add`.

## Locked Inputs

- Parent plan:
  `.llm/tmp/run/feat-package-quality-wave5-apps--5c-fresh-ui/plan.md` (LOCKED
  v2; PLAN-EVAL PASS 2026-06-11).
- Parent design:
  `.llm/tmp/run/feat-package-quality-wave5-apps--5c-fresh-ui/design.md`.
- Parent appendix:
  `.llm/tmp/run/feat-package-quality-wave5-apps--5c-fresh-ui/design-appendix.md`.
- Parent drift entries D-7 and D-8 bind this run's popover fallback and registry
  schema.

## Gate Policy

Verdict-grade evidence uses raw `deno` and raw `git`, not `rtk`. Targeted
`deno check` commands that touch workspace code include `--unstable-kv`. Root
`deno.lock` is not touched; run-local config and lock files live in this run
directory.

## Current State

Bootstrap artifacts created and baseline measurement recorded in
`measure-5c1.json`. Starting baseline: scoped check and doc-lint pass;
package-local check/test have weak/no-file behavior; lint/fmt wrappers exit 1
despite zero reported findings; JSR dry-run fails with excluded module errors
plus six missing return types in `runtime/sheet/Sheet.tsx`.

Slice 1 complete: package-local `check` and `test` now use `deno.gates.json` and
glob arguments, fixing the baseline no-file behavior without touching root
`deno.lock`.

Slice 2 complete: DTCG token source files now live under
`packages/fresh-ui/tokens/`. The source covers all 134 root `--ns-*` custom
properties and all 27 light overrides from `registry/theme/tokens.css`;
run-local verifier evidence is in `slice-02-token-parity.json`.

Slice 3 complete: `packages/fresh-ui` now has `tokens:build` and `tokens:check`
tasks backed by `npm:style-dictionary@5.4.4`. `tokens:build` regenerates
`registry/theme/tokens.css` from the DTCG source and currently produces
byte-identical CSS; evidence is in `slice-03-token-build-parity.json`.

Slice 4 complete: `tokens:build` now also generates
`registry/theme/theme-bridge.css` with Tailwind v4 `@theme inline` and
`registry/theme/tokens.json`. `registry/theme/styles.css` imports the generated
bridge and no longer owns an inline `@theme` block.

Slice 5 complete: `.llm/tools/fitness/check-token-drift.ts` provides the
`tokens-drift` gate. It rebuilds fresh-ui token outputs and fails on untracked
or changed generated artifacts.

Slice 6 complete: registry schema v2 is in place. Manifest files now use
placeholder `target` paths, registry dependencies are string arrays, layer-3 UI
items are `block` kind, all items carry `author`, and `theme-seed` claims the
generated bridge/token JSON artifacts.

Slice 7 complete: `.llm/tools/fitness/check-manifest-integrity.ts` provides the
`manifest-integrity` gate. The manifest now claims 44 installable registry files
through 36 items, with manifest/schema/test files excluded from copy inventory.

Slice 8 complete: component CSS now travels through per-item/support CSS files
under `registry/components/ui/`; the old four aggregate component CSS files are
gone from `theme-seed`. Move-only evidence preserved 161/161 top-level CSS
statements from base `91a01ee`, and manifest-integrity now claims 61/61
installable registry files through 41 items.

Slice 9 complete: `@netscript/fresh-ui/primitives` now exports the L0
platform-contract primitives `VisuallyHidden`, `SrOnly`, and `Show`, with
package-owned structural public types that avoid leaking Preact private JSX
internals through `deno doc --lint`. The L0 conventions doc is published under
`packages/fresh-ui/docs/`, README documents the entrypoint, and 35 package tests
pass including JSX component usage for `VisuallyHidden`.
