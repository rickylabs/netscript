**Verdict: PASS — the advancing-base integration onto `96d13d294` is signed off for review. This is not a merge or release certification.**

I found no blockers in source preservation, carrier preservation or the authorisation safeguards.

### Authorisation

- **The authority and its limits are recorded.** The repeated user instruction authorises the rebase and force-push for this sync (`.llm/runs/orch-divybot-6470427461--s8c/worklog.md:179`). Merge, tag, release and labels remain forbidden.
- **The push is guarded and nothing is published yet.** A backup ref keeps the old remote tip `9cc0442b2`, and the push will use an exact lease against it, after the planned check that the remote tip and base are still current.

### Source preservation (`advancing-base-source-comparison.json`)

- **All 17 commits replayed, with none skipped.**
- **Conflicts were confined to the generated carrier.** The only overlap with upstream is `packages/cli/src/kernel/assets/agent-docs-prose.generated.ts`. Its three conflicts, at the original commits `101f69062`, `5d5ee06e3` and `9cc0442b2`, were each resolved to the fixed `96d13d294`, as the approved plan requires.
- **Upstream is kept intact.** All 286 upstream paths are preserved, apart from the carrier that is regenerated anyway. That includes the tokens-v2 package API, foreign run context and the root lock.
- **Feature source is intact.** All 48 compared feature-written paths are byte-identical to the old `9cc`.
- **No conflicting upstream token changes.** The feature-written paths include `docs/site/styles/tokens.css`, the `tools/docs-site/figma-variables/*` export, `docs/site/deno.json` and `packages/mcp/src/publish-assets.generated.ts`. None of them overlaps with upstream, so tokens v2 didn't touch the docs-site token pipeline.

### Carrier preservation (`advancing-base-carrier-comparison.json`)

- **Main's carrier is preserved.** All 204 rows from main are kept, every upstream page is present, and nothing is removed.
- **The non-site entries come from main.** Both `context/*.mdx` entries are byte-identical to main.
- **Only the approved pages were added.** The three Docs kit pages are the only additions, giving 207 stored rows and 208 decoded entries.
- **Every site row equals its rendered source,** and every row's integrity is verified.
- **The differences from the old feature tip are explained by upstream.** Exactly four rendered pages changed:
  - `cli-reference`
  - `reference/cli/commands`
  - `reference/fresh-ui`
  - `web-layer/how-to/customize-fresh-ui`

  These are the pages that tokens v2 updated upstream.
- **The new `reference/cli/commands` row matches main.** It's absent from the list of differences against main, so it is identical to main's own row. That's expected because the page has no markup this PR changes.
- **`llms.txt` and the MCP embedded docs are unchanged from `9cc`.** That's still 14 docs and 283,750 of 294,912 bytes, consistent with none of the four changed pages being in the MCP list.
- **The MCP export corpus is byte-identical to main after regeneration.** Main's new public API is therefore inherited intact, with no manual package or API edits.

### Evidence (reported to me, not observed)

- all four generators and their freshness checks;
- `--allow-dirty` limited to the generated prose;
- typed check, lint and fmt;
- the generated-TS check;
- 12 tooling tests, quality, exports, 671 snippets and 15 caveats;
- reproducibility for 254 HTML pages and 205 twins, with only the known #2453 differences and the strict default kept;
- the serialized link scan of 24,225 links across 254 pages;
- the root and docs locks both exactly matching `96d13d294`.

### Still pending (not certified)

- **The serialized 116-test browser run** and the three real style negative controls.
- **Post-commit assets-barrel freshness.**
- **The final check that the remote tip and base are still current,** then the exact lease push against `9cc0442b2`.
- **Fresh hosted CI and a new screenshot artifact.**
- **The full CLI E2E (`scaffold.runtime`).** It's still unproven locally because Docker is unavailable, and that still blocks merge readiness under `AGENTS.md`.
- **Deferred work is unchanged.** #2450 and #2453 remain as previously recorded.
