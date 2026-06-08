# Umbrella Context Pack — Wave 3: `@netscript/plugin` (A4 plugin host)

Run ID (umbrella): `feat-package-quality-wave3-plugin--umbrella`
Umbrella branch: `feat/package-quality-wave3-plugin` (off track `feat/package-quality` @ `f2a7ff2`)
PR target: `feat/package-quality` (the S1 track) — merges **once**, at wave completion.
Role: SUPERVISOR-authored umbrella/tracking seed. **Not** a PLAN-EVAL or IMPL-EVAL
artifact. The locked slice authority will be the sub-run `plan.md` once written.

## Why an umbrella for a single unit

Wave 3 has one publishable unit (`@netscript/plugin`), so **no sub-wave split is
expected** (one unit is far under the `< 30`-slice Plan-Gate cap). The umbrella
exists for **tracking-surface continuity**, the discipline promoted in
`.llm/harness/lessons/sub-wave-orchestration.md`: stand up the umbrella PR *before*
merging anything, so the wave's tracking surface survives even if scope later
splits. The actual generator work happens on the sub-branch
`feat/package-quality-wave3-plugin-host` (worktree `.worktrees/wave3-plugin-host`,
nested run `feat-package-quality-wave3-plugin--host`), which targets this umbrella.

## Branch model

```
feat/package-quality                         (S1 track → main, PR #2)
└── feat/package-quality-wave3-plugin          ← THIS umbrella (Draft PR → track)
    └── feat/package-quality-wave3-plugin-host   ← generator sub-branch (Draft PR → umbrella)
```

## Scope

In scope: `packages/plugin` (`@netscript/plugin`) to the JSR alpha enterprise bar.

Archetype: **A4 — DSL/Builder (plugin host)**. Pattern: DSL + Registry + abstract
contribution base. Gate set (from `gates/archetype-gate-matrix.md`): **F-1..F-12,
F-14..F-18** (F-13 saga/runtime n/a) + **required consumer-import validation** +
required static gates. Runtime/Aspire validation optional (run if the host's
bootstrap path is touched). Browser validation n/a.

Out of scope (later waves): the `*-core` runtime packages and `plugins/{streams,
workers,sagas,triggers}` (**Wave 4**); `@netscript/cli` (**Wave 6**); publishing /
versioning / OIDC (S2/S3).

## Carried-in caveats from Wave 2 (must resolve or re-attribute in this wave)

1. **`e2e:cli` `behavior.triggers-health`** — generated trigger-service health
   probe fails (`localhost:8093/health`, os error 10054). The plugin **host**
   bootstrap path lives in this package (`src/sdk/runtime/plugin-host-bootstrap.ts`,
   `plugin-context.ts`, `plugin-service-context.ts`). Research must determine
   whether the regression is a plugin-host defect (fix here) or downstream in the
   generated trigger service (Wave 4). **Do not assume.**
2. The Wave 2 `cli-maintainer-sync-isolated-declarations` debt is **Wave 6's**, not
   this wave's.

## MEASURE-FIRST (the canonical evaluate is heavily stale)

The canonical `…/copilot-evaluate-…/evaluate_plugin.md` + `plan_plugin.md` describe a
**5-file / 1956-LOC / 33-slow-type / 0-test** package. That is the **2026-05
pre-rewrite** state and is now wrong: the platform rewrite already restructured the
package into a full hexagonal `src/` layout (see below), README is 139 LOC, `docs/`
exists, tests exist, and `inspectPlugin` ships. **Treat every canonical number as
stale.** The generator's Research step MUST re-measure at the wave base:

- `deno publish --dry-run --allow-dirty` (real slow-type count; canonical 33 is stale).
- Full-export `deno doc --lint` across **all 8 `exports` entrypoints** (root-only
  undercounts massively — see `lessons/validation.md`; telemetry went 2 → 168).
- README length vs the 150-line / 14-section STANDARDS bar (currently 139).
- Test adequacy vs A4 test layers (doctest + domain + port-contract + adapter
  conformance + runtime lifecycle + DSL ergonomics).

Record the real per-entrypoint numbers in the sub-run `research.md`/`drift.md`
before locking slice effort.

## Current structural baseline (at `f2a7ff2`, already hexagonal)

`packages/plugin/` exports 8 entrypoints in `deno.json`:
`.`, `./abstracts`, `./config`, `./cli`, `./loader`, `./sdk`, `./testing`, `./templates`.

```
mod.ts                       loader.ts (./loader — has a dynamic import, see below)
README.md (139 LOC)          docs/{README,architecture,concepts,getting-started}.md
                             docs/plugin-author-guide.md (372 LOC) + recipes/ + reference/
src/abstracts/   (12 contribution abstract bases + mod.ts)
src/adapters/    (filesystem-scaffolder, memory-file-system, string-template + mod)
src/application/ (plugin-loader, plugin-registry + mod)
src/cli/         (base/, composition/, presentation/, types.ts, mod)
src/config/      (builders/{define-plugin, plugin-builder 344 LOC}, domain/*, validators/*, mod)
src/diagnostics/ (inspect-plugin 70 LOC, inspect-walker-output, mod)
src/domain/      (constants, core-types, errors, installed-version, mod)
src/kernel/assets/template-registry.ts
src/ports/       (file-system-port, scaffolder-port, template-port, mod)
src/public/mod.ts
src/sdk/         (discovery/{ast-extractor 127, filesystem-walker, manifest-resolver, ports/*,
                 registry-emitter 88, source-graph, watcher}, runtime/{plugin-host-bootstrap,
                 plugin-context, plugin-service-context, doctor-runner, instrumentation-bridge},
                 presets/*, application/run-walker-pipeline, mod)
src/templates/skeleton/  (the `netscript plugin scaffold` template — replaces the deleted
                          plugins/hello-world; shipped via publish include `src/templates/**/*.template`)
src/testing/     (manifest-fixtures, walker-fixtures, memory-{emitter,walker,manifest-resolver},
                 plugin-cli-contract, mod)
tests/           (_fixtures/readme-examples_test.ts, application/, cli/, sdk/walker-ports_test.ts)
```

## Known deltas / hotspots to investigate (NOT pre-decided — for Plan & Design)

- **F-6 task hygiene gap:** `deno.json` `tasks.check` only checks `mod.ts`; it must
  enumerate **all 8** exports entrypoints. No `lint`/`fmt` tasks (Wave 2 added these).
- **F-1 file-size:** `src/config/builders/plugin-builder.ts` (344 LOC) and
  `docs/plugin-author-guide.md` (372 LOC) — check against the doctrine size cap; the
  builder is the classic A4 hotspot (fluent accumulator may also drive slow types).
- **`./loader` dynamic import:** `loader.ts` historically had an
  `unanalyzable-dynamic-import` (`await import(source)`). Confirm whether it still
  blocks publish or is only a benign warning; decide if loader belongs on the public
  surface at alpha or should be internalized.
- **`plugins/hello-world` is GONE** — replaced by `src/templates/skeleton/`. The
  canonical `plan_plugin.md` references to hello-world do not apply; log the delta.
- **Structural-target reconciliation:** the canonical `plan_plugin.md` § 2 proposes a
  `src/{public,domain,ports,application,adapters,runtime,presentation,diagnostics,
  testing,internal}` tree. The repo already has most of this but with different names
  (`config/`, `cli/`, `sdk/`, `abstracts/`, `kernel/`). Decide whether to align to the
  canonical names or accept the rewrite's vocabulary — record the decision; do **not**
  rename speculatively (alpha, but verify zero-consumer first per
  `lessons/package-quality-archetype.md`).
- **A4 diagnostic axis:** `inspectPlugin` already exists (canonical asked for it) — verify
  it is exported from `mod.ts` and returns a structured `InspectionReport`.

## Concept of Done (A4 enterprise bar — apply `lessons/package-quality-archetype.md`)

1. `deno publish --dry-run` 0 slow types.
2. Full-export `deno doc --lint` 0 errors across all 8 entrypoints.
3. README ≥150 LOC / 14 STANDARDS sections; docs scaffold complete; doctested.
4. A4 test layers present (doctest + domain + port-contract + adapter conformance +
   runtime lifecycle + DSL ergonomics); `tests/_fixtures/readme-examples_test.ts` green.
5. F-1..F-12, F-14..F-18 green (manual evidence or accepted debt); consumer-import
   validation green for the host's consumers.
6. Folder vocabulary + cardinality (F-11/F-16) clean; no forbidden `utils/`/`interfaces/`.
7. `deno.json` tasks: `check` enumerates all entrypoints, plus `lint`/`fmt`/`publish:dry-run`.
8. `./testing` port-contract entrypoint exercised; defensive cleanup where the host
   holds watchers/timers (`sdk/discovery/watcher.ts`, `start-watcher`).

## Process boundaries (Harness v2)

- Generator, PLAN-EVAL, IMPL-EVAL are each a SEPARATE session.
- Supervisor does not run gates, PLAN-EVAL, IMPL-EVAL, dry-run, or doc-lint.
- Never delete lock files/caches; never `deno cache --reload` without approval.
- Record every deviation from the locked plan in the sub-run `drift.md`.

## References

- Canonical (stale, structural intent only): `…/copilot-evaluate-…/plan_plugin.md`,
  `evaluate_plugin.md`.
- Archetype: `.llm/harness/archetypes/ARCHETYPE-4-*.md`; gate matrix
  `.llm/harness/gates/archetype-gate-matrix.md`.
- Lessons: `.llm/harness/lessons/{package-quality-archetype,sub-wave-orchestration,validation,platform}.md`.
- Supervisor: `.llm/tmp/run/feat-package-quality--supervisor/phase-registry.md` (Wave 3).
