# Plan: `netscript config` — schema-aware key resolution (#955)

## Run Metadata

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| Run ID         | `fix-config-set-schema-aware-keys--955` |
| Branch         | `fix/config-set-schema-aware-keys`      |
| Phase          | `plan`                                  |
| Target         | `packages/cli` (public `config` feature) |
| Archetype      | `6 — CLI / Tooling`                     |
| Scope overlays | `none`                                  |

## Archetype

Archetype 6 (CLI / Tooling). The change lives entirely in `packages/cli/src/public/features/config/`
— a command surface plus its use case. No port/adapter seam is introduced (Archetype 2 does not
apply); no long-running behavior (Archetype 3 does not apply).

## Current Doctrine Verdict

`@netscript/cli` — Archetype 6, **Restructure**; headline action: split `pipeline.ts` (1,869) and
`official-plugin-copier.ts` (1,203), apply the Archetype-6 layout. Neither file is in this run's
scope; the run must not add to the restructure debt (no new oversized file, no new flat folder).

## Axioms in Play

| Axiom | Why it matters                                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1    | Contract first — the appsettings **schema** is the contract; the CLI must resolve against it rather than guess a string transform.               |
| A2    | Wrap, do not reinvent — reuse `@netscript/aspire`'s existing `generateAppSettingsJsonSchema()` instead of hand-writing a parallel path table.    |
| A4    | Single source of truth — one derivation of "what keys exist", shared by `set`, `get`, and `list`.                                                |
| A9    | Fail loudly — a command that cannot honor its contract must exit non-zero, not print success.                                                     |
| A13   | Public surface discipline — no new package export; the new module stays internal to the feature folder.                                          |

## Goal

`netscript config set <path> <value>` resolves `<path>` against the schema the Aspire generator
actually parses, writes the canonical case-sensitive key, and **fails** (non-zero, with suggestions)
when the path is one the generator does not know. `config get` uses the same resolution. `config
list` enumerates canonical paths.

## Scope

- Replace `appsettingsPath()`'s blind heuristic with schema-aware resolution derived from
  `generateAppSettingsJsonSchema()`.
- Accept all three input spellings and canonicalize them: full path (`NetScript.Databases.postgres.
  Persistent`), section-relative (`Databases.postgres.Persistent`), and case-insensitive/camelCase
  (`databases.postgres.persistent`). Record keys resolve against the live document so user-chosen
  keys keep their real casing.
- Preserve the documented `telemetry.otlpEndpoint` alias explicitly (constant table, not a
  heuristic).
- `config set` reports the canonical path it wrote, and errors with "did you mean" suggestions on an
  unknown path. `--force` writes an unknown path anyway with a printed warning.
- Validate the *value* against the schema at the resolved path; refuse writes the generator's parser
  would reject.
- Add `netscript config list` printing canonical case-sensitive paths (schema paths + the paths
  present in the project's `appsettings.json`).
- Extend the regression guard: the existing test only covers the one hardcoded alias.

## Non-Scope

- `config override` / `config runtime` (KV-backed runtime override snapshots) — a different store
  with a different key space; untouched.
- The `@netscript/config` (`netscript.config.ts`) project-config surface read by `config inspect` /
  `config get`'s primary lookup — untouched.
- The `Parameters` schema gap (finding 11): the scaffold writes a top-level `Parameters` block that
  `AppSettingsSchema` does not model. This run **works around** it via `--force`; modelling it is a
  separate issue (see Handoff).
- Restructuring `packages/cli` per the doctrine verdict.

## Hidden Scope

- `config get`'s appsettings fallback shares the broken mapper — fixing `set` alone would leave the
  read path wrong. Both must move onto the resolver.
- `kernel/domain/` already has exactly 12 children (R-A6-N1 cap). The new module therefore **cannot**
  go there; it goes in the feature folder.

## Locked Decisions

| ID | Decision                                                                                                                                                        | Rationale                                                                                                                       |
| -- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| D1 | Derive the canonical path space at runtime from `generateAppSettingsJsonSchema()` (`@netscript/aspire/schema`), which is generated from the same Zod schemas `parseAppSettings()` validates with. | A hand-maintained path table is exactly the drift that produced this bug. Deriving it means "the generator knows this key" is true by construction. |
| D2 | Distinguish closed objects (`additionalProperties: false` → canonicalize case-insensitively against `properties`) from records (`additionalProperties: <schema>` → key stays verbatim, case-corrected only against keys already in the document). | Record keys are user data (`postgres`, `deno-kv`, service names). Capitalizing them is the second half of the reported bug.        |
| D3 | Unknown path → **error**, exit non-zero, with suggestions. `--force` downgrades to a warning and writes.                                                          | Issue: "never a silent success". `--force` exists because finding 11 shows one legitimate off-schema key (`Parameters.*`).        |
| D4 | Add `config list` as its own subcommand rather than folding into `inspect`.                                                                                       | The issue names `config list`; `inspect` has an existing `InspectionReport` JSON contract that must not change shape.             |
| D5 | Keep `telemetry.otlpEndpoint` as an explicit alias constant.                                                                                                      | It is the one documented shorthand and has a shipped test. Explicit table > implicit heuristic.                                    |
| D6 | Value validation reports only schema issues located **at or under** the resolved path.                                                                            | An `appsettings.json` that is already invalid elsewhere must not block an unrelated, correct `set`.                                |
| D7 | New module lives at `public/features/config/project/resolve-appsettings-path.ts`.                                                                                  | `kernel/domain/` is at the 12-child cardinality cap (R-A6-N1); the feature folder has 3 files and the module has one consumer feature. |

## Open-Decision Sweep

| Decision                                       | Status              | Notes                                                                          |
| ---------------------------------------------- | ------------------- | ------------------------------------------------------------------------------ |
| Unknown key: warn vs error                     | resolved now (D3)   | Would force rework of the command contract if deferred.                        |
| Path-table source: derived vs hand-written     | resolved now (D1)   | Determines whether the fix can drift; cannot be deferred.                      |
| `config list` output format (text vs `--json`) | resolved now        | Both, matching sibling commands' `--json` convention.                          |
| Modelling `Parameters` in `AppSettingsSchema`  | safe to defer       | Cross-package schema change; `--force` covers the case today. Filed as handoff. |
| Restructuring `packages/cli` per verdict       | safe to defer       | Out of scope; run adds no new debt.                                            |

## Risk Register

| Risk                                                                                       | Mitigation                                                                                                                     |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Erroring on unknown paths breaks a workflow that relied on writing an off-schema key.      | `--force` escape hatch; the error message names it. Only `Parameters.*` is known to need it.                                    |
| `z.toJSONSchema()` output shape changes in a future Zod, breaking the walker.              | Walker handles the two documented node kinds and treats anything else as "cannot descend" → unknown, i.e. it fails closed, not open. A unit test asserts real schema paths resolve. |
| Resolver becomes a second source of truth about the schema.                                | It holds no schema facts — only traversal rules. Every key name comes from the generated schema at runtime.                     |
| Case-insensitive matching makes two distinct schema fields collide.                        | Ambiguous match (>1 case-insensitive hit) is an error, not a silent pick.                                                       |
| File-size gate (F-CLI-1: use cases ≤ 250 LOC, presentation ≤ 150 LOC).                     | Resolver is its own module; the command file stays a thin dispatcher.                                                           |

## Anti-Patterns to Resolve or Avoid

| AP    | Status   | Plan                                                                                                        |
| ----- | -------- | ------------------------------------------------------------------------------------------------------------- |
| AP-1  | avoid    | Resolver is a separate module; no monolith growth in the command file.                                       |
| AP-11 | avoid    | No `Deno.*` in the new module — all IO goes through the existing `FileSystemPort`.                            |
| AP-18 | resolve  | Existing test asserts one string-mapping snapshot; new tests assert the *semantic* property (the generator's parser reads the key back). |
| AP-24 | avoid    | Node kinds are dispatched by schema shape, not a hardcoded switch over section names.                        |
| AP-25 | avoid    | No `console.*` in the new module; output goes through `outputText`/`outputWarning` presentation helpers.      |

## Fitness Gates

| Gate               | Required | Expected evidence                                                    |
| ------------------ | -------- | -------------------------------------------------------------------- |
| Static (check)     | yes      | `deno task check`                                                    |
| Static (lint)      | yes      | `deno task lint`                                                     |
| Static (fmt)       | yes      | `deno task fmt:check`                                                |
| Tests              | yes      | `deno task test`                                                     |
| F-3 layering       | yes      | `deno task arch:check`                                               |
| F-CLI-1 / F-CLI-2  | yes      | LOC scan — new files under the per-layer caps                        |
| F-CLI-26           | yes      | no `console.*` outside the allowed roots                             |
| F-CLI-25           | yes      | feature folder stays ≤ 12 children                                   |
| F-CLI-1…31 (rest)  | PENDING_SCRIPT | no dedicated script (per archetype profile); backed by `arch:check` |
| Consumer / runtime | n/a      | No change to generated output, scaffold templates, or command names other than the added `list`. |

## Arch-Debt Implications

| Entry                                      | Action | Notes                                                          |
| ------------------------------------------ | ------ | -------------------------------------------------------------- |
| `@netscript/cli` Restructure (doctrine 10) | none   | Run adds no new oversized file and no new flat folder.         |
| `Parameters` not in `AppSettingsSchema`    | none   | Reported as a follow-up issue, not accepted debt in this run.  |

## Validation Plan

| Order | Gate       | Command or check                                | Expected result                                    |
| ----- | ---------- | ----------------------------------------------- | -------------------------------------------------- |
| 1     | repro      | pre-fix unit test on the reported path           | FAIL before the fix, PASS after                    |
| 2     | tests      | `deno task test`                                 | PASS                                               |
| 3     | check      | `deno task check`                                | PASS                                               |
| 4     | lint       | `deno task lint`                                 | PASS                                               |
| 5     | fmt        | `deno task fmt:check`                            | PASS                                               |
| 6     | arch       | `deno task arch:check`                           | PASS (no new findings vs baseline)                 |

## Risks

- Baseline gate noise on a 38k-LOC package could mask a regression → capture baseline results before
  the change and diff.

## Dependencies

- `@netscript/aspire` `./schema` and `./config` subpath exports (already declared, already used by
  `packages/cli`).

## Drift Watch

- If `z.toJSONSchema()` stops emitting `additionalProperties: false` for closed objects, the walker's
  closed/record discrimination changes meaning — log to `drift.md`.
- If `AppSettingsSchema` gains a `Parameters` section, the `--force` path for `Parameters.*` becomes
  unnecessary.
