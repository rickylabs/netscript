# S2 docs tools worklog

Append-only implementation evidence for issue #726 on branch
`feat/netscript-mcp-skills-s2-docs`.

## Design

- **Public surface:** `DocsCorpusPort`, its document/summary/section/search read models,
  `FilesystemDocsCorpus`, and the existing `createMcpServer` composition option. The public MCP
  verbs remain `list_docs`, `search_docs`, and `get_doc`.
- **Domain vocabulary:** a path-derived document slug, front-matter title and description, heading
  sections with slugified identifiers, bounded Markdown content, and scored lexical matches.
- **Ports:** `DocsCorpusPort` is the filesystem/test seam. Application flows know only this port;
  `FilesystemDocsCorpus` owns `Deno.readDir`, metadata, and file reads.
- **Constants:** `MAX_INDEXED_DOC_LENGTH`; flow-local list/search defaults and caps; the existing
  runner truncation policy remains the final response boundary.
- **Composition:** `cli.ts` resolves `--docs-root`, then `NETSCRIPT_DOCS_ROOT`, then
  `<project-root>/docs/site`, and injects the filesystem corpus through `createMcpServer`.
- **Commit slices:** (1) corpus contract and lazy mtime-reusing filesystem index, proven by fixture
  parsing/exclusion tests; (2) bounded docs flows and composition, proven by search/get and runner
  tests; (3) requested package gates and evidence in this file.
- **Deferred scope:** hosted-site fallback and live refresh watching are not part of S2. Index
  freshness is checked lazily from file mtimes on each corpus operation.
- **Contributor path:** add corpus semantics to `docs-corpus-port.ts`, filesystem interpretation to
  `filesystem-docs-corpus.ts`, and public tool behavior to `docs-flows.ts`; exercise new corpus
  cases only through `tests/fixtures/docs/`.
- **Archetype fit:** the owner-locked horizontal Archetype-6 deviation accepted in S1 remains in
  force as debt `MCP-A6-V2-SHAPE`; S2 adds no new deviation or dependency.

## 2026-07-12 — implementation

- Added the docs corpus contract and typed read models before implementation.
- Added a root-confined Markdown adapter with underscore/internal exclusions, front matter,
  headings, bounded bodies, lazy indexing, and mtime-based parsed-document reuse.
- Added weighted lexical search (title 12, heading 5, body 1), bounded list/search flows, slug and
  section retrieval, CLI root resolution, registry composition, fixtures, and real-corpus smoke.

## 2026-07-12 — validation evidence

| Gate | Exit | Evidence |
| --- | ---: | --- |
| scoped check wrapper (`packages/mcp`, `ts`) | 0 | 22 selected, 1 batch, 0 failed, 0 diagnostics |
| scoped lint wrapper (`packages/mcp`, `ts`) | 0 | 22 selected, 1 batch, 0 findings |
| scoped fmt wrapper (`packages/mcp`, `ts`) | 0 | 22 selected, 1 batch, 0 findings |
| MCP tests with requested permissions and `--no-lock` | 0 | 13 passed, 0 failed; fixture and real corpus included |
| `deno task arch:check` | 0 | dependency scan plus all configured doctrine roots completed; existing repository warnings only |
| `deno task doc:lint --root packages/mcp --pretty` | 0 | 2 entrypoints, 0 errors, 0 private refs, 0 missing JSDoc |
| package `deno publish --dry-run --allow-dirty` | 0 | publish simulation succeeded; intended README/config/entrypoints/source only, no tests or lock |
| JSR package audit helper | 0 | metadata/exports/file list pass; helper counted the informational slow-type-check banner as one warning, while authoritative raw dry-run emitted no slow-type diagnostic and succeeded |
| public-wording grep | 0 | no matches for `eis|VIF|CSB|PR #|dogfood` under `packages/mcp` |
| lock hygiene | 0 | `git diff -- deno.lock` empty |

Reconcile: S2 remains limited to issue #726 and introduces no issue-state, taxonomy, milestone, or
umbrella changes. The supervisor owns umbrella review and integration; this lane opens no PR.
