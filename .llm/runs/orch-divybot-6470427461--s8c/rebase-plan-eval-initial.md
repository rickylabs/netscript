**Verdict: FAIL_PLAN**

There is one blocker. The rest of the reconciliation plan is sound.

### Blocker 1: the plan doesn't say which carrier side to take during the rebase, and regeneration won't fix a wrong choice for non-site entries

- **Where:** `.llm/runs/orch-divybot-6470427461--s8c/rebase-plan.md`, the "Commit slice" line ("A temporary side selection for a conflicted generated carrier is only an intermediate rebase resolution; regenerate all carriers after all commits replay").
- **Problem:**
  - The prose generator only rebuilds site-generated entries: `llms.txt`, `llms-full.txt` and `pages/*` (`.llm/tools/docs/agent-docs-page-carrier.ts:12-14`).
  - It copies every other entry, such as `context/*.mdx`, unchanged from whatever carrier file is in the working tree (`.llm/tools/docs/build-agent-docs-bundle.ts:114-115`, `234-240`, `268-274`).
  - So the side chosen when resolving the `agent-docs-prose.generated.ts` conflict permanently decides those entries. Regenerating afterwards won't restore them.
  - PR #2463 changed that same generated carrier on main. If the feature side is kept, any non-site rows that main added or changed are silently dropped. That breaks the plan's own goal to "preserve every upstream doc change".
  - The plan's checks only compare hand-written source files, so they wouldn't catch this.
- **Correction:**
  - Lock that every conflicted generated carrier is resolved to **main's** version: the upstream side, which during a rebase is "ours", so take `0825bd0f4`'s content. Only then regenerate in the established order.
  - Add a carrier comparison against main's carrier, not the old feature tip. It should confirm:
    - every non-site entry is byte-identical to main;
    - every `pages/*` entry from main is still present;
    - the only differences are the feature's rendered pages and `llms.txt`;
    - nothing is removed and the MCP budget still holds.

### Checked and passing

- **Authorisation and limits are recorded.** The latest user instruction explicitly authorises the rebase and force-push. Merge, tag, release and label changes are still forbidden.
- **The force-push is guarded.** A backup ref keeps the old tip, and an exact `--force-with-lease` against `ae2f4002b` protects against overwriting concurrent work.
- **Source preservation is checked.**
  - Final hand-written feature source must equal the old tip, except for the five upstream canonical docs, and those must equal main exactly.
  - Any unexpected conflict in hand-written source must be declared and recorded before it is resolved.
- **The rest of the carrier and lock handling matches earlier rounds.**
  - The carriers are regenerated in the established order (prose, MCP exports, assets barrel, publish assets).
  - `--allow-dirty` is only for generated files that have been inspected.
  - `docs/site/deno.lock` is restored to the target main after every step that rebuilds the site has finished.
- **The full gate set and sequencing are kept.** That covers freshness, generated TS, build, links, caveats, exports, snippets, quality, tool tests, typed wrappers, reproducibility, and the serialized 116-test browser run with strict axe and the style negative controls. IMPL-EVAL in this same session comes before the sign-off commit, then the post-commit assets-barrel check, new hosted CI and the screenshot artifact.
- **Deferred items are unchanged.** That covers #2450, #2453 and the Docker/runtime limitation, and no merge is certified.

After this decision and comparison are added to `rebase-plan.md`, re-run PLAN-EVAL before rebasing.
