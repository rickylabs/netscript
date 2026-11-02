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
carrier; `check:agent-docs-prose` renders the site and compares decoded page content. Unchanged
valid page, entrypoint and README transports are retained when writing, so a compressor patch does
not create false drift.

MCP owns the only stored full prose corpus,
`packages/mcp/src/infrastructure/docs/agent-docs-prose.generated.ts`, exposed through
`@netscript/mcp/docs`. The CLI consumes that public subpath; MCP never imports CLI internals.
Add pages in the docs site and use the generation chain above; there is no curated MCP page list. Each sorted page
row contains gzip/base64 text, its SHA-256 and decoded length. Blank separators allow Git to merge
adjacent independent edits. The CLI derives `llms-full.txt` from the page twins at installation. The
composition policy lives in `docs/site/_plugins/llms-policy.ts`; the prose generator copies that
source to MCP, and the site uses the same functions and canonical location. The provenance
sidecar contains only schema and framework versions. API docs still come from the exact installed
package exports. Installed `MANIFEST.md` retains the historical `Prose source commit` and
`Prose extraction time` row labels for compatibility. Their values are now `sha256:<digest>`
and `release:<framework version>`: content identity and a deterministic release label. The digest
covers UTF-8 JSON `{schemaVersion:1,files:<sorted decoded prose map>}`, including derived
`llms-full.txt`, before adding API docs or the manifest. It is computed at installation, never
stored as an aggregate that would conflict across independent page edits. Neither row uses Git
identity or wall-clock time. `API generation time` still uses the caller's clock.
The strict full-manifest byte-parity test in
`packages/cli/src/public/adapters/agent/deno-agent-docs-generator_test.ts` reads the canonical
carrier independently, fixes the API clock, and compares both generation and actual installation.
Extend that expected manifest when changing this consumer contract.

MCP exports use one row per package entrypoint, with raw-deflate/base64 declaration columns,
SHA-256, decoded length and symbol count. Loading is lazy and cached. The legacy compressed-source
constructor override remains supported. MCP's full offline prose, the CLI skill bundle and
agent-tool bundle store one source entry at a time; aggregate hashes and counts are computed from
those entries. Their bounded aggregate hashes are computed once at module load.

The main safety net runs after every push, independently of required PR quality. It regenerates only
carrier output and uses the repository's existing `PAT_TOKEN` convention to open or update
`automation/generated-carriers`. Updates are ordinary commits with the previous branch head as a
parent, so no forced push or ruleset bypass is needed. Without a chainable token, or if generation
or PR creation fails, it updates one tracking issue and fails visibly. A bot repair still needs
normal PR CI and review. Generic maintenance uses the repository's `Backlog / Triage` milestone.
Tracking is created before optional milestone lookup/assignment; metadata failures never suppress
the issue. Newly generated untracked carriers are included in the allowlisted repair output.

`gen:design-skill` owns the design SKILL, exact guideline reference, and CLI
`design-guidance.generated.ts` metadata. `check:design-skill` checks all three read-only before
asset regeneration. Agent init verifies the original skill bundle, then fills release-ref links
only in the design SKILL from the invoking CLI version.

## Carrier audit

The audit covers every tracked `*.generated.ts` under packages and plugins:

| Carrier family                     | Shape and decision                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| Shared full-corpus policy             | One generated copy of the docs site composition source; no independent policy |
| Shared MCP/CLI prose                          | One sorted, compressed page per row; no binary twin or full-text aggregate    |
| MCP export surfaces                | One sorted, independently compressed entrypoint per row                       |
| CLI design guidance              | Manifest-derived doc slugs and one release-ref placeholder; no runtime docs imports |
| CLI agent docs export map          | One sorted package export map per row                                         |
| CLI skills and agent tools         | One sorted source file per row; derive aggregate hashes                       |
| MCP published prose                | Derive from shared page rows; no second stored prose corpus                      |
| CLI templates and plugin skeletons | One source template per constant; existing separate rows                      |
| Fresh UI registry                  | Each registry source file has its own constant; existing separate rows        |
| CLI published schema               | One schema source asset, not a multi-source corpus; retain its literal        |
| Service Scalar bundle              | One upstream minified JS asset, not a multi-source corpus; retain its literal |
| Package/plugin metadata            | A single version constant per package; retain                                 |

The single-asset schema and Scalar carriers can conflict when both branches edit that same asset,
which is an ordinary same-source conflict. Adding/removing documents or entrypoints may still change
indexes and ordering; the safety net detects any merged output that differs from regeneration.

## Frozen parity baseline

The test-only legacy inputs and per-page/full-corpus/export digests in
`fixtures/legacy-carrier-parity/` guard decoding independently of current source changes. They
remain fixed after this migration merges, are outside published packages, and require neither a
remote Git ref nor a rendered site. Tests regenerate row transports from those frozen inputs and
pass them through the production decoders; they never skip a missing baseline.
