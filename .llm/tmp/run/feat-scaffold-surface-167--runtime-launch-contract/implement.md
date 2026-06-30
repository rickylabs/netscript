use harness. Implement the **plugin runtime-launch contract** — the FINAL #173 E2E blocker and the last chapter of the #157/#172 thin-dependency convergence. Worktree/branch: `/home/codex/repos/netscript-scaffold-167` on `feat/scaffold-surface-167`. Reasoning effort: high — this changes a public package contract (new JSR exports) + CLI Aspire generation; ground every edit against real code before changing it.

PLAN-EVAL **PASSED** (OpenHands minimax-M3, run 28419815466). Implementation is authorized. The plan + research are committed on this branch — they are your single source of truth; read them FIRST and follow the locked decisions D1–D4 and Slices 0–6 verbatim:
- `.llm/tmp/run/feat-scaffold-surface-167--runtime-launch-contract/research.md` (grounded mechanism, file:line)
- `.llm/tmp/run/feat-scaffold-surface-167--runtime-launch-contract/plan.md` (D1–D4, Slices 0–6, gates, risks — INCLUDES the 4 folded PLAN-EVAL refinements)

## SKILL (activate before any edit — read each SKILL.md, do not skip)
- `.agents/skills/netscript-harness` — 8-phase model; slice discipline: ONE commit per slice (explicit paths, NEVER `git add -A`), push explicit refspec, PR-comment, append `commits.md`/`worklog.md`/`drift.md`; close debt.
- `.agents/skills/netscript-doctrine` — ARCHETYPE-5 (plugins) + ARCHETYPE-6 (CLI generation); layering; the #157 thin-connector / core-centralization LAW. New public exports must respect doctrine file 02 (public surface) + 05 (folder vocabulary — glue resource lives under `src/adapter/resources/glue/`).
- `.agents/skills/netscript-cli` — CLI scaffold/appsettings/register-helper generation surface.
- `.agents/skills/netscript-deno-toolchain` — scoped check/lint/fmt wrappers; `deno doc` for the new `./runtime`/`./services` public surface BEFORE/AFTER.
- `.agents/skills/jsr-audit` — publish bar: every new `./runtime`/`./services` export needs `@module` + documented symbols + NO new slow types; `deno publish --dry-run --allow-dirty` per touched package must not regress.
- `.agents/skills/codex-wsl-remote` — native-WSL E2E rule: run `deno task e2e:cli` from THIS ext4 worktree, NEVER `/mnt/c`.
- `.agents/skills/aspire` — `aspire start --isolated`, `aspire wait <resource>`, `aspire describe --format Json` for Slice 6 verification.

## The defect (already grounded in research.md — REPRODUCE before trusting)
`deno task e2e:cli run scaffold.runtime --cleanup` is at `passed=21 failed=1`. The remaining fail is `runtime.wait.workers-api`: thin-dep installs no longer copy `plugins/<name>` into the project, but the generated Aspire AppHost still launches BOTH the workers service (`workers-api`, port 8091) and the background processor (`workers`) from `cwd = <project>/plugins/workers`, which the thin install never creates → `aspire wait workers-api` never resolves. Root cause confirmed at `generate-register-plugins.ts:47,48,67,74`, `generate-register-background.ts:42,66,73`, `appsettings-entry-builders.ts:55-57,99-101`, `install-plugin.ts:365-368`.

## The contract (D1 Hybrid — LOCKED by PLAN-EVAL, do not redesign)
- **SERVICES** launch by exported package subpath `jsr:@netscript/plugin-<x>/services` with `cwd=projectRoot`. The `NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE` env var already decouples the service's context binding from cwd — KEEP that wiring (the helper-relative file URL at `generate-register-plugins.ts:68-69,80`) UNTOUCHED. `WithEnvironment` env propagation is process-scope and survives a `jsr:`-spec launch.
- **BACKGROUND** processors launch via an install-generated userland glue entrypoint (e.g. `workers/runtime.ts`) that imports a NEW public `@netscript/plugin-<x>/runtime` start library and performs project-relative job-registry discovery in the user project. NEVER resolve user data via `import.meta.url` inside a JSR-resident module (the decisive hazard: `bin/combined.ts:8` resolves the jobs registry via `import.meta.url`, which points at the JSR cache when launched by package-spec → worker starts with zero jobs). NO plugin internals copied.

## Slices (implement IN ORDER; each independently committed with its own validating gate)

### Slice 0 — Reconcile sagas background-processor declaration
sagas declares `backgroundEntrypoint: bin/combined.ts` in `scaffold.plugin.json` but `plugins/sagas/bin/` does NOT exist. Pick option (a) per the PLAN-EVAL refinement: add a real `./runtime` export — this is largely a `deno.json` re-export because `plugins/sagas/src/runtime/saga-runner.ts` already exposes `runSagaRunner`/`startSagaRuntime` and its `registryModule` option is already parameterized (glue will pass `.netscript/generated/plugin-sagas/sagas.registry.ts` in — no `import.meta.url` inside the library). If, on inspection, sagas has no real durable background loop to run, fall back to option (b): set `provider.category='plugin'` + drop `backgroundEntrypoint` so only `sagas-api` registers. Record the chosen option + why in `drift.md`.
- Gate: `cd plugins/sagas && deno task check`; `deno publish --dry-run --allow-dirty`.

### Slice 1 — Workers `./runtime` export + project-relative-safe API
Add `"./runtime": "./bin/runtime.ts"` to `plugins/workers/deno.json`. `bin/runtime.ts` already exports `startWorkerProcess`/`startSchedulerProcess`/`startCombinedProcess(options)` — ensure `@module` + documented exported symbols; job discovery MUST be parameterized (caller passes `definitions`), NEVER resolved via `import.meta.url` inside the library. Leave `bin/combined.ts` for local `deno task` use; do NOT export it.
- Gate: `cd plugins/workers && deno task check && deno publish --dry-run --allow-dirty`.

### Slice 2 — Triggers `./runtime` processor export
Confirm `src/runtime/trigger-processor.ts` exposes a documented start fn reachable from `./runtime` (`src/runtime/mod.ts`). Standardize the start-fn name/signature with workers via an ADDITIVE shim (a new uniform-named re-export), NOT a rename — triggers' `./runtime` is already published; do not break its existing API.
- Gate: `cd plugins/triggers && deno task check && deno publish --dry-run --allow-dirty`.

### Slice 3 — Streams `./services` export
Add `"./services": "./services/src/main.ts"` to `plugins/streams/deno.json` (file already ships via `services/**`). Add `@module`/symbol docs if missing.
- Gate: `cd plugins/streams && deno task check && deno publish --dry-run --allow-dirty`.

### Slice 4 — Install: emit background runtime glue importing the dep
Add a runtime-glue scaffolder SIBLING to `barrelScaffolder` (`plugins/workers/src/adapter/resources/barrel/barrel.ts`). Lock the folder as `plugins/<x>/src/adapter/resources/glue/`. It writes `workers/runtime.ts` (triggers analog) importing `@netscript/plugin-<x>/runtime` `startCombinedProcess`, performing the project-relative jobs-registry discovery currently in `bin/combined.ts`, self-starting under `import.meta.main`. Wire into `workersStarterResources` in `plugins/workers/src/adapter/plugin.ts`; triggers analog. (Sagas glue, if Slice 0 chose (a), passes `.netscript/generated/plugin-sagas/sagas.registry.ts` to `runSagaRunner`'s `registryModule`.)
- Gate: `cd plugins/workers && deno task check`; `cd packages/cli && deno test --unstable-kv --allow-all src/public/features/plugins/install/install-plugin_test.ts`.

### Slice 5 — CLI AppHost/appsettings generation: services by package-spec, background by glue
- SERVICE entries: `Entrypoint = 'jsr:@netscript/plugin-<x>/services'`, `Workdir = projectRoot` (drop `plugins/<name>` workdir). Adjust `buildPluginServiceEntry`/`buildBasePluginEntry` (`appsettings-entry-builders.ts:33-44,90-115`) + install workdir derivation (`install-plugin.ts:365-368,381-386`).
- BACKGROUND entries: `Entrypoint = '<glue path>'` (e.g. `workers/runtime.ts`), `Workdir = projectRoot`. `buildBackgroundProcessorEntry` (`appsettings-entry-builders.ts:47-88`).
- Generators: ensure `addExecutable('deno', workdir, ['run',...perms, entrypoint])` works when `entrypoint` is a `jsr:` spec (cwd=projectRoot) and perms/`--node-modules-dir=none`/`--unstable-worker-options`/`withHttpEndpoint` remain correct (`generate-register-plugins.ts:47-78`, `generate-register-background.ts:42-77`). Keep the `NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE` wiring UNTOUCHED (R5).
- Manifests: update all five `plugins/*/scaffold.plugin.json` `provider.defaultEntrypoint`/`defaultServiceEntrypoint`/`officialSource` to the new contract.
- Gate: `cd packages/cli && deno test --unstable-kv --allow-all` (generator + workspace-mutator + install); root `deno task lint` over touched roots.

### Slice 6 — E2E alignment + THE BAR
Re-run the runtime suite from THIS native ext4 worktree. Confirm `workers-api`, `workers`, `sagas-api`, `triggers-api`, `auth` wait gates pass with NO `plugins/<x>` workdirs. Verify BEHAVIOR gates (`behavior.workers-executions`, `behavior.workers-trigger-health-job`), not just health/wait (R2 — a worker started with zero jobs would pass health but fail behavior). If a further DISTINCT defect appears, fix it if same-class, else record in `drift.md` + report (do not silently expand scope).
- Gate (THE BAR): `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` → `passed=N failed=0`.

## Cross-cutting gates (before declaring done)
- `deno publish --dry-run --allow-dirty` for EVERY touched plugin (workers, triggers, streams, sagas) — new exports MUST have `@module` + documented symbols, NO new slow types.
- `deno task arch:check` — EXIT 0, all 13 roots FAIL=0.
- Rock-solid typesafe: ZERO new `any`, ZERO new casts beyond the 2 sanctioned categories (centralized contract `as unknown as`, top-level router `any`). Type-guard any parsed config/manifest shape.

## Hard constraints
- Do NOT copy plugin internals into userland or reintroduce a required userland `scaffold.plugin.json`.
- Do NOT hand-edit `deno.lock`; do NOT run `deno cache --reload`; never `--no-verify`.
- Run full E2E ONLY from this native ext4 worktree (`/home/codex/repos/netscript-scaffold-167`), never `/mnt/c`.
- Commit by slice with explicit paths only. Footer EXACTLY:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` then
  `Claude-Session: https://claude.ai/code/session_014gW4zfhMMQU6txC828ijct`.
- Push explicit refspec each slice: `git push origin HEAD:refs/heads/feat/scaffold-surface-167` (NEVER bare push — inherited upstream is the umbrella).

## Reporting (per slice + final)
1. After EACH slice: commit (explicit paths), push refspec, append `commits.md`, update `worklog.md` (raw gate evidence).
2. After Slice 6 green: PR-comment #172 (`gh pr comment 172 --repo rickylabs/netscript --body-file <path>`, NEVER inline body) with: per-slice commit hashes, what changed, the raw full `scaffold.runtime` summary line (`passed=N failed=0`), and `arch:check` exit. CLOSE debt `PLUGIN-RUNTIME-DEPENDENCY-ENTRYPOINT-EXPORTS` in `.llm/harness/debt/arch-debt.md`.
3. Then stop and report the final E2E summary + arch:check verdict.
