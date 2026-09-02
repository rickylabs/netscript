# Worklog: #1452 Slice 3 plugin service host context

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-plugin-service-context-s3--1452` |
| Branch | `feat/plugin-service-context-s3` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | none |

## Design

### Public Surface

- `PluginServiceContext.appsettings?: unknown` — generic host-provided configuration value.
- `createPluginServiceContext(pluginName, resolvers)` — adds optional `getAppsettings` and
  `getEnvironment` resolver inputs without changing the required DB/KV seam.

### Domain Vocabulary

- Appsettings — opaque caller-resolved configuration; plugin-specific services own narrowing.
- Environment — immutable string record captured or supplied by the host.
- Ready — the real plugin service factory has returned its running handle/listener, not merely a
  context object.

### Ports

- `getAppsettings` — async caller IO seam for file/config/Aspire-independent settings resolution.
- `getEnvironment` — async caller seam for process, test, or alternative runtime environment.
- Existing `getDatabaseClient` / `getKv` — unchanged lazy adapter seams.

### Constants

- No new finite domain-value constants are required; plugin names in the acceptance test are the
  explicit issue subjects, not a new host dispatch registry.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Complete host-context resolvers and prove all three generated consumers reach ready | scoped plugin wrappers/tests, doc/publish/docs/quality/arch gates | `packages/plugin/src/sdk/runtime/plugin-service-context*.ts`, package-local tests, run artifacts |

### Deferred Scope

- Appsettings schema, validation, merging, and source discovery — plugin/host responsibility.
- CLI template changes — row 4 is already shipped and explicitly out of scope.
- Hosted runtime/Aspire/Docker/browser/E2E — owner-prohibited for this construct-and-ready proof.

### Contributor Path

Add future host-owned synchronous context values as optional resolver fields in
`plugin-service-context-factory.ts`, expose only the least-specific shared type in
`plugin-service-context.ts`, and extend the factory observation test plus a real consumer test.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-02 | 1 | audit/design | Four-row audit locked; PLAN-EVAL N/A; implementation not started |
| 2026-09-02 | 1 | public seam | Added opaque optional appsettings and one-shot async appsettings/environment assembly; DB/KV remain lazy and memoized |
| 2026-09-02 | 1 | focused factory proof | Added injected one-shot resolver assertions plus a separate `Deno.env.toObject()` compatibility-default test |
| 2026-09-02 | 1 | generated consumer proof | Materialized the unchanged CLI template at its generated `services/_shared` path; real workers/auth/sagas factories each bound TCP, returned healthy, and stopped |
| 2026-09-02 | 1 | downstream narrowing | Generic `appsettings: unknown` exposed auth's prior assumption that base context was already plugin-specific; auth now validates/narrows structurally without a cast |
| 2026-09-02 | 1 | supervisor review | Accepted the public seam, auth narrowing, and genuine generated-consumer lifecycle proof; no scope expansion required |
| 2026-09-02 | 1 | full gates | Structured package/auth gates, full plugin tests, doc/publish/docs, quality/architecture, and baseline-sensitive fitness gates completed |
| 2026-09-02 | 1 | carrier generation | Ran assets barrel, publish assets, then MCP export corpus; only the corpus changed, exactly for the two `@netscript/plugin/sdk` entries whose public documentation/signatures moved |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Structural appsettings resolver | Keeps shared convention in `@netscript/plugin` without a concrete config/Aspire edge | doctrine 07/11; owner ruling |
| Optional env resolver with compatibility default | Satisfies override acceptance without editing shipped template | issue row 2; row 4 audit |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| RTK executable unavailable | minor | yes |
| Final PR is owner-required non-draft rather than bootstrap draft | minor | yes |
| Auth consumer narrowing required one plugin-local source edit beyond the planned package-local file ceiling | minor | yes |

## Gate Results

Focused exploratory failures are retained below for traceability. The final supervisor gates follow
them and are the sign-off verdicts.

| Command | Exit | Exact result |
| --- | --- | --- |
| `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/plugin/src/sdk/runtime/plugin-service-context-factory_test.ts packages/plugin/src/sdk/runtime/plugin-service-context-generated-consumer_test.ts` (attempt 1) | 1 | 0 passed, 0 failed, 0 ignored, 0 results; type-check found fixture URL typing and auth opaque-appsettings narrowing |
| Same focused wrapper command (attempt 2) | 1 | 2 passed, 1 failed, 0 ignored, 3 total; fixture path was not a file URL, so no readiness probe ran |
| Same focused wrapper command (attempt 3) | 1 | 2 passed, 1 failed, 0 ignored, 3 total; workers/auth reached healthy and stopped, sagas failed closed before binding because its required store backend was unset |
| Same focused wrapper command (attempt 4) | 0 | 3 passed, 0 failed, 0 ignored, 3 total; workers/auth/sagas all bound TCP, returned `/health` 200 `healthy`, and stopped |
| `deno fmt --check` over the five edited TypeScript files | 0 | checked 5 files |
| `git diff --check` | 0 | no whitespace errors |
| `run-deno-check.ts --root packages/plugin --ext ts,tsx` | 0 | 158 files, 2 batches, 0 diagnostics |
| `run-deno-check.ts --root plugins/auth --ext ts,tsx` | 0 | 39 files, 1 batch, 0 diagnostics |
| `run-deno-lint.ts --root packages/plugin --ext ts,tsx` | 0 | 158 selected/processed, 0 findings |
| `run-deno-lint.ts --root plugins/auth --ext ts,tsx` | 0 | 39 selected/processed, 0 findings |
| `run-deno-fmt.ts --root packages/plugin --ext ts,tsx` | 0 | 158 selected/processed, 0 findings |
| `run-deno-fmt.ts --root plugins/auth --ext ts,tsx` | 0 | 39 selected/processed, 0 findings |
| `run-deno-test.ts -- --allow-all packages/plugin` | 0 | 97 passed, 0 failed, 0 ignored, 97 total |
| `run-deno-doc-lint.ts --root packages/plugin --pretty` on `origin/main` | 1 | 15 total: 15 private-type, 0 missing-JSDoc, 0 other |
| Same doc-lint command on slice head | 1 | 15 total: 15 private-type, 0 missing-JSDoc, 0 other; delta 0 |
| `deno publish --dry-run --allow-dirty` from `packages/plugin` | 0 | dry run complete; stderr listing emitted; 2 inherited dynamic-import warnings |
| `deno task docs:readme-fences` | 0 | 36 READMEs, 168 fences, 73 checked; baseline `type_errors=7` |
| `deno task docs:jsdoc-examples` | 0 | 359 checked, 0 enforced failures; deferred `unboundName=116`, `typeError=14` |
| `audit-jsr-package.ts --root packages/plugin --text` on `origin/main` | 1 | 7 inherited findings: 4 module-tag failures, 2 cardinality warnings, 1 sanctioned slow-types info |
| Same JSR audit on slice head | 1 | same 7 findings; only census changed from 157/8888/30 to 158/9035/31 files/LOC/tests |
| `deno task quality:gate` | 0 | quality scan and nested architecture gate passed |
| `deno task arch:check` | 0 | explicitly repeated as requested; dependency and doctrine checks passed |
| `deno task gen:assets-barrel` | 0 | generated; no carrier delta |
| `deno task gen:publish-assets` | 0 | generated; no carrier delta |
| `deno task gen:mcp-export-corpus` | 0 | 35 packages, 273 subpaths, 7816 symbols; corpus SHA `628133…5d7c` |

MCP corpus provenance changed by +143 uncompressed bytes (2,192,016 → 2,192,159) and +67
compressed bytes (317,993 → 318,060), with symbol count unchanged at 7,816. Decoded A/B evidence
attributes the delta only to `PluginServiceContext` gaining `appsettings?: unknown` and
`createPluginServiceContext` becoming an async assembly function with updated resolver/timing docs.

Protected-file SHA-256 remains unchanged: `packages/plugin/deno.json`
`defff7d107edef01fff3b54ed84f46822c3aff6686e8f5ecec5c65821452549c`; `deno.lock`
`e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`.

## Handoff Notes

- Inspect the generated-consumer test first: it must start/ready/stop each real service.
- Verify `packages/plugin/deno.json` and `deno.lock` remain byte-identical.
- Post-commit carrier checks and the separate IMPL-EVAL remain before PR handoff.
