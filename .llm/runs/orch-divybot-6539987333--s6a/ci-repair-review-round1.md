**Verdict: FAIL_FIX.** One blocker: the new legacy-alias browser test can't fail, so it doesn't actually check the aliases. The three test-contract fixes and the axe baseline migration are correct.

**Hashes and scope:** all 7 files match `ci-repair-source-hashes.json`. Against HEAD `e501f41`, the diff touches only test, tool and README files plus run evidence; no production source changed since the S6 PASS. I re-ran the three CLI test files read-only: 10 tests (22 steps) pass, and the worktree is unchanged afterwards.

### Blocker: the iframe alias check in `design.spec.ts` compares two meaningless values
- **What it does:** it loads `/presets/ns-one.css` alone in an iframe, sets `background:var(--ns-background);color:var(--ns-foreground)` on the body, then compares the explicit form (`data-theme=ns-one` + `data-scheme`) with the alias form (`data-theme=light|dark`).
- **Why it can't fail:** neither `--ns-background` nor `--ns-foreground` exists in `presets/ns-one.css` or `tokens.css`; the real roles are `--ns-bg` and `--ns-fg`. Both declarations are invalid when computed, so both reads return the defaults (transparent background, initial text colour) whatever the theme attributes are.
- **Effect:** the check passes even if the aliases are broken or the stylesheet never loads. The old test it replaced compared real computed body colours, so this is lost coverage, not just a style issue.
- **Fix:**
  1. Bind the iframe body to `var(--ns-bg)` and `var(--ns-fg)`.
  2. Make it able to fail. Assert the explicit background is not `rgba(0, 0, 0, 0)` and that the light and dark explicit colours differ (or equal known NS One values), then keep the alias-equals-explicit assertion.
  3. Optionally run a negative control, such as a bogus `data-theme` that must produce different colours.

  Then rerun the browser contract and the full replay.

### Verified correct
- **`route-templates_test`:** it now asserts the reviewed filter (`appNavigation.filter((item) =>`, `!item.developmentOnly || import.meta.env.MODE === 'development'`, `).map((item) => (`). Those strings match the actual layout template.
- **`template-asset_test`:** the whitespace-aware `assertMatch(/f-client-nav\s+class=/)` matches the template, where `f-client-nav` and `class=` are now on separate lines. The `f-client-nav={true}` ban is kept.
- **`render-resource-slice_test` goldens:**
  - The only change to `ResourceIsland.tsx.template` since the baseline is S1's `af6418f`. It replaced the `<pre>{JSON.stringify(query.data, null, 2)}</pre>` dump with the semantic `QueryResult` renderer, which I approved in S1.
  - All four cases render that same island, which is why the four updated hashes are identical.
  - The new hash passes against the current template, and the other golden hashes are unchanged.
- **Axe baseline migration** (I compared HEAD's baseline with the new one myself):
  - All 8 old default token/component cases are byte-identical under the matching explicit `?preset=ns-one` keys.
  - The 4 `?preset=studio-utility` cases are unchanged (empty).
  - The new default token cases are empty.
  - The new default component cases are exactly the old non-contrast subset: the 3 DesktopTrayMenu fingerprints (`aria-required-children`, 2× `listitem`).
  - The `engine` and `debt` sections are unchanged, and no fingerprint was added or increased.
  - Coverage isn't weakened by the matrix: legacy findings are all still tracked, and the Utility component gallery is now actually scanned.
- **Navigation tests:** these are real checks. They leave an NS One preview, confirm Utility metadata (`studio`/`compact`/`utility`, no `/presets/` sheet, Utility fonts), then browser Back must restore NS One metadata, the single `ns-one.css` link and NS One fonts. The default route must not add a duplicate preset stylesheet.
- **README:** "20 cases" matches 5 routes × 2 widths × 2 schemes, and the wording about the default and the explicit NS One previews is accurate. Once the fix lands, add one line saying the alias check reads `--ns-bg`/`--ns-fg`.

Runtime and leak hygiene stay **UNPROVEN**. Nothing here certifies remote CI or READY. The terminal-failure streak is now 1.
