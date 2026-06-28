# Run Summary — OpenHands PR-comment PLAN-EVAL (cycle 3)

## Summary

PLAN-EVAL evaluator session for the centralization plan that hoists duplicated
plugin-scaffolding primitives/base/adapters from `plugins/{workers,sagas,streams,triggers,auth}/src/scaffold/`
into core `@netscript/plugin/scaffold`. Branch: `chore/plugin-167-harden` (PR #170 held open, prior
PLAN-EVAL + IMPL-EVAL PASS on the schema/CI/dead-code infra slice; this is the cycle-3 centralization
plan). Verdict emitted: **PASS_PLAN** — implementation may begin.

## Changes

- Created `.llm/tmp/run/openhands/pr-170/run-28329181305-1/plan-eval-verdict.md` (run-trace artifact
  with per-criterion walk + cycle-3 spot-check evidence table + watcher notes).
- No source edits. No `deno.lock` churn. Branch unchanged at `4d601e6a`.
- Plan under evaluation (read-only):
  `.llm/tmp/run/plugin-167-harden--impl/plan-scaffold-core.md` (145 lines).

## Validation

PLAN-EVAL gate evidence (separate from IMPL-EVAL — no code validation; this is plan-level):

| Plan-Gate criterion | Verdict | Evidence |
| --- | --- | --- |
| 1. Problem correctly diagnosed | OK | md5 `files.ts` twins (sagas==triggers `395537b5…`, streams==auth `58bac14e…`); `toPascalCase/toCamelCase/toKebabCase/toSnakeCase` reinvented in all 5 `artifacts.ts` (workers L580-603, sagas L611-622, streams L429-438, triggers L650-663, auth); `NETSCRIPT_VERSION` JSON-import in artifacts.ts:1/13/29; `SCAFFOLD_SCHEMA_URL` formula duplicated 5×; `generateScaffoldPluginJson` envelope 5×; `--context-json` argv harness 5× mod.ts; `writePlannedFiles` byte-identical. |
| 2. Dependency-direction soundness | OK | Core home = `packages/plugin` (not `packages/cli`); no plugin→CLI import (grep returns 0); all 5 plugins already peer-dep `@netscript/plugin` (auth/deno.json:22, sagas/deno.json:25, streams/deno.json:19); additive `./scaffold` subpath export is legal (`packages/plugin/deno.json` already publishes `src/**/*.ts`); no cycle into `protocol/` or `sdk/`. |
| 3. Byte-identical-output invariant | OK | C2 byte-equality test feeds each plugin spec through `buildScaffoldPluginJson` and diffs vs the 5 committed `plugins/*/scaffold.plugin.json`; this is the right safety net for `plugins:check` byte-stability. C6 mandates full `scaffold.runtime` e2e (machinery change — runner hoisted — correctly mandatory, unlike #170's inert string change). |
| 4. Slice decomposition | OK | C1 primitives → C2 builder → C3 runner → C4 workers+streams migrations → C5 sagas+triggers+auth → C6 full verification. Each slice has named gate + bound in-slice acceptance. "Fold, don't split" justified (Decision 1): same branch, PR #170 held so duplicated `$schema`/version consts never land on `main`; final adversarial-review + IMPL-EVAL on whole branch; alpha.13 cut follows single merge. |
| 5. API minimalism / no over-abstraction | OK | 6-file core surface is the minimum. Base-class + adapters shape consistent with existing `PluginItemScaffolder` (packages/plugin/src/cli/base/plugin-item-scaffolder.ts). Plan explicitly bans generic-template-DSL creep. |
| 6. #167 reconciliation | OK | Plugins still OWN `./scaffold` export (each plugin deno.json mapping unchanged, e.g. `plugins/sagas/deno.json:11`), file-template bodies (workers service/router/contracts/db; auth `templates/`; sagas saga-scaffolders), and manifest data (spec.ts literal per plugin). Only machinery moves to core. |
| 7. Debt handling | OK | `SCAFFOLD-CASING-CLI-DUP` (cli casing dedupe) and `SCAFFOLD-DENOJSON-ENVELOPE` (optional `buildPluginDenoJson`) explicitly deferred to arch-debt, not silently dropped or force-fit. |
| 8. Gate set | OK | Scoped check/lint/fmt, `deno task test`, `plugins:check`, `arch:check`, full `scaffold.runtime` e2e, 6 publish dry-runs. Recommended optional addition (IMPL-EVAL, not plan-blocking): `deno doc --filter` confirmation of new `./scaffold` export. |

## Watcher notes (non-blocking, IMPL-EVAL guidance)

1. Per-plugin `mod.ts` files (auth/sagas/streams/triggers) re-declare `ScaffolderContext` and
   `ScaffoldResult` locally despite the protocol surface exporting them. The plan covers this
   implicitly under "Drop every primitive"; the implementing session must explicitly delete the local
   copies and force-import from `@netscript/plugin/protocol` to avoid leaking a primitive.
2. `defineScaffold` vs `PluginScaffolder` base class — user wording was "base class, adapters."
   Recommend landing a real `PluginScaffolder` abstract class with `abstract buildArtifacts(context:
   ScaffolderContext): readonly ScaffoldArtifact[]` (matching `PluginItemScaffolder<TInput>` shape at
   `packages/plugin/src/cli/base/plugin-item-scaffolder.ts:11`) and per-plugin concrete subclasses
   (`WorkerScaffolder extends PluginScaffolder`, etc.) over a functional `defineScaffold({…})` factory.
   This satisfies "base class + adapters" verbatim and preserves the #167 protocol contract.
3. Add `deno doc --json packages/plugin/src/scaffold/mod.ts` to C6 gate set (cheap public-surface
   confirmation; matches `.agents/skills/netscript-deno-toolchain` guidance).
4. `buildArtifacts` should accept `ScaffolderContext` (not a custom `TInput`) so the existing CLI
   dispatch at `packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts:175-194`
   (which already passes a `ScaffolderContext` via `--context-json`) keeps working unchanged.

## Responses to review comments or issue comments when relevant

None — this is a fresh PLAN-EVAL cycle on a continuation plan. Cycle-2 evaluator (`eval-cycle2.md`)
PASS_PLAN on the prior slice (S1–S5 schema/CI/dead-code infra) is intact; cycle-3 evaluates only the
new centralization plan (`plan-scaffold-core.md`).

## Remaining risks

- **Byte drift** in generated manifests/files during C4/C5 migration — caught by C2 byte-equality
  test + C6 `scaffold.runtime` e2e. Plan's contingency: regenerate committed manifests in the same
  slice + record in `drift.md`. Acceptable.
- **Per-plugin `ScaffolderContext`/`ScaffoldResult` re-declaration** — if not explicitly deleted in
  C4/C5, becomes a fresh primitive. Watcher note 1 captures this.
- **Base-class vs factory** ambiguity in L62-63 of the plan — resolver picks at C3 implementation
  time. Watcher note 2 captures the preferred shape.

## Verdict

**PASS_PLAN.** Implementation may begin on C1 (core primitives).
