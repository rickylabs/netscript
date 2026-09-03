# IMPL-EVAL — feat-app-service-client-wiring (PR #1664)

## CI-red delta evaluation (4ac77ac36)

Scope: `git diff dbb577826 4ac77ac36` only (commit "test(cli): expose hosted refetch page failures").
Product delta and earlier probe delta carry prior PASS verdicts and were not re-evaluated.
Session: independent bounded IMPL-EVAL, detached checkout `worktrees/007-eval-1664` at `4ac77ac36`,
read-only. No Aspire/Docker/browser run.

**Verdict: PASS_IMPL_WITH_FINDINGS**

### Findings

| Severity | Location | Finding |
| --- | --- | --- |
| low | `packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts:294-296` | `pageDiagnostics.observe(event)` runs first inside the shared `client.observe` listener with no try/catch. Every helper in `service-client-browser-diagnostics.ts` is type-guarded and CDP params are JSON, so a throw is not realistically reachable; but if one ever occurred it would skip the list-request bookkeeping that the success path depends on. Optional hardening: wrap the diagnostics call in try/catch. Not blocking. |
| info | `packages/cli/e2e/src/application/gates/scaffold/runtime/behavior-gates.ts:361-376` / `scaffold-gates.ts` | The refetch `commandGate` definition moved from `createScaffoldGates` to `createRuntimeBehaviorGates` (8th touched e2e file; not named in the brief). Definition order there is served-surface → hydration → refetch → ai-chat-route, mirroring `RUNTIME_GATES`. Consistent; no duplicate ID (grep shows one definition). |
| info | `service-client-browser-probe.ts:734,739,748-751` | `islandHydrated` and `hydrationEvidence` heuristics changed (`list` falls back to any `ul[data-state]`; `islandHydrated` now also true when a QueryClient is discoverable). These fields are diagnostics-only (`OptimisticRenderDiagnostics`), not assertion inputs. |
| info | environment | First `run-deno-test` pass: 326/327, one failure `service-client-generated-format_test.ts:13` `NotFound ... tmpdir` — `Deno.makeTempDir({ dir: .llm/tmp })` in a fresh checkout without `.llm/tmp`. File untouched by the delta; rerun after the directory existed: 327/327. Environmental, not a delta defect. |

### Verification

1. **Touch set** — `git diff --name-only dbb577826 4ac77ac36`: 8 files under `packages/cli/e2e/**`
   (`runtime/behavior-gates.ts`, `scaffold-gates.ts`, new `service-client-browser-diagnostics.ts`,
   `service-client-browser-probe.ts`, `service-client-runtime-probe.ts`,
   `suites/scaffold/capability-suites.ts`, `tests/application/gates/service-client-runtime-probe_test.ts`,
   `tests/presentation/suite-registry_test.ts`) plus 3 run artifacts under `.llm/runs/feat-app-service-client-wiring--1664/`.
   `deno.lock` diff: 0 lines. No `packages/cli/src/**` template/product path touched.
2. **Order** — `RUNTIME_GATES` (`capability-suites.ts:136-139`): `BEHAVIOR_SERVICE_HEALTH` →
   `BEHAVIOR_ISLAND_SERVED_SURFACE` → `BEHAVIOR_ISLAND_HYDRATION` → `BEHAVIOR_SERVICE_CLIENT_REFETCH` →
   `BEHAVIOR_SERVICE_ENV`. Only the island pair moved (from after `BEHAVIOR_APP_REFERENCE`); refetch and
   every other entry keep their position. `DATABASE_CODEGEN` sits in the scaffold/service gate lists
   (`capability-suites.ts:32,50,57,83`), well before the behavior block — Slice G (#1958) ordering is
   undisturbed. `behavior-gates.ts` definition order matches. Both `suite-registry_test.ts:321-334`
   (RUNTIME and RUNTIME_SQLITE) and `service-client-runtime-probe_test.ts:1016-1026` assert the
   contiguous triple and `SERVICE_HEALTH` precedence; `commandGate()` helper now searches both factories.
3. **Diagnostics** — `pageDiagnostics.snapshot()` is passed only on the three failure paths
   (`browser-probe.ts:322,340,368`) into `captureOptimisticRenderDiagnostics`, whose body is fully
   try/catch-wrapped and returns a null-filled record with `captureError` on failure, so the original
   `diagnosticsError(...)` is always thrown. Bounds: `bodyHtmlSnippet` = `innerHTML.slice(0, 600)`
   (`PAGE_BODY_HTML_LIMIT`), `TEXT_LIMIT=500` per string, `EVENT_LIMIT=20` per array (`pushBounded` shifts).
   `Log.enable` added. Success-path assertions: `service-client-runtime-probe.ts` diff is 2+/1- (only the
   `SERVICE_SHOWCASE_PATH` constant and URL line); `assertSettledRefetch` byte-identical to `dbb577826`.
4. **Target URL** — `previewState` is optional in the island
   (`ServiceShowcaseLab.tsx.template:128`: `props.previewState ?? (isLoading ? 'loading' : isError ? 'error' : items.length === 0 ? 'empty' : 'success')`);
   it is fed from `search.preview` (`(_shared)/service-showcase.ts.template:95`, zod-optional enum). With
   seeded rows and no `?preview`, `renderState='success'` → `showList` → one Rename `<Button>` per row
   (`:221-231`). The probe's assertions never read `previewState`. The author's standalone measurement
   (one `frsh:island:ServiceShowcaseLab` marker + Rename on both URLs) is consistent with the template.
   New test at `service-client-runtime-probe_test.ts:930-939` pins the constant and forbids the old URL.

### Evidence (commands, exit codes)

| Command | Exit | Result |
| --- | --- | --- |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | 0 | 985 files, 9 batches, 0 failed batches, 0 diagnostics |
| `TMPDIR=$HOME/tmp deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests` (1st) | 1 | 326 passed / 1 failed (env: `.llm/tmp` absent, see finding) |
| same, rerun | 0 | 327 passed / 0 failed / 0 ignored |
| `deno test --allow-all packages/cli/e2e/tests/application/gates/service-client-generated-format_test.ts` | 0 | 1 passed |
| `deno task arch:check` | 0 | pass (pre-existing F-5/F-6 `export default` WARNs only) |
| `deno task quality:gate` | 0 | FAIL=0 across all packages (WARN/INFO only, pre-existing) |
