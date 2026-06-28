# PLAN-EVAL — `plugin-167-harden--impl` cycle-3 (centralization plan)

- Run: `plugin-167-harden--impl` (continuation; branch `chore/plugin-167-harden`, PR #170 held)
- Session: separate from generator (model `openrouter/minimax/minimax-m3`, provider `OPENROUTER`)
- Plan under evaluation: `.llm/tmp/run/plugin-167-harden--impl/plan-scaffold-core.md` (145 lines)
- User trigger: PLAN-EVAL only; no implementation until verdict
- Verdict emitted: **PASS_PLAN**

## Verification performed

### Evidence of duplication (in-tree, cycle-3 spot-check)

| Claim | Verified | File:line evidence |
| --- | --- | --- |
| 5 plugin `src/scaffold/{artifacts,mod,files}.ts` exist | YES | `plugins/{workers,sagas,streams,triggers,auth}/src/scaffold/{artifacts,mod,files}.ts` |
| `files.ts` md5 duplication sagas==triggers | YES | `md5sum`: sagas `395537b5…` == triggers `395537b5…` |
| `files.ts` md5 duplication streams==auth | YES | `md5sum`: streams `58bac14e…` == auth `58bac14e…` |
| workers `files.ts` unique | YES | `e39ef453…` |
| `toPascalCase/toCamelCase/toKebabCase/toSnakeCase` reinvented per plugin | YES | `plugins/workers/.../artifacts.ts:580-603`, `plugins/sagas/.../artifacts.ts:611-622`, `plugins/streams/.../artifacts.ts:429-438`, `plugins/triggers/.../artifacts.ts:650-663`, `plugins/auth/.../artifacts.ts` |
| `NETSCRIPT_VERSION = packageConfig.version` JSON-import per plugin | YES | `plugins/workers/.../artifacts.ts:1`, `plugins/sagas/.../artifacts.ts:13`, `plugins/auth/.../artifacts.ts:29` |
| `SCAFFOLD_SCHEMA_URL = https://jsr.io/@netscript/plugin/${v}/schema/...` reinvented | YES | `plugins/workers/.../artifacts.ts:14`, `plugins/sagas/.../artifacts.ts:14-15`, `plugins/auth/.../artifacts.ts:30-31` |
| `generateScaffoldPluginJson()` envelope reinvented | YES | `plugins/workers/.../artifacts.ts`, `plugins/sagas/.../artifacts.ts:100`, `plugins/auth/.../artifacts.ts:83` |
| `--context-json` argv harness reinvented in each `mod.ts` | YES | `plugins/workers/.../mod.ts:37-87` (and same shape in 4 other plugins); CLI caller: `packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts:185` |
| `writePlannedFiles` reinvented in `files.ts` | YES | `plugins/workers/.../files.ts` + byte-identical twin in sagas/triggers and streams/auth |

### Core home / dependency-direction (cycle-3 spot-check)

| Claim | Verified | File:line evidence |
| --- | --- | --- |
| Casing pipes live in CLI kernel, not plugin-consumable | YES | `packages/cli/src/kernel/adapters/scaffold/template-adapter.ts` (CLI-only home) |
| Plugins cannot import `@netscript/cli` | YES | `grep -rn "from '@netscript/cli'" plugins/*/src/scaffold/*.ts` returns 0 hits; doctrine: `docs/architecture/doctrine/06-archetypes.md:229` "packages legitimately call into the CLI's flows" only one-way |
| Each plugin already peer-deps `@netscript/plugin` | YES | `plugins/auth/deno.json:22`, `plugins/sagas/deno.json:25`, `plugins/streams/deno.json:19` |
| Existing core scaffold surface to reuse | YES | `packages/plugin/src/protocol/scaffolder.ts` (ScaffolderContext/ScaffoldResult/PluginScaffoldEntrypoint), `packages/plugin/src/ports/{scaffolder,template}-port.ts`, `packages/plugin/src/adapters/{filesystem-scaffolder,string-template-adapter}.ts`, `packages/plugin/src/cli/base/plugin-item-scaffolder.ts` (PluginItemScaffolder base) |
| `Protocol` already exports `ScaffolderContext`/`ScaffoldResult` but 4 plugins redeclare them | YES | `plugins/auth/src/scaffold/mod.ts:12,29`, `plugins/workers/src/scaffold/mod.ts:18,37` (sagas/streams/triggers similar) |

### jsr-audit (cycle-3 spot-check)

| Claim | Verified | File:line evidence |
| --- | --- | --- |
| Additive `./scaffold` subpath export is legal (peerDep `@netscript/plugin` already in all 5 plugin `deno.json`) | YES | `packages/plugin/deno.json` exports `.`, `./abstracts`, `./config`, `./cli`, `./loader`, `./protocol`, `./schema`, `./sdk`; plan adds `./scaffold` (8th subpath, additive) |
| Tarball-resolvable `deno.json` JSON-import under `jsr:@netscript/<plugin>/scaffold` already proven | YES | `worklog.md:166-176` (cycle-1 IMPL-EVAL): all 5 plugin `deno publish --dry-run` clean; JSR raw-asset URL form `https://jsr.io/@scope/<name>/<version>/<path>` verified HTTP 200 in `worklog.md:169` |
| `publish.include` already covers `src/**/*.ts` | YES | `packages/plugin/deno.json` already publishes `src/`; new `src/scaffold/*` files auto-included |

### Per-plan criterion walk

| Plan-Gate criterion | Verdict | Reason |
| --- | --- | --- |
| 1. Problem correctly diagnosed | OK | Duplication table (L23-31) maps every cell to actual code: `toPascalCase`/etc. duplicated (artifacts.ts:580-603 et al.), `NETSCRIPT_VERSION` JSON-import duplicated (artifacts.ts:1/13/29), `SCAFFOLD_SCHEMA_URL` formula duplicated (5×), `generateScaffoldPluginJson` envelope duplicated (5×), `--context-json` harness duplicated (5× mod.ts), `writePlannedFiles` byte-identical (md5 evidence). Per-plugin `ScaffolderContext`/`ScaffoldResult` re-declaration not enumerated in the table but covered by "primitive → core." |
| 2. Dependency-direction soundness | OK | Core home = `packages/plugin` (L36, L121-122). No plugin→CLI import appears (verified, 0 hits). `@netscript/plugin/scaffold` is additive (`deno.json` currently has 7 subpath exports; `./scaffold` would be 8th); `publish.include` already covers `src/**/*.ts`; no cycle into `protocol/` or `sdk/` (scaffold surface depends on `protocol/scaffolder.ts` types only, not the inverse). |
| 3. Byte-identical-output invariant as safety net | OK | C2 byte-equality test (L91-92) feeds the per-plugin `spec` literal into `buildScaffoldPluginJson` and diffs vs the 5 committed `plugins/*/scaffold.plugin.json`. This is the right invariant: it guarantees `plugins:check` byte-stability and zero manifest churn. C6 mandates `scaffold.runtime` e2e (L101) — correctly mandatory because C3 hoists the `--context-json` runner (machinery change, unlike #170's inert string change). |
| 4. Slice decomposition | OK | C1–C6 dependency-ordered: C1 primitives (no consumer) → C2 builder (uses C1 types) → C3 runner (uses C1+C2) → C4 plugin migrations (consume C1+C2+C3) → C5 rest of plugins → C6 full verification. Each slice has named gate (check/lint/fmt/test) and bound in-slice acceptance. "Fold vs split" justified (Decision 1, L117-119): same branch `chore/plugin-167-harden`, #170 held so the per-plugin duplication never lands on `main`; final adversarial-review + IMPL-EVAL on whole branch; alpha.13 cut follows single merge. |
| 5. API minimalism / no over-abstraction | OK | 6-file core surface (artifact/naming/schema-url/manifest-spec/runner/mod) is the minimum that absorbs the table. `defineScaffold` factory (L62) composes a base class `PluginScaffolder` (L63) — consistent with existing `PluginItemScaffolder` (packages/plugin/src/cli/base/plugin-item-scaffolder.ts) but is **new** behavior (existing `FilesystemScaffolder` does not implement `--context-json`/`databaseMigrationsAdded`/`planned|applied|skipped` status), so this is not a redundant adapter. Plan explicitly bans generic-template-DSL creep (L143-144 "do not introduce a generic plugin template DSL"). |
| 6. #167 reconciliation | OK | Plugins still OWN: `./scaffold` entrypoint export (each plugin `deno.json` `./scaffold` mapping unchanged — verified for sagas: `plugins/sagas/deno.json:11`), file-template bodies (kept per-plugin, e.g. auth `templates/` dir, workers service/router/contracts/database templates, sagas saga-scaffolders), manifest data (`spec.ts` literal in each plugin). Only machinery moves to core. The `PluginScaffoldEntrypoint` type (protocol/scaffolder.ts) is unchanged — the #167 contract is preserved. |
| 7. Debt handling | OK | `SCAFFOLD-CASING-CLI-DUP` (cli casing dedupe) explicitly deferred to arch-debt (L37-38, L128, L131) with rationale (cli behavior change, out of scope here). `SCAFFOLD-DENOJSON-ENVELOPE` (optional `buildPluginDenoJson`) is correctly hedged ("include only if byte-stable, else defer as debt" — L133-135) — not silently dropped, not force-fit. |
| 8. Gate set | OK | C6 gates cover the change: scoped check/lint/fmt `--ext ts,tsx` on packages/plugin+plugins (L99-101), `deno task test` (L108), `deno task plugins:check` byte-stability (L99, L106), `arch:check` (L100), `scaffold.runtime` e2e (L101), 5-plugin + `@netscript/plugin` publish dry-runs (L102). One gate possibly missing: `deno doc --filter` confirmation of the new `./scaffold` export surface — recommended as IMPL-EVAL gate (non-blocking for plan). |

### Watcher notes (non-blocking, not required-fix)

1. The plan's duplication table (L23-31) does not list the per-plugin re-declaration of `ScaffolderContext` and `ScaffoldResult` in 4 of 5 `mod.ts` files (auth/sagas/streams/triggers all have their own local copies despite the protocol surface exporting them). Covered implicitly by "Drop every primitive" (L82-84) and the C3 runner consolidation. The implementing session should explicitly delete the local `interface ScaffolderContext {…}` and `interface ScaffoldResult {…}` blocks in each `mod.ts` to force-import from `@netscript/plugin/protocol` — otherwise the C4/C5 slice will leak a primitive.

2. `defineScaffold` factory vs `PluginScaffolder` base class — the plan (L62-63) says "or a `PluginScaffolder` base class — evaluator/user-directed shape: base class + adapters preferred." The user wording was "base class, adapters." Recommend the implementing session lands a real `PluginScaffolder` base class with an abstract `buildArtifacts(input): readonly ScaffoldArtifact[]` method (matching `PluginItemScaffolder<TInput>` shape at `packages/plugin/src/cli/base/plugin-item-scaffolder.ts:11`) and exposes `defineScaffold({ … })` only as a thin factory wrapper if needed. Concretely: prefer base class + concrete subclass per plugin (e.g. `WorkerScaffolder extends PluginScaffolder`) over functional `defineScaffold({…})`. This satisfies "base class + adapters" verbatim.

3. `deno doc --filter` public-surface confirmation of the new `./scaffold` subpath should be added to C6 (one line: `deno doc --json packages/plugin/src/scaffold/mod.ts | jq '.nodes[] | .name'`). Not required for PASS, but cheap and matches `.agents/skills/netscript-deno-toolchain` guidance.

4. The plan claims `defineScaffold` owns "the `ScaffolderContext`→write→`ScaffoldResult` flow incl. `status` + `databaseMigrationsAdded`" (L63-64). This needs the abstract method signature to take `ScaffolderContext` (not a custom input) so the existing CLI dispatch in `packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts:175-194` (which already passes a `ScaffolderContext` via `--context-json`) keeps working unchanged. Recommend `abstract buildArtifacts(context: ScaffolderContext): readonly ScaffoldArtifact[]` rather than `buildArtifacts(input: TInput)` — that matches the #167 protocol contract verbatim.

## Per-criterion verdict

1. **Problem correctly diagnosed** — OK
2. **Dependency-direction soundness** — OK
3. **Byte-identical-output invariant is the right safety net** — OK
4. **Slice decomposition** — OK
5. **API minimalism / no over-abstraction** — OK
6. **#167 reconciliation** — OK
7. **Debt handling** — OK
8. **Gate set** — OK (with one optional IMPL-EVAL addition noted above)

## Verdict

**PASS_PLAN** — implementation may begin. No must-revise items. Four non-blocking watcher notes above are implementation-time guidance, not plan-level fixes; they do not block C1.

## Files touched by this evaluation

- Created: `.llm/tmp/run/openhands/pr-170/run-28329181305-1/plan-eval-verdict.md` (this file)
- No source edits. No `deno.lock` churn. Branch unchanged.
