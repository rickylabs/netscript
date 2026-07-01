# PLAN-EVAL — chore-plugin-rearch-v2--184

- Plan evaluator session: openhands / minimax-M3
- Date: 2026-05-15
- Run: chore-plugin-rearch-v2--184 (PR #193, issue #184 tracking #191)
- Base: `alpha.16` / `fc911ba1` (HEAD of `chore/plugin-rearch-v2` is `4d058d52`, docs only)
- Surface / archetype: Archetype-5 (5 converged plugins: workers, sagas, triggers, streams, auth) + feeders (`@netscript/plugin`, `packages/cli`, `@netscript/service`, `@netscript/aspire`)
- Scope overlays: jsr-audit (package+plugin surface), doctrine archetype-5 (5 connectors), deno-toolchain (`deno doc` surface)
- Open sibling PR: #192 (feat/triggers-feature-backing) — **OPEN, PLANNING**

## Checklist results

| Plan-Gate item                          | Result            | Evidence / location |
| --------------------------------------- | ----------------- | ------------------- |
| Research present and current            | PASS              | `research.md` (160 L) supervisor-corrected against alpha.16; base-truth correction table (lines 30-46) verified against `packages/plugin/deno.json` (12 exports) + `deno doc` on each subpath |
| Decisions locked                        | PASS              | Plan lines 203-211: D-base, Q4, Q5, Q6, Q7, #181 sequencing; per-plugin Decisions A/B/C explicit |
| Open-decision sweep                     | FAIL              | `#181 sequencing` is **NOT safe to defer** as currently worded — PR #192 is OPEN in PLANNING, not landed. The plan does not include an explicit BLOCK + rebase/verify gate for S-conform-triggers. See Finding #2 |
| Commit slices (< 30, gate + files each) | PASS              | Plan lines 187-201: 8 slices (S-core-1, S9, S-conform-{workers,sagas,triggers,streams,auth}, S-verify), each names proving gate + files |
| Risk register                           | FAIL              | No explicit "Risk register" section. Risks are implicit in slice ordering and locked decisions, but not enumerated with mitigations. PLAN-GATE requires explicit risk register. See Finding #1 |
| Gate set selected                       | PASS              | Plan lines 213-220: `arch:check`, scoped check/lint/fmt, `publish:dry-run` per package, `scaffold.runtime`, `e2e-cli-prod` (HARD), byte-identical-output guard |
| Deferred scope explicit                 | PASS              | Plan lines 206-207: Q4 = DEFER (AUTH-BACKEND-ENV-CENTRALIZATION) to separately-gated sub-wave; line 224 (debt-clearing) `.template`-skeleton retirement = Q5 |
| jsr-audit surface scan (pkg/plugin)     | FAIL              | No explicit slow-type / `@module` / explicit-return-types / JSR-publishability risk enumeration. `publish:dry-run` is a gate but the plan does not itemize the new surface (`@netscript/plugin/scaffold` net-new; trimmed `-core` role-named subpaths) against the jsr-audit rubric. See Finding #5 |

## Hard-check results (a-g)

### a. BASE DIVERGENCE — PASS
Independently confirmed via `packages/plugin/deno.json` v0.0.1-alpha.16: 12 subpaths exported.
**Already present (per plan's corrected base-truth):** `./adapter`, `./protocol`, `./contract-base`, `./service` (all pre-existing in `src/`).
**Net-new:** `./scaffold` only.
Synthesizer's "alpha.5 missing ./service/./contract-base/./adapter/./scaffold" alarm confirmed as a stale-worktree false alarm against live alpha.16.

### b. DECISION A — streams proxy, no contract — PASS
Plan lines 173-177 explicitly state: "DELETE fabricated scaffolder + dead stream-api + CLI + type pass-throughs + local manifest types. Do NOT add `contracts/v1`; base-meta is factory-supplied to the `serveRpc:false` proxy."
`serveRpc?: boolean` parameter exists in `createPluginService` (`packages/plugin/src/service/presentation/create-plugin-service.ts:92`) with default-true and skip-when-false behavior at line 158.
`capabilities.hasRoutes:false` correction is correct: streams is a proxy with no served contract, current `hasRoutes:true` in `plugins/streams/scaffold.plugin.json` is wrong.

### c. ASPIRE base extension — PASS
`AspireNSPluginContribution` abstract class exists at `packages/aspire/src/runtime/aspire-ns-plugin-contribution.base.ts:10`. Plan line 95, 151, 182 correctly require each connector's `aspire.ts` to **extend** this base class; no plan to invent a parallel `@netscript/plugin` aspire-contract.

### d. A11 / removal hazards — FAIL (two findings)
**d.1 — #181 sequencing invalid.** PR #192 (feat/triggers-feature-backing) is **OPEN, PLANNING** as of this evaluation (verified via `gh pr list --state open`). The plan's "AFTER #181 lands" requirement (line 197) is not satisfied by an explicit gate — S-conform-triggers (slice 5) could begin before #192 lands. The 4 hot shared files (`plugin-manifest.ts`, `contract-base/`, `ports/`, `service/`) make a parallel rebase hazardous. The plan needs an explicit BLOCK + rebase/verify gate.
**d.2 — streams `src/public/mod.ts` deletion hazard.** Plan says DELETE `stream-api.ts` + local manifest types (line 173), but `plugins/streams/src/public/mod.ts` lines 71-75 (manifest interface fields `defineTopic`/`defineProducer`/`defineConsumer`) and lines 139-141 (manifest implementation) are also deletion candidates. The plan does not enumerate this cleanup. `e2e/probes/probe-context.ts:2` and `tests/public/stream-api_test.ts:3-5` are live consumers that must be addressed in the same slice.

### e. CAST budget — FAIL (oversimplification)
Plan line 149-150: "**D1** cross-cutting: `definePlugin().build()` returns `PluginManifest` → delete every local `*PluginManifest`/`*Contribution`/`inspect*` + the `as unknown as` cast."
**Structural narrowing analysis** (verified in `plugins/workers/src/public/mod.ts:36,45,112`):
- `WorkersPluginManifest.dependencies: WorkersPluginDependencies` where `WorkersPluginDependencies = Readonly<Record<string, WorkersPluginDependencyManifest>>` (line 36).
- `WorkersPluginDependencyManifest` has typed fields `{name, version, dependencies?, contributions, [key: string]: unknown}` — fields are present in `PluginManifest` (structurally compatible).
- HOWEVER, the local `*PluginManifest` interface is a **NARROWER subset** of `PluginManifest` (no `description?`, `displayName?`, `type?`, `author?`, `license?`, `tags?`, `permissions?`, `metadata?`, `hooks?`).
- The cast `as unknown as WorkersPluginManifest` at `plugins/workers/src/public/mod.ts:245` is doing a **downcast** (narrowing) — not a widening.
- If `build()` returns `PluginManifest` (broad), the downcast to `WorkersPluginManifest` (narrow) requires a structural check, which TypeScript cannot verify from shape alone.
- **The plan contradicts itself**: "delete every local `*PluginManifest`" requires keeping the local interface (otherwise no narrowing needed → no cast). The plan's mechanism for cast removal is **incomplete**.

Possible resolutions (plan must pick one):
- **Resolution A (preserves narrowing)**: Keep local `*PluginManifest` interfaces, type `build()` to return a `Pick<PluginManifest, 'name'|'version'|'dependencies'|'contributions'>` — cast is removable.
- **Resolution B (drops narrowing)**: Delete local interfaces, `build()` returns `PluginManifest`, type the `workersPlugin` constant as `PluginManifest` — but the typed `inspectWorkers(manifest: WorkersPluginManifest)` access pattern breaks.

### f. GREENFIELD-FIRST ordering — PASS
- S9 (greenfield `plugin new`) is slice 2, BEFORE any S-conform-*. ✓
- 5-gate merge bar present: (1) `arch:check`, (2) scoped check/lint/fmt, (3) `publish:dry-run` both tiers, (4) `scaffold.runtime --cleanup` E2E, (5) byte-identical-output guard. ✓
- D2 (typesafe AST/factory codegen, never string templates) is provable via gate (4) — `scaffold.runtime` scaffolds, registers, type-checks generated userland. ✓
- Q5 retirement of `.template` skeleton is explicit (line 208, 224). The new `scaffolding/<name>-scaffolder.ts`+`<name>.stub.ts` structure (line 127) is a different file layout — no scaffold path copies plugin internals. ✓

### g. e2e-cli-prod = HARD gate — PASS
Plan line 218: "**`e2e-cli-prod` (HARD)** JSR-installed `scaffold.runtime --source jsr` green (never accept red as drift — user mandate)"
Plan line 231 acceptance: "`e2e-cli-prod` green."
A local-green + prod-red result cannot land. ✓

## Open-decision sweep (evaluator-run)

1. **#181 sequencing** — NOT safe to defer as currently worded. #192 is OPEN in PLANNING. Requires explicit BLOCK + rebase gate on S-conform-triggers. **Hard finding.**
2. **Cast mechanism** — NOT safe to defer. Plan must pick a resolution path (A or B above) before implementation. **Hard finding.**
3. **`runtime/` → `application/` rename vs. public subpath retention** — Plan line 82 keeps `./runtime` as a subpath ("only where a real external consumer needs them"); plan line 155-156 renames `-core/src/runtime/` orchestration to `application/`. If orchestration is renamed, the `./runtime` subpath on the trimmed `-core` surface (e.g., line 163: "trim 17 subpaths → `. ./contracts/v1 ./runtime ./testing`") is either: (a) stale (should be removed since the content is now in `application/`), or (b) refers to a DIFFERENT `runtime/` (e.g., runtime-launch binding). Plan does not disambiguate. **Hard finding.**
4. **`AUTH-BACKEND-ENV-CENTRALIZATION` Q4 deferral** — Scoped correctly: per-backend env construction → siblings via separately-gated breaking sub-wave (line 206-207). Doc-only impact to other plugins (no consumer reads `backend-registry.ts` internals beyond the connector itself). Safe to defer. **Acknowledged.**
5. **S9 retires `.template` skeleton** — Q5 is locked YES. The new `scaffolding/<name>-scaffolder.ts`+`<name>.stub.ts` is a different file structure from `src/scaffolding/mod.ts.template`. Confirmed no path copies plugin internals. Safe to land. **Acknowledged.**
6. **`pluginNewSpec` dual-tier lockstep + workspace member wiring** — Plan line 136-138, line 140-145: S9 gate (3) requires `publish:dry-run` on BOTH tiers; S9 gate (1) `arch:check` covers workspace member list + import map. Implicit but adequate. **Acknowledged.**
7. **Unified #164/#166/#167-task/#168 folding** — Plan line 185, 194 claim folding. Cross-checked: #168 is the "plugin new greenfield" deliverable (S9 + acceptance line 226-231 covers it). #164/#166/#167-task are scoped to the `arch:check` final verification gate (S-verify line 200-201). No orphaned requirements detected. **Acknowledged.**

## Verdict

`FAIL_PLAN`

## Required fixes (in order)

1. **Add an explicit Risk register** with mitigations. At minimum: (a) #181/192 rebase hazard → BLOCK gate; (b) cast-mechanism choice → A or B; (c) `runtime/` subpath disambiguation → remove or document. The "Locked decisions" section does not substitute.

2. **Tighten #181 sequencing** to an explicit BLOCK gate on S-conform-triggers: "BLOCK until PR #192 (`feat/triggers-feature-backing`) is merged into `chore/plugin-rearch-v2`. On resume: rebase against merged head, run `deno task arch:check` + scoped `run-deno-check` over the 4 hot shared files (`packages/plugin/src/config/domain/plugin-manifest.ts`, `packages/plugin/src/contract-base/`, `packages/plugin/src/ports/`, `packages/plugin/src/service/`) before touching `plugins/triggers/`."

3. **Resolve cast mechanism** — pick Resolution A (preserve narrowing) or Resolution B (drop narrowing) above. Update the cross-cutting delta (plan line 149-150) to be self-consistent. If A: keep local `*PluginManifest` interfaces, type `build()` to return `Pick<PluginManifest, 'name'|'version'|'dependencies'|'contributions'>`, cast is removable. If B: delete local interfaces, `build()` returns `PluginManifest`, refactor `inspectWorkers`/`inspectSagas`/etc. to take `PluginManifest`. Update the "2-cast budget" gate (line 215) to reflect the chosen path.

4. **Make streams deletion explicit** — extend S-conform-streams to include: (a) `plugins/streams/src/public/mod.ts` lines 71-75, 139-141 (manifest fields), (b) `plugins/streams/src/e2e/probes/probe-context.ts:2` (`StreamPayloadSchema` import), (c) `plugins/streams/tests/public/stream-api_test.ts` (entire file or migrated test). Add to the slice's "files it touches" enumeration.

5. **Disambiguate `runtime/` subpath retention** — either (a) remove `./runtime` from line 82 and 163 (since orchestration is renamed to `application/`), or (b) explicitly document which `runtime/` content is exported (e.g., `runtime-launch` port binding if any). Make the same call for `./config`, `./telemetry`, `./transports` (line 82 parenthetical).

6. **Apply jsr-audit rubric explicitly** — add a "JSR publishability" section itemizing: (a) no slow types (enumerated for each new export: `createPluginService` annotated, `bindPluginContract` annotated, `scaffold` codegen output typed), (b) explicit return types on all exported functions, (c) `@module` doc comments on all new `mod.ts` barrels, (d) symbol docs (`@param`/`@returns`/`@example`) on public functions per JSR convention. The `publish:dry-run` gate is necessary but not sufficient; the surface scan must precede slicing.

## Notes

- The plan is structurally sound: greenfield-first ordering is correct, base-truth correction is correct, aspire base is consumed not duplicated, e2e-cli-prod is a hard gate, retire-`.template` is well-scoped, AUTH-BACKEND-ENV-CENTRALIZATION deferral is appropriately scoped. The 6 required fixes are all **planning-quality** issues, not architecture-quality issues.
- After the 6 fixes, the plan should pass. None require re-architecting.
- A second `FAIL_PLAN` cycle on the same items will escalate to the user per plan-gate loop-limit.
