# Research — W3-B2 #1375 MCP documentation corpus plumbing

## Re-baseline

- Re-derived from the live issue body and `origin/main@aa8e151e65939ecd789c82e45b22b6338a8d8ce8`
  on 2026-08-09. The earlier “`writeHostConfig` plus a probe plus tests” summary is incomplete.
- The branch and worktree were clean at the exact supplied baseline before run artifacts were
  created.
- Live #1375 remains open at milestone `0.0.5`, priority `p1`, with eleven unchecked acceptance
  rows. Live #1260 remains open and was explicitly moved to `0.0.6`; it owns broader SDK query
  coverage, not this release-blocking plumbing and bounded fallback.
- #1376 is concurrently changing `packages/cli/src/public/features/agent/mcp/run-agent-mcp.ts`.
  This plan does not touch that file or any of #1376's named symbols.

## Live acceptance contract (quoted verbatim)

The following rows are copied from the live #1375 body fetched on 2026-08-09:

- [ ] `agent init --with-docs` emits host configs containing a `--docs-root` pointing at the
      installed bundle.
- [ ] Every host config `agent init` writes carries the same docs wiring.
- [ ] With no flag and no environment variable, the server resolves `<projectRoot>/.netscript/docs`
      when it exists.
- [ ] Explicit `--docs-root` overrides the environment variable, which overrides auto-detection.
- [ ] The embedded fallback corpus contains the enumerated golden-path document set, generated at
      build time.
- [ ] The embedded corpus carries framework-version provenance and fails closed on mismatch.
- [ ] A size budget for the embedded corpus is asserted in CI.
- [ ] `list_docs` reports corpus kind, resolved root, and document count.
- [ ] Tests cover: bundle installed → filesystem corpus; no bundle → embedded corpus; flag beats
      env beats probe.
- [ ] Negative test: a `.netscript/docs` directory with no indexable documents does not silently
      produce an empty corpus — it falls back to embedded and says so.
- [ ] Negative test: an embedded corpus whose provenance version differs from the package version
      fails to construct.

## Findings

| # | Finding | Evidence |
| --- | --- | --- |
| 1 | `agent init --with-docs` writes the generated bundle under `.netscript/docs/`, but all three host emitters omit `--docs-root`: Claude `.mcp.json`, VS Code `.vscode/mcp.json`, and Zed `.zed/settings.json`. | `packages/cli/src/public/features/agent/init/init-agent.ts` |
| 2 | Both requested JSON shapes share `writeHostConfig`; Zed has a separate `writeZedConfig`. Passing one optional installed root to both emitters satisfies “every host config” without changing host detection. | `init-agent.ts:112-168,226-307` |
| 3 | `resolveDocsRoot` is synchronous and currently implements only flag > environment. `createMcpCliServer` therefore selects a filesystem corpus only for an explicit option/environment root. | `packages/mcp/cli.ts:83-121` |
| 4 | `FilesystemDocsCorpus.list()` already provides the authoritative “indexable” verdict: missing roots and trees yielding zero processed documents throw `DocsCorpusUnavailableError`. Probe policy can share its public-path/indexing rules rather than accepting any directory entry. | `packages/mcp/src/infrastructure/filesystem-docs-corpus.ts` |
| 5 | `list_docs` currently reports only the retained page count and document rows. Its output schema has no corpus identity, root, or total document count. | `packages/mcp/src/application/flows/docs-flows.ts`; `packages/mcp/src/domain/tool-contracts.ts` |
| 6 | Default CLI composition contains the generated MCP README plus `help.md`, hence two documents. Standalone MCP contains one. | `packages/mcp/cli.ts`; `packages/cli/src/public/features/agent/mcp/run-agent-mcp.ts` |
| 7 | The existing release docs source is already generated and versioned: `.llm/assets/agent-docs/prose.json.gz` plus provenance. It contains 166 files, is 1.2 MiB compressed, and is embedded wholesale only in the CLI installer. A bounded MCP subset can be generated from the same source without runtime filesystem reads. | `.llm/assets/agent-docs/provenance.json`; `.llm/tools/generate-publish-assets.ts`; `.llm/tools/generate-cli-assets-barrel.ts` |
| 8 | JSR guidance forbids runtime asset reads/import attributes. Checked-in generated TypeScript string constants are the established publish-safe mechanism, and `check:publish-assets` is the freshness gate. | `jsr-audit` skill; `.llm/tools/generate-publish-assets.ts`; root `deno.json` |
| 9 | Export-surface provenance validates schema/version/bytes/hash/counts and rejects framework-version drift before serving data. The docs fallback needs the same release-identity principle and an explicit byte ceiling. | `packages/mcp/src/infrastructure/export-surfaces/embedded-export-surface-corpus.ts` |
| 10 | A real stdio helper already spawns the local CLI and exchanges JSON-RPC in `init-agent_test.ts`. It can be generalized to call `search_docs` against a temporary project populated by `agent init --with-docs`, while config-shape tests separately assert the exact emitted args. | `packages/cli/src/public/features/agent/init/init-agent_test.ts:695-734` |
| 11 | The agent-tooling docs currently describe only flag/environment and say the package default is one document. Both claims become stale under this issue. | `docs/site/ai/agent-tooling.md`; `packages/mcp/README.md`; `docs/site/reference/mcp/index.md` |

## Bounded fallback corpus decision input

The generated fallback will enumerate a small navigation/golden-path set from the existing release
docs artifact. It will include the MCP README and the minimal pages that orient an agent from
quickstart → contracts → services → web builders/routes. It will not claim #1260's SDK-specific
cache invalidation, hydration, or optimistic-mutation search coverage. Exact paths are locked in
`plan.md`; the generator fails if any selected release source is absent.

## Doctrine and accepted debt

- Controlling archetype: **6 — CLI / Tooling**, with the docs overlay.
- Current doctrine file 10 still labels `@netscript/cli` **Restructure**; later debt history records
  the bounded A6 promotion complete but retains two accepted entries relevant here:
  `cli/maintainer-mode-mixing` and `cli/no-permissions-doc`. This change neither imports maintainer
  code into public features nor alters the binary permission grant.
- `packages/mcp` carries open accepted debt `MCP-A6-V2-SHAPE`: its horizontal protocol-engine
  layout is owner-approved until a later reassessment. New MCP code stays inside the existing
  domain/application/infrastructure vocabulary and does not invent the full CLI spine.
- In-scope anti-patterns: AP-1 (generated asset growth), AP-2/AP-9 (duplicated probing helpers),
  AP-11/AP-25 (filesystem effects at the adapter/composition edge), AP-18 (semantic generated-config
  assertions, not giant snapshots), AP-19 (permissions remain documented), AP-23 (no command body
  added to composition).

## JSR-audit planned-surface scan

- `@netscript/mcp` remains a three-entrypoint ESM package. No export-map key is added. The `./cli`
  behavior and `TOOL_OUTPUT_SCHEMAS.list_docs` contract change, and a generated internal adapter is
  published under the existing `src/**/*.ts` include.
- `@netscript/cli` adds no export and no dependency. Its emitted config changes only inside the
  existing `agent init` flow.
- Generated TypeScript constants avoid import attributes and runtime package-file reads. Explicit
  annotations are required for all exported generated constants, and generated provenance is
  version-matched to `packages/mcp/deno.json`.
- Risks to gate: stale generated assets, slow types on any new exported symbol, unintended tests or
  docs assets in publish lists, and package growth beyond the locked byte budget. Full MCP/CLI
  doc-lint, JSR audit, and publish dry-run remain selected even without an export-map change.

## Scope feasibility

All eleven rows are implementable in one PR using four implementation slices after PLAN-EVAL. No
row requires a post-publish observation. #1197's measured agent-run acceptance remains excluded.

## PLAN-EVAL corrections

- #1376 overlaps textually in `packages/mcp/cli.ts` and `packages/mcp/README.md`, even though its
  symbols differ. This branch owns only docs-corpus hunks. Whichever PR merges second must rebase
  and regenerate publish assets before its gates.
- Not-yet-existing adapter/generated-export tests move to S2. S1 statically imports existing
  modules only and fails on behavioral assertions.
- The corpus budget is exactly **256 KiB = 262,144 bytes**, represented in TypeScript as `262_144`.
- The release docs provenance file list contains **166** entries.

## Open questions

None that may force implementation rework. PLAN-EVAL must challenge the selected corpus paths, the
metadata result shape, and whether the probe uses exactly the same indexability policy as serving.
