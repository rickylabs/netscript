# S5 final-head CI correction — generated MCP JSR specifiers

Date: 2026-08-09

## Diagnosis

Final-head CI failed `deno task check:netscript-jsr-specifiers` twice at
`packages/mcp/src/publish-assets.generated.ts:16`: embedded quickstart prose pinned
`jsr:@netscript/cli@0.0.3` while the workspace ships 0.0.4.

The publish generator correctly reads the MCP README plus five selected documents from the
checked-in `.llm/assets/agent-docs/prose.json.gz`. The current docs template already derives
`releaseSpecifier` from `packages/cli/deno.json`; the compressed rendered input was stale. Its
provenance version had been refreshed to 0.0.4 while exact rendered NetScript JSR pins remained
0.0.3.

## Repair

- Normalized 104 exact `jsr:@netscript/*@0.0.3` pins in the checked-in compressed prose source to
  the aligned workspace version 0.0.4.
- Recomputed its compressed byte count and SHA-256 while preserving the original extraction/source
  identity and file inventory.
- Regenerated `packages/mcp/src/publish-assets.generated.ts` through
  `deno task gen:publish-assets`; the generated file was not hand-edited.
- No #1400-owned behavior or shared composition/README hunk changed. #1400 remains second-to-merge
  and will rebase/regenerate afterward.

## Gate evidence

| Gate | Raw exit | Named result |
| --- | ---: | --- |
| `deno task check:publish-assets` | 0 | generated corpus/provenance current |
| `deno task check:netscript-jsr-specifiers` | 0 | scanned 2,314; allowances 1; ranges 0; failures 0 |
| focused CLI/MCP/docs/generator suite | 0 | 48 passed, 0 failed; decisive stdio and all acceptance tests green |
| `deno task doc:lint --root packages/mcp --pretty` | 0 | combined errors/private refs/missing JSDoc all 0 |
| MCP `deno publish --dry-run --allow-dirty` | 0 | `@netscript/mcp@0.0.4` simulated successfully |
| `git diff origin/main -- deno.lock` | 0 | empty diff |

## Non-verdict attempt

The authoritative full external docs-bundle builder was attempted first and exited 1 before
writing tracked inputs because the docs site currently fails to render unrelated
`data-persistence/how-to/database-migration.md` due an unterminated Vento string. That page and its
build defect are outside #1375 and were not modified. The failed attempt is not counted as a gate.
