# Context Pack: #1452 Slice 2 — structural injected plugin service context factory

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-plugin-service-context-host-factory--1452` (shipped Slice 1 directory reused as directed) |
| Branch | `feat/plugin-service-context-factory` |
| Baseline | `7ae7fe2dad941ed70e5806965fd964b9746d8fe1` (`origin/main`) |
| Current phase | gated; ready for the single commit, explicit-refspec push, and draft PR |
| Archetype | `4 — Public DSL / Builder` (`packages/plugin` SDK composition factory); `6 — CLI/Tooling` carrier |
| Scope overlays | none |

## Outcome

Slice 2 publishes `createPluginServiceContext` from `@netscript/plugin/sdk`. The factory owns lazy
memoization plus contracts/logger/env assembly over two caller-supplied async resolvers. The CLI
host retains the project-relative database import and imports `getKv` itself, then injects both.

The coordinator's dependency ruling is preserved: `packages/plugin/deno.json` is byte-identical to
baseline and `@netscript/plugin` has no dependency or import edge to `@netscript/kv`.

## Behavior Proven

- DB and KV resolver counts are zero immediately after factory construction.
- Both remain zero after awaiting the returned context.
- Concurrent repeated DB access resolves the database adapter exactly once.
- Concurrent repeated KV operations resolve the KV adapter exactly once.
- The existing `PluginServiceContext` shape is unchanged.
- The generated template imports and calls the SDK factory and supplies both resolvers; the old
  inline context assembly is absent.

## Product Files

| Path | Status | Purpose |
| --- | --- | --- |
| `packages/plugin/src/sdk/runtime/plugin-service-context-factory.ts` | new | structural injected factory and private lazy KV façade |
| `packages/plugin/src/sdk/runtime/plugin-service-context-factory_test.ts` | new | observable laziness/memoization proof |
| `packages/plugin/src/sdk/mod.ts` | changed | one new public SDK export |
| `packages/cli/src/kernel/assets/plugins/service-context.ts.template` | changed | host adapter injection |
| `packages/cli/src/kernel/templates/plugins/generate-plugin-service_test.ts` | changed | semantic delegating-template assertions |
| `packages/cli/src/kernel/assets/embedded.generated.ts` | regenerated | CLI asset carrier |
| `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` | regenerated | MCP export carrier |

Run-artifact updates are limited to `worklog.md`, `context-pack.md`, and append-only `drift.md`.

## Gate Summary

| Gate | Result |
| --- | --- |
| structured check / lint / fmt | **PASS**; all accepted receipts have non-empty stdout (307; plugin 358/307; CLI 352/301 bytes) |
| focused tests | **PASS**; 5/5, 418 stdout bytes |
| `check:assets-barrel` | **PASS**; exit 0, legitimate zero stdout, no additional generated delta |
| `docs:exports-drift` | **PASS** |
| `check:mcp-export-corpus` | **PASS**; 7,751 vs isolated baseline 7,750 = exactly +1 factory export |
| `quality:scan` | **PASS** |
| `arch:check` | **PASS** |
| `publish:dry-run` | **PASS**; 0 stdout bytes, 343,265 stderr bytes |
| `deno.lock` | byte-identical `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` |

## JSR / Debt

Pre-existing package audit debt remains outside this slice: four missing entrypoint module tags,
two folder-cardinality warnings, the sanctioned oRPC slow-type notice, and 15 package-level private
type diagnostics. The `./sdk` entrypoint has zero doc-lint diagnostics, so the new export contributes
none.

The checked-in baseline MCP carrier lagged its own generator (7,680 checked in vs 7,750 regenerated);
`drift.md` records that the Slice 2 attributable delta is only the final +1.

## Deferred

Generic `appsettings` assembly remains unimplemented. Contrary to the stale original brief, an
auth-specific optional seam exists at `plugins/auth/services/src/init.ts:15`, and CLI/Aspire already
support `appsettings.json`; the generic `PluginServiceContext` contract has no such member. The
coordinator directed this slice not to invent one.

Issue #1452 therefore remains partial. The PR must use `Refs #1452` with no closing keyword.

## Handoff Boundary

- One commit only.
- Push with an explicit refspec.
- Open a draft PR with no labels and no acceptance boxes.
- Do not dispatch an evaluator and do not merge. This is the owner's explicit IMPL-EVAL waiver for
  this session; no evaluator verdict is claimed.
