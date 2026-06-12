# Research - Run 3 production hardening + scaffold revamp

## Re-baseline

- Carried-in source: `.llm/plans/2026-06-12-fresh-ui-doctrine-plan.md` plus the user-provided
  Run 3 slice table.
- Re-derived against current worktree head `049711f01fc62367254df53d426017efec3f7c00`; recorded
  `origin/main` as `beea4ddf7ef9ef63bf2105ae13c5834f098ca04f`.
- What changed vs the carried-in plan:
  - The plan file covers cleanup slices C-1..C-12 only; the user prompt extends the locked scope
    with scaffold revamp slices 12-16.
  - `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md` still lists
    `@netscript/fresh-ui` as Archetype 4 / Keep. The locked Run 3 plan treats it as
    Archetype 3 because the package now owns imported runtime behavior and lifecycleful
    interactive primitives. The CLI scaffold revamp additionally touches `@netscript/cli`, which
    remains Archetype 6 / Restructure debt.
  - No Run 3 `plan-eval.md` was found under `.llm/tmp/run/`; prior plan-eval artifacts belong to
    earlier wave runs.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `packages/fresh-ui/deno.json` still uses `deno.gates.json` for `check` and `test`, and package version is `0.0.1-alpha.0`. | `Get-Content packages/fresh-ui/deno.json` |
| 2 | `packages/fresh-ui/deno.gates.json` contains the compiler/fmt settings that C-1/C-7 must fold into the package config. | `Get-Content packages/fresh-ui/deno.gates.json` |
| 3 | `packages/fresh-ui/deno.lock` is untracked in the worktree, so C-2 must follow the user's approval requirement before tracking or deleting. | `git status --short --branch` |
| 4 | The L0 contract requires copy-fidelity, token-only CSS, native-first behavior, no L2-to-L2 imports, and reduced-motion handling. | `packages/fresh-ui/docs/l0-conventions.md` |
| 5 | Theme authoring requires complete light/dark semantic `--ns-*` assignment and Tailwind v4 `@theme inline` bridge. | `packages/fresh-ui/docs/theme-authoring.md`; `.llm/tmp/docs/tailwindcss-v4-theme.md` |
| 6 | `@zag-js/preact` exists and maps to the package's prop-getter/data-attribute model, but must be validated in a real Fresh island before adoption. | `.llm/tmp/docs/zagjs-preact-api.md` |
| 7 | Fresh islands require serializable props and client-only guards for browser APIs; Zag-backed widgets must be islands. | `.llm/tmp/docs/fresh2-islands-partials.md`; `.agents/skills/deno-fresh/SKILL.md` |
| 8 | The CLI maintainer path and full scaffold smoke are documented; scaffold changes must use the one-pass `scaffold.runtime` suite for merge-readiness. | `.agents/skills/netscript-cli/SKILL.md`; `packages/cli/docs/commands.md`; `packages/cli/docs/maintainer-cli.md` |
| 9 | The repo-local `rg`/`rtk grep` path is unavailable in this shell; use PowerShell `Select-String` or focused file reads until the environment changes. | failed `rg` and `rtk grep` attempts during bootstrap |
| 10 | `.resources/deps-docs/` is absent in this worktree; curated `.llm/tmp/docs/` files are present and used first. | `Get-ChildItem .resources/deps-docs` failed; `Get-ChildItem .llm/tmp/docs` passed |

## jsr-audit surface scan

- Surface scanned: planned public surfaces for `@netscript/fresh-ui` (`.`, `./interactive`,
  `./primitives`) plus publish-included registry/docs artifacts; scaffold revamp also changes
  `@netscript/cli` behavior but not necessarily its public library exports.
- Slow-type / surface risks:
  - Fresh UI docs are publish-included, but docs scaffold/doctests are incomplete until C-11.
  - Package tasks lack `publish:dry-run`, lint, and fmt ownership until later slices.
  - Version mismatch (`deno.json` `0.0.1-alpha.0` vs registry manifest `0.1.0`) is a publish
    readiness risk until C-6.
  - Registry support code currently living inside the copy-source payload can leak implementation
    concerns into copied consumer payloads until C-3.
  - JSR dry-run must pass clean without `--allow-dirty` in Slice 11; earlier slices may use
    targeted gates only.

## Open questions

- C-2 lock policy is intentionally unresolved: the user must approve whether the package lock file
  is tracked or ignored before Slice 2 changes it.
- Whether a separate PLAN-EVAL has already passed for this exact Run 3 scope is unresolved. Current
  filesystem evidence says no; implementation must not begin without a separate `PASS` or explicit
  written waiver.
