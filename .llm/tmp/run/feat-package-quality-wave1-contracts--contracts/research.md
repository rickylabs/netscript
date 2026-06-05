# Research — feat-package-quality-wave1-contracts--contracts

> **Reviewer seed.** These are verified facts from an initial scan of
> `feat/package-quality`. Re-baseline against the current branch and extend before locking the
> plan. Do not treat as final.

## Re-baseline

- Carried-in canonical audit: `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/`
  (`plan_runtime-config.md` etc.). **Predates the plugin-platform merge** — stale skeleton only.
  Re-derive every count against `feat/package-quality`.
- Base: `feat/package-quality` (Wave 0 `shared` + Wave 0b harness reinforcement + agent docs merged).

## Wave 1 units (3)

| Unit | Version | Exports (`deno.json`) | README | `/docs` | Tests | Notes |
|------|---------|-----------------------|--------|---------|-------|-------|
| `@netscript/config` | `0.0.1-alpha.0` | `.`, `./merge`, `./paths`, `./schema/plugins` | yes (~7.5 KB) | `docs/` present | `tests/` present | Root files: `define-config.ts`, `env.ts`, `helpers.ts`, `loader.ts`, `types.ts` (~15 KB), `workspace.ts`. `helpers.ts` is a generic name (doctrine folder-vocab finding). `check` task uses `--unstable-kv`. Deps: `@std/fs`, `@std/path`, `zod@4`. |
| `@netscript/contracts` | `0.0.1-alpha.0` | `.`, `./crud`, `./query`, `./transform` | yes (~11.7 KB) | `docs/` present | `tests/` present | Dirs: `crud/`, `helpers/`, `schemas/`, `src/`. `helpers/` is a generic folder (doctrine finding). Deps: `zod@4`, `@orpc/server`. `mod.ts` tiny (~0.7 KB). |
| `@netscript/runtime-config` | `0.0.1-alpha.0` | `.` only | **MISSING** | **MISSING** | **MISSING** | Single `mod.ts` ~13.4 KB (file-size gate F-1 risk). Dep: `@std/path`. **Least developed** — needs README >= 150 LOC, `/docs` per STANDARDS § 7, and tests. |

## Slow-types posture

- Workspace root `deno.json` sets `compilerOptions.isolatedDeclarations: true` (forces explicit
  types) — slow-types should be largely satisfied already.
- Per-package `publish:dry-run` tasks do **not** pass `--allow-slow-types` — i.e. these packages are
  expected to be slow-types-clean. **Verify** with `deno publish --dry-run` per unit and record the
  real output.

## Archetype

- All three are **Archetype 1 (Small Contract)** candidates. `config` and `runtime-config` carry
  light Integration (env / `@std/fs` / `@std/path`); confirm whether that pulls either toward
  Archetype 2 in the Design checkpoint.

## jsr-audit (Plan-Gate input — D3)

Apply the `jsr-audit` skill rubric to each unit's PLANNED public surface BEFORE slicing: name
slow-type / surface risks, confirm `name`/`version`/`exports`, description <= 250 chars, README
>= 150 LOC, `deno doc --lint` clean, `/docs` per STANDARDS § 7.

## Open questions (the plan must close)

- `runtime-config`: does the ~13.4 KB single `mod.ts` exceed the F-1 file-size gate, and should it
  be split into the doctrine layout? Decide in Design.
- `config/helpers.ts` and `contracts/helpers/`: rename per doctrine folder vocabulary, or record an
  `arch-debt.md` entry if deferred? Decide + log.
- Confirm the exact STANDARDS § 7 `/docs` structure target for each unit (`runtime-config` has none).
- Re-derive the real `deno publish --dry-run` slow-type output for each unit (canonical audit is stale).
