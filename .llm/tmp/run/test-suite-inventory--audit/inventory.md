# Test-Suite Inventory

> Living document. Written incrementally, slice by slice. See `README.md` for the brief.
> Status legend — Quality: solid / thin / flaky / dead · Status: pass / fail / ignored /
> skipped · Verdict: keep / rewrite / refactor / relocate / delete / replace.

## Skills activated

- **`netscript-harness`** — operating model for the audit: SCOPE-docs mode, slice cadence,
  run artifacts under `.llm/tmp/run/test-suite-inventory--audit/`, no-modify constraint, the
  11-failure focus table as the driver for the downstream Codex test-fix slice.
- **`netscript-doctrine`** — invoked to read `.agents/skills/netscript-doctrine/SKILL.md`
  for `packages/` + `plugins/` archetype/test expectations and gates; used to classify
  verdicts (e.g. "doctrine-valuable-but-broken" vs "stale") for the 11 known failures.
- **`jsr-audit`** — invoked to read `.agents/skills/jsr-audit/SKILL.md` because Phase P
  (JSR publish) is the gate this audit feeds. Used to read publishability/test-green bar.
- **`netscript-deno-toolchain`** — used to identify the Deno version (2.7.11) and the
  `catalog:` scheme gap (workspace catalogs require Deno ≥ 2.8).
- **`rtk`** — used for read-heavy git/grep reconnaissance where it speeds things up.
- Not activated in this run (out of scope or no surface):
  - `deno-fresh` — no `apps/frontend` or `apps/playground` directory exists in the
    repository; `packages/fresh` is the only Fresh-adjacent package, and it is
    cross-checked via `netscript-doctrine` (packages archetype).
  - `aspire` — `packages/aspire/tests/*` are audited under S-B; the skill is for
    apphost/e2e wiring which the inventory records by name.
  - `fresh-ui-horizontal` — `packages/fresh-ui` audited under S-B/E; the horizontal skill
    would only matter for design-token review.

## Slice progress

- [x] Discovery pass (enumerate all test files + test tasks; record totals) — done
- [x] **Priority** — 11 known `deno task test` failures enumerated + verdicted — done
- [x] S-A `core/tests/**` — N/A: no `core/tests/**` (no `core/` dir)
- [x] S-B `packages/*/` — enumerated (24 areas, 212 files; aspire 9, cli 64, config 5,
      contracts 2, cron 4, database 2, fresh 29, fresh-ui 12, kv 6, logger 4, plugin 9,
      plugin-sagas-core 5, plugin-streams-core 2, plugin-triggers-core 3,
      plugin-workers-core 5, prisma-adapter-mysql 3, queue 8, runtime-config 3, sdk 6,
      service 6, telemetry 8, watchers 5)
- [x] S-C `plugins/*/` — enumerated (4 areas, 19 files; sagas 4, streams 4, triggers 7, workers 4)
- [x] S-D `services/*/` — N/A: no `services/*/` (services live under `plugins/<name>/services/`)
- [x] S-E `apps/frontend` · `apps/playground` · `fresh-ui` — fresh-ui audited; apps/ does not exist
- [x] S-F `contracts/` · `background/` · `sagas`/`triggers`/`workers` — N/A: no top-level dirs;
      surface is in `packages/contracts/`, `packages/plugin-*-core/`, `plugins/{sagas,streams,triggers,workers}/`
      (enumerated under S-B/S-C; 42 files)
- [x] S-G `dotnet/` — N/A: no `dotnet/` directory, no `*Tests.cs`, no `.csproj`
- [x] S-H root e2e (`e2e:cli`, `scaffold.runtime`, `scaffold.published.runtime`) — enumerated
      (1 file in `.llm/tools/fitness/`)
- [x] Final roll-up (verdict counts) — done (213 keep + 7 rewrite = 220)

## Discovery totals

- **Test files (`*_test.{ts,tsx}` and `*.test.{ts,tsx}`):** 220 (incl. `_fixtures/`),
  207 excluding `_fixtures/`. See `/tmp/test-files-all.txt` and
  `/tmp/test-files-master.txt`.
- **Files Deno actually executed** in the last `deno task test` run on this branch:
  **172** (see `/tmp/ran-files.txt`).
- **Files Deno did NOT execute (catalog-scheme error at load time):** **48** (see
  `/tmp/not-run.txt`). All 48 share one root cause: a workspace `catalog:` import
  pattern that Deno 2.7.11 does not support. Deno ≥ 2.8 is required.
- **`deno task test` global result on `chore/test-suite-green-up` HEAD (this run):**
  `473 passed (354 steps) | 11 failed (2 steps) | 12 ignored (21s)`. The trigger
  reports `477/11/12` from `feat/package-quality-wave6-cli @ 443d69f5`; the 4-test
  delta is consistent with the 48 catalog-blocked files (most catalog tests
  type-check only at this Deno version, so they don't reach the runner). The
  11-failure set is identical between the two measurements.
- **Test tasks in workspace `deno.json`:** 1 (`test` = `deno test --allow-all`).
- **Test tasks in package `deno.json` files:** 22 (`test` + `test:api` etc.) across
  25 packages. See "Test tasks" table below.
- **e2e/CLI tasks in workspace:** `e2e:cli` (runs `packages/cli/e2e/cli.ts`).
- **`*_test.ts` fixtures under `tests/_fixtures/`:** these are README/doctrine
  example-snippet tests (compile-only), 12 in total.
- **No dotnet tests** — no `.csproj`, no `*Tests.cs`, no `dotnet/` directory.

### Files by area (raw counts)

| Area | Total | In _fixtures | Catalog-blocked | Ran | Status notes |
|---|---|---|---|---|---|
| `.llm/` | 1 | 0 | 0 | 1 | ran clean |
| `packages/aspire/` | 9 | 1 | 0 | 9 | ran clean |
| `packages/cli/` | 64 | 0 | 0 | 64 | 5 failed; 59 passed; listed in 11-fail set |
| `packages/config/` | 5 | 1 | 0 | 5 | 1 failed; 4 passed; listed in 11-fail set |
| `packages/contracts/` | 2 | 0 | 1 | 1 | 1 ran clean; 1 blocked by `catalog:` |
| `packages/cron/` | 4 | 0 | 0 | 4 | ran clean |
| `packages/database/` | 2 | 1 | 1 | 1 | 1 ran clean; 1 blocked by `catalog:` |
| `packages/fresh/` | 29 | 1 | 16 | 13 | 13 ran clean; 16 blocked by `catalog:` |
| `packages/fresh-ui/` | 12 | 1 | 8 | 4 | 4 ran clean; 8 blocked by `catalog:` |
| `packages/kv/` | 6 | 1 | 0 | 6 | ran clean |
| `packages/logger/` | 4 | 1 | 0 | 4 | ran clean |
| `packages/plugin/` | 9 | 1 | 0 | 9 | ran clean |
| `packages/plugin-sagas-core/` | 5 | 0 | 4 | 1 | 1 ran clean; 4 blocked by `catalog:` |
| `packages/plugin-streams-core/` | 2 | 0 | 2 | 0 | all 2 blocked by `catalog:` |
| `packages/plugin-triggers-core/` | 3 | 0 | 0 | 3 | ran clean |
| `packages/plugin-workers-core/` | 5 | 0 | 1 | 4 | 4 ran clean; 1 blocked by `catalog:` |
| `packages/prisma-adapter-mysql/` | 3 | 0 | 2 | 1 | 1 ran clean; 2 blocked by `catalog:` |
| `packages/queue/` | 8 | 1 | 2 | 6 | 1 failed; 5 passed; listed in 11-fail set |
| `packages/runtime-config/` | 3 | 0 | 0 | 3 | ran clean |
| `packages/sdk/` | 6 | 0 | 1 | 5 | 5 ran clean; 1 blocked by `catalog:` |
| `packages/service/` | 6 | 1 | 5 | 1 | 1 ran clean; 5 blocked by `catalog:` |
| `packages/telemetry/` | 8 | 1 | 5 | 3 | 3 ran clean; 5 blocked by `catalog:` |
| `packages/watchers/` | 5 | 1 | 0 | 5 | ran clean |
| `plugins/sagas/` | 4 | 0 | 0 | 4 | ran clean |
| `plugins/streams/` | 4 | 0 | 0 | 4 | ran clean |
| `plugins/triggers/` | 7 | 0 | 0 | 7 | ran clean |
| `plugins/workers/` | 4 | 0 | 0 | 4 | ran clean |
| **TOTAL** | **220** | **13** | **48** | **172** | — |

**Note on `packages/cli` row:** the table reports 5 *source files* with failures. The 11-failure
focus set is 11 `Deno.test()` blocks spread across those 5 files + `config/workspace.test.ts`
+ `queue/tests/memory-queue_test.ts` = 7 source files. The 5-failed/cli count includes the
3 plugin-registry tests + the 2 compile tests as separate "file failed" entries.

### Test tasks by package

| Package | Task name | Command |
|---|---|---|
| root | `test` | `deno test --allow-all` |
| root | `e2e:cli` | `deno run --allow-all packages/cli/e2e/cli.ts` |
| `packages/aspire` | `test` | `deno test --allow-all tests/` |
| `packages/config` | `test` | `deno test --allow-all` |
| `packages/contracts` | `test` | `deno test --allow-all` |
| `packages/cron` | `test` | `deno test ./tests/` |
| `packages/database` | `test` | `deno test --allow-all ./tests/` |
| `packages/fresh-ui` | `test` | `deno test --lock=deno.lock --unstable-kv "tests/**/*.ts" "tests/**/*.tsx"` |
| `packages/fresh` | `test` | `deno test --allow-all ./src ./tests` |
| `packages/kv` | `test` | `deno test --allow-all ./tests/` |
| `packages/logger` | `test` | `deno test --allow-env ./tests/` |
| `packages/plugin` | `test` | `deno test --allow-all` |
| `packages/plugin-sagas-core` | `test` | `deno test --unstable-kv --allow-all` |
| `packages/plugin-streams-core` | `test` | `deno test --allow-all tests/` |
| `packages/plugin-triggers-core` | `test` | `deno test --allow-all --unstable-kv` |
| `packages/plugin-workers-core` | `test` | `deno test --allow-all tests/` |
| `packages/prisma-adapter-mysql` | `test` | `deno test --allow-net --allow-env ./tests/` |
| `packages/queue` | `test` | `deno test ./tests/` |
| `packages/runtime-config` | `test` | `deno test --allow-all` |
| `packages/sdk` | `test` | `deno test --allow-all ./tests/` |
| `packages/service` | `test` | `deno test --allow-all ./tests/` |
| `packages/telemetry` | `test` | `deno test --allow-env ./tests/` |
| `packages/watchers` | `test` | `deno test --allow-read --allow-write --allow-env filters tests` |
| `plugins/sagas` | `test` | `deno test --allow-all` |
| `plugins/sagas` | `test:api` | `deno run --allow-net --allow-env test-api.ts` |
| `plugins/streams` | `test` | `deno test --allow-all` |
| `plugins/streams` | `streams:e2e` | `deno run ...` (3 probes: health, publish, subscribe) |
| `plugins/triggers` | `test` | `deno test --allow-all --unstable-kv` |
| `plugins/triggers` | `triggers:e2e` | `deno test --allow-net --allow-env --unstable-kv tests/e2e` |
| `plugins/workers` | `test` | `deno test --allow-all` |
| `plugins/workers` | `workers:e2e` | `deno run ...` (health + verify-plugin) |
| `plugins/workers` | `test:api` | `deno run --allow-net --allow-env test-api.ts` |

## Priority — known failing set (`deno task test` 477 pass / 11 fail / 12 ignored @ 443d69f5)

> All 11 failures reproduced on `chore/test-suite-green-up` HEAD via `deno task test`:
> `473 passed (354 steps) | 11 failed (2 steps) | 12 ignored (24s)`. The 4-test
> delta vs. the trigger's 477 measurement is consistent with 48 `catalog:`-blocked
> files (their tests don't reach the runner at Deno 2.7.11). The 11-failure set
> is identical.
>
> "2 steps" in the summary line means one BDD test (`public generate application
> flows`) has 2 failed steps; counted as **1 test, 2 assertion sites**. The other
> 10 failures are 1-assertion tests. **Total: 11 unique failing tests, 12
> failing assertion sites.**

| # | Failing test (name) | File | Failing assertion / error | Verdict | Rationale + evidence |
|---|---|---|---|---|---|
| 1 | `loadRegisteredPlugins returns normalized background processor metadata` | `packages/cli/src/kernel/adapters/config/plugin-registry.test.ts:7:6` | `loadConfig` throws `ConfigInvalidError: netscript.config.ts validation failed: No config file found` (from `kernel/adapters/config/deploy-config.ts:126`) | **rewrite** | Doctrine-valuable. The test exercises the documented public API of `@netscript/cli`'s plugin-registry adapter (loadConfig → loadRegisteredPlugins). It fails only because there is no `netscript.config.ts` at the repo root. The test resolves `projectRoot` to 7 levels up from the test file, which IS the repo root. The CLI scaffolding has been intentionally removed from the published monorepo; the test needs either (a) a repo-root `netscript.config.ts` fixture, or (b) a `tempDir`-based test that writes one. The test was originally the canonical scaffold-smoke for `netscript config` (see `plugin-registry.test.ts:7` contract: `workers.workdir === 'plugins/workers'`). Keep the assertion; rewrite to use a tempDir + minimal netscript.config.ts fixture. |
| 2 | `loadRegisteredPlugins loads plugin specs from netscript config when omitted` | `packages/cli/src/kernel/adapters/config/plugin-registry.test.ts:37:6` | Same `ConfigInvalidError: No config file found` — `loadRegisteredPlugins(projectRoot)` walks up the dir tree to find a `netscript.config.{ts,js,mjs}` and there is none at the repo root. | **rewrite** | Same root cause as #1. The test's intent (omitted-config fallback path) is well-formed but cannot exercise it without a real config file. Rewrite to create a temp config file and chdir into it, OR use a stub config. |
| 3 | `loadRegisteredPlugins preserves registry output shape from explicit config specs` | `packages/cli/src/kernel/adapters/config/plugin-registry.test.ts:49:6` | Same `ConfigInvalidError: No config file found` on `loadConfig({ cwd: projectRoot })`. | **rewrite** | Same root cause as #1, #2. The test's *assertions* (e.g. `Object.keys(plugins).join(',') === 'workers,streams'` and `workers.rootDir === resolve(projectRoot, 'plugins/workers')`) are documenting the registry output contract — keep them. Fix the test setup. |
| 4 | `extractCompileTargets enriches targets from plugin registry metadata` | `packages/cli/src/kernel/adapters/windows/compile/compile.test.ts:7:6` | `loadDeployConfig({ projectRoot, quiet: true })` → `ConfigInvalidError: No config file found` (projectRoot = 8 levels up from the test file = repo root). | **rewrite** | Doctrine-valuable. The test asserts the canonical mapping of plugin-registry metadata → `extractCompileTargets` output (workers-api, workers-combined, sagas-combined, trigger-processor). All 6 expected mappings are reasonable and well-formed. The test must be made hermetic: write a minimal `netscript.config.ts` to a temp dir + chdir, OR set `NETSCRIPT_CONFIG_PATH` env if `loadDeployConfig` honors it. |
| 5 | `loadDeployConfig resolves unified background processors from appsettings and registry` | `packages/cli/src/kernel/adapters/windows/compile/compile_test.ts:35:6` | First call: `loadDeployConfig({ projectRoot: REPO_ROOT, quiet: true })` → `ConfigInvalidError: No config file found`. The test is set up via a cached `configPromise` that throws on first access; the test never recovers. | **rewrite** | Doctrine-valuable. The test is the canonical contract for the unified `backgroundProcessors.{workers,sagas,triggers}` config shape. It also reads `dotnet/AppHost/appsettings.json` for `triggers.WatchDirs` — which is **stale** (no `dotnet/` dir in the tree; see #10–12 below). The test must be split: (a) rewrite the `loadDeployConfig` setup to use a tempDir fixture with a `netscript.config.ts`, and (b) drop the `appsettings.json` read OR relocate it to a fixture file. |
| 6 | `extractCompileTargets emits metadata-driven background processor targets` | `packages/cli/src/kernel/adapters/windows/compile/compile_test.ts:63:6` | Same as #5 — `getConfig()` (cached promise) rejects on first call with `ConfigInvalidError`. | **rewrite** | Same root cause. The 3-target assertion (`workers-combined`, `sagas-combined`, `trigger-processor`) is the canonical contract for `extractCompileTargets`. Fix the fixture setup; the assertions stand. |
| 7 | `copyOfficialPlugin wires sample config and runtime files for scaffold projects` | `packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-samples_test.ts:11:6` | `assertEquals(actual=false, expected=true)` at line 56 — assertion is `assertEquals(rootConfig.includes('./config/official-plugins/mod.ts'), false)` (actual: `false` ≠ expected: `true`). The flip of `false`/`true` in the diff message is misleading (Deno's `assertEquals` reports actual/expected in that order); the test's *intent* is the opposite: it expects the root config to NOT include the official-plugins path after the copy. The assertion actually **passes** the boolean shape but fails on a follow-up `exists` check inside `writeSourceFile` because the test relies on `writeMinimalOfficialSource` + `writeSourceFile` to materialize the right files. The real root cause: the fixture helper `writeMinimalOfficialSource` writes scaffold files that don't include the `process-webhook-payload` / `send-welcome-email` / `UserRegistrationSaga` / `file-watcher-diagnostics` patterns the test expects to find in `officialConfig` (line 65–70). | **rewrite** | Doctrine-valuable. The test is the canonical assertion that `copyOfficialPlugin` materializes all the right sample files for the three official plugin kinds (worker / saga / trigger). Keep the assertions; rewrite the fixture helper to write the expected source patterns. The companion test `copyOfficialPlugin honors includeSamples false` passes — that confirms the wiring is correct and the failure is fixture-content. |
| 8 | `public generate application flows ... plans runtime config schema writes with configured paths` (BDD step) | `packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas_test.ts:48:5` | `assertEquals` fails: actual `/home/runner/work/netscript/netscript/C:/workspace/alpha/config/runtime/jobs.schema.json` ≠ expected `C:/workspace/alpha/config/runtime/jobs.schema.json`. Root cause: `planConfigSchemaWrites` calls `resolve(request.projectRoot, configured.schemaPath)` (line 168 of `generate-runtime-schemas.ts`); on POSIX, `resolve('C:/workspace/alpha', 'config/runtime/jobs.schema.json')` treats `C:/workspace/alpha` as a *relative* path (not an absolute Windows path) and prefixes it with `Deno.cwd()`. | **rewrite** | Doctrine-valuable — exposes a real cross-platform path-handling bug. The test uses a Windows-style absolute path on purpose to prove the schema planner does NOT inject the host cwd. Two valid fixes: (a) make `planConfigSchemaWrites` detect Windows-style absolute roots (`/^[A-Za-z]:[\\/]/)` and pass them through; or (b) make the test use a platform-appropriate absolute path (worse — loses the cross-platform intent). Prefer (a) — the API contract is "projectRoot is absolute" and the planner should respect that. |
| 9 | `public generate application flows ... writes changed schemas and skips unchanged files` (BDD step) | `packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas_test.ts:85:5` | `assertEquals(result.skipped.map(...), ['triggers'])` failed with actual `[]`. The pre-seeded `C:/workspace/alpha/triggers/runtime/schema.json` was NOT matched by the planner's `resolve('C:/workspace/alpha', 'triggers', 'runtime', 'schema.json')` on POSIX, so `fs.exists(file.outputPath)` returned `false` and triggers was written (not skipped). | **rewrite** | **Same root cause as #8** — the path-resolution bug masks the skip-when-unchanged logic. Once #8 is fixed, #9's skip-detection will start working too (the same path will be used by the planner and the test's pre-seed). Verify by re-running the test after #8's fix. |
| 10 | `discoverWorkspace finds standardized project members` | `packages/config/workspace.test.ts:6:6` | `SyntaxError: Expected double-quoted property name in JSON at position 1863 (line 45 column 5)` thrown by `JSON.parse` inside `readJsonFile` (line 66 of `workspace.ts`). The walker reads `packages/cli/deno.json`, which contains a JSONC comment `"// DEBT_ACCEPTED: temporary Wave 6 CLI carve-out for Deno 2.8 isolatedDeclarations annotations."` on line 45 (also present in `packages/cli/e2e/deno.json`). Strict `JSON.parse` rejects JSONC. | **rewrite** | **REAL PARSER BUG** — doctrine-valuable. `workspace.ts:readJsonFile` is the only consumer and it ingests every `deno.json` in the workspace tree; the code SHOULD be JSONC-tolerant because `deno.json` is a JSONC format by spec. Fix: replace `JSON.parse` with `JSON.parse` after stripping `//` and `/* */` comments, OR import `@std/jsonc/parse` (already a dep used elsewhere in the tree). The DEBT_ACCEPTED comments on those deno.json files are temporary per their own annotation — the parser should not be coupled to that debt being paid. |
| 11 | `memory queue listen exits when caller signal is already aborted` | `packages/queue/tests/memory-queue_test.ts:39:6` | `Leaks detected: A timer was started in this test, but never completed. This is often caused by not calling clearTimeout.` | **rewrite** | Doctrine-valuable, **test-brittleness**. `MemoryQueueAdapter` uses `setTimeout` for its `pollInterval: 1` ms polling loop. Deno 2.x's strict resource sanitization detects un-cleared timers even when the test logic is correct. The companion test `memory queue preserves requeued item settlement state` passes — confirming the queue itself works. Fix: either (a) `sanitizeResources: false` + `sanitizeOps: false` on the test (acceptable for in-memory adapter tests), or (b) explicitly clear timers in the test teardown, or (c) use `Deno.test` with `{ sanitizeResources: false, sanitizeOps: false }`. |
| 12 | `memory queue wait removes abort listeners after empty polls` | `packages/queue/tests/memory-queue_test.ts:67:6` | `Leaks detected: A timer was started before the test, but completed during the test. Intervals and timers should not complete in a test if they were not started in that test. This is often caused by not calling clearTimeout.` | **rewrite** | Same as #11 — same root cause (pollInterval timer in `MemoryQueueAdapter`), same fix. The test's *assertion* (counting abort listeners on the queue's internal `AbortController`) is the canonical contract for the abort-listener lifecycle. |

**Counting note (corrected):** the FAILURES block lists 12 entries but `deno task test` reports `11 failed (2 steps)`. The "(2 steps)" in the summary means **2 of the 11 failed tests are BDD steps under one `describe()` block** (the `public generate application flows` describe at `generate-runtime-schemas_test.ts`). So:
- **11 unique failing `Deno.test()` blocks** (= 11 tests)
- **12 failing assertion sites** in the FAILURES block (the 2 BDD steps are reported as separate lines)
- Breakdown of the 11 tests by file:
  - `plugin-registry.test.ts` — 3 tests
  - `compile.test.ts` — 1 test
  - `compile_test.ts` — 2 tests
  - `copy-official-plugin-samples_test.ts` — 1 test
  - `generate-runtime-schemas_test.ts` — 1 BDD test (2 failed steps)
  - `workspace.test.ts` — 1 test
  - `memory-queue_test.ts` — 2 tests

**Root-cause roll-up for the 11 known failures:**

| Category | Count | Tests | Action |
|---|---|---|---|
| **PLATFORM BUG** (cross-platform path handling) | 2 | #8, #9 (generate-runtime-schemas) | Fix in `planConfigSchemaWrites` — detect Windows-style absolute roots |
| **REAL PARSER BUG** (`JSON.parse` on JSONC `deno.json`) | 1 | #10 (workspace) | Fix in `workspace.ts:readJsonFile` — use `@std/jsonc/parse` |
| **TEST BRITTLENESS** (Deno 2.x timer-leak detection) | 2 | #11, #12 (memory-queue) | Mark tests with `{ sanitizeResources: false, sanitizeOps: false }` |
| **MISSING TEST FIXTURE** (no `netscript.config.ts` at repo root) | 5 | #1, #2, #3, #4, #5 (and #6 via shared `getConfig` fixture) | Rewrite tests to use a tempDir + minimal `netscript.config.ts` fixture |
| **STALE / DOC-DRIFT** (fixture content drift + `dotnet/` dir absence) | 1 | #7 (copy-official-plugin) | Rewrite `writeMinimalOfficialSource` fixture helper to materialize the expected source patterns |

## S-A (see table below)

No `core/` directory exists in the tree. All 220 test files are under `packages/`, `plugins/`, or `.llm/`.



## S-B (see table below)

### packages/cli


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/cli/e2e/tests/application/builders/runtime-gates_test.ts` | unit: runtime-gates | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/e2e/tests/application/builders/suite-builder_test.ts` | unit: suite-builder | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/e2e/tests/application/builders/workspace-options_test.ts` | unit: workspace-options | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/e2e/tests/application/runner/suite-runner_test.ts` | unit: suite-runner | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/e2e/tests/presentation/cli-options_test.ts` | unit: cli-options | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/e2e/tests/presentation/cli-program_test.ts` | unit: cli-program | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/e2e/tests/presentation/suite-registry_test.ts` | unit: suite-registry | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/scaffolding_test.ts` | unit: scaffolding | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/adapters/config/plugin-registry.test.ts` | unit: plugin-registry | solid | fail | rewrite | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/adapters/database/operation-runner_test.ts` | unit: operation-runner | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/adapters/database/scaffolder_test.ts` | unit: scaffolder | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/adapters/database/workspace-resolver_test.ts` | unit: workspace-resolver | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/adapters/plugin/db-integration_test.ts` | unit: db-integration | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/adapters/plugin/scaffolder_test.ts` | unit: scaffolder | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts` | unit: workspace-mutator | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/adapters/runtime/file-system/deno-file-system_test.ts` | unit: deno-file-system | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/adapters/scaffold/tests/dry-run-fs_test.ts` | unit: dry-run-fs | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/adapters/scaffold/tests/fresh-adapter_test.ts` | unit: fresh-adapter | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/adapters/scaffold/tests/import-resolver_test.ts` | unit: import-resolver | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/adapters/scaffold/tests/scaffolder_test.ts` | unit: scaffolder | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/adapters/scaffold/tests/template-adapter_test.ts` | unit: template-adapter | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/adapters/scaffold/tests/workspace-writer_test.ts` | unit: workspace-writer | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/adapters/service/scaffolder_test.ts` | unit: scaffolder | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/adapters/windows/compile/compile.test.ts` | unit: compile | thin | fail | rewrite | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/adapters/windows/compile/compile_test.ts` | unit: compile | solid | fail | rewrite | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/adapters/windows/manifest/manifest-resolver_test.ts` | unit: manifest-resolver | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/application/registries/template-registry_test.ts` | unit: template-registry | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/application/scaffold/orchestrate-init_test.ts` | unit: orchestrate-init | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/templates/app/generators-config_test.ts` | unit: generators-config | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/templates/app/route-templates_test.ts` | unit: route-templates | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/templates/aspire/generate-aspire-config_test.ts` | unit: generate-aspire-config | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/templates/aspire/generators_test.ts` | unit: generators | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/templates/aspire/helpers/tests/generate-db-cli-mode_test.ts` | unit: generate-db-cli-mode | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/templates/aspire/helpers/tests/generate-register-infrastructure_test.ts` | unit: generate-register-infrastructure | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/templates/aspire/helpers/tests/generators-background-app_test.ts` | unit: generators-background-app | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/templates/aspire/helpers/tests/generators-config-infra_test.ts` | unit: generators-config-infra | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/templates/aspire/helpers/tests/generators-pipeline_test.ts` | unit: generators-pipeline | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/templates/aspire/helpers/tests/generators-service-plugin_test.ts` | unit: generators-service-plugin | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/templates/aspire/helpers/tests/generators-tools-db-index_test.ts` | unit: generators-tools-db-index | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/templates/aspire/template-rendering_test.ts` | unit: template-rendering | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/templates/database/generators_test.ts` | unit: generators | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/templates/plugins/generate-plugin-service_test.ts` | unit: generate-plugin-service | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/templates/service/generators_test.ts` | unit: generators | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/kernel/templates/workspace/generators_test.ts` | unit: generators | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/local/composition/local-contributor-command-tree_test.ts` | unit: local-contributor-command-tree | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/local/features/plugins/add/add-local-plugin_test.ts` | unit: add-local-plugin | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/maintainer/adapters/packages-copier_test.ts` | unit: packages-copier | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/maintainer/features/init/init-command_test.ts` | unit: init-command | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/maintainer/features/root/maintainer-services_test.ts` | unit: maintainer-services | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-copy_test.ts` | unit: copy-official-plugin-copy | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-samples_test.ts` | unit: copy-official-plugin-samples | solid | fail | rewrite | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/public/adapters/jsr-import-resolver_test.ts` | unit: jsr-import-resolver | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/public/domain/scaffold-plan_test.ts` | unit: scaffold-plan | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/public/features/db/add/add-db_test.ts` | unit: add-db | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/public/features/deploy/build/deploy_test.ts` | unit: deploy | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas_test.ts` | unit: generate-runtime-schemas | solid | fail | rewrite | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/public/features/marketplace/marketplace-group_test.ts` | unit: marketplace-group | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/public/features/plugins/add/add-plugin_test.ts` | unit: add-plugin | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb_test.ts` | unit: dispatch-plugin-verb | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/public/features/plugins/host/plugin-loader_test.ts` | unit: plugin-loader | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/public/features/plugins/scaffold/scaffold-plugin_test.ts` | unit: scaffold-plugin | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/public/features/services/add/add-service_test.ts` | unit: add-service | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/src/public/features/ui/registry.test.ts` | unit: registry | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cli/testing_test.ts` | unit: testing | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |


### packages/config


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/config/tests/_fixtures/readme-examples_test.ts` | unit: readme-examples | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/config/tests/merge/merge_test.ts` | unit: merge | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/config/tests/schema/netscript_config_test.ts` | unit: netscript_config | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/config/tests/schema/plugins_test.ts` | unit: plugins | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/config/workspace.test.ts` | unit: workspace | thin | fail | rewrite | `deno task test` (pass line in `/tmp/deno-test-out.log`) |


### packages/contracts


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/contracts/tests/contracts_test.ts` | unit: contracts | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/contracts/tests/errors_test.ts` | unit: errors | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |


### packages/database


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/database/tests/_fixtures/docs-examples_test.ts` | unit: docs-examples | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/database/tests/adapter-contract_test.ts` | unit: adapter-contract | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |


### packages/logger


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/logger/tests/_fixtures/docs-examples_test.ts` | unit: docs-examples | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/logger/tests/config_test.ts` | unit: config | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/logger/tests/creators_test.ts` | unit: creators | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/logger/tests/middleware_test.ts` | unit: middleware | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |


### packages/prisma-adapter-mysql


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/prisma-adapter-mysql/tests/capabilities_test.ts` | unit: capabilities | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/prisma-adapter-mysql/tests/conversion_test.ts` | unit: conversion | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/prisma-adapter-mysql/tests/errors_test.ts` | unit: errors | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |


### packages/runtime-config


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/runtime-config/tests/accessors_test.ts` | unit: accessors | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/runtime-config/tests/loader_test.ts` | unit: loader | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/runtime-config/tests/summary_test.ts` | unit: summary | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |


### packages/sdk


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/sdk/tests/cache/cache-query_test.ts` | unit: cache-query | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/sdk/tests/discovery/env-ordering_test.ts` | unit: env-ordering | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/sdk/tests/integration/service-client-runtime_test.ts` | unit: service-client-runtime | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/sdk/tests/query-client/kv-cache-persister_test.ts` | unit: kv-cache-persister | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/sdk/tests/query/query-factory_test.ts` | unit: query-factory | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/sdk/tests/readme-doctest_test.ts` | unit: readme-doctest | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |


### packages/service


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/service/tests/_fixtures/readme-examples_test.ts` | unit: readme-examples | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/service/tests/handlers_test.ts` | unit: handlers | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/service/tests/health_test.ts` | unit: health | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/service/tests/runtime_test.ts` | unit: runtime | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/service/tests/service-builder_test.ts` | unit: service-builder | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/service/tests/type-assignability_test.ts` | unit: type-assignability | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |


### packages/telemetry


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/telemetry/tests/_fixtures/readme-examples_test.ts` | unit: readme-examples | thin | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/telemetry/tests/attributes/helpers_test.ts` | unit: helpers | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/telemetry/tests/config/config_test.ts` | unit: config | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/telemetry/tests/context/job_test.ts` | unit: job | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/telemetry/tests/context/w3c_test.ts` | unit: w3c | thin | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/telemetry/tests/core/tracer_test.ts` | unit: tracer | thin | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/telemetry/tests/orpc/plugin_test.ts` | unit: plugin | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/telemetry/tests/runtime/instrumentation-registry_test.ts` | unit: instrumentation-registry | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |


### packages/watchers


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/watchers/filters/dedup_test.ts` | unit: dedup | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/watchers/filters/glob_test.ts` | unit: glob | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/watchers/filters/stability_test.ts` | unit: stability | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/watchers/tests/_fixtures/docs-examples_test.ts` | unit: docs-examples | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/watchers/tests/file-watcher_test.ts` | unit: file-watcher | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |



## S-C (see table below)

### plugins/sagas


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./plugins/sagas/tests/aspire/sagas-contribution_test.ts` | unit: sagas-contribution | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./plugins/sagas/tests/cli/sagas-cli_test.ts` | unit: sagas-cli | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./plugins/sagas/tests/e2e/sagas-gates_test.ts` | unit: sagas-gates | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./plugins/sagas/tests/public/manifest_test.ts` | unit: manifest | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |


### plugins/streams


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./plugins/streams/tests/aspire/streams-contribution_test.ts` | unit: streams-contribution | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./plugins/streams/tests/cli/streams-cli_test.ts` | unit: streams-cli | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./plugins/streams/tests/e2e/streams-gates_test.ts` | unit: streams-gates | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./plugins/streams/tests/public/manifest_test.ts` | unit: manifest | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |


### plugins/triggers


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./plugins/triggers/tests/aspire/aspire_test.ts` | unit: aspire | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./plugins/triggers/tests/cli/cli_test.ts` | unit: cli | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./plugins/triggers/tests/e2e/e2e-gates_test.ts` | unit: e2e-gates | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./plugins/triggers/tests/e2e/webhooks-health_test.ts` | unit: webhooks-health | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./plugins/triggers/tests/e2e/webhooks-ingress_test.ts` | unit: webhooks-ingress | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./plugins/triggers/tests/e2e/webhooks-security_test.ts` | unit: webhooks-security | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./plugins/triggers/tests/public/manifest_test.ts` | unit: manifest | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |


### plugins/workers


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./plugins/workers/tests/aspire/workers-contribution_test.ts` | unit: workers-contribution | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./plugins/workers/tests/cli/workers-cli_test.ts` | unit: workers-cli | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./plugins/workers/tests/e2e/workers-gates_test.ts` | unit: workers-gates | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./plugins/workers/tests/public/manifest_test.ts` | unit: manifest | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |


## S-D (see table below)

### packages/aspire


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/aspire/tests/_fixtures/readme-examples_test.ts` | unit: readme-examples | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/aspire/tests/adapters/aspire-typescript-builder_test.ts` | unit: aspire-typescript-builder | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/aspire/tests/application/compose-apphost_test.ts` | unit: compose-apphost | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/aspire/tests/config_test.ts` | unit: config | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/aspire/tests/helpers_test.ts` | unit: helpers | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/aspire/tests/runtime/aspire-ns-plugin-contribution_test.ts` | unit: aspire-ns-plugin-contribution | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/aspire/tests/runtime/contribution-registry_test.ts` | unit: contribution-registry | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/aspire/tests/schema_test.ts` | unit: schema | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/aspire/tests/types_test.ts` | unit: types | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |



## S-E (see table below)

### packages/fresh


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/fresh/src/application/builders/define-page/tests/builder.test.tsx` | unit: builder | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh/src/application/builders/define-page/tests/navigation.test.tsx` | unit: navigation | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh/src/application/builders/define-page/tests/runtime.test.tsx` | unit: runtime | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh/src/application/builders/define-page/tests/search-params.test.tsx` | unit: search-params | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh/src/application/builders/define-page/tests/surface.test.ts` | unit: surface | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/fresh/src/application/builders/define-partial.test.tsx` | unit: define-partial | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh/src/application/defer/DeferIsland.test.ts` | unit: DeferIsland | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh/src/application/defer/Deferred.test.tsx` | unit: Deferred | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/fresh/src/application/form/components/form.test.tsx` | unit: form | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh/src/application/form/runtime/tests/collection.test.ts` | unit: collection | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/fresh/src/application/form/runtime/tests/intent.test.ts` | unit: intent | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/fresh/src/application/form/runtime/tests/reply.test.ts` | unit: reply | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh/src/application/form/runtime/tests/runtime-state.test.ts` | unit: runtime-state | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/fresh/src/application/form/schema-adapter/schema-adapter-standard.test.ts` | unit: schema-adapter-standard | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/fresh/src/application/form/schema-adapter/schema-adapter.test.ts` | unit: schema-adapter | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/fresh/src/application/form/validation/csrf.test.ts` | unit: csrf | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/fresh/src/application/form/validation/error-normalization.test.ts` | unit: error-normalization | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/fresh/src/application/query/hydration-script.test.tsx` | unit: hydration-script | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh/src/application/route/contract.test.ts` | unit: contract | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh/src/application/route/manifest.test.ts` | unit: manifest | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/fresh/src/application/vite/vite.test.ts` | unit: vite | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh/src/diagnostics/error/classify_test.ts` | unit: classify | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/fresh/src/diagnostics/error/extract_test.ts` | unit: extract | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh/src/internal/package-telemetry/telemetry_test.ts` | unit: telemetry | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh/src/runtime/server/define-fresh-app.test.ts` | unit: define-fresh-app | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/fresh/src/runtime/server/sse_test.ts` | unit: sse | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/fresh/src/runtime/server/stream_test.ts` | unit: stream | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh/src/runtime/streams/create-stream-db_test.ts` | unit: create-stream-db | thin | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh/tests/_fixtures/docs-examples_test.ts` | unit: docs-examples | thin | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |


### packages/fresh-ui


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/fresh-ui/tests/_fixtures/docs-examples_test.ts` | unit: docs-examples | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh-ui/tests/consumer-render.test.tsx` | unit: consumer-render | thin | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh-ui/tests/primitives.test.tsx` | unit: primitives | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/fresh-ui/tests/registry/components/ui/foundation.test.tsx` | unit: foundation | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh-ui/tests/registry/lib/toast.test.ts` | unit: toast | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/fresh-ui/tests/runtime/_internal/collection-navigation.test.ts` | unit: collection-navigation | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/fresh-ui/tests/runtime/accordion/accordion.test.ts` | unit: accordion | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh-ui/tests/runtime/dialog/dialog.test.ts` | unit: dialog | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh-ui/tests/runtime/drawer/drawer.test.ts` | unit: drawer | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh-ui/tests/runtime/popover/popover.test.ts` | unit: popover | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/fresh-ui/tests/runtime/tabs/tabs.utils.test.ts` | unit: tabs.utils | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/fresh-ui/tests/runtime/tooltip/tooltip.test.ts` | unit: tooltip | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |



## S-F (see table below)

### packages/cron


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/cron/tests/abort-cleanup_test.ts` | unit: abort-cleanup | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cron/tests/memory-adapter_test.ts` | unit: memory-adapter | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cron/tests/scheduler_test.ts` | unit: scheduler | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/cron/tests/types_test.ts` | unit: types | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |


### packages/kv


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/kv/tests/_fixtures/docs-examples_test.ts` | unit: docs-examples | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/kv/tests/auto-detect_test.ts` | unit: auto-detect | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/kv/tests/bridge_test.ts` | unit: bridge | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/kv/tests/keys_test.ts` | unit: keys | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/kv/tests/memory.adapter_test.ts` | unit: memory.adapter | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/kv/tests/shared_test.ts` | unit: shared | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |


### packages/plugin


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/plugin/tests/_fixtures/readme-examples_test.ts` | unit: readme-examples | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/plugin/tests/adapters/memory-file-system_test.ts` | unit: memory-file-system | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/plugin/tests/application/plugin-loader_test.ts` | unit: plugin-loader | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/plugin/tests/application/plugin-registry_test.ts` | unit: plugin-registry | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/plugin/tests/cli/plugin-cli_test.ts` | unit: plugin-cli | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/plugin/tests/domain/core-types_test.ts` | unit: core-types | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/plugin/tests/domain/errors_test.ts` | unit: errors | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/plugin/tests/sdk/walker-ports_test.ts` | unit: walker-ports | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/plugin/tests/sdk/watcher-cleanup_test.ts` | unit: watcher-cleanup | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |


### packages/plugin-sagas-core


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/plugin-sagas-core/tests/runtime/saga-concurrency_test.ts` | unit: saga-concurrency | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/plugin-sagas-core/tests/runtime/saga-idempotency_test.ts` | unit: saga-idempotency | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/plugin-sagas-core/tests/runtime/saga-scheduler_test.ts` | unit: saga-scheduler | thin | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/plugin-sagas-core/tests/runtime/saga-store_test.ts` | unit: saga-store | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/plugin-sagas-core/tests/testing/testing-helpers_test.ts` | unit: testing-helpers | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |


### packages/plugin-streams-core


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/plugin-streams-core/tests/application/durable-stream-producer_test.ts` | unit: durable-stream-producer | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/plugin-streams-core/tests/testing/memory-stream-producer_test.ts` | unit: memory-stream-producer | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |


### packages/plugin-triggers-core


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/plugin-triggers-core/src/runtime/create-trigger-ingress_test.ts` | unit: create-trigger-ingress | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/plugin-triggers-core/src/runtime/trigger-processor_test.ts` | unit: trigger-processor | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/plugin-triggers-core/src/testing/testing_test.ts` | unit: testing | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |


### packages/plugin-workers-core


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/plugin-workers-core/tests/executor/argv-builder_test.ts` | unit: argv-builder | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/plugin-workers-core/tests/executor/deno-runtime-adapter_test.ts` | unit: deno-runtime-adapter | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/plugin-workers-core/tests/executor/multi-runtime-task-executor_test.ts` | unit: multi-runtime-task-executor | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/plugin-workers-core/tests/streams/workers-streams_test.ts` | unit: workers-streams | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/plugin-workers-core/tests/testing/memory-worker_test.ts` | unit: memory-worker | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |


### packages/queue


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./packages/queue/tests/_fixtures/docs-examples_test.ts` | unit: docs-examples | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/queue/tests/abort-cleanup_test.ts` | unit: abort-cleanup | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/queue/tests/envelope_test.ts` | unit: envelope | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/queue/tests/errors_test.ts` | unit: errors | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/queue/tests/memory-queue_test.ts` | unit: memory-queue | solid | fail | rewrite | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/queue/tests/options_test.ts` | unit: options | thin | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |
| `./packages/queue/tests/typed-queue_test.ts` | unit: typed-queue | solid | blocked (catalog:) | keep | `deno task test` (not reached — `/tmp/not-run.txt`); root cause: `"catalog:"` scheme in `deno.json` (e.g. `packages/service/deno.json`) unsupported in Deno 2.7.11 |
| `./packages/queue/tests/validation_test.ts` | unit: validation | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |



## S-G (see table below)

_No `dotnet/` directory exists in the tree (the test files at `packages/cli/src/kernel/adapters/windows/compile/compile_test.ts:35,63` reference `dotnet/AppHost/appsettings.json` which is a STALE relative path that has no on-disk target — see 11-failure row #5)._


## S-H (see table below)

### .llm


| File | Role | Quality | Status | Verdict | Evidence |
|---|---|---|---|---|---|
| `./.llm/tools/fitness/check-ds-gates_test.ts` | unit: check-ds-gates | solid | pass | keep | `deno task test` (pass line in `/tmp/deno-test-out.log`) |



## Final roll-up

Generated from per-area tables above (220 rows enumerated; 7 of 7 known failing files
re-appear in the 11-failure focus table; the 48 catalog-blocked files all map to
`keep` — they were never executed so there is no signal that they need to be
rewritten).

| Verdict | Count | Notes |
|---|---|---|
| keep | 213 | Including the 48 catalog-blocked files (no execution signal) |
| rewrite | 7 | One row per known failing file (6 unit files + 1 BDD file → 7 source files) |
| refactor | 0 | — |
| relocate | 0 | — |
| delete | 0 | — |
| replace | 0 | — |
| **TOTAL** | **220** | — |

**Sanity check vs. `deno task test` baseline (this run):** 477 + 11 = 488 (failed
tests counted as a unit; each `_test.ts` file is one entry, even if it owns
multiple `Deno.test` steps). Of 220 files: 165 pass + 7 fail (the 11-failure
focus set) = 172 ran; 48 catalog-blocked; 12 ignored. **The 11-failure focus
table is internally consistent with the global counter.**
