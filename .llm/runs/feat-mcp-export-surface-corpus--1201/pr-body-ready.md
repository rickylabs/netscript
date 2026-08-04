## Summary

Add a distinct, version-pinned MCP corpus for generated NetScript export surfaces so agents can discover symbols, package subpaths, signatures, and related helpers without a local documentation mirror.

The five locally provable acceptance boxes are complete. The canary.3 adoption measurement remains orchestrator-owned, so this PR references the issue and does not auto-close it.

## Scope

- Archetype / area: `packages/mcp` · Archetype 2 integration
- Refs #1201
- Run dir: `.llm/runs/feat-mcp-export-surface-corpus--1201/`

## Slices

- [x] S0 Re-baseline, mirror-free RED, locked plan, and composed PLAN-EVAL waiver — `674f228fb`
- [x] S1 Contract-first export corpus, four bounded flows, generator, and real deno-doc fixtures — `36cdc3411`
- [x] S2 Pinned embedded corpus, registry/receipt wiring, mirror-free GREEN, docs, and full gates — `36cdc3411`, evidence `332ea2392`

## Validation

- Focused check/lint/format wrappers — PASS, 101 files and zero findings
- MCP package tests — PASS, 105 passed and 0 failed
- Generator tests and freshness — PASS, 35 packages / 268 subpaths / 7,278 symbols
- `quality:gate` and scoped doctrine check — PASS; existing repository cardinality warnings only
- Full export-map doc lint — PASS, 3 entrypoints and zero diagnostics
- Package and root publish dry-runs — PASS; no slow types
- Publish asset freshness — PASS
- Mirror-free MCP JSON-RPC acceptance — PASS
- Full CLI E2E — 51/52 gates passed; the unrelated generated users-service Prisma database health probe returned 503 after scaffold, DB init/generate/seed, generated checks, and Aspire startup passed. Cleanup passed and the leak reporter found no run-owned survivors.
- Lock hygiene — PASS for slice-owned changes; the pre-existing one-line `deno.lock` change remains unstaged and outside this PR.

## Harness

- Phase: implementation evaluation
- PLAN-EVAL: composed per milestone-run.md (orchestrator waiver)
- Evaluation composition: draft→ready augment + OpenHands + orchestrator pre-merge gate

## Drift / Debt

- Current main has 35 publishable first-party packages / 268 subpaths; the issue's 36-file count remains historical control-run evidence.
- Query policy stays in application flows behind a narrow corpus-loading port.
- Existing `MCP-A6-V2-SHAPE` debt is neither closed nor deepened.
- The canary.3 adoption measurement remains orchestrator-owned and is not a local completion claim.

## Definition of Done

- [x] A distinct export-surface corpus answers all four priority-ordered question forms through bounded MCP tools.
- [x] Exact symbol detail returns one signature and JSDoc with honest truncation metadata, never a whole package file.
- [x] The generated corpus is pinned by schema/framework version, hash, byte sizes, and exact package/subpath/symbol counts.
- [x] An end-to-end workspace with no `docs/` directory resolves `definePage` to `@netscript/fresh` `./builders` through MCP and records a post-validation receipt.
- [x] Archetype-2 scoped wrappers, `quality:gate`, full export-map doc lint, JSR audit, publish dry-run, package tests, generator freshness, and lock-hygiene checks pass.

```acceptance-evidence
issue: 1201
entries:
  - box-index: 1
    evidence: "Four priority-ordered bounded MCP flows and fixtures: packages/mcp/src/application/export-surfaces/export-surface-flows.ts and packages/mcp/tests/export-surface-flows_test.ts at 36cdc3411."
  - box-index: 2
    evidence: "The distinct generated ExportSurfaceCorpusPort, real deno-doc fixture, deterministic generator, and embedded adapter landed at 36cdc3411."
  - box-index: 3
    evidence: "get_export returns only bounded signature/JSDoc fields with explicit truncation metadata; boundary fixtures pass in the 105-test MCP suite at 36cdc3411."
  - box-index: 4
    evidence: "Generator freshness pins schema 1, framework 0.0.4, SHA-256 fa0a56beaa7e83ba59d9f553e71ca4ab4d5dec118926fa8475b6796a24cdcdd1, exact byte sizes, and cardinalities at 36cdc3411."
  - box-index: 5
    evidence: "packages/mcp/tests/export-surface-mirror-free_test.ts proves an empty workspace with no docs directory resolves definePage to @netscript/fresh ./builders through the real MCP server and receipt wrapper at 36cdc3411."
```
