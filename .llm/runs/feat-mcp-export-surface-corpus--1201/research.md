# Research — MCP generated export-surface corpus (#1201)

## Re-baseline

- Baseline: clean source at `origin/main` SHA `a194d5a0359ba4eda4aeb06a302dc1c79326b38b`
  (2026-08-04). The worktree has one unrelated pre-existing `deno.lock` addition for
  `jsr:@netscript/queue@0.0.4`; it is user-owned and excluded from every commit.
- Live issue #1201 and its owner comment were read before planning. Five acceptance boxes are
  locally provable. The sixth—real-agent adoption with MCP calls non-zero and deno-doc greps
  zero—is explicitly routed to the canary.3 orchestrator; this PR must use `Refs #1201`, not a
  closing keyword.
- The issue's measured 36 flat export files describe the control-run mirror. Current main has 35
  publishable first-party `@netscript/*` packages and 268 declared export subpaths. The corpus
  generation plan uses the current manifests rather than preserving the older count.

## Findings

| # | Finding | Evidence |
| --- | --- | --- |
| R1 | The shipped MCP registry has 17 tools and no export-surface tool. | `TOOL_NAMES`; baseline RED below |
| R2 | Baseline mirror-free call is impossible: an empty workspace with no `docs/` returns JSON-RPC `tool_not_found` for `find_export`. | RED command output in `worklog.md` |
| R3 | Prose is modeled as Markdown documents, headings, slugs, snippets, and lexical ranking. That model cannot represent package/subpath/symbol/signature relationships without lying about the corpus type. | `src/domain/docs-corpus-port.ts`; `embedded-docs-corpus.ts`; `docs-flows.ts` |
| R4 | `deno doc --json` 2.9 emits `{ version: 2, nodes: Record<moduleUrl, { module_doc, symbols }> }`; each symbol contains declarations with location, kind, JSDoc, and a structured definition. | Live `deno doc --json packages/mcp/mod.ts`; focused `definePage` query |
| R5 | `definePage` is absent from `@netscript/fresh` root and exported from `@netscript/fresh/builders`; this is the issue's specific-helper-below-the-general-surface case. | Live export-map walk: root 5 symbols, `./builders` 99 symbols including `definePage` |
| R6 | The offline docs installer generates plain deno-doc files at install time from exact installed versions, but the MCP default composition embeds only prose/README data. Reusing the installer would retain a filesystem mirror and would not produce an MCP query index. | `deno-agent-docs-generator.ts`; `packages/mcp/cli.ts` |
| R7 | Shipped result discipline is two-layered: flows self-cap rows and expose `truncated`; the runner then caps arrays/strings, enforces 64 KiB, revalidates, and only then settles receipts. | `list-service-operations-flow.ts`; `truncation.ts`; `mcp-server.ts`; #1134 S8 artifacts |
| R8 | Read tools that produce diagnostic evidence are wrapped at CLI composition with `withFlowReceipt`; this preserves post-validation settlement through the runner. | `cli.ts`; `receipt-lifecycle.ts`; `openapi-read-tools_test.ts` |
| R9 | The package is absent from the old doctrine census and carries open `MCP-A6-V2-SHAPE` debt. The owner brief binds this slice to the Archetype-2 full column. New files must avoid deepening existing folder cardinality warnings. | doctrine file 10; `arch-debt.md`; live JSR audit |

## Baseline JSR/public-surface scan

| Check | Baseline result | Planning consequence |
| --- | --- | --- |
| Full export-map doc lint | PASS, 3 entrypoints, combined 0 diagnostics | Every new public type/class needs complete JSDoc; rerun after exports |
| Package publish dry-run | PASS, no blocking slow types | New generated asset must be publish-safe TypeScript; no runtime file reads/import attributes |
| JSR audit | Exit 0; current cardinality warnings at `src/domain` (14) and `src/application/flows` (16); helper reports one banner-line slow-type warning | Put the port in `src/ports`, the feature flow under `src/application/export-surfaces`, and the adapter/asset under `src/infrastructure/export-surfaces` |
| Package metadata | name/version/description/3 exports valid; description 93 chars | No new package subpath or dependency is required |

## Deno-doc JSON contract used by the design

- Package and subpath identity come from each publishable first-party manifest, not from source
  paths inferred out of the doc JSON.
- Symbol name, declaration kind, JSDoc, and structured signature fields come from
  `deno doc --json` version 2.
- The generator normalizes volatile locations/resolution details out of the embedded data and
  renders stable TypeScript-like signatures from declaration definitions.
- The embedded payload carries schema version, framework version, corpus SHA-256, and exact
  package/subpath/symbol counts. Runtime loading verifies framework version, byte count, and hash.

## Open questions resolved before lock

| Question | Resolution |
| --- | --- |
| One generic search tool or four question-shaped tools? | Four tools. Their contracts mirror the priority-ordered questions and keep each response predictable. |
| Filesystem or embedded corpus? | Embedded, deterministic, gzip-compressed generated TypeScript. A filesystem mirror is forbidden by acceptance. |
| Does `docsRoot` override affect exports? | No. Prose override and export corpus are independent compositions. |
| How is ambiguity handled for one-symbol detail? | `get_export` requires an exact name and returns a bounded `export_ambiguous` error with candidates unless package/subpath narrows to one. |
| How does grouped listing stay bounded? | Stable flattened pagination (`offset`/`limit`) is regrouped by subpath and returns `total`, `returned`, `nextOffset`, and `truncated`. |
| How does shape matching work? | Deterministic lexical scoring over camel-case symbol tokens, kind, signature, package, subpath, and JSDoc; exact/name-prefix hits outrank signature/JSDoc hits. |

## No unresolved plan blockers

All decisions that would force implementation rework are locked in `plan.md`. Canary adoption,
future fuzzy/semantic ranking, and #1135 instruction/template activation are safe deferred scope.
