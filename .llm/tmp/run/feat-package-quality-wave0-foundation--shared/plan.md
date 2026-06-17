# Plan: S1 / Wave 0 — Foundation (@netscript/shared)

> Nested phase-group run under the S1 supervisor
> (`.llm/tmp/run/feat-package-quality--supervisor/`). Operating protocol:
> `.llm/harness/workflow/{run-loop,supervisor}.md`. This is a SCAFFOLD — the
> implementation agent completes the Design checkpoint in `worklog.md` (from
> `.llm/harness/templates/worklog.md`) before writing code.

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `feat-package-quality-wave0-foundation--shared` |
| Group branch | `feat/package-quality-wave0-foundation` (hyphen — ref conflict with `feat/package-quality`) |
| Worktree | `.worktrees/wave0-foundation` |
| Sub-PR | draft, base `feat/package-quality` |
| Archetype | A1 — small-contract |
| Unit | `@netscript/shared` |

## Goal

Bring `@netscript/shared` to the alpha bar: `deno publish --dry-run` 0 slow-types
(drop `--allow-slow-types`), `deno doc --lint` clean, README >= 150 LOC, `/docs`
per STANDARDS section 7, archetype A1 gate matrix green. It is the type substrate
every other unit depends on, so it ships first (Foundation-first).

## Starting point (use, but verify — it predates PR #98)

The canonical per-package docs are the **starting skeleton only**:

- `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/evaluate_shared.md`
- `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/plan_shared.md`

They were produced BEFORE the plugin-platform merge (`netscript-start` PR #98),
so references and slow-type counts may be outdated. Step 1 is to re-derive against
the current tree, not trust the 2026-05 numbers:

    deno run -A .llm/tools/fitness/release-readiness.ts --out ./audit --include-plugins
    deno publish --dry-run --allow-dirty   # in packages/shared: count real slow-types

## Quality bar

- `docs/architecture/STANDARDS.md` section 6 (README) + section 7 (`/docs`)
- `docs/architecture/PUBLIC-SURFACE-PATTERNS.md` (A1 surface shape)
- `.llm/harness/gates/archetype-gate-matrix.md` (A1 column)

## Gates (all green before the sub-PR merges)

- `deno publish --dry-run --allow-dirty` (no `--allow-slow-types`) -> 0 slow-types
- `deno doc --lint packages/shared/mod.ts` -> clean
- `.llm/tools/fitness/check-netscript-standards.ts` -> clean (README >= 150, `/docs`, barrel)
- `deno test --allow-all packages/shared` -> green
- separate evaluator session -> `PASS`

## Next

Complete the Design checkpoint (public-surface split, domain vocabulary) in
`worklog.md`, then slice the refactor per the nested `plan_shared.md`, re-checked
against the Wave 0 re-audit.
