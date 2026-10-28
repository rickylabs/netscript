# Independent generated-data review

This bounded CI correction was reviewed in a separate read-only Anthropic session on the separately regenerated payload. The owner then pushed the same decoded payload in a different valid gzip representation. Every one of the 204 stored rows was independently decoded and hash/length checked; no document content differs. The owner representation was retained, and native freshness gates were repeated on the retained files. No handwritten package code or public schema changed. Raw evaluator identity is private.

# Verdict: PASS. Commit and push of the regenerated docs assets is approved

No blockers, and I made no edits. I used only the file read and search tools: no shell, no git, no subprocesses or agents, and nothing under `profiles/`.

## What I checked

**How regeneration works** (`.llm/tools/docs/build-agent-docs-bundle.ts`, `.llm/tools/docs/agent-docs-page-carrier.ts`)
- The site-owned entries (`llms.txt`, `llms-full.txt`, `pages/**`) are rebuilt from the built site. Every other entry is kept as-is from the existing carrier.
- `renderAgentDocsPages` reuses an existing row only when its decoded content exactly equals the site content. Otherwise it writes a fresh gzip/SHA-256/size row. So unchanged pages keep identical bytes and the diff contains only real changes.
- Check mode re-renders and requires the result to byte-equal the checked-in carrier. It also requires the recomposed `llms-full.txt` to equal the site's copy. A passing `check:agent-docs-prose` therefore already proves every row matches the built site; the audit's "15 twins byte-equal the site" result is an extra confirmation, not the only proof.
- Each row's integrity is enforced when it is decoded (`agent-docs-transport.ts:19`: byte length and SHA-256), and duplicate rows are rejected.

**The checked-in carrier as it stands**
- 204 rows, plus the derived `llms-full.txt`, gives 205 decoded entries, matching the audit.
- All 15 design-system pages are present (the index, guidelines, create-your-own-theme, token-contract and 11 themes).
- The header still says generated / do not edit, and the file still exports only `EMBEDDED_AGENT_DOCS_PAGES`.
- `provenance.json` is version `0.0.8`, the same as the root `deno.json`, so the build path cannot drift from the check path.
- The CLI assets barrel re-exports the carrier by name (`generate-cli-assets-barrel.ts:439`). Its freshness can't depend on the carrier's contents, which explains why it needed no change.

**MCP fallback** (`.llm/tools/generate-publish-assets.ts`)
- The size ceiling `MCP_EMBEDDED_DOCS_MAX_BYTES` is still `294_912`, and the fallback list (`MCP_EMBEDDED_DOC_PATHS`) is still 14 paths. No design-system page was added to it.
- `packages/mcp/src/publish-assets.generated.ts` holds exactly those 14 documents in the same order. It still has the same four exports (`MCP_PACKAGE_VERSION`, `MCP_PACKAGE_README`, `MCP_EMBEDDED_DOCS`, `MCP_EMBEDDED_DOCS_PROVENANCE`), with the provenance type unchanged. 284,489 bytes is within the ceiling, and the build throws if the ceiling is exceeded.
- The only fallback document that could change is `llms.txt`, which fits your scope claim.

**Formatting:** the root formatter's exclude list does contain `packages/cli/` (`deno.json:235`). The publish-assets generator runs the MCP file through `deno fmt` itself, so selecting only the MCP file is correct.

**Gate summary:** all four native checks report PASS, exit 0, on `a4341d33b`. The type-check found 0 issues across 2 files, the MCP budget test is 1/1, `quality:gate` exits 0, and no lock files changed. The only untracked files are the two new run JSON files.

## Limits of this evidence
1. **I didn't see the diff.** Without shell or git I couldn't diff `a4341d33b` against `2cb59827a`. That only two package files changed, that only `llms.txt`, the 15 new pages and the Fresh UI link row changed, and that no old documents were removed all rest on your statement and the receipts. I verified the current tree, not the change between commits.
2. **I used the summary, not the raw receipts.** I relied on the privacy-safe summary and didn't open the private receipts.
3. **The runtime proof is for the parent head.** The hosted scaffold.runtime pass (120/0/0, with cleanup) ran on `2c3199e74`, not `a4341d33b`. That's reasonable because only generated docs data changed since, but it isn't direct proof for the new head. The desktop packaging job in that same workflow failed separately; neither the whole workflow nor native packaging is certified.
4. **This is a local result.** `a4341d33b` isn't pushed yet. The hosted CI quality run on the pushed head is the conclusive check for `check:agent-docs-prose`.

## Fix round
Not needed. I made no label changes, merge, tag or release, and didn't weaken any gate.
