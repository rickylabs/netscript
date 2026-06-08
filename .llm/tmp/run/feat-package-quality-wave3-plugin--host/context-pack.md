# Context Pack — Wave 3 host: `@netscript/plugin` (A4)

Run ID: `feat-package-quality-wave3-plugin--host`
Branch: `feat/package-quality-wave3-plugin-host`
Base: umbrella `feat/package-quality-wave3-plugin` @ `89071df` (= track `f2a7ff2` + umbrella seed)
PR target: `feat/package-quality-wave3-plugin` (umbrella) — **not** the track.
Role: SEED for the Research → Plan & Design phases, authored by the SUPERVISOR
session. **Not** a PLAN-EVAL or IMPL-EVAL artifact.

> Read the **umbrella context-pack** first — it holds the full deep-dive:
> `.llm/tmp/run/feat-package-quality-wave3-plugin--umbrella/context-pack.md`.
> This file is the generator-facing entry point and does not duplicate it.

## Phase status

- Research + Plan & Design: complete (committed).
- **PLAN-EVAL: PASS** (2026-06-08, separate session) — see `plan-eval.md`. One
  rework-forcing decision resolved in-line as **LD-8** (upstream-typed `private-type-ref`
  → package-owned structural types, not upstream re-export; preserves F-15/AP-14). Carry
  LD-8 into slice 1. **Implementation may now begin.**
- Implementation: slice 1 complete. Commit `0c1b2a1` fixes all `private-type-ref` errors; full-export
  doc-lint now has no `private-type-ref` matches and 100 planned `missing-jsdoc` errors for slices
  2-7.
- Implementation: slice 2 complete. Commit `1a7e71e` documents the first abstract contribution
  group and reduces full-export doc-lint to 86 remaining missing-JSDoc errors.

## One-unit wave

`@netscript/plugin` only. Archetype **A4 — DSL/Builder (plugin host)**. Gate set
**F-1..F-12, F-14..F-18** (F-13 n/a) + required consumer-import validation + static
gates, per `.llm/harness/gates/archetype-gate-matrix.md`. No sub-wave split.

## Phase 0 reading (read only what the task needs)

1. Umbrella context-pack (above) — scope, baseline, deltas, caveats, Concept of Done.
2. `.llm/harness/archetypes/ARCHETYPE-4-*.md` + `gates/archetype-gate-matrix.md` (A4 row).
3. `.llm/harness/lessons/{package-quality-archetype,validation,sub-wave-orchestration,platform}.md`
   — the Wave 2 playbook. **package-quality is architectural, not type/lint cleanup.**
4. Canonical (stale, structural intent only):
   `…/copilot-evaluate-…/plan_plugin.md` §§2–5, `evaluate_plugin.md`. Treat all
   numbers as pre-rewrite.
5. Focused code: `packages/plugin/deno.json`, `mod.ts`, `src/public/mod.ts`, the 8
   exports entrypoints, `loader.ts`, `src/config/builders/plugin-builder.ts`,
   `src/sdk/runtime/*`, `src/diagnostics/inspect-plugin.ts`.

For internal API shape prefer `deno doc packages/plugin/mod.ts` and
`deno doc --filter <symbol>` over reading whole files.

## Research step (MEASURE-FIRST — mandatory before locking the plan)

The canonical evaluate (5 files, 33 slow types, 0 tests) is **stale**; the package
is already hexagonal with docs + tests. Re-measure at base `89071df` and record real
numbers in `research.md` / `drift.md`:

- `deno publish --dry-run --allow-dirty` from `packages/plugin` (real slow-type count).
- Full-export `deno doc --lint` over **all 8** entrypoints (`.`, `./abstracts`,
  `./config`, `./cli`, `./loader`, `./sdk`, `./testing`, `./templates`) — root-only
  undercounts; see `lessons/validation.md`.
- README length / 14-section coverage (currently 139 LOC).
- Test adequacy vs A4 layers (doctest · domain · port-contract · adapter conformance ·
  runtime lifecycle · DSL/builder ergonomics).
- `deno check --unstable-kv` over all entrypoints (the shipped `tasks.check` only
  covers `mod.ts` — F-6 gap).

## Open questions for Plan & Design (resolve in the plan; do not pre-decide)

- **OQ-A `./loader` dynamic import:** does `loader.ts`'s `await import(source)` still
  block publish (slow types / unanalyzable) ? Keep `./loader` public, internalize it,
  or document the runtime-resolvability caveat? Decide with dry-run evidence.
- **OQ-B vocabulary reconciliation:** canonical `plan_plugin.md` §2 wants
  `src/{public,domain,ports,application,adapters,runtime,presentation,diagnostics,
  testing,internal}`. Repo already has most, plus `config/`, `cli/`, `sdk/`,
  `abstracts/`, `kernel/`. Align names or accept the rewrite's vocabulary? Verify
  zero external consumers before any subpath/folder rename (alpha = no shims, but
  prove it first). F-11 forbids `utils/`/`interfaces/`; F-16 cardinality must hold.
- **OQ-C file-size (F-1):** `plugin-builder.ts` 344 LOC and `docs/plugin-author-guide.md`
  372 LOC vs the doctrine cap — split, or accept with debt?
- **OQ-D `e2e:cli` triggers-health:** is the `localhost:8093/health` failure a
  plugin-host bootstrap defect (in `src/sdk/runtime/`) or downstream `plugin-triggers`
  (Wave 4)? Investigate before scoping; if downstream, record as carried-forward, do
  not fix here.
- **OQ-E `./testing` + defensive I/O:** the host owns watchers/timers
  (`sdk/discovery/watcher.ts`, `presets/start-watcher.ts`). Plan an abort/cleanup test
  and confirm the `./testing` contract surface is exercised.
- **OQ-F diagnostic axis:** confirm `inspectPlugin` is exported from `mod.ts` and
  returns a structured `InspectionReport`.

## Concept of Done

See the umbrella context-pack § "Concept of Done". In short: dry-run 0 slow types;
full-export doc-lint 0; README/docs at STANDARDS bar + doctested; A4 test layers;
F-1..F-18 (minus F-13) green or accepted-debt; consumer-import validation green;
task hygiene (`check` all entrypoints + `lint`/`fmt`/`publish:dry-run`).

## Slice discipline (carry the Wave 2 cadence)

One commit per slice, each with a single named gate, paired with a
`docs(wave3): record …` run-doc commit. Renames as `git mv`-only slices with the
static gate deferred to the retarget slice (record the transient-failure expectation
in `drift.md`). Final slices: consumer-import gate, then `deno task e2e:cli` once as
merge-readiness (escalate out-of-scope runtime failures, do not block — see
`lessons/validation.md`).

## Process boundaries (Harness v2)

- Generator, PLAN-EVAL, IMPL-EVAL are each a SEPARATE session. Evaluator ≠ generator.
- Never delete lock files/caches; never `deno cache --reload` without approval.
- Record every plan deviation in `drift.md`.
- Targeted `deno check` must pass `--unstable-kv`.
