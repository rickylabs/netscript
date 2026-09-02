# Worklog: desktop fixture oRPC contract dependency

## Run Metadata

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| Run ID         | `desktop-orpc-contract-dep--impl`       |
| Branch         | `fix/desktop-fixture-orpc-contract-dep` |
| Archetype      | `6 — CLI / Tooling` (owned harness)     |
| Scope overlays | none                                    |

## Design

### Public Surface

- No published or CLI command surface changes.
- Internal developer surface: root `deno task check` gains a prepared desktop-fixture graph guard.

### Domain Vocabulary

- **checked-in fixture map** — reviewable source dependency declaration.
- **prepared fixture map** — rewritten temporary manifest actually used by native packaging.
- **prepared graph guard** — structured Deno check executed with the prepared fixture as resolution
  root.

### Ports

- Existing `requireNativeCommand` process seam executes the structured wrapper; no new port.

### Constants

- No new finite domain values or command vocabulary.

### Archetype-6 Applicability

- Five spine abstracts, layer-2 abstracts, vertical feature catalog, extension registries, public
  composition, and command constants are unchanged; this E2E harness slice adds none.
- Existing native-desktop adapters own temp files and subprocess execution, preserving AP-25/R-A6
  boundaries.

### Commit Slices

| # | Slice                                                             | Gate                                                                  | Files                                                                                                      |
| - | ----------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 0 | Activate run and publish locked plan                              | PLAN-EVAL N/A                                                         | `.llm/runs/desktop-orpc-contract-dep--impl/**`                                                             |
| 1 | Repair both fixture maps and add prepared-graph ordinary-PR guard | non-vacuous failure, scoped gates, fixture contract, local/CI runtime | fixture `deno.json`, `fixture-workspace.ts`, `fixture-contract-driver.ts`, root `deno.json`, run artifacts |

### Deferred Scope

- Full desktop-native scheduling policy change — record recommendation; a future process issue can
  choose every-main-push versus scheduled smoke based on runtime cost.

### Contributor Path

When a relative package entry is added to the desktop fixture, declare its reachable bare imports in
the checked-in fixture map and the prepared map. `deno task check` then prepares the same workspace
used by packaging and checks its graph on ordinary PRs.

## Progress Log

| Time (UTC) | Slice | Step      | Notes                                                                                                                              |
| ---------- | ----- | --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-02 | 0     | research  | Confirmed branch equals `origin/main`, dependency is current, root-context scan is vacuous, and prepared map is runtime authority. |
| 2026-09-02 | 0     | plan gate | `PLAN-EVAL: N/A` — small bounded repair with complete issue contract, scope, pin, gates, and no unresolved material decision.      |

## Decisions

| Decision                             | Reason                                                                                                            | Source                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Check the prepared fixture graph     | It is the actual packaging manifest and materializes the catalog.                                                 | `fixture-workspace.ts`; baseline command evidence |
| Keep full native runtime label-gated | Cheap graph check belongs on ordinary PRs; native `.deb`/updater validation remains the exact CI acceptance gate. | issue #1926; workflow policy                      |

## Drift

| Drift                                                                       | Severity | Logged in drift.md |
| --------------------------------------------------------------------------- | -------- | ------------------ |
| Staging rewrites the checked-in import map, requiring a second declaration. | minor    | yes                |
| RTK binary is unavailable despite repo guidance.                            | minor    | yes                |

## Gate Results

Complete. See "Final implementation and gates" below.

## Handoff Notes

- Evaluator should inspect that the guard runs from the prepared fixture root and verify the
  labelled `desktop-native-linux` job, not accept the repository-root wrapper scan as evidence.

## Final implementation and gates

Phase: **impl** (was recorded as `plan`).

Commits:

- `45fbef54e` — declare `@orpc/contract` in the fixture import map at `^1.15.0` (matching
  `packages/sdk/deno.json:34`); guard scaffolding committed but explicitly **not claimed**, because
  it measured vacuous.
- `f8df31782` — guard reads the fixture's **committed** map instead of the staged one.
- this commit — collector widened per IMPL-EVAL C1; comments stripped; run artifacts reconciled.

Guard non-vacuity, measured at each step rather than inspected:

| fixture map              | result                                                               |
| ------------------------ | -------------------------------------------------------------------- |
| without `@orpc/contract` | exit 1 — names `@orpc/contract` and `stable-v1-adapter.ts`           |
| with `@orpc/contract`    | exit 0 — `satisfies 14 reachable SDK modules; 0 unmapped specifiers` |

Specifier-form coverage, verified against the IMPL-EVAL C1 vector: static value, side-effect,
dynamic, `export … from`, `export *`, and inline-type forms are all collected; `import type` and
`export type` are skipped as erased.

Gates: scoped check 5 files / 0 diagnostics; fixture-contract test exit 0; lint exit 0; fmt exit 0;
`quality:gate` exit 0; `arch:check` exit 0; `deno.lock` byte-identical to `origin/main`. Hosted:
`desktop-native-linux` **success** at `f8df31782`, run 33638728013.

Local limits: the isolated-root dpkg install/update/rollback path cannot run in this environment (no
dpkg root, X server, or a11y bus), so the packaged-app assertion rests on hosted CI.
