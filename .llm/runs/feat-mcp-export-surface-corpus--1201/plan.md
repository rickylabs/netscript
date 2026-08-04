# Plan: MCP generated export-surface corpus (#1201)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-mcp-export-surface-corpus--1201` |
| Branch | `feat/mcp-export-surface-corpus` |
| Phase | `plan` (locked; implementation follows under milestone waiver) |
| Target | `packages/mcp` + deterministic corpus generator + required public docs |
| Archetype | `2 - Integration` (owner binding for `packages/mcp`) |
| Scope overlays | `none` (supporting API reference prose is not a docs-only changeset) |

## Archetype

Archetype 2 applies because the MCP package consumes a generated external representation
(`deno doc --json`) through a package-owned corpus port, ships a generated embedded adapter, and
composes bounded protocol flows at the CLI edge. The corpus generator is build-time infrastructure;
the published runtime performs no filesystem/process/network work for export lookup.

## Current Doctrine Verdict

The historical census predates `@netscript/mcp`. Open debt `MCP-A6-V2-SHAPE` records the broader
package's old horizontal/Archetype-6 shape. The owner explicitly binds this slice to Archetype 2.
This PR neither closes nor deepens that debt and avoids the currently over-cardinality folders.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1/A2 | Define the four MCP contracts and public corpus port before implementation. |
| A6/A7 | Use Deno's native doc JSON, compression, hashing, and base64 primitives; no registry SDK or helper reinvention. |
| A8/A9 | One feature-named application/infrastructure folder; Archetype-2 port/adapter separation. |
| A10/A11 | CLI is the composition root; the named variability is export-corpus source, injected through one port. |
| A14 | Real doc fixtures, mirror-free MCP acceptance, public doc lint, publish dry-run, and full fitness evidence protect the capability. |

## Goal

Ship four bounded MCP read paths over a version-pinned generated export corpus so an agent can
discover package/subpath/symbol/signature facts with no `docs/` directory or deno-doc mirror.

## Scope

- Add `ExportSurfaceCorpusPort` and immutable export record/result contracts.
- Add exact symbol location, grouped package listing, exact symbol detail, and partial name/shape
  search flows in the issue's priority order.
- Add four registered read tools with Standard Schema input/output contracts.
- Add a deterministic `deno doc --json` generator and checked-in gzip TypeScript asset with
  schema/framework/hash/count provenance.
- Add embedded adapter, CLI composition, post-validation receipts, truncation metadata, public
  exports, real doc fixtures, and mirror-free end-to-end acceptance.
- Update the MCP README/reference/tool catalog and regenerated publish asset for the 21-tool surface.

## Non-Scope

- Canary.3 adoption measurement; the orchestrator owns the sixth issue box and hand-close.
- #1197 discoverability re-measurement, #1102 shared docs-MCP surface, or #1135
  instructions/templates/activation files.
- A prose-ranking extension, semantic/vector search, remote registry queries, or project-local
  package version discovery.
- Package restructuring or closure of `MCP-A6-V2-SHAPE`.
- Any `deno.lock` change.

## Hidden Scope

- Generated data must be importable from JSR: checked-in TypeScript only, no runtime asset reads,
  import attributes, or top-level `import.meta` path conversion.
- The generated corpus must include all 35 current publishable first-party packages and all 268
  current subpaths, not only packages installed in the querying workspace.
- Central truncation is a safety net, not pagination. List/search flows self-cap below 50 rows and
  truthfully expose dropped-row metadata.
- Receipt success must remain after output validation/bounding; all four flows use the existing
  wrapper rather than writing evidence directly.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Use four tools: `find_export`, `list_package_exports`, `get_export`, `search_exports`. | Each maps one acceptance question to a stable bounded contract. |
| D2 | Model exports with a new `ExportSurfaceCorpusPort`, not `DocsCorpusPort`. | Package/subpath/symbol/signature data is not Markdown prose. |
| D3 | Generate one deterministic gzip/base64 TypeScript payload from `deno doc --json` v2 and manifest export maps. | Publish-safe, mirror-free, version-comparable, and cheap to load lazily. |
| D4 | Provenance includes schema version, framework version, SHA-256, byte sizes, and exact counts; adapter verifies them before serving. | A stale/mismatched corpus fails explicitly rather than silently changing run conditions. |
| D5 | `list_package_exports` paginates a stable flattened symbol order and regroups the returned page by subpath. | Preserves grouped discovery while keeping a hard response bound. |
| D6 | `get_export` exact-matches and refuses ambiguity with bounded candidates. | Never guesses which duplicate symbol the agent meant. |
| D7 | Search is deterministic lexical/camel-case scoring over name, kind, signature, JSDoc, package, and subpath. | Answers partial-name/shape discovery without collapsing into prose ranking or adding a dependency. |
| D8 | Put new files in feature subfolders outside the already over-cardinality `domain` and `application/flows` directories. | Avoids deepening existing doctrine debt. |
| D9 | Wrap all four CLI flows with the shipped receipt lifecycle and expose explicit `truncated` metadata. | Preserves S8/#1134 conventions. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Semantic/vector ranking | safe to defer | Lexical name/shape matching is the owner-requested bounded first capability. |
| Consumer-supplied custom corpus | resolved now | Expose optional `exportSurfaceCorpus` injection on `McpCliOptions`; default remains embedded/pinned. |
| Corpus refresh cadence | resolved now | Explicit generator plus `--check`; release/source changes must regenerate and diff the asset. |
| Adoption wording/instructions | safe to defer | Owned by #1135/canary orchestrator; do not touch templates. |
| Closing keyword | resolved now | `Refs #1201`; no keyword because measurement remains open. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| JSON renderer loses signature meaning | Fixture functions, interfaces, aliases, variables, and classes from real v2 output; compare representative output to `deno doc --filter`. |
| Corpus becomes too large for JSR | Deterministic gzip, publish dry-run file-list/size review, lazy decompression. |
| Duplicate re-exports confuse detail lookup | Exact identity includes package + subpath + symbol; ambiguity is a structured error. |
| Central 50-item truncation hides dropped rows | Flow caps to at most 49 rows and owns `total/returned/nextOffset/truncated`. |
| Version bump leaves stale corpus | Runtime framework-version check plus generator `--check` and provenance fixture. |
| New files deepen folder debt | Feature folders under application/infrastructure; port under currently small `src/ports`. |
| Docs/tool-count drift | Registry fixture asserts 21 tools and all three public tool catalogs enumerate every tool. |
| Lock churn | No dependency added; compare `deno.lock` to its pre-existing one-line user diff before each commit. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 | risk | Keep port, flow, adapter, and generator focused; size-check all new files. |
| AP-2/AP-9 | risk | Use native Deno primitives and one corpus model; no generic search abstraction. |
| AP-3 | risk | Four behavior-specific port methods only; types remain result data, not backend capability sprawl. |
| AP-8 | risk | Plain CLI composition; no container. |
| AP-11/AP-25 | risk | Build-time generator owns process/filesystem; published adapter is immutable and in-memory. |
| AP-14 | risk | No upstream re-exports. |
| AP-16/AP-17/AP-22 | risk | Named `ports` and `export-surfaces` folders; no sub-barrel. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1 | yes | `quality:gate` + file-size review |
| F-2 | yes | `quality:gate` + native-primitive review |
| F-3 | yes | `arch:check` + import-direction review |
| F-4 | yes | `arch:check`; no inheritance added |
| F-5 | yes | full export-map `doc:lint`, `deno doc`, consumer import fixture |
| F-6 | yes | package publish dry-run + JSR audit |
| F-7 | yes | full export-map doc lint, public docs/catalog review |
| F-8/F-9 | yes | `arch:check`; compiler libs unchanged; README permissions remain accurate |
| F-10 | yes | focused fixture sizes + package tests |
| F-11/F-12 | yes | `arch:check` + scoped lint |
| F-14/F-15 | yes | `quality:gate` + diff review |
| F-16/F-17/F-18 | yes | `arch:check`; feature folders avoid cardinality debt; no inheritance/barrels |
| F-19 | yes | scoped check/lint/fmt wrappers over `packages/mcp` and generator-owned TS |
| Static | yes | targeted tests, package tests, scoped wrappers |
| Runtime | yes | mirror-free MCP JSON-RPC call through real CLI composition |
| Consumer | yes | public import/check fixture and live `tools/list` contracts |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `MCP-A6-V2-SHAPE` | none | Adjacent package-shape debt remains open and is not deepened. |
| New debt | none expected | Any new gate failure triggers fix or rescope, not an allowance. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED | baseline empty-workspace `find_export definePage` JSON-RPC call | 17 tools, zero export tools, `tool_not_found` |
| 2 | corpus/flow fixtures | targeted export-surface tests + generator normalization tests | four question forms and ambiguity/truncation cases pass |
| 3 | generator freshness | corpus generator `--check` | version/hash/count payload current |
| 4 | mirror-free GREEN | real `createMcpCliServer` in empty temp workspace | `find_export definePage` returns `@netscript/fresh`, `./builders`; receipt succeeds |
| 5 | package suite | `deno task test` in `packages/mcp` | all MCP tests pass |
| 6 | scoped check/lint/fmt | repository wrapper trio on `packages/mcp` plus generator test/root | PASS, non-zero selection, no ignores |
| 7 | doctrine quality | `deno task quality:gate` | quality scan + architecture gate PASS |
| 8 | docs/JSR | `doc:lint`, JSR audit, package + root publish dry-run | zero new diagnostics; publish-safe generated asset |
| 9 | diff hygiene | raw git status/diff, prohibited-pattern scan | only owned files; unchanged pre-existing lock diff |

## Dependencies

- Deno 2.9 `deno doc --json` schema version 2, `CompressionStream`/`DecompressionStream`,
  `Uint8Array` base64, and `crypto.subtle`; no new package dependency.
- Current first-party package manifests are the authoritative package/subpath set.

## Drift Watch

- Deno doc JSON schema, package/subpath counts, generated payload size, public export count,
  folder cardinality, receipt settlement, docs/tool count, and any lockfile movement.
