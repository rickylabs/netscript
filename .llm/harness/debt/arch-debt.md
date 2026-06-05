# Architecture Debt Registry

Seeded from
`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md` on
2026-04-29. Entries track packages with `Refactor`, `Restructure`, or `Rewrite` doctrine verdicts.
`Keep` and `Defer` verdicts are not seeded here.

## packages/runtime-config — doctrine verdict Refactor

- **Reason:** Split single-file `mod.ts`; add subpaths if exports grow.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** closed 2026-05-01 — Phase 11 completed the Archetype 6 v2 layout: public/maintainer
  feature slices, kernel adapters, template assets, binary edges, and executable CLI fitness gates
  now cover the former monoliths.
- **Gate:** F-1, F-5, F-6, F-7

## packages/config — AP-1 / doctrine verdict Refactor (schema.ts 945 LOC)

- **Reason:** `schema.ts` is above the doctrine file-size threshold and should split by concept.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** closed 2026-05-01 — public local-source and monorepo behavior moved behind the
  maintainer command graph; `deno task arch:check` enforces public/maintainer isolation.
- **Gate:** F-1, F-5, F-10

## packages/cron — AP-17 / doctrine verdict Refactor

- **Reason:** `interfaces/` should become `ports/`; adapter classes should be named by technology.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** closed 2026-05-01 — CLI permission expectations are documented in
  `packages/cli/docs/permissions.md` and linked from `packages/cli/README.md`.
- **Gate:** F-3, F-11

## packages/database — AP-17 / doctrine verdict Refactor

- **Reason:** `interfaces/` should become `ports/`; composition root needs confirmation.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-3, F-11

## packages/queue — AP-16 / doctrine verdict Refactor

- **Reason:** `internal/` and `utils/` need role-named placement under the doctrine vocabulary.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-3, F-11

## packages/kv — AP-1 / doctrine verdict Refactor (bridge_test.ts 1,039 LOC)

- **Reason:** `bridge_test.ts` is a god test file; adapters need audit.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-10, F-3

## packages/telemetry — doctrine verdict Refactor

- **Reason:** Confirm port/adapter split and expose OTEL adapter as a subpath export.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-3, F-5, F-6

## packages/triggers — doctrine verdict Restructure

- **Reason:** Flat files should lift into `application/`, `state/`, and `runtime/`.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-3, F-11, F-13

## packages/workers — AP-1 / doctrine verdict Restructure (task-executor.ts 1,287 LOC)

- **Reason:** `task-executor.ts` needs supervisor/executor/dispatcher split.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-1, F-3, F-13

## packages/sagas — AP-1 / doctrine verdict Refactor (list-transport.ts 847 LOC)

- **Reason:** `list-transport.ts` should split; compensation should be a builder method.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-1, F-13

## packages/fresh — AP-1 / doctrine verdict Restructure (builders/mod.ts 1,110 LOC)

- **Reason:** `builders/mod.ts` should split per builder concern with subpath exports.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-1, F-5, F-11

## packages/service — doctrine verdict Refactor

- **Reason:** `presets/` and `assets/` need role clarification.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-3, F-11

## packages/plugin — AP-1 / doctrine verdict Restructure (types.ts 1,005 LOC)

- **Reason:** `types.ts` should split per concept and introduce `domain/` plus `ports/`.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-1, F-3, F-5, F-11

## packages/plugin/src/sdk/discovery/ast-extractor.ts — PLG-WALKER-AST (extractor precision)

- **Reason:** Group G needs walker-generated registries now, but a full TypeScript AST resolver with
  symbol binding, import graph traversal, and expression evaluation exceeds the polish slice. The
  implementation intentionally uses a bounded regex extractor for direct
  `export const name = defineJob|defineSaga|defineWebhook(...)` call sites and records this debt
  before slice G10-3 as required by evaluator finding 3.
- **Owner:** Plugin platform maintainers.
- **Target:** Replace with compiler-backed AST extraction before plugin platform stabilization.
- **Linked plan:** `.llm/tmp/run/feat-plat-impl-polish--plan-and-impl/plan.md` (G10-3).
- **Created:** 2026-05-20
- **Status:** open
- **Gate:** PLG-WALKER-AST, F-5, F-11

## packages/cli — AP-1 / doctrine verdict Restructure

- **Reason:** `pipeline.ts` and `official-plugin-copier.ts` are monoliths; package should move
  toward Archetype 6 layout.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-1, F-3, F-10, AP-18 manual review
- **Slice 8 update:** `commands/init/pipeline.ts` was decomposed into
  `src/public/application/init/**`; this entry remains open for `official-plugin-copier.ts` and
  remaining CLI debt.

## packages/cli — cli/maintainer-mode-mixing

- **Reason:** Public CLI code currently exposes local-source and monorepo concepts that must move
  behind the workspace-only `netscript-dev` command graph.
- **Owner:** refactor-cli-doctrine-rewrite.
- **Target:** Close after slice 25.
- **Linked plan:** `.llm/tmp/run/refactor-cli-doctrine-rewrite/plan.md`
- **Created:** 2026-04-30
- **Status:** open
- **Gate:** F-CLI-3, F-CLI-4, F-CLI-11

## packages/cli — cli/no-permissions-doc

- **Reason:** The CLI permissions contract is not documented by command and binary, which leaves
  public and maintainer runtime requirements ambiguous.
- **Owner:** refactor-cli-doctrine-rewrite.
- **Target:** Close after slice 28.
- **Linked plan:** `.llm/tmp/run/refactor-cli-doctrine-rewrite/plan.md`
- **Created:** 2026-04-30
- **Status:** open
- **Gate:** F-CLI-8, F-CLI-10

## packages/cli — cli/doctrine-drift-phase-10

- **Reason:** Phase 10 removed the audited master-era roots, but post-PR review found the package
  still failed the stricter readability and consistency bar now codified in Archetype 6 v2: command
  surfaces remain too flat, composition still owns command body shape, templates and adapters need
  normalized placement, and output/exit edges need hard enforcement.
- **Owner:** refactor-cli-doctrine-rewrite.
- **Target:** Close by slice 63.
- **Linked plan:** `.llm/tmp/run/refactor-cli-doctrine-rewrite/plan.md`
- **Created:** 2026-05-01
- **Status:** closed 2026-05-01 — Phase 11 slices 49-63 completed the kernel rename, binary
  extraction, vertical slicing, declarative composition, exit discipline, template consolidation,
  and executable F-CLI-1..31 gate wiring for the CLI package.
- **Gate:** F-CLI-1..31 plus universal F-16, F-17, F-18

## packages/cli — cli/archetype-6-v2-pending-scripts

- **Reason:** Slice 48 registers Archetype 6 v2 gates F-CLI-14 through F-CLI-31 before all
  enforcement scripts exist. Temporary manual evidence is allowed only while Phase 11 implements the
  scripts.
- **Owner:** refactor-cli-doctrine-rewrite.
- **Target:** Close by slice 62.
- **Linked plan:** `.llm/tmp/run/refactor-cli-doctrine-rewrite/plan.md`
- **Created:** 2026-05-01
- **Status:** closed 2026-05-01 — slice 62 added and wired the F-CLI-14..31 fitness scripts;
  `deno
  task arch:check` runs without `pending-script marker` output.
- **Gate:** F-CLI-14..31

## packages/shared — AP-2 / doctrine verdict Rewrite (datetime.ts 1,112 LOC)

- **Reason:** `utils/datetime.ts` should be replaced by `@std/datetime` or platform primitives;
  `shared` should shrink to cross-package identifiers.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** partially closed 2026-06-05 — `utils/datetime.ts` was deleted in Wave 0 and the
  published surface remains free of generic datetime helpers. Residual unpublished `utils/`
  compatibility for `@shared/utils` consumers is tracked in the Wave 0 drift registry until later
  plugin waves migrate those imports.
- **Gate:** F-1 and F-2 closed for datetime; F-11 remains deferred for residual unpublished `utils/`
  compatibility

## plugins/triggers — doctrine verdict Refactor

- **Reason:** Confirm `verify-plugin.ts` exists and plugin verification shape matches Archetype 5.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-3, F-9, F-11

## plugins/workers — doctrine verdict Refactor

- **Reason:** Confirm `verify-plugin.ts` exists and review `worker/` versus `jobs/` split.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-3, F-9, F-11

## packages/cli — public-api doc completeness (`cli/public-api-doc-completeness`)

- **Reason:**
  `deno doc --lint packages/cli/mod.ts packages/cli/scaffolding.ts packages/cli/testing.ts` reports
  48 residual `private-type-ref` errors after the Phase 12 evaluator pass. Public `Add*Dependencies`
  interfaces name concrete kernel adapter classes (`DatabaseWorkspaceMutator`,
  `PluginWorkspaceMutator`, `ServiceWorkspaceResolver`, `PortAllocator`, `DbEngineRegistry`,
  `PluginKindRegistry`) and through them surface internal collaborators (`Registry`,
  `DiscoveredService`, `PluginScaffoldResult`, `ResolvedXxxConfig`, `CompileResult`, etc.). Plan
  goal #3 ("100% JSR documentation score") is not fully met.
- **Owner:** `@netscript/cli` maintainers.
- **Target:** before the next public minor; tracked as plan slice 67.
- **Linked plan:** `.llm/tmp/run/refactor-cli-doctrine-rewrite/plan.md` (slice 67).
- **Created:** 2026-05-01 (evaluator pass).
- **Status:** open. Publish dry-run still passes; this is doc-completeness, not a publish blocker.
- **Gate:** F-CLI-8 (doc score), F-7 (universal doc-score gate).

## packages/aspire — public schema doc-lint completeness (`aspire-public-schema-doc-lint`)

- **Reason:** `deno doc --lint packages/aspire/mod.ts` reports 32 pre-existing public API doc-lint
  errors in `config.ts` and `types.ts`: exported Zod schema constants lack explicit type
  annotations, and public types derived with `z.infer` reference Zod's private `output` helper type.
  The slice 1 OTEL vocabulary change adds an explicit dashboard env constant and does not introduce
  these schema/type failures. `deno publish --dry-run --allow-dirty --no-check=remote` from
  `packages/aspire` fails on the same slow-type class, while
  `deno publish --dry-run --allow-dirty --no-check=remote --allow-slow-types` succeeds. Fixing the
  package-wide Zod public surface would exceed the OTEL parity slice.
- **Owner:** `@netscript/aspire` maintainers.
- **Target:** before the next public Aspire package release.
- **Linked plan:** `.llm/tmp/run/feat-cli-aspire-otel-parity/plan.md` (slice 1 doc-lint gate).
- **Created:** 2026-05-03
- **Status:** superseded by `.llm/tmp/run/feat-plat-impl-foundation--plan-and-impl`: root
  `deno doc --lint packages/aspire/mod.ts` now passes after narrowing the root contract. Schema
  subpath/public schema publish hardening remains owned by the future Aspire/schema package work if
  that subpath is promoted as stable.
- **Gate:** F-5, F-7

## packages/telemetry/src/instrumentation/{saga,worker,scheduler}.ts — AP-1/F-1 active compatibility debt (`telemetry-plugin-instrumentation-extraction`)

- **Reason:** `saga.ts`, `worker.ts`, and `scheduler.ts` remain active and exported from
  `@netscript/telemetry/instrumentation` because current worker/scheduler/saga packages and official
  plugins still import those helper symbols. Removing them during Group A would break consumer
  coherence. This intentionally defers the extraction that was partially reversed by the
  compatibility restoration.
- **Owner:** Future worker, scheduler, saga, and plugin runtime package groups.
- **Target:** Move domain-specific instrumentation to the owning future plugin/package subpaths
  before the next plugin-platform stabilization pass.
- **Linked plan:** `.llm/tmp/run/feat-plat-impl-foundation--plan-and-impl/plan.md` and
  `.llm/tmp/run/feat-plat-impl-foundation--plan-and-impl/drift.md`.
- **Created:** 2026-05-08
- **Status:** open, DEBT_ACCEPTED for Foundation alpha only.

## packages/config — plugin-specific schema/config ownership (`config-plugin-specific-schema-debt`)

- **Reason:** Core config still owns plugin-specific concerns in `src/schema/plugins/mod.ts`,
  `src/domain/worker-schema.ts`, `src/domain/saga-schema.ts`, `src/domain/trigger-schema.ts`,
  `src/domain/runtime-config-schema.ts`, and deploy/runtime plugin config surfaces. These remain
  temporarily because the future plugin-specific packages/subpaths that should own them are not
  present yet and CLI/generated project consumers depend on the current shapes.
- **Owner:** Group D (workers) for worker/job/permissions schemas; future groups for
  sagas/triggers/runtime.
- **Target:** Move worker/job/permissions schemas to `@netscript/plugin-workers-core/config` in
  Group D. Move saga/trigger/runtime schemas in their respective groups. Keep `@netscript/config`
  focused on project-level loader/composition contracts.
- **Linked plan:** `.llm/tmp/run/feat-plat-impl-workers--plan-and-impl/plan.md` slice D-config.
- **Created:** 2026-05-08
- **Status:** in-progress: workers extracted; sagas/triggers pending
- **Gate:** F-3, F-5, F-7, plugin import/platform fitness gates
- **Notes:** Group D rescoped plan (2026-05-10) adds D-config slice to extract worker/job config
  schemas to `@netscript/plugin-workers-core/config/`. The accepted D4 path is no-shim TRUE_CLOSE:
  workers core does not import or re-export through `@netscript/config`. Legacy config ownership
  remains only until D28-D29 migrate consumers and delete the old worker config copies.

## packages/aspire/deno.json — `./helpers` alpha compatibility subpath (`aspire-helpers-subpath-shim`)

- **Reason:** The forbidden `helpers/` folder was removed, but
  `./helpers -> ./src/application/mod.ts` remains as an alpha compatibility subpath while generated
  AppHost/helper consumers migrate to `@netscript/aspire/application`.
- **Owner:** Future Aspire/AppHost generator migration group.
- **Target:** Remove the `./helpers` export after generated projects and package consumers import
  `@netscript/aspire/application`.
- **Linked plan:** `.llm/tmp/run/feat-plat-impl-foundation--plan-and-impl/plan.md` and
  `.llm/tmp/run/feat-plat-impl-foundation--plan-and-impl/drift.md`.
- **Created:** 2026-05-08
- **Status:** open, DEBT_ACCEPTED for Foundation alpha only.
- **Gate:** F-5, F-7, F-11, F-18

## runtime — Aspire OTEL CLI Dashboard API discovery fails (`aspire-otel-cli-discovery`)

- **Reason:** Slice 5 can start the master C# AppHost and verify Deno runtime resources with full
  OTEL env (`OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318`, protocol `http/protobuf`, sampler
  `always_on`). Direct Aspire Dashboard telemetry API probes return `200` for
  `/api/telemetry/resources`, `/api/telemetry/logs`, and `/api/telemetry/traces`, but
  `aspire otel
  logs` and `aspire otel traces` still fail with "Dashboard API is not available."
  This blocks CLI-command evidence, not trace capture itself.
- **Owner:** runtime validation / Aspire CLI environment.
- **Target:** before claiming `aspire otel ...` CLI parity as PASS.
- **Linked plan:** `.llm/tmp/run/feat-cli-aspire-otel-parity/plan.md` (slices 5-6 runtime parity
  procedure).
- **Created:** 2026-05-03
- **Status:** open. Slice 5 records `PASS_WITH_CLI_DEBT` evidence in
  `.llm/tmp/run/feat-cli-aspire-otel-parity/baseline-csharp-trace.md`; slice 6 may compare trace
  shape through the Dashboard API, but final PR must not claim the `aspire otel` CLI path passed.
- **Gate:** runtime - C# baseline, runtime - telemetry

## packages/cli — legacy C# scaffold plugin-add incompatibility (`legacy-csharp-scaffold-plugin-add`)

- **Reason:** The runtime plan required a generated C# scaffold covering official plugins, handmade
  plugin, db, service, worker, trigger, saga, and frontend. `netscript init --legacy-aspire` creates
  a legacy C# AppHost project under `dotnet/AppHost`, but `netscript plugin add worker` then fails
  while regenerating helpers because it expects an `aspire/` directory. The command partially writes
  plugin files and `appsettings.json`, but the generated C# `Program.cs` remains frontend-only.
- **Owner:** CLI scaffold/runtime maintainers.
- **Target:** before using generated legacy C# scaffolds for full plugin runtime parity baselines.
- **Linked plan:** `.llm/tmp/run/feat-cli-aspire-otel-parity/plan.md` (slice 5 scaffolded project
  spec).
- **Created:** 2026-05-03
- **Status:** open. Slice 5 used the master checkout itself as the C# reference after recording
  drift; no C# package edits were made.
- **Gate:** runtime - C# baseline, regression

## runtime — generated TS scaffold local import overlay (`generated-ts-scaffold-local-import-overlay`)

- **Reason:** Slice 6 generated TS scaffolds reference unpublished `@netscript/*` package imports,
  while the current `netscript init` command no longer accepts the documented `--local` mode.
  Runtime validation required an ignored local import-map overlay that maps package exports to
  worktree file URLs and pins `@logtape/logtape@^2.0`.
- **Owner:** CLI scaffold/runtime maintainers.
- **Target:** before declaring generated scaffold runtime parity without harness-only overlays.
- **Linked plan:** `.llm/tmp/run/feat-cli-aspire-otel-parity/plan.md` (slice 6 runtime parity).
- **Created:** 2026-05-03
- **Status:** open. The overlay is documented in `scaffold.md`; generated source was not committed.
- **Gate:** runtime - generate, runtime - start

## runtime — generated TS frontend React reference (`generated-ts-frontend-react-reference`)

- **Reason:** Slice 6 generated frontend route fails with `ReferenceError: React is not defined`.
  The dashboard trace exists and includes Fresh/page spans, but it is a 500 trace rather than a
  successful frontend-origin E2E parity trace.
- **Owner:** Fresh/frontend scaffold maintainers.
- **Target:** before claiming `runtime - E2E trace` as plain PASS.
- **Linked plan:** `.llm/tmp/run/feat-cli-aspire-otel-parity/plan.md` (slice 6 runtime parity).
- **Created:** 2026-05-03
- **Status:** open. Trace `5e7adbe64e93c5cc4b0da94d6dfb1b20` records the failure and confirms OTEL
  ingestion works for the frontend resource.
- **Gate:** runtime - E2E trace, runtime - span attrs

## runtime — generated TS sample E2E chain missing (`generated-ts-sample-e2e-chain`)

- **Reason:** The generated TS scaffold's sample resources expose healthy service/plugin API
  endpoints and Deno OTel spans, but they do not provide the same trigger -> queue -> worker chain
  captured from the master C# baseline. A manual Deno probe proves traceparent propagation for a
  client fetch into the `users` service, but not the required full parity chain.
- **Owner:** CLI sample/runtime maintainers.
- **Target:** before claiming generated TS trace shape parity with the C# baseline.
- **Linked plan:** `.llm/tmp/run/feat-cli-aspire-otel-parity/plan.md` (slice 6 runtime parity).
- **Created:** 2026-05-03
- **Status:** open. `ts-apphost-trace.md` records healthy resource traces and the missing chain.
- **Gate:** runtime - E2E trace, runtime - span attrs

## runtime — DB lifecycle conflicts with strict container hygiene (`runtime-db-hygiene-persistent-container`)

- **Reason:** Removing the generated persistent Postgres container between `db init`/`db seed` and
  final `aspire start` erases the migrated database, causing `otel-parity-db` health to fail with
  `database "otel-parity-db" does not exist`. The successful Slice 6 run preserved the migrated
  generated Postgres container between DB lifecycle and final trace capture.
- **Owner:** runtime validation / generated DB orchestration maintainers.
- **Target:** before requiring strict container removal between generated DB lifecycle and AppHost
  trace capture.
- **Linked plan:** `.llm/tmp/run/feat-cli-aspire-otel-parity/plan.md` (run hygiene).
- **Created:** 2026-05-03
- **Status:** open. Final cleanup stopped AppHost, removed generated containers, and confirmed ports
  `4318` and `18888` were free.
- **Gate:** runtime - start, runtime - describe

## packages/cli — runtime schema generation plugin dependency gap (`cli-runtime-schemas-plugin-dependency`)

- **Reason:** Slice 7 regression exercised the current project-level generation surface. The
  historical `netscript generate` gate in the plan is stale: the current command group only exposes
  `generate runtime-schemas`. Running `generate runtime-schemas --dry-run` against a fresh scaffold
  after `plugin add worker` failed because the temporary generated plugin registry imports
  `@netscript/plugin`, but the scaffold's import map/dependencies do not resolve that package.
- **Owner:** CLI generation/plugin maintainers.
- **Target:** before treating `generate runtime-schemas` as a clean generated-project regression
  gate.
- **Linked plan:** `.llm/tmp/run/feat-cli-aspire-otel-parity/plan.md` (slice 7 validation matrix,
  `runtime - generate`).
- **Created:** 2026-05-03
- **Status:** open. The OTEL-related regeneration paths still passed through `db add` and
  `plugin add`, each of which regenerated 12 Aspire helper files. The failing command is recorded as
  `DEBT_ACCEPTED` for Slice 7 rather than folded into the OTEL implementation.
- **Gate:** runtime - generate, regression

## packages/plugin-workers-core/contracts — structural server contract export (`workers-contract-structural-server-export`)

- **Reason:** `workersContractV1` is exported as a structural server-contract type to keep JSR
  slow-type findings at 0. The shape preserves route keys but weakens deep handler-options inference
  inside the workers service routers, so the server contract uses a narrow structural handler shim
  instead of exporting the full inferred oRPC server type.
- **Owner:** Workers core maintainer.
- **Target:** Remove the structural handler shim and restore deep server-contract inference once
  oRPC exposes a wrapper that preserves JSR slow-type cleanliness, or once TypeScript/JSR no longer
  reports slow types for the inferred server contract.
- **Linked plan:** `.llm/tmp/run/feat-plat-impl-workers-v2--plan-and-impl/plan.md`,
  `.llm/tmp/run/feat-plat-impl-workers-v2--plan-and-impl/drift.md`, and
  `.llm/tmp/run/feat-plat-impl-workers-v2--plan-and-impl/evaluate.md`.
- **Created:** 2026-05-11
- **Status:** open, DEBT_ACCEPTED for Group D merge.
- **Gate:** core/plugin `deno publish --dry-run --allow-dirty` stays at 0 slow-type errors, then
  remove the structural contract shim without reintroducing service-router casts or slow types.
