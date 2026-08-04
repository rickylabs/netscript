# Worklog: MCP generated export-surface corpus

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-mcp-export-surface-corpus--1201` |
| Branch | `feat/mcp-export-surface-corpus` |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Design

### Public Surface

- `ExportSurfaceCorpusPort` — injected query boundary for exact location, grouped listing, exact
  detail, and partial name/shape search.
- Export record/result/provenance types — immutable package/subpath/symbol/signature/JSDoc data and
  bounded result metadata.
- `EmbeddedExportSurfaceCorpus` — package-shipped, version/hash-verified adapter.
- `McpCliOptions.exportSurfaceCorpus` — optional embedder/test override; default uses pinned corpus.
- MCP tools: `find_export`, `list_package_exports`, `get_export`, `search_exports`.

### Domain Vocabulary

- `ExportSurfaceEntry` — one symbol at one package subpath, with kind, signature, and JSDoc.
- `ExportSurfaceLocation` — compact package/subpath/symbol/kind identity.
- `ExportSurfacePage` — stable page metadata (`total`, `returned`, `nextOffset`, `truncated`).
- `ExportSurfaceSearchMatch` — ranked compact match with deterministic numeric score.
- `ExportSurfaceCorpusProvenance` — schema/framework/hash/size/count identity of one generated corpus.

### Ports

- `ExportSurfaceCorpusPort` — real generation/runtime seam: tests inject fixture entries; production
  injects the checked-in embedded corpus. It does not expose generator/process methods.

### Constants

- `EXPORT_SURFACE_CORPUS_SCHEMA_VERSION = 1` — normalized payload schema.
- Per-flow list/search maxima below the runner's 50-item cap.
- `EXPORT_SURFACE_TOOL_NAMES` — the four priority-ordered stable tool names folded into
  `TOOL_NAMES`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0 | Harness bootstrap, live issue truth, RED, locked plan, composed PLAN-EVAL waiver | artifact review + raw diff | run-dir artifacts only |
| 1 | Contract-first corpus port, deterministic query/index behavior, four tool contracts/flows, generator/parser, real deno-doc fixtures | targeted export-surface + generator tests; scoped wrappers | `src/ports/export-surface-corpus-port.ts`, `src/application/export-surfaces/export-surface-flows.ts`, tool types/contracts/registry, `mod.ts`, generator + tests/fixtures, run artifacts |
| 2 | Version-pinned generated corpus, embedded adapter, CLI receipt wiring, mirror-free GREEN, public catalogs/publish asset | generator `--check`; mirror-free JSON-RPC; package/full Archetype-2 gates | `src/infrastructure/export-surfaces/*`, `cli.ts`, end-to-end tests, README/reference docs, generated publish asset, run artifacts |

### Deferred Scope

- Canary adoption measurement — orchestrator-owned sixth box after canary.3 publication.
- Semantic/vector ranking — lexical name/shape search is the bounded first capability.
- #1135 instruction/template changes and #1197/#1102 scopes — explicitly coordinated elsewhere.

### Contributor Path

Add a new question form by extending the package-owned port contract, implementing the bounded flow
under `src/application/export-surfaces/`, adding its stable tool schema/registry row, and wiring the
flow once in `createMcpCliServer`. Change corpus fields only by updating the generator schema,
adapter validator, real deno-doc fixtures, and schema version together.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-04 | bootstrap | issue/repo baseline | Read live #1201 + owner comment; confirmed five local boxes and one orchestrator measurement box. |
| 2026-08-04 | bootstrap | RED | Empty workspace, no `docs/`: 17 tools, zero export tools, `find_export` returns `tool_not_found`. |
| 2026-08-04 | bootstrap | deno-doc research | Confirmed JSON v2 nodes/symbol/declaration shape and `definePage` at `@netscript/fresh` `./builders`. |
| 2026-08-04 | bootstrap | JSR baseline | Doc lint PASS (3 entrypoints, 0 combined diagnostics); package dry-run PASS; audit exit 0 with pre-existing cardinality warnings. |
| 2026-08-04 | plan-gate | waiver | Plan locked; PLAN-EVAL row recorded as composed per milestone-run.md (orchestrator waiver). |

## RED Evidence

Command: real `createMcpCliServer` in a fresh temp directory, then JSON-RPC `tools/call` for
`find_export { symbol: "definePage" }`.

```json
{
  "rootEntries": [],
  "docsDirectoryPresent": false,
  "toolCount": 17,
  "exportSurfaceTools": [],
  "response": {
    "error": {
      "code": -32602,
      "message": "Unregistered tool",
      "data": { "code": "tool_not_found", "name": "find_export" }
    }
  }
}
```

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Separate export corpus | Package/subpath/symbol structure is not Markdown prose. | owner frame; research R3 |
| Four question-shaped tools | Predictable bounded contracts in priority order. | issue acceptance; plan D1 |
| Generated gzip TypeScript | JSR-safe, version-pinned, no runtime mirror/file reads. | JSR skill; plan D3/D4 |
| Feature subfolders | Do not deepen current `domain`/`application/flows` cardinality warnings. | JSR audit; doctrine F-16 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Issue says 36 flat files; current publishable package set is 35 with 268 subpaths. | minor | yes |
| Worktree arrived with unrelated one-line `deno.lock` queue addition. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline RED | empty-workspace MCP call | PASS (negative demonstrated) | No export tool path exists today |
| Baseline doc lint | `deno task doc:lint --root packages/mcp --pretty` | PASS | 3 entrypoints, 0 combined diagnostics |
| Baseline package dry-run | package `deno task publish:dry-run` | PASS | publish surface clean before changes |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Plan-Gate | composed waiver | `plan-eval.md` | Milestone-run owner ruling; plan locked before implementation |
| Archetype-2 full column | NOT_RUN | plan gate table | Run after implementation |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Mirror-free RED | PASS (negative demonstrated) | RED JSON above | GREEN pending slice 2 |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| MCP host / public exports | NOT_RUN | planned slice 2 | Requires implemented tool contracts |

## Handoff Notes

- Evaluate the corpus as a distinct structured capability, not a prose search extension.
- Compare RED and GREEN mirror-free JSON-RPC evidence.
- Verify generated provenance version/hash/counts and that no runtime source reads the repository.
- Verify #1201 remains referenced, not auto-closed; the canary measurement is still orchestrator-owned.
