# Drift Log — feat-package-quality-wave4-runtimes--4a-streams-watchers

> Record every deviation from the locked plan, every subpath/folder rename, and every
> MEASURE-FIRST re-baseline finding here.

## Carried-in (from umbrella pre-research, to be confirmed by MEASURE-FIRST)

| Item | Status at base | Action for 4a |
|------|----------------|---------------|
| All 3 units dry-run PASS 0 slow types | measured at `f2a7ff2` | Re-confirm at the umbrella base; this wave is doc/test/structure, not slow-type. |
| Full-export `deno doc --lint` | **not yet measured** | MEASURE-FIRST per entrypoint (root undercounts). Becomes the real doc-debt number. |
| `plugin-streams` tests = 0 | A5 ⇒ F-10 required | Design + build a real test layer (Plan & Design). |
| `watchers` flat layout / no README / no docs/ / no tasks | structural finding | Full structural lift to `src/public/` + README ≥150 + docs scaffold + task block. |
| `*-streams-core` archetype A1 vs A3 | disputed (registry A1/A4 vs canonical A1) | **Decide in Plan & Design**; declare in `docs/architecture.md`; record gate delta here. |

## Re-baseline drift (generator MEASURE-FIRST — append)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-08 | none | Slice 1 followed the locked A3 declaration scope | `packages/plugin-streams-core/docs/architecture.md` updated only | No drift |
| 2026-06-08 | none | Slice 2 followed the locked check-task scope | `packages/plugin-streams-core/deno.json` check task now enumerates all 3 entrypoints | No drift |
| 2026-06-08 | none | Slice 3 followed the locked testing private-type-ref scope | `StreamTopicFixtureSchema` exported through `src/testing/mod.ts`; no third-party re-export | No drift |
| 2026-06-08 | none | Slice 4 followed the locked AP-13 debt scope | `DurableStreamProducer` warn behavior documented; AP-13 entry added to `.llm/harness/debt/arch-debt.md` | No drift |
| 2026-06-08 | none | Slice 5 followed the locked AbortSignal lifecycle-test scope | Added close-after-abort coverage in existing producer test file | No drift |
| 2026-06-08 | none | Slice 6 followed the locked private-type-ref split | First-party `@netscript/*` type graph re-exported; third-party Standard Schema reference replaced with package-owned structural `StreamPayloadSchema` | No drift |
| 2026-06-08 | none | Slice 7 followed the locked verifier scope | `verify-plugin.ts` validates streams manifest shape against `@netscript/plugin` inspector expectations | No drift |
| 2026-06-08 | none | Slice 8 followed the locked manifest-test scope | Added manifest shape test under `tests/public/` | No drift |
| 2026-06-08 | none | Slice 9 followed the locked CLI test scope | Added CLI registry test under `tests/cli/` | No drift |
| 2026-06-08 | none | Slice 10 followed the locked Aspire contribution test scope | Added in-memory Aspire registration test under `tests/aspire/` | No drift |
| 2026-06-08 | none | Slice 11 followed the locked E2E metadata test scope | Added E2E gate metadata test under `tests/e2e/` | No drift |
| 2026-06-08 | none | Slice 12 followed the locked check-task scope | Added `verify-plugin.ts` to the plugin check task; exported entrypoints remained covered | No drift |
| 2026-06-08 | planned-transient | Slice 13 moved watchers source files into `src/` before export/import retarget | Git renames for `file-watcher.ts`, `fs.ts`, `types.ts`, `filters/*.ts`, and `strategies/*.ts` | Static failures expected until S15 per locked plan |
| 2026-06-08 | planned-transient | Slice 14 retargeted watchers public exports before test/downstream import retarget | Root `mod.ts` forwards to `src/public/mod.ts`; S15 still owns tests and `plugin-triggers` deep import | Static failures in tests expected until S15 per locked plan |
| 2026-06-08 | minor | `plugin-streams-core` full-export doc-lint = 1 error (private-type-ref on `StreamTopicFixtureSchema`) | `deno doc --lint mod.ts src/telemetry/mod.ts src/testing/mod.ts` | Fix in slice 3 |
| 2026-06-08 | minor | `plugin-streams` full-export doc-lint = 15 errors (11 private-type-ref + 4 missing-jsdoc) | `deno doc --lint mod.ts src/cli/composition/main.ts src/scaffolding/mod.ts src/e2e/mod.ts src/aspire/mod.ts` | Fix in slice 6 |
| 2026-06-08 | minor | `watchers` full-export doc-lint = 5 errors (missing-jsdoc on constructors) | `deno doc --lint mod.ts` | Fix in slice 19 |
| 2026-06-08 | architectural | `plugin-streams-core` archetype A1→A3 | `DurableStreamProducer` owns runtime behavior (network I/O, lifecycle, registry) | Declare in `docs/architecture.md`; gate delta = F-13 required + Runtime/Aspire validation required |
| 2026-06-08 | minor | `watchers` has no README, no docs/, no tasks, no description | `deno.json` + directory listing | Structural lift in slices 13–21 |

## Implementation drift (append during Implement)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
