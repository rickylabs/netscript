use harness

## SKILL
You are the opposite-family `docs_audit` lane (gate set: .llm/harness/workflow/doc-audit.md). Audit a Claude-authored docs changeset. Verdicts come from evidence you gather yourself (commands run, source inspected), never from the generator's claims. You do NOT edit tutorial content beyond what a finding requires; prefer reporting findings.

## Task — audit PR #1209 (branch docs/tutorials-page-builder)
Worktree: /home/codex/repos/ns005-tutorials. Changeset under audit: f7558aa1c..HEAD (two commits: the page-builder rewrite 38009a962 and the repair 2706fdb53).

Audit gates:
1. **API accuracy**: every symbol used in the three changed tutorials (docs/site/tutorials/{chat/03-chat-ui.md, live-dashboard/04-definePage-QueryIsland.md, storefront/06-storefront-ui.md}) exists on the real workspace surface — check packages/fresh/src (builders/query/defer exports) and packages/sdk. Run the fixture gate yourself: `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/tests/type-fixtures --ext tsx`.
2. **Narrative consistency**: no feature appears without a narrative predecessor in the tutorial track (the prior commit's auth force-fit is the class of defect; confirm it is gone and nothing similar remains).
3. **Contract fidelity**: examples honor the route contracts their own Step 1 defines (live-dashboard: limit/offset/status).
4. **Cross-page consistency**: chapter-3 naming (`ordersQueryUtils.update`, clientKey shapes) matches what ch. 4 uses; storefront/chat claims match their surrounding chapters.
5. **Prose quality**: flag generic/filler prose ("seamlessly", feature-tour listicles) as findings.

Output: append `audit.md` to /home/codex/repos/ns-docs-orch/.llm/runs/docs-mainpages--orchestrator/slices/pr1209-audit/ with per-gate PASS/FAIL, evidence per gate (commands + results), and a final verdict PASS / FAIL_FIX with the finding list. Also post nothing to GitHub; the orchestrator relays. Do not commit or push anything.
