# Generated carriers

Carriers remain committed and checked by the required `quality` job. Run the chain after changing
site prose or published JSDoc:

```sh
deno task gen:agent-docs-prose
deno task gen:mcp-export-corpus
deno task gen:assets-barrel
deno task gen:publish-assets
deno run --allow-read --allow-write --allow-run=git .llm/tools/validation/aspire-surface-manifest.ts
```

Commit source changes before export generation, or use its existing `--allow-dirty` override
explicitly. All four `check:*` tasks remain required. `check:assets-barrel` also checks the page
carrier; `check:agent-docs-prose` renders the site and compares every page transport byte.

The CLI owns the only stored full prose corpus, `agent-docs-prose.generated.ts`. Each sorted page
row contains gzip/base64 text, its SHA-256 and decoded length. Blank separators allow Git to merge
adjacent independent edits. The CLI derives `llms-full.txt` from the page twins at installation. The
provenance sidecar contains only schema and framework versions. API docs still come from the exact
installed package exports. Installed `MANIFEST.md` omits the old source-commit and extraction time
rows; its API generation time is still the caller's clock.

MCP exports use one row per package entrypoint, with raw-deflate/base64 declaration columns,
SHA-256, decoded length and symbol count. Loading is lazy and cached. The legacy compressed-source
constructor override remains supported. MCP's selected offline prose, the CLI skill bundle and
agent-tool bundle store one source entry at a time; aggregate hashes and counts are computed from
those entries. Their bounded aggregate hashes are computed once at module load.

The main safety net runs after every push, independently of required PR quality. It regenerates only
carrier output and uses the repository's existing `PAT_TOKEN` convention to open or update
`automation/generated-carriers`. Updates are ordinary commits with the previous branch head as a
parent, so no forced push or ruleset bypass is needed. Without a chainable token, or if generation
or PR creation fails, it updates one tracking issue and fails visibly. A bot repair still needs
normal PR CI and review.

## Carrier audit

The audit covers every tracked `*.generated.ts` under packages and plugins:

| Carrier family                     | Shape and decision                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| CLI prose                          | One sorted, compressed page per row; no binary twin or full-text aggregate    |
| MCP export surfaces                | One sorted, independently compressed entrypoint per row                       |
| CLI agent docs export map          | One sorted package export map per row                                         |
| CLI skills and agent tools         | One sorted source file per row; derive aggregate hashes                       |
| MCP published prose                | One source document per row; derive aggregate provenance                      |
| CLI templates and plugin skeletons | One source template per constant; existing separate rows                      |
| Fresh UI registry                  | Each registry source file has its own constant; existing separate rows        |
| CLI published schema               | One schema source asset, not a multi-source corpus; retain its literal        |
| Service Scalar bundle              | One upstream minified JS asset, not a multi-source corpus; retain its literal |
| Package/plugin metadata            | A single version constant per package; retain                                 |

The single-asset schema and Scalar carriers can conflict when both branches edit that same asset,
which is an ordinary same-source conflict. Adding/removing documents or entrypoints may still change
indexes and ordering; the safety net detects any merged output that differs from regeneration.
