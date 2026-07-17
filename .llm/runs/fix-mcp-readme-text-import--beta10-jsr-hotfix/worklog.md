# Worklog: registry-safe MCP README embedding

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-mcp-readme-text-import--beta10-jsr-hotfix` |
| Branch | `fix/mcp-readme-text-import` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Design

### Public Surface

- `@netscript/mcp/cli` behavior is unchanged; the default embedded docs corpus still exposes the package README.
- No new package export or CLI command is introduced.

### Domain Vocabulary

- `ImportAttributeFinding` — a publishable source location containing registry-unsafe `with { type: ... }` syntax.
- generated publish asset — checked-in TypeScript constant derived from README, schema, or package metadata.

### Ports

- None. The generator is maintainer tooling and the runtime consumes plain constants.

### Constants

- `MCP_PACKAGE_README` — exact `packages/mcp/README.md` content.
- package release versions — exact owning `deno.json` version values.
- CLI schema constant — exact config schema data needed by scaffold output.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Harness bootstrap and design | separate PLAN-EVAL | run artifacts |
| 2 | Generated publish assets and surface sweep | freshness green/red; focused package tests/checks | generator, tasks, generated files, consumers |
| 3 | Registry-failing preflight and corrected guidance | scanner tests; preflight green/red; skill sync | release scanner/tests, release + JSR skills |
| 4 | Final evidence and evaluator handoff | required gates; separate IMPL-EVAL | run artifacts and PR comments |

### Deferred Scope

- Release retry and production JSR E2E — post-merge release-owner operation.

### Contributor Path

Update the source README/schema/package metadata, run the publish-assets generation task, and commit the resulting `*.generated.ts`; the freshness and release-preflight tasks reject drift or import attributes.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-17 | 1 | research/design | Re-baselined at `a5adb706`; implementation remains blocked on PLAN-EVAL. |
| 2026-07-17 | 1 | PLAN-EVAL | Separate local Qwen session `f03ae1dd-da69-406a-b725-f3bf391255a8` returned `PASS`. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Generated constants only | Registry rejects import attributes that local dry-run accepts. | user evidence + publish-workspace comment |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| none | minor | n/a |

## Gate Results

No implementation gates run before PLAN-EVAL.

## Handoff Notes

- PLAN-EVAL should spot-check `packages/mcp/cli.ts:18`, the existing generator pattern, and publish-rule filtering in `scanPublishSurface`.
