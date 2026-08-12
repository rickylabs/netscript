# Research — test-1374-docs-compile-gate--leaf

## Re-baseline

- Carried-in source: live issue #1374 and the dispatch brief.
- Re-derived against `origin/main` at `01aa12b67e36b643e1ca4f94421ecba07e030db5` on 2026-08-12.
- The issue Evidence section is accepted as verified fact and was not re-derived. Research below
  covers the design inputs requested by the brief: workspace resolution, the live fence census,
  checker responsibilities, and workflow wiring.
- Orchestrator-provided current facts: the old dialect markers are zero under `docs/site/**`; the
  stale MCP generated corpus is #1531 and out of scope.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | The root `deno.json` declares `workspace: ["packages/*", "packages/cli/e2e", "plugins/*", "examples/*", "apps/*"]`. Workspace member `name` plus `exports` maps `@netscript/*` and exact subpaths to local declared entrypoints. | `deno info --json @netscript/sdk/query` reports root `packages/sdk/src/query/mod.ts`; `deno info --json @netscript/sdk` reports `packages/sdk/mod.ts`. |
| 2 | A synthetic file outside the repository resolves `@netscript/sdk/client` and `@netscript/sdk/query` when checked with the root config. TSX additionally needs the Preact JSX import mapping. | Research probe: `deno check --unstable-kv --frozen --config <root>/deno.json <temp>.ts`; TSX passes when the import map supplies exact `preact` and `preact/jsx-runtime` mappings. |
| 3 | Root `isolatedDeclarations: true` is correct for packages but creates example-only failures for exported snippet declarations without explicit annotations. The synthetic config must turn it off; it must not weaken `strict`, `noImplicitAny`, or `noImplicitReturns`. | Root `deno.json:compilerOptions`; research TSX probe emitted TS9007 until checked from a config with `isolatedDeclarations: false`. |
| 4 | `docs/site/**` contains 246 `.md`/`.vto` source files, 578 fenced blocks on 123 pages, 211 `ts`, 77 `tsx`, and 7 `typescript` blocks. The gate recognizes all three TS-like tags, for 295 blocks. | Read-only Deno fence scanner over every `.md`/`.vto`, with matching backtick/tilde fence length and an unclosed-fence assertion. Per-page table below. |
| 5 | The nine Tier-1 pages contain 35 `ts`/`tsx` blocks: `quickstart` 1, `index` 0, SDK overview 1, add-service 6, query 7, examples 2, interactive 2, form 6, query-bridge 10. | Focused extraction with source lines; table below. |
| 6 | Tier-1 includes complete modules, multi-file continuations indicated by leading `// path.ts[x]` comments, deliberate counter-examples, and partial fragments with app-local names. A permissive ambient preamble would make the gate lie. | Direct inspection of the 35 extracted blocks. After the PLAN-EVAL disposition, the planned census is 21 checked and 14 reason-marked exemptions. |
| 7 | `check-accuracy-and-discoverability.ts` mixes forbidden stale-text rules with positive API needles, source regexes, a manual Fresh-root export allowlist, 18 hardcoded CLI mutation families, and a subprocess call to `check-exports-drift.ts`. | `.llm/tools/docs/check-accuracy-and-discoverability.ts`. Exact demotion is locked in `plan.md`. |
| 8 | `check-exports-drift.ts` reads package `deno.json` export maps and docs export tables for 8 mappings. Only `config`, `contracts`, and `telemetry` have `checkSymbols: true`; symbol checking shells out to `deno doc --json`. Expanding its mapping belongs to #1108. | `.llm/tools/docs/check-exports-drift.ts:13-220,222-392`. |
| 9 | `pages.yml` runs for PRs/pushes only on `docs/site/**` and itself. It builds Lume, links, and caveats, but has no snippet/API check. | `.github/workflows/pages.yml`. |
| 10 | `ci.yml` suppresses all draft-PR jobs. On non-drafts its `quality` job runs when classifier output is `needs_deno || needs_docs`, and currently invokes `docs:accuracy` but no snippet compile task. `packages/**`/`plugins/**` classify as Deno changes. | `.github/workflows/ci.yml`; `.github/scripts/ci-classify-changes.ts`. |
| 11 | Deno 2.9.5 `check` accepts multiple entry files, `--config`, `--import-map`, `--lock`, `--frozen`, and `--unstable-kv`; it type-checks without executing the modules. | `deno check --help`; `netscript-deno-toolchain` skill. |
| 12 | A synthetic config cannot use the real workspace lock with `--frozen`: every evaluator control exits 1 with `The lockfile is out of date`. Copying the root lock into the temp root and omitting `--frozen` allows Deno to reconcile synthetic workspace metadata without mutating the tracked lock. | Opposite-family PLAN-EVAL cycle-1 executed D2 probe (B1). |
| 13 | Root/member `imports` are insufficient for reachable workspace graphs: `@opentelemetry/api` is imported by telemetry but exists only in the root npm `catalog`. The synthetic map must materialize root catalog fallbacks. | Opposite-family PLAN-EVAL cycle-1 D2 probe; `deno.json:215`; `packages/telemetry/src/context/w3c.ts`. |
| 14 | Of the original 17 planned exemptions, 14 are structural, two query-island examples are harness-fit and can compile with typed relative support modules, and one add-service barrel is a real missing-local-binding defect. | Opposite-family PLAN-EVAL cycle-1 classification and compiled probes (B4/N1). |

## Fence census by language

| Language | Blocks |
| --- | ---: |
| `ts` | 211 |
| `sh` | 168 |
| `tsx` | 77 |
| `bash` | 63 |
| `text` | 23 |
| plain info string | 20 |
| `typescript` | 7 |
| `json` | 4 |
| `js`, `jsonc`, `md`, `powershell`, `prisma` | 1 each |
| **Total** | **578** |

The compile gate recognizes `ts`, `tsx`, and `typescript`: **295 TS-like blocks**. `typescript` is
normalized to the `.ts` compilation path immediately so a one-word tag rename cannot bypass the
gate; canonical tag cleanup remains part of the reference expansion wave.

## Fence census by page

Only pages containing at least one fence are listed. Counts include every language so the scanner's
denominator is reproducible.

| Page | Fence census |
| --- | --- |
| `_diagrams/README.md` | plain 4 |
| `_includes/readme-template.md` | sh 1, ts 1 |
| `_plan/02-information-architecture.md` | plain 1 |
| `_plan/10-nav-ia-redesign.md` | plain 1, ts 1 |
| `_plan/briefs/00-INDEX.md` | plain 1 |
| `_plan/research/market-fit.md` | plain 1 |
| `_plan/research/netscript-feature-landscape.md` | plain 1 |
| `ai/agent-tooling.md` | bash 2 |
| `ai/chat-ui.md` | text 1 |
| `ai/durable-chat.md` | text 1, ts 5 |
| `ai/engine.md` | ts 1 |
| `ai/how-to/build-a-durable-chat.md` | text 1, ts 3, tsx 1 |
| `ai/mcp.md` | ts 1 |
| `background-processing/how-to/add-a-task-runtime-adapter.md` | bash 1, js 1, ts 3 |
| `background-processing/how-to/restrict-worker-task-permissions.md` | ts 1 |
| `background-processing/how-to/run-a-polyglot-task.md` | sh 1, ts 1 |
| `background-processing/how-to/tune-worker-runtime.md` | bash 1, sh 1, ts 2 |
| `background-processing/workers.md` | bash 3, ts 4 |
| `data-persistence/database.md` | text 1, ts 1 |
| `data-persistence/how-to/choose-a-queue-provider.md` | bash 1, ts 5 |
| `data-persistence/how-to/database-migration.md` | bash 1, text 1 |
| `data-persistence/how-to/queue-kv-cron.md` | ts 9 |
| `data-persistence/how-to/use-a-second-database.md` | bash 1, ts 1 |
| `durable-workflows/how-to/build-a-validated-ingestion-queue.md` | ts 3 |
| `durable-workflows/how-to/publish-a-durable-stream.md` | ts 4 |
| `durable-workflows/sagas.md` | ts 2 |
| `durable-workflows/streams.md` | ts 1 |
| `durable-workflows/triggers.md` | ts 4 |
| `explanation/architecture.md` | text 1 |
| `explanation/aspire.md` | text 1, ts 4 |
| `explanation/auth-model.md` | text 1 |
| `explanation/contracts.md` | text 1, ts 1 |
| `explanation/durability-model.md` | text 1, ts 3 |
| `explanation/observability.md` | text 1, ts 1 |
| `identity-access/better-auth-plugins.md` | ts 2, tsx 1 |
| `identity-access/how-to/add-authentication.md` | sh 7 |
| `identity-access/session-lifecycles.md` | ts 3 |
| `observability/how-to/add-opentelemetry.md` | bash 3 |
| `orchestration-runtime/cli-scaffold.md` | bash 1 |
| `orchestration-runtime/how-to/add-a-plugin.md` | bash 5 |
| `orchestration-runtime/how-to/author-a-plugin.md` | plain 2, sh 5 |
| `orchestration-runtime/how-to/deno-lsp-code-intelligence.md` | bash 5, json 2, powershell 1 |
| `orchestration-runtime/how-to/deploy-deno-deploy.md` | ts 1 |
| `orchestration-runtime/how-to/deploy-local-aspire.md` | bash 4 |
| `orchestration-runtime/how-to/deploy.md` | bash 6, ts 1 |
| `orchestration-runtime/how-to/graceful-shutdown.md` | ts 4 |
| `orchestration-runtime/how-to/roll-out-runtime-overrides.md` | bash 3, ts 1 |
| `orchestration-runtime/runtime-config.md` | ts 2 |
| `quickstart.vto` | bash 4, sh 10, text 1, ts 1 |
| `quickstart/aspire.md` | bash 2 |
| `reference/ai/index.md` | ts 12 |
| `reference/ai/skills.md` | md 1, ts 4 |
| `reference/contracts/index.md` | typescript 3 |
| `reference/cron/index.md` | ts 1 |
| `reference/fresh-ui/index.md` | tsx 3 |
| `reference/plugin-ai-core/index.md` | typescript 3 |
| `reference/plugin-ai/index.md` | bash 1, text 1, ts 5 |
| `reference/prisma-adapter-mysql/index.md` | typescript 1 |
| `reference/queue/index.md` | ts 1 |
| `reference/sagas/index.md` | ts 1 |
| `reference/streams/index.md` | ts 1 |
| `reference/telemetry/convention.md` | text 1 |
| `reference/triggers/index.md` | ts 1 |
| `reference/watchers/index.md` | ts 1 |
| `reference/workers/index.md` | ts 1 |
| `services-sdk/how-to/add-a-service.md` | bash 7, text 1, ts 6 |
| `services-sdk/how-to/discover-services.md` | bash 3, jsonc 1, ts 4 |
| `services-sdk/how-to/expose-openapi-scalar.md` | sh 1, ts 1 |
| `services-sdk/sdk.md` | ts 1 |
| `services-sdk/services.md` | ts 2 |
| `tutorials/chat/01-scaffold.md` | plain 1, sh 7 |
| `tutorials/chat/02-durable-chat-route.md` | sh 2, ts 4 |
| `tutorials/chat/03-chat-ui.md` | bash 2, tsx 3 |
| `tutorials/chat/04-tool-call.md` | bash 1, ts 2, tsx 1 |
| `tutorials/chat/05-mcp.md` | bash 1, sh 2, ts 3 |
| `tutorials/chat/06-live-streaming.md` | bash 1, tsx 1 |
| `tutorials/chat/index.md` | sh 2 |
| `tutorials/erp-sync/01-scaffold.md` | plain 1, sh 9 |
| `tutorials/erp-sync/02-import-job.md` | sh 8, ts 2 |
| `tutorials/erp-sync/03-polyglot-transform.md` | plain 2, sh 4, ts 4 |
| `tutorials/erp-sync/04-queue-and-cron.md` | sh 4, ts 2 |
| `tutorials/erp-sync/05-deploy.md` | sh 5 |
| `tutorials/erp-sync/index.md` | plain 1 |
| `tutorials/live-dashboard/01-scaffold.md` | plain 1, sh 6, ts 2 |
| `tutorials/live-dashboard/02-contract-to-service.md` | json 1, sh 4, ts 3 |
| `tutorials/live-dashboard/03-sdk-cache-first-query.md` | sh 2, ts 2 |
| `tutorials/live-dashboard/04-definePage-QueryIsland.md` | sh 2, ts 1, tsx 4 |
| `tutorials/live-dashboard/05-live-stream.md` | sh 4, ts 1, tsx 4 |
| `tutorials/live-dashboard/06-deploy.md` | plain 2, sh 5 |
| `tutorials/live-dashboard/index.md` | sh 2 |
| `tutorials/storefront/01-scaffold.md` | sh 8 |
| `tutorials/storefront/02-catalog-service.md` | sh 7, ts 5 |
| `tutorials/storefront/03-cart-contracts.md` | sh 7, ts 4 |
| `tutorials/storefront/04-checkout-saga.md` | sh 8, ts 3 |
| `tutorials/storefront/05-shipping-webhook.md` | bash 1, sh 9, ts 2 |
| `tutorials/storefront/06-storefront-ui.md` | sh 2, ts 2, tsx 2 |
| `tutorials/storefront/07-deploy.md` | sh 5 |
| `tutorials/workspace/01-scaffold.md` | plain 1, sh 6 |
| `tutorials/workspace/02-auth.md` | sh 8 |
| `tutorials/workspace/03-workspace-data.md` | prisma 1, sh 4, ts 1 |
| `tutorials/workspace/04-provision-job.md` | sh 5, ts 1 |
| `tutorials/workspace/05-route-authz.md` | json 1, sh 1, ts 3 |
| `tutorials/workspace/06-deploy.md` | sh 4 |
| `web-layer/builders.md` | ts 2, tsx 1 |
| `web-layer/defer-streaming-ui.md` | ts 2, tsx 3 |
| `web-layer/error.md` | ts 3, tsx 3 |
| `web-layer/examples.md` | ts 1, tsx 1 |
| `web-layer/form.md` | tsx 6 |
| `web-layer/fresh-ui.md` | ts 1 |
| `web-layer/how-to/build-a-desktop-frontend.md` | bash 1, ts 3, tsx 2 |
| `web-layer/how-to/build-a-server-validated-form.md` | ts 1, tsx 2 |
| `web-layer/how-to/customize-fresh-ui.md` | bash 2 |
| `web-layer/interactive.md` | tsx 2 |
| `web-layer/layers.md` | ts 2, tsx 7 |
| `web-layer/partials.md` | tsx 6 |
| `web-layer/query-bridge.md` | text 1, ts 5, tsx 5 |
| `web-layer/query.md` | ts 3, tsx 4 |
| `web-layer/resources.md` | text 1, ts 1, tsx 4 |
| `web-layer/response.md` | text 1, ts 1, tsx 8 |
| `web-layer/route.md` | text 5, ts 4, tsx 3 |
| `web-layer/server.md` | ts 6 |
| `web-layer/testing.md` | ts 4 |
| `web-layer/vite.md` | ts 6 |

## Tier-1 census and planned day-one disposition

| Page | `ts` | `tsx` | Checked | Exempt | Reason summary |
| --- | ---: | ---: | ---: | ---: | --- |
| `quickstart.vto` | 1 | 0 | 1 | 0 | Typed generated-schema fixture supplies the scaffold alias. |
| `index.vto` | 0 | 0 | 0 | 0 | Coverage-floor page is asserted present even with no TS fence. |
| `services-sdk/sdk.md` | 1 | 0 | 1 | 0 | Typed contract fixture supplies the app contract alias. |
| `services-sdk/how-to/add-a-service.md` | 6 | 0 | 6 | 0 | The broken barrel excerpt is corrected to import and re-export its local binding. |
| `web-layer/query.md` | 3 | 4 | 6 | 1 | Typed support modules cover both primary island examples; one cache fragment remains deliberately partial. |
| `web-layer/examples.md` | 1 | 1 | 1 | 1 | Cache-projection fragment assumes loader values. |
| `web-layer/interactive.md` | 0 | 2 | 2 | 0 | Typed support module supplies the app query fixture. |
| `web-layer/form.md` | 0 | 6 | 3 | 3 | Counter-example and two state-only fragments are intentionally partial. |
| `web-layer/query-bridge.md` | 5 | 5 | 1 | 9 | Counter-examples, pseudocode, and chain fragments are intentionally partial. |
| **Total** | **17** | **18** | **21** | **14** | **35 Tier-1 candidates** |

The gate will also report **260 TS-like blocks outside the Tier-1 floor**. That separates marked
exemptions from not-yet-covered work instead of presenting 21 checked blocks as site-wide coverage.

## Current checker responsibilities

### `check-accuracy-and-discoverability.ts`

- Source/API regexes for `defineSaga` and `spawn`.
- Positive API/text needles for saga payload/return shape, preferred how-to paths,
  `--with-client`, quickstart paths, the query-dialect exception, and 18 CLI mutation families.
- Forbidden stale claims: old saga calls/sends, retired client paths/aliases, and treating
  `apps/<app>/client.ts` as a data client.
- A manual `ALLOWED_FRESH_ROOT_SYMBOLS` set and import regex.
- Mutation-map heading and five required columns.
- A subprocess invocation of `check-exports-drift.ts`.

### `check-exports-drift.ts`

- Eight fixed package/reference mappings: `fresh-ui`, `plugin`, `config`, `contracts`, `queue`,
  `sdk`, `service`, and `telemetry`.
- Exact package entrypoint name/path comparison for all eight.
- `deno doc --json` symbol comparison only for `config`, `contracts`, and `telemetry`; the other
  five explicitly set `checkSymbols: false`.
- This PR leaves its mapping and symbol policy unchanged because #1108 owns expansion.

## Workflow wiring

- `pages.yml`: PR/push paths are only `docs/site/**` and the workflow. The build job runs Lume,
  internal links, and caveat checks. Draft PRs are not excluded.
- `ci.yml`: draft PRs schedule no jobs. Non-draft `quality` runs for `needs_deno || needs_docs` and
  includes `docs:accuracy`; package/plugin source sets `needs_deno`. It does not compile site code
  fences.

## jsr-audit surface scan

N/A. This is an internal docs tooling and workflow slice; it changes no package/plugin export or
publish surface. The snippet resolver consumes declared export maps but does not publish a new
package.

## Open questions

None that would force implementation rework. All design decisions are locked in `plan.md`.
