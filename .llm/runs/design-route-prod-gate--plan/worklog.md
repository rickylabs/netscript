# Worklog: `/design` production exclusion

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `design-route-prod-gate--plan` |
| Branch | `fix/design-route-prod-gate` |
| Archetype | 6 — CLI / Tooling |
| Scope overlays | Frontend |

## Design

### Public Surface

- No published CLI command, exported type, package entrypoint, or JSDoc surface changes.
- Generated-app contract changes: `/design` is present in development and absent/refused outside literal development.
- E2E contract adds gate ID `scaffold.design-production-exclusion` to `scaffold.runtime`.

### Domain Vocabulary

- `design route group` — generated `routes/(design)/design/**` developer reference modules.
- `structural exclusion` — Fresh does not crawl/import those modules for a production build.
- `runtime refusal` — route-group middleware returns 404 without delegation outside literal development.
- `production exclusion probe` — clean build assertion plus a controlled mutation that proves the detector can fail.

No new public interfaces or discriminated unions are required.

### Ports

- Existing `TemplateAssetPort`/template registry path loads the middleware template.
- Existing scaffold file-system abstraction emits it.
- Existing E2E command executor runs the generated `deno task build`.
- No new port is introduced.

### Constants

- `GATE.SCAFFOLD_DESIGN_PRODUCTION_EXCLUSION` → `scaffold.design-production-exclusion`.
- A local stable design build marker and cross-platform route-group regexp are named beside the production probe/config that consumes them; no package-global abstraction is warranted.

### Archetype-6 checkpoint

- Five existing spine abstracts remain unchanged: `CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`, `UseCase<Input, Result>`, and `Registry<TKey, TValue>`.
- No layer-2 abstract, extension axis, registry, command, feature, composition root, adapter, or permission declaration changes.
- Generated output: one `_middleware.ts` plus changed `vite.config.ts`; embedded template registry gains the middleware asset.
- Semantic strategy: focused template/materialization tests, hosted production build inspection, mutation failure proof, and existing dev HTTP probe.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove dual exclusion and non-vacuity: RED tests; middleware/manifest/writer/Vite config; regenerate embedded barrel; register hosted production build probe; update run evidence. | Focused structured tests; embedded freshness; scoped check/lint/fmt; `quality:gate`; `arch:check`; hosted `scaffold.runtime` via `ci:full` | Files enumerated in `plan.md` § File list plus run artifacts |

One implementation slice is appropriate because the middleware template, embedded barrel, writer plumbing, and production gate form one atomic acceptance contract; separating them would leave either an unpublished asset or an unproved exclusion.

### Deferred Scope

- Production opt-in — no repository contract requires it; future work must retain two independent exclusions.
- Navigation removal from production pages — route URL strings are not route modules; only pursue if bundle/runtime evidence shows a user-facing dangling-link defect within this acceptance scope.
- General E2E scaffold-directory remediation — owned by debt `scaffold-runtime-a8-f16-1333`; this slice avoids deepening it.
- UI appearance/browser responsive work — no visual change.

### Contributor Path

To change a scaffold template, edit its `.template` source, register it in `assets/manifest.ts`, load/write it through the existing scaffold-template map/writer, run `deno task gen:assets-barrel`, and prove freshness. To add a scaffold E2E assertion while the scaffold directory debt remains open, extend the closest role-named existing gate family rather than adding another top-level sibling.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-02T17:27:31Z | Plan | Research | Re-baselined #1481/RFC 0005 against `origin/main` `850cc7757`; inspected positioning, generated README/templates, Fresh docs/API, writer/manifest/barrel generator, and closest E2E mutation pattern. |
| 2026-09-02T17:27:31Z | Plan | Design | Locked developer-only intent and both independent exclusion mechanisms; selected Archetype 6 + frontend overlay. |
| 2026-09-02T17:27:31Z | Plan | Gate status | PLAN-EVAL selected and pending. No implementation or later-phase gate was run. |
| 2026-09-02T19:02:00Z | Implement | Plan gate | Resumed only after separate-session `PASS_PLAN` at `5566a89f6` for plan head `f8ed75b41`. |
| 2026-09-02T19:10:00Z | Implement | RED 1 | Added focused middleware/config/materialization expectations and `scaffold.design-production-exclusion` registration/order expectations. The structured test wrapper failed as required: missing `TEMPLATE_KEYS.appRoutesDesignMiddleware` and missing `GATE.SCAFFOLD_DESIGN_PRODUCTION_EXCLUSION` (exit 1, five type errors). No implementation exists in this step. |
| 2026-09-02T19:15:00Z | Implement | RED 2 | `scaffold.design-production-exclusion` production-build baseline probe is `HOSTED_PENDING` under `ci:full`. Per the coordinator constraint, no local `e2e:cli`, Aspire, or Docker command was run. |
| 2026-09-03T00:35:00Z | Implement | GREEN 3 | Added the typed middleware asset, scaffold load/write plumbing, fail-closed runtime middleware, Vite-mode structural ignore, gate ID/command, mutation/restoration probe, and runtime-suite selection. Focused E2E registration/order tests pass 32/32. Structured E2E-source check reaches only the intentional Step-4 stale-barrel error (`TS2741` for the new middleware asset key). |
| 2026-09-03T01:05:00Z | Implement | GREEN 4 | Ran `deno task gen:assets-barrel`; only `packages/cli/src/kernel/assets/embedded.generated.ts` changed and `deno.lock` remained untouched. The freshness task's pre-commit diff check rejected that intended uncommitted delta; its authoritative PASS is run after this generator commit. |
| 2026-09-02T23:45:00Z | Implement | Upstream sync | Mechanically merged `origin/main` `ba6f1f49a` as `21ee63419`. Concurrent scaffold gate IDs were both retained; the only generated-file conflict was resolved by rerunning `deno task gen:assets-barrel`, never by hand-editing the barrel. This supervisor-requested baseline sync is not plan drift. |
| 2026-09-02T23:45:00Z | Implement | Local validation | At `21ee63419`, scoped check/test/lint/fmt, embedded freshness, `quality:gate`, explicit `arch:check`, and all four carrier checks exited 0. The current wrappers require repeated `--file`; rejected positional lint/fmt invocations ran no lint/fmt and are excluded from verdict evidence. No local `e2e:cli`, Aspire, or Docker command ran. |
| 2026-09-03T01:42:46Z | Evaluate repair | Gate ordering | Supervisor commit `de4d31b69` correctly moved `scaffold.design-production-exclusion` after `DATABASE_CODEGEN`; merge head `9630583c8` contains that order and current `main`. Both hosted runtime tiers now reach the production probe and expose the same product defect: 20 passed, 1 failed. |
| 2026-09-03T01:42:46Z | Evaluate repair | Causal discrimination | Fresh SQLite scaffold at exact head `9630583c8`: init exit 0; immediate production build exit 1 on the not-yet-generated database Zod barrel; standalone `db:generate` exit 0; post-codegen production build exit 1 on Vite loading bare `catalog:` from the materialized service-example route contract. Raw evidence is below. |
| 2026-09-03T01:42:46Z | Evaluate repair | Scope ruling | Filed release-blocking product bug #1971 with `type:bug`, `area:cli`, `area:fresh`, `priority:p0`, `wave:v1`, `gate:e2e`, `status:triage`, `orchestrator:fixes`, and milestone `0.0.7`. #1945 stays code-complete but merge-blocked; dependency stack is #1971 → #1945. No #1971 product fix, skip, or xfail is added here. |
| 2026-09-03T01:49:39Z | Main sync | Conflict resolution | Verified docs head `1a777a0b3` was already on `origin/fix/design-route-prod-gate`, then merged exact `origin/main` `574e9ce57` as `9c1f8765e`. The sole conflict was the generated carrier `packages/cli/src/kernel/assets/embedded.generated.ts`; it was resolved by `deno task gen:assets-barrel`, never by hand. `check:assets-barrel` and `check:aspire-version-parity` exited 0. No suite-file conflict occurred, and the runtime suite still places `scaffold.design-production-exclusion` immediately after `DATABASE_CODEGEN`. |
| 2026-09-03T01:49:39Z | Main sync | Focused validation | On merge tree `9c1f8765e`, the exact requested structured CLI check exited 0 (979 files, 9 batches, 0 failed batches), and `deno test --allow-all packages/cli/e2e/tests/presentation/suite-registry_test.ts` exited 0 (20 passed, 0 failed). Branch-versus-`origin/main` lock diff exited 0; no `deno.lock` churn. No local hosted E2E, Aspire runtime, Docker, product workaround, skip, or xfail was run or added. |
| 2026-09-03T04:28:29Z | Merge readiness | Main sync | Merged exact `origin/main` `5778d70bb` (including #1974 `953b0849c` and #1979 `5778d70bb`) as `bcb83330b`. Preserved both sides in `cli-surface.ts`, `capability-suites.ts`, and `suite-registry_test.ts`; audited the clean auto-merge in `route-templates_test.ts` and retained both design-route and service-client assertions. The design exclusion gate remains immediately after `DATABASE_CODEGEN`. Regenerated the sole generated-carrier conflict, `embedded.generated.ts`, via `deno task gen:assets-barrel`; no harness run was removed or rewritten. |
| 2026-09-03T04:28:29Z | Merge readiness | Tier-A preflight | Merge-tree check passed 1001 files in 9/9 batches; five focused files passed 89/89; post-format conflict tests passed 51/51; scoped E2E lint/fmt passed 6/6 and scoped CLI lint/fmt passed 6/6 using a standalone temporary config because the root workspace intentionally excludes `packages/cli/`. `quality:gate`, explicit `arch:check`, asset freshness, Aspire parity, and lock hygiene exited 0. The rejected whole-package and cross-workspace lint/fmt attempts are non-verdict diagnostics: Deno applied the root `packages/cli/` exclusion, and the wrappers correctly failed closed on partial/all-excluded coverage. |
| 2026-09-03T07:59:27Z | Hosted runtime | Terminal evidence | Retrieved run `33715250068` at exact head `98699f4bd`. PostgreSQL passed 102/102 and SQLite/Garnet passed 97/97; both ran `scaffold.design-production-exclusion` and downstream `behavior.app-reference`. This closes the #1971 runtime blocker without any local Aspire/Docker run. |
| 2026-09-03T07:59:27Z | Hosted core CI | Causal discrimination | The only product/test red at `98699f4bd` was core `check-test`, not runtime. Durable artifact `ci-check-test-gate-receipts-33715250151-1/test.report.json` reports 5235 passed / 1 failed: `service and runtime suites preserve executable service-client gate order`, exact index diff 21 vs 22. The design gate is the intentional extra runtime member. |
| 2026-09-03T07:59:27Z | Main sync | Conflict resolution | Integrated exact `origin/main` `e14322c511` (#1956). Manually retained the design middleware contract in `route-templates_test.ts` alongside main's generated resource-slice test/import surface. Regenerated the conflicted `embedded.generated.ts` from the merged template sources with `deno task gen:assets-barrel`; no shared file was wholesale restored. All #1956 harness runs and product deletions/additions remain preserved. |
| 2026-09-03T07:59:27Z | Delta repair | RED/GREEN | Focused local RED reproduced the order failure. Updated `service-client-runtime-probe_test.ts` so the service suite keeps direct codegen→client-contract adjacency and runtime requires codegen→design-exclusion→client-contract. Focused structured GREEN over six merged/owned files passed 92/92 with an executable worktree `TMPDIR`; the NAS default `/ephemeral/tmp` is no-exec and its two spawn failures are excluded environmental diagnostics. |
| 2026-09-03T08:20:00Z | Hosted runtime delta | Causal discrimination | Exact-head SQLite/Garnet job `100572750365` passed `scaffold.design-production-exclusion` (clean build, planted-route rejection, restored build all true) and then failed only `behavior.app-reference`: 83 passed / 1 failed. The probe's first retired `/examples/users?preview=loading` expectation lacked `data-state="loading"`; #1956 intentionally deleted the legacy showcase state family in favor of the generated resource slice. |
| 2026-09-03T08:20:00Z | Hosted runtime delta | RED/GREEN repair | Focused RED after changing the expected contract produced the exact old/new expectation diff (1 passed / 2 failed). Updated only `probe-app-reference.ts` to retain `/` and `/design/composition` while asserting the canonical `/examples/users` resource markers. Focused GREEN over that probe plus service-order and suite-registry contracts passed 54/54. D-3 records the bounded E2E-only drift; no scaffold product source or local runtime changed. |
| 2026-09-03T08:31:00Z | Owner convergence | Exact escalation | The primary coordinator designated #1958 as sole writer for the shared reference/island probe migration. Reverted the two D-3 probe/test hunks before any evaluation; retained the raw hosted diagnosis and local receipts. D-4 records that this branch must wait for #1958's hosted/evaluator PASS and merge, then integrate its canonical `/examples/users` + `/people` + `PeopleIsland` contract. The coordinator canceled the superseded `a0e83dfee` runtime attempts; no blind retry or local runtime was launched. |

## Causal Discrimination at `9630583c8`

The reproduction used an isolated local-source SQLite scaffold at
`.llm/tmp/design-route-prod-gate-causal/catalog-build-probe`. No application, Aspire, or Docker
runtime was started.

### A. Immediately after init

```text
deno run -A packages/cli/bin/netscript-dev.ts init catalog-build-probe \
  --path .llm/tmp/design-route-prod-gate-causal \
  --db sqlite --cache=false --service --service-name users \
  --ci --yes --no-git --force
exit 0 — 211 files, 47 directories

cd apps/catalog-build-probe-web
deno task build
exit 1
[deno] Could not load .../database/sqlite/schema/.generated/zod/crud.ts
(imported by ../../contracts/versions/v1/users.contract.ts):
Import 'file:///.../database/sqlite/schema/.generated/zod/crud.ts' failed, not found.
```

The first build does not pass. It stops on the expected pre-codegen missing generated Zod barrel,
before the app route's `zod` mapping becomes the active failure.

### B. After the exact standalone database-codegen task

```text
cd database/sqlite
DATABASE_URL='file:./sqlite.db' SQLITE_URI='file:./sqlite.db' deno task db:generate
exit 0

cd ../../apps/catalog-build-probe-web
deno task build
exit 1
vite v7.2.2 building ssr environment for production...
✓ 434 modules transformed.
✗ Build failed in 4.84s
error during build:
[vite:load-fallback] Could not load catalog: (imported by routes/examples/users/(_lib)/route-contract.ts): ENOENT: no such file or directory, open 'catalog:'
```

The source `service/(_lib)/route-contract.ts.template` does **not** build. Scaffold substitution
materializes it as `routes/examples/users/(_lib)/route-contract.ts`; its line-1
`import { z } from 'zod'` is the exact importer named by Vite. There is no separate generated
`routes/examples/service` path to compare. The file already exists immediately after init;
standalone database codegen generates `@database/zod`, allowing the build graph to advance from the
missing-barrel error to this route-contract resolver error.

The suspected producer is
`packages/cli/src/kernel/constants/scaffold/scaffold-app-catalog.ts:58`, which maps
`'zod': 'catalog:'`. The generated workspace root supplies `catalog.zod = "^4.4.3"`, but the Fresh
app's Vite SSR build receives `catalog:` as a load ID. The repository toolchain contract permits
catalog indirection only for npm dependency resolution; it does not make bare `catalog:` a
Vite-loadable module ID. Product remediation is owned by #1971.

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| `/design` is development-only | All affirmative prose describes a local customization reference/gallery; no production-user contract exists. | `research.md` F1-F5 |
| Deliver both exclusions | Fresh supports structural ignore; generated route middleware supplies independent runtime refusal. | RFC 0005 H-4/H-8; `research.md` F6-F8 |
| Extend generated-quality E2E files | Closest mutation pattern and avoids deepening an over-cap directory. | `research.md` F10-F11 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| `packages/cli/e2e/suites/scaffold/capability-suites.ts` was omitted from the plan file list but is the existing selector required to put the new registered gate into `scaffold.runtime`. | minor | `drift.md` D-1; bounded inside `packages/cli/**` with no new gate-directory child |

## Gate Results

| Gate | Status | Evidence |
| --- | --- | --- |
| PLAN-EVAL | PASS | `plan-eval.md`; evaluator commit `5566a89f6`, plan head `f8ed75b41` |
| RED focused tests | EXPECTED_FAIL | Structured `run-deno-test.ts` over five focused unit/E2E files exited 1 with missing middleware asset key and gate ID; 2026-09-02 |
| GREEN 3 focused E2E tests | PASS | Structured `run-deno-test.ts`; 32 passed, 0 failed |
| GREEN 3 source check | EXPECTED_STEP_BOUNDARY | Structured `run-deno-check.ts --root packages/cli/e2e/src --ext ts,tsx`; only stale embedded-barrel `TS2741`, to be resolved by GREEN 4 |
| Validated implementation head | PASS | `21ee63419` (includes mechanical merge of `origin/main` `ba6f1f49a`) |
| Check | PASS | Structured `run-deno-check.ts --root packages/cli/src --ext ts,tsx`; exit 0, 733 files, 0 failed batches |
| Focused tests | PASS | Structured `run-deno-test.ts`; exit 0, 88 passed, 0 failed across five touched test files |
| Lint | PASS | Structured `run-deno-lint.ts`; 12 touched non-generated TS files processed across CLI/E2E configs, 0 findings |
| Format | PASS | Structured `run-deno-fmt.ts`; 12 touched non-generated TS files processed across CLI/E2E configs, 0 findings |
| Embedded generation | PASS | `deno task gen:assets-barrel`; only the CLI embedded barrel changed; `deno.lock` unchanged |
| Embedded freshness | PASS | `deno task check:assets-barrel`; exit 0 after merge-time regeneration |
| Quality | PASS | `deno task quality:gate`; exit 0; existing repository warnings only |
| Architecture | PASS | `deno task arch:check`; exit 0; existing repository warnings only |
| Publish assets carrier | PASS | `deno task check:publish-assets`; exit 0 |
| MCP export corpus carrier | PASS | `deno task check:mcp-export-corpus`; exit 0 |
| Agent docs prose carrier | PASS | `deno task check:agent-docs-prose`; exit 0 |
| Main `574e9ce57` sync | PASS | Merge `9c1f8765e`; only conflict was `packages/cli/src/kernel/assets/embedded.generated.ts`, regenerated with `deno task gen:assets-barrel` |
| Post-sync CLI check | PASS | Exact requested `run-deno-check.ts --root packages/cli --ext ts,tsx --exclude '^(.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)'`; exit 0, 979 files, 9/9 batches |
| Post-sync suite registry test | PASS | Exact requested `deno test --allow-all packages/cli/e2e/tests/presentation/suite-registry_test.ts`; exit 0, 20 passed / 0 failed |
| Post-sync Aspire parity | PASS | `deno task check:aspire-version-parity`; exit 0, manifest fresh, 927 checked / 0 failed |
| Post-sync lock hygiene | PASS | `git diff --exit-code origin/main...HEAD -- deno.lock packages/cli/deno.lock packages/cli/e2e/deno.lock`; exit 0 |
| Main `5778d70bb` sync | PASS | Merge `bcb83330b`; three authored conflicts preserved both sides, `route-templates_test.ts` was audited/formatted after its clean auto-merge, and `embedded.generated.ts` was generator-resolved |
| Merge-readiness check | PASS | Structured `run-deno-check.ts --root packages/cli --ext ts,tsx`; exit 0, 1001 files, 9/9 batches |
| Merge-readiness focused tests | PASS | Structured `run-deno-test.ts` over five approved CLI/E2E tests; exit 0, 89 passed / 0 failed |
| Merge-readiness lint | PASS | Structured wrappers over the 6 E2E + 6 CLI authored TS files; exit 0, 12/12 processed, 0 findings |
| Merge-readiness format | PASS | Structured wrappers over the 6 E2E + 6 CLI authored TS files; exit 0, 12/12 processed, 0 findings after formatting the auto-merged route-test hunk |
| Merge-readiness quality/doctrine | PASS | `deno task quality:gate` and explicit `deno task arch:check`; exit 0, existing repository warnings only |
| Merge-readiness freshness | PASS | `check:assets-barrel` and `check:aspire-version-parity`; exit 0, Aspire manifest fresh (953 checked / 0 failed) |
| Merge-readiness lock hygiene | PASS | Branch-versus-`origin/main` diff for known lockfiles; exit 0 |
| Hosted development behavior | PASS | Exact head `98699f4bd`; `behavior.app-reference` passed in PostgreSQL job `100523051743` and SQLite/Garnet job `100523052025` |
| Hosted production exclusion — PostgreSQL | PASS | Exact head `98699f4bd`; [job 100523051743](https://github.com/rickylabs/netscript/actions/runs/33715250068/job/100523051743); 102 passed / 0 failed, including `scaffold.design-production-exclusion` |
| Hosted production exclusion — SQLite | PASS | Exact head `98699f4bd`; [job 100523052025](https://github.com/rickylabs/netscript/actions/runs/33715250068/job/100523052025); 97 passed / 0 failed, including `scaffold.design-production-exclusion` |
| Hosted core test delta | FAIL_REPAIRED_PENDING_EXACT_HEAD | Head `98699f4bd`; run `33715250151`, job `100523026122`; 5235 passed / 1 failed on stale service-client adjacency. D-2 records the bounded assertion repair; fresh exact-head CI is pending. |
| Current-main hosted design exclusion | PASS | Merge head `d813df7ca`; run `33731627085`, SQLite/Garnet job `100572750365`; production exclusion clean/mutation/restored booleans all true before a downstream stale reference-probe failure. |
| Current-main app-reference delta | FAIL_REPAIRED_PENDING_EXACT_HEAD | Run `33731627085`, SQLite/Garnet report: 83 passed / 1 failed only on the retired `?preview=loading` contract. D-3 repair passes focused tests 54/54; fresh exact-head hosted tiers remain required. |
| App-reference repair local receipts | PASS | Structured CLI check 1001 files / 9 batches; focused tests 100/100 after formatting; scoped lint/fmt 2/2 files; `quality:gate`, explicit `arch:check`, asset/Aspire freshness, and all four carrier checks exit 0. No local runtime or lockfile delta. |
| Shared app-reference owner | BLOCKED_ON_1958 | D-4 supersedes the local D-3 repair. #1958 is the sole writer; integrate it only after its hosted/evaluator PASS and coordinator merge. No second blind runtime loop is authorized. |

## Handoff Notes

- The gate order after `DATABASE_CODEGEN` is the correct contract and must not be reverted, skipped, or xfailed.
- #1971 is present through merged main and both hosted runtime tiers are green at `98699f4bd`.
- Fresh exact-head static/hosted receipts and a separate-session delta IMPL-EVAL remain before merge readiness. No full local `e2e:cli`, Aspire runtime, Docker run, skip, or xfail was used for this repair.
