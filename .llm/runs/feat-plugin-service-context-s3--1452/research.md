# Research — feat-plugin-service-context-s3--1452

## Re-baseline

- Carried-in source: issue #1452; merged PRs #1820 and #1842; owner-provided Slice 3 brief.
- Re-derived against `origin/main` @ `850cc7757d11d420b9061dbe6a61536357ab77fe` on 2026-09-02.
- What changed vs the carried-in version:
  - The owner's likely-state table is correct for rows 1, 3, and 4.
  - Row 2 is **PARTIAL**: DB injection exists; environment capture is hard-coded to
    `Deno.env.toObject()` and has no caller override.
  - Auth and sagas already contain plugin-specific appsettings reads, but the shared context and
    public host factory do not assemble appsettings.

## Four-row acceptance audit

| Row | State | File / symbol | Existing test evidence | Outstanding proof |
| --- | --- | --- | --- | --- |
| Generic factory covering lazy DB/KV, contracts, logger, env, appsettings | **PARTIAL** | `packages/plugin/src/sdk/runtime/plugin-service-context-factory.ts` · `createPluginServiceContext`; `plugin-service-context.ts` · `PluginServiceContext` | `plugin-service-context-factory_test.ts` proves DB/KV first-use memoisation plus contracts/logger/env assembly | No generic `appsettings` member or resolver |
| Consumer override points for DB adapters and environment resolution | **PARTIAL** | `createPluginServiceContext` requires `getDatabaseClient`; env is directly read with `Deno.env.toObject()` | Factory test proves injected DB resolver | No environment resolver option or override test |
| Generated-consumer test proving workers/auth/sagas services boot with public factory | **NOT SHIPPED** | No matching test found under `packages/plugin`, `packages/cli`, or the three plugin service test trees | Existing auth import-surface test asserts only function import; CLI generator test asserts emitted strings | Add one generated-template consumer boot test that constructs each service and reaches ready, then stops it |
| CLI scaffold delegates to public seam instead of emitting full `LazyPluginKv` | **SHIPPED** | `packages/cli/src/kernel/assets/plugins/service-context.ts.template` delegates to aliased public `createPluginServiceContext` | `packages/cli/src/kernel/templates/plugins/generate-plugin-service_test.ts` · `generatePluginServiceContext emits package-resident safe imports` asserts delegation and rejects inline object assembly | None; do not touch CLI |

## Doctrine and dependency findings

- Doctrine file 11, R-PLUGIN-THIN / R-PLUGIN-SEAM: a shared host convention belongs in the core
  `@netscript/plugin` base seam; plugins stay consumers.
- Doctrine file 07: configuration is a caller-owned typed boundary and the composition root accepts
  injected collaborators. Therefore appsettings is resolved by the caller and supplied
  structurally; `@netscript/plugin` must not import config/Aspire/KV implementations.
- `packages/plugin/deno.json` SHA-256 before work:
  `defff7d107edef01fff3b54ed84f46822c3aff6686e8f5ecec5c65821452549c`.
- `deno.lock` SHA-256 before work:
  `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`.
- Live issue #1452's acceptance rows are plain bullets, not Markdown checkboxes. Per
  `netscript-pr`, the mirror has no recognized `box-index` targets and no `acceptance-evidence`
  block may be invented.

## jsr-audit surface scan

- Surface scanned: `packages/plugin/deno.json` export map and
  `deno doc --filter createPluginServiceContext packages/plugin/src/sdk/mod.ts`.
- Planned surface risk: the inline resolver options and `PluginServiceContext` extension must stay
  explicitly typed and documented so no new `deno doc --lint` diagnostic or slow type appears.
- Dependency risk: zero package-manifest and lock movement; no new concrete dependency.
- Publish risk: package has 15 known baseline private-type diagnostics; verdict is an A/B delta
  against `origin/main`, never the absolute count.

## Open questions

- None that forces rework. The owner and doctrine already lock structural caller injection; the
  test will prove whether the unchanged generated template is sufficient to boot all three service
  consumers without a scaffolded project. If it is not, implementation stops rather than replacing
  the requested generated-consumer proof with an object-shape unit test.
