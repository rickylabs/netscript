**Verdict: PASS** for the implementation and S6. This is not a merge-readiness or release-readiness statement. Two things stay open: the native `scaffold.runtime` gate is **UNPROVEN** (Docker and the Aspire doctor are unavailable), and required CI still has to pass at the exact final commit.

**Evidence matches the frozen source:**
- All 92 files in `final-source-hashes.json` and all 4 helpers in `evidence-tool-hashes.json` match on disk.
- The carriers show newer mtimes (09:52:5x) than the hash file, but their contents still match. Those writes came from the frozen-state gate receipts regenerating identical bytes. The receipts ran at HEAD `8e5e8b1` with the frozen working tree and all passed:
  - `check:assets-barrel`
  - `check:publish-assets`
  - `check:mcp-export-corpus`
  - `docs:accuracy`
  - `quality:gate`
- Those receipts come after the last source edit (`data-table.css`, 09:48:49), and so do the full test run (09:49:28) and the legacy check (09:49:37). I found no other running processes, and no generated servers are still listening.

**Whole PR against the plan:**
- **Scope:**
  - The 52 inventory items (41 components and 11 blocks) are all compared in `visual-inventory.json`, `visual-summary.md` and the private paired HTML, with the locked renders as top authority.
  - All Utility CSS is behind the guard, and the legacy check covers 262 fixtures × NS One/tonal/macos-27 × light/dark with no changes.
  - No PR2488 gap components were added, and the only contract change is the reviewed Badge `info` value and dot part.
- **Gate set:**
  - Structured check, lint and fmt, the package tests, the 13 root `check:*` tasks, `tokens:check`, `docs:accuracy`, `release:preflight` and `quality:gate` all pass.
  - Token contrast: 9080 uses with zero source exclusions.
  - The JSR audit and the native publish dry run pass, with existing warnings.
  - The 4 carriers are regenerated, with no churn in `docs/site` or `deno.lock`.
  - The exact `scaffold.runtime --cleanup` command was attempted once and is honestly recorded as UNPROVEN.
- **Scaffold proof:** a fresh merged scaffold defaults to Studio Utility.
  - Its private code-proof route imports the copied CodeBlock. The structured check and the Fresh Vite production build pass, and the code-proof server chunk (316 kB) includes highlight.js.
  - In both dev and prod at 390 and 1280px, the keyword (`oklch 0.508…`) and number colours resolve and the clipboard keeps the original source.
  - The Design link is present in dev and absent in prod. At 390px the health card sits below the wrapped header with no overflow (`health-dev-390.png`).
  - This closes the inline `npm:` import and build concern from S5.

**S6 repairs, checked in source:**
- **DataTable header:** the guarded rule for the data-table header only sets `flex-direction: row` and `align-items: center`. It removes the dependency on Card load order without new tokens. `data-table-light.png` now shows the heading left-aligned in the row.
- **Overlay focus:** the trigger/close `:focus-visible` rings in `floating.css` and `sheet.css` are guarded Utility rules using the standard 2px ring roles.
- **Avatar test:** it now checks the rendered presence part, class and state, with and without `src`. That's stricter than the old fixed child-index check.
- **Registry-authoring test:** the historical fixture is unchanged, and the only allowed difference is the CodeBlock dependency on `npm:highlight.js@11.11.1`.
- **JSR audit helper:** it now skips JSON exports only in the `@module` tag scan, after the unconditional existence check. The new test proves an undocumented TS export and a missing JSON export still fail, and that the JSON export isn't scanned for tags.
- **Capture script:**
  - The progress midpoint freeze is removed with `removeProperty` before reduced motion is emulated.
  - The Accordion exemption applies only to `scope === 'accordion'`, and only for the strict 2px assertion.

**Before the commit / CI handoff:**
1. **`data-table.css` is not staged yet**, while the other 15 source changes are. Commit all of them together, then re-verify the commit against `final-source-hashes.json`.
2. **`s6-gates.json` has stale `gitHead` values.** It records `0272640` for `docs-accuracy` and `quality-gate`. Point those entries at the frozen `8e5e8b1` receipts.
3. **Wording in the PR body:**
   - Runtime and leak hygiene stay UNPROVEN (24 unproven survivors, 0 mutations); never call them PASS or READY.
   - Report the 53 dependency advisories as pre-existing.
   - Optionally note that CodeBlock still uses the inline `npm:` specifier, which the build has now proven works.
