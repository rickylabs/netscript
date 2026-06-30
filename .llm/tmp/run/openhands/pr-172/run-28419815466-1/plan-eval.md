# PLAN-EVAL — `feat-scaffold-surface-167--runtime-launch-contract`

Evaluator: OpenHands (openrouter/minimax/minimax-m3) — separate-session PLAN-EVAL pass.
Branch: `feat/scaffold-surface-167` · Run dir: `.llm/tmp/run/feat-scaffold-surface-167--runtime-launch-contract/`
Debt closed: `PLUGIN-RUNTIME-DEPENDENCY-ENTRYPOINT-EXPORTS` (`.llm/harness/debt/arch-debt.md:1704-1721`).
Archetypes: ARCHETYPE-5 (plugins) + ARCHETYPE-6 (CLI generation). Scope overlay: none.
Gate bar: `deno task e2e:cli run scaffold.runtime --cleanup` → `failed=0` (AGENTS.md canonical bar).

## Verdict

**PASS**

## Plan-Gate checklist (`gates/plan-gate.md`)

| Box | Status | Evidence |
|---|---|---|
| Research present and current | ✅ | `research.md` re-baselined against current tree; spot-checked file:line claims — every load-bearing STEP 1 finding matches `git ls-files`. |
| Decisions locked | ✅ | D1–D4 stated with rationale in `plan.md` §"Locked decisions". |
| Open-decision sweep | ✅ | Only open question is sagas (a) vs (b) (Slice 0 spike). Plan correctly localizes it inside Slice 0 and gates on `deno task check` + `publish --dry-run`. No deferred decision would force rework. |
| Commit slices (<30, ordered, gated) | ✅ | 7 slices (0–6), each with explicit gate + files. Slice 0 sequenced before Slice 5 (correct dependency). |
| Risk register | ✅ | R1–R6 cover JSR surface, glue discovery, Aspire `jsr:` launch, sagas/workers/triggers asymmetries, bootstrap-module env, per-plugin runtime divergence. |
| Gate set selected | ✅ | Archetype-5 + -6 matrix rows present (F-1, F-3, F-5, F-6, F-7, F-9, F-10); Phase-A reporting uses `deno task arch:check` and `deno publish --dry-run` as proxies. |
| Deferred scope explicit | ✅ (with one PENDING) | Debt closure is narrowly scoped to the runtime-launch contract. Slice 2's "standardize start-fn name" is ambiguous re renames vs re-exports — see Suggestions, not a blocking fail. |
| jsr-audit publishability | ✅ | `deno publish --dry-run --allow-dirty` per touched plugin; new `./runtime`/`./services` exports carry the `@module` + symbol-doc obligations already enforced at the package level (workers/bin/runtime.ts, streams/services/src/main.ts, triggers/src/runtime/mod.ts). |

## Verification against the actual tree

1. **Root-cause accuracy (research §STEP 1) — VERIFIED**
   - `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-plugins.ts:47,48,67,74` — service launch path defaults `workdir = 'plugins/<name>'`, `entrypoint = src/main.ts`. Match.
   - `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts:42,66,73` — background launch path defaults `workdir = name`, `entrypoint = bin/combined.ts`. Match.
   - `packages/cli/src/kernel/adapters/plugin/appsettings-entry-builders.ts:55-57,99-101` (`SCAFFOLD_DIRS.PLUGINS`, `provider.defaultEntrypoint`, fallback workdir). Match.
   - `packages/cli/src/public/features/plugins/install/install-plugin.ts:365-368,381-386` — `backgroundWorkdir`/`serviceWorkdir` set to `'plugins/<pluginName>'`. Match.
   - `plugins/sagas/scaffold.plugin.json:26,45-47,50` declares `category: background-processor`, `backgroundDir: sagas`, `backgroundEntrypoint: bin/combined.ts`, but `plugins/sagas/bin/` does not exist. Slice 0 reconciliation is real and necessary.
   - `plugins/workers/bin/runtime.ts` exports the runtime-start library (`startCombinedProcess` with options-shaped signature). `bin/combined.ts` is the thin executable wrapper doing `new URL('../../.netscript/generated/plugin-workers/jobs.registry.ts', import.meta.url)`. Both verified.
   - `plugins/sagas/src/runtime/saga-runner.ts:60-61` already exposes a parameterized `runSagaRunner`/`startSagaRuntime` API that takes `registryModule`. The Slice-0 (a) option is a re-export, not new code.
   - `plugins/triggers/src/runtime/mod.ts` already re-exports `createRuntimeTriggerProcessor` and `loadProjectTriggerDefinitions`. New `./runtime` export already exists — Slice 2 reduces to documentation / signature standardization.
   - `plugins/streams/deno.json` (`./services` absent) and `plugins/streams/services/src/main.ts` (already a self-starting service with `if (import.meta.main)`) — confirmed; Slice 3 is purely a `deno.json` mapping + a published-symbol audit.

2. **D1 Hybrid contract — SOUND**
   - `import.meta.url`-relative project-path hazard is real and confirmed in two places (`plugins/workers/bin/combined.ts:8`, `plugins/sagas/services/src/init.ts:13` + `plugins/sagas/src/runtime/saga-runner.ts:91`). A pure-package-spec background launch (`Shape A`) would resolve against the JSR cache and silently ship zero user-defined jobs.
   - Service launch is genuinely cwd-independent: the bootstrap env `NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE` is set by the helper to an absolute file URL (`generate-register-plugins.ts:68-69,80`) and consumed via `if (import.meta.main)` inside `services/src/main.ts`. `jsr:` spec + `cwd=projectRoot` preserves both the env and the service-self-start.
   - Hybrid is the smallest viable contract: one new public export per background-runtime plugin (`./runtime`) plus a 10-line userland glue scaffolder. No plugin internals copied.

3. **Slice ordering and D4 — CORRECT**
   - Slice 0 reconciles the sagas `category=background-processor` ↔ missing `bin/` decision before Slice 5 mutates the generator path. The dependency is real — Slice 5's manifest updates depend on which option Slice 0 picks.
   - D4 ↔ Slice coverage matrix:
     | plugin | category | slice |
     |---|---|---|
     | workers | background-processor | 1 + 4 + 5 |
     | triggers | background-processor | 2 + 4 + 5 |
     | sagas | background-processor | 0 + (4 + 5 if (a)) or (5 service-only if (b)) |
     | streams | plugin | 3 + 5 (services only) |
     | auth | plugin | 5 only (services) |
   - Per-slice gates include `deno task check` AND `deno publish --dry-run --allow-dirty`. Slice 4 also adds `packages/cli` install-plugin test. Slice 6 is the full `scaffold.runtime` e2e (waits + behavior probes). Each slice is independently committable.

4. **JSR surface obligations — RIGHT**
   - New exports: `./runtime` on workers + triggers (+ optionally sagas from Slice 0); `./services` on streams. Each must pass `deno publish --dry-run --allow-dirty` (plan stated per-slice).
   - Doc-bar: `@module` annotations already present on workers/bin/runtime.ts and streams/services/src/main.ts. Triggers src/runtime/mod.ts already documents its exports. New exports are limited and inherit existing types — no slow-type regression risk introduced.
   - `deno task arch:check` (full 13 roots `FAIL=0`) is the layered check; plan schedules it post-slicing.

5. **Risks — ADEQUATE**
   - **R2 (discovery in glue)** verified by behavior gates (`behavior.workers-executions`, `behavior.workers-trigger-health-job`), not only `runtime.wait.*` health gates. Plan explicitly names them.
   - **R3 (Aspire `jsr:` entrypoint launch)** — `generate-register-plugins.ts:67` keeps `--node-modules-dir=none`, `--minimum-dependency-age=0`, the perms list, and `withHttpEndpoint`. Per-plan: only `Entrypoint` and `Workdir` change; perms + flags are unchanged. Verified feasible.
   - **R5 (bootstrap-module env preservation)** — `services/_shared/plugin-service-context.ts` URL is helper-relative; the env survives process-level `WithEnvironment`. Plan correctly says no helper edit needed.
   - **R6 (per-plugin runtime divergence)** — Slice 2 owns the standardization; minor scope clarification recommended below.
   - **No missing risks identified**, but two latent items to monitor in IMPL-EVAL:
     a) Aspire `addExecutable` may need an extra env-var when `entrypoint` is a `jsr:` spec (e.g., cache hints). Plan should ack in worklog.
     b) Sagas `runSagaRunner` already accepts `registryModule` — if Slice 0 picks (a), glue will need to know the generated registry path (`.netscript/generated/plugin-sagas/sagas.registry.ts`); plan covers this implicitly via "sibling to barrelScaffolder" but should be enumerated in Slice 0's gate-evidence.

6. **Bar — RIGHT**
   - `deno task e2e:cli run scaffold.runtime --cleanup` → `failed=0` is the canonical AGENTS.md PR-trigger bar for runtimes that touch scaffold. The remaining `runtime.wait.workers-api` failure is the specific gate this plan repairs. Slice 6 picks the right bar (not just `lint`/`check`).

## Findings (minor, non-blocking)

These are PM-level clarifications to add to Slice text before/with IMPL-EVAL, NOT reasons to FAIL.

1. **Slice 0 — sagas option (a) wording.** Plans says "add a real `src/runtime` start OR demote". The realistic (a) is largely a `deno.json` re-export because `sagas/src/runtime/saga-runner.ts` already exposes `runSagaRunner`/`startSagaRuntime`. Plan should note "likely thin re-export; only add a wrapper if `registerSagaDefinitions` is also required". This avoids ad-hoc API growth.
2. **Slice 2 — core-centralization scope.** "Standardize start-fn name/signature" could be read as either a rename (breaking public API) or a uniform doc-string + adapter shim. Plan must choose one and gate it: prefer shim (no breaking API change).
3. **Slice 4 — glue-resource folder placement.** Plan says "sibling to `barrel/`" (i.e. `plugins/workers/src/adapter/resources/glue/`). This naming choice is conventional but should be locked in Slice 4 text to avoid a later renaming patch.
4. **R5 augmentation.** Plan should add a single sentence: "Aspire `WithEnvironment` env-var propagation to a `jsr:`-launched entrypoint is process-scope; `NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE` does NOT require a code change". That removes any IMPL-EVAL confusion.

## Comments to track into IMPL-EVAL (deferred to implementation phase)

- Confirm `addExecutable('deno', '<project>', [...perms,'jsr:@netscript/plugin-streams/services'])` produces the same Deno process tree and HTTP-endpoint bootstrap as the file-path case in Slice 6.
- After Slice 4, verify the userland glue `workers/runtime.ts` does NOT introduce a new dependency on JSR-only paths (must be readable by a fresh project).
- After Slice 5, run `cd packages/cli && deno task arch:check`; confirm no new slow-type or surface warning.

## Files verified during this evaluation

- `plugins/workers/deno.json`, `plugins/workers/bin/runtime.ts`, `plugins/workers/bin/combined.ts`, `plugins/workers/src/adapter/resources/mod.ts`, `plugins/workers/scaffold.plugin.json`
- `plugins/triggers/deno.json`, `plugins/triggers/src/runtime/mod.ts`, `plugins/triggers/scaffold.plugin.json`
- `plugins/sagas/scaffold.plugin.json`, `plugins/sagas/services/src/init.ts`, `plugins/sagas/src/runtime/saga-runner.ts`, `plugins/sagas/src/runtime/` (confirmed no `bin/` and triggers runtime exists in `src/runtime/`)
- `plugins/streams/deno.json`, `plugins/streams/services/src/main.ts`
- `plugins/auth/scaffold.plugin.json`
- `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-plugins.ts`, `generate-register-background.ts`
- `packages/cli/src/kernel/adapters/plugin/appsettings-entry-builders.ts`, `packages/cli/src/kernel/adapters/plugin/plugin-registry.ts`
- `packages/cli/src/public/features/plugins/install/install-plugin.ts`
- `.llm/harness/debt/arch-debt.md:1704-1721`

PLAN-EVAL: PASS. Implementation may begin; surface minor clarifications (Findings 1–4) into Slice text before commit.
