**Verdict: PASS.** The round-1 blocker is fixed, I found nothing new that blocks slice 1, and it can take its sign-off commit. I re-read the evidence file and the repaired source; I did not run the build or browser suite myself, so the pass counts below come from the evidence file.

**Round-1 blocker: fixed**
- **No more ns-one fallback:** the preview page no longer loads `tokens.css`. It starts from `presets/studio-utility.css` (`docs/site/design-system/components.page.ts:50`), and that page publishes all 24 canonical preset files at `/assets/fresh-ui/presets/<id>.css` (`components.page.ts:27-37`).
- **Preview waits for the right theme:** `tools/docs-site/fresh-ui/preview.tsx:11-19` swaps in the selected preset's stylesheet and waits for it to load before setting the theme attributes, mounting, and signalling it's ready. Those attributes (`data-theme`, `data-flavor`, `data-scheme`) match the selectors in the preset CSS.
- **Freshness covers the theme files:** the preset files live under the registry directory, which the input hash already covers. `tools/docs-site/fresh-ui/check.ts:27-37` also fails if any published preset stylesheet is missing.
- **The test now checks real theme values:** `tools/fresh-ui-browser/docs-tests/components.spec.ts:55-87` compares the preview's computed `--ns-radius-control` and `--ns-font-sans` against the catalog values (taken from `packages/fresh-ui/registry/theme/tokens.json`) for both `studio-utility` and `studio-cloud`.
- **The test can fail:** swapping in the Utility stylesheet for Cloud makes it go red (exit 1), so it isn't a test that always passes.

**Rest of the slice, re-checked**
- **Coverage:** 52 component/block pages and 24 presets, with the census mounting all 52 previews. The census also checks that the loading placeholder is gone (`components.spec.ts:111`).
- **Fixed presets:** the catalog keeps the token density and Figma's source density label as separate fields (`tools/docs-site/fresh-ui/generate.ts:143-144`, `tools/docs-site/fresh-ui/catalog.ts:33-34`), so `data-density` now carries the real token value.
- **Preset codes:** the existing `ns1_` codec is reused. The code names the real `style-utility` style item, and font and icon-library choices are still rejected.
- **CLI commands:** the init command shows the project name, both in the server-rendered page and after JS refreshes it (`tools/docs-site/fresh-ui/render.ts:175`, `tools/docs-site/fresh-ui/builder.ts:64-69`).
- **Base paths:** asset links are rewritten for the `/netscript/` deployment path. The stylesheet URL is resolved from the already-rewritten link, and the browser config runs under `/netscript/`.
- **Build integration:** `build:fresh-ui` runs before Lume and `check:fresh-ui` runs after the build. The build directory is now `.llm/tmp/fresh-ui-docs/` (`generate.ts:11`, `components.page.ts:7`).
- **Prop docs:** the generation path is unchanged and still comes from `deno doc --json --private`.
- **Evidence:** per the evidence file, the browser run was 17 passed, 0 failed, 3 census-only skips, covering all 12 page × scheme × width cases. Links: 33,127 checked, 0 unresolved. Largest agent twin: 5,013 bytes (limit 12,288).

**Non-blocking**
- **Density label mismatch:** before JS runs, the server-rendered density label shows the token value (`compact`) (`render.ts:162-163`). After JS runs it shows the Figma source label (e.g. `Chunky`) (`builder.ts:57`). Consider using one source for both.
- **Weak preset-CSS check:** `check.ts:36` only checks that each published preset file isn't empty, not that it matches the source. That's acceptable given the computed-token browser test, but a byte or normalized-content comparison would catch stale copies without a browser.

I did not evaluate MCP routing, the canonical carriers, the #2410 fix or the full CLI proof; those belong to the later slices.
