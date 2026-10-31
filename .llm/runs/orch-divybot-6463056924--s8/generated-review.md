# Independent generated-data review

**Verdict: PASS** (generated documentation data only)

This isn't IMPL-EVAL and isn't a merge-readiness claim. These are still open:
- #2437 is still open, so the full link check and the browser suite still fail on the missing design-system section.
- The local CLI E2E is unproven because of the environment.
- The hosted runtime run at `69f231b` hasn't finished.
- An unrelated desktop job failed, so the workflow as a whole isn't green.
- The assets-barrel `git diff` gate has to run after the reviewed generated files are committed.

### Provenance and what was kept
- **Produced by the existing generators only.** The audit records only `gen:agent-docs-prose` and `gen:publish-assets` against `69f231b`. Exactly two generated files changed, and no generator or budget code changed.
- **Entries:** 190 before and 190 after. 142 changed and none were removed (`generated-content-audit.json:7-153`).
- **Non-site sources kept:** the two `context/*.mdx` entries are unchanged (`generated-content-audit.json:154-158`).
- **MCP corpus:** 14 documents, 282,008 source bytes against the existing 294,912-byte limit, with a content-addressed hash (`generated-content-audit.json:160-184`). The bundled page list matches the built site and contains no design-system pages, which is correct while #2437 is unmerged.
- **Freshness checks:** the prose, MCP export corpus and publish-asset checks all passed with exit 0 (`.llm/tmp/gate-receipts/s8-generated/{prose,mcp,publish}.json`). The prose receipt shows a fresh build of 236 HTML files with the rendered-output check passing.

### Content compared
- **Old twins had broken links.** In the sample before/after pairs, every link in the old home twin had the base twice (`…/netscript/netscript/…`), so all of them were broken. The new data fixes that.
- **No bad links left in the current build.** A search of all built `.md` and `.txt` files finds no `netscript/netscript/`, `[object` or empty `]()` links.
- **New content is complete.** The new twins keep the canonical diagram image link and alt text, all code blocks, the file-tree content, the learning-path links and the "Where to go" links. The extra content (the install aside, the ownership tree, the runtime code) correctly reflects the new homepage.

### Not blocking: quality problems in the twins themselves
These come from the slice 3 component markup, not from generation. The fix belongs in the components, followed by a fresh `gen:agent-docs-prose` run.
1. **UI-only text leaks into the twins.**
   - The tab hint (`data-ns-runtime · remembered`) and lone language labels (`ts`, `bash`) appear as separate lines. A match on such lone lines found about 170 across 38 built twins.
   - These come from `.ns-tabbed__hint` and from `codeBlock` headers that fall back to the language name when there's no filename.
   - Marking decorative hints `aria-hidden="true"` (which the twin tool skips), and leaving out the header when the label is only the language, would remove them. It would also stop screen readers from announcing the hint inside the tab list.
2. **Missing spaces.**
   - Learning-path steps read `01Scaffold the storefront`.
   - File-tree items read `AGENTS.md[guidance]` and `deno.json# workspace config[owned]`.
   - Card text runs into the link label, as in `…boundary.How the type flow works →`.

   Either hide the step number with `aria-hidden`, since the `<ol>` already numbers the steps, or add separators.
3. **One link loses its address.** On the home page, "Read the quickstart →" becomes plain text because it's a bare `<a>` next to block elements in the quickstart section. The twin tool turns a block-level `<a>` into plain inline text. The same destination is still linked elsewhere on the page.
4. **The home twin now has two H1s:** the page title and then the hero tagline.

### Merge order
When #2437 lands and this branch is rebased, the design-system pages will enter the twins. Both generated files will need to be regenerated and re-reviewed then, and the existing freshness checks will force that.
