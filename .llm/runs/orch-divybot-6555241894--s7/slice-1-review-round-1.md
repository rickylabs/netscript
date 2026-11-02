**Verdict: FAIL_FIX.** There is one blocker in the slice. Separately, the browser and link verification you said is still running has to finish before sign-off.

**Blocker: the preview only ever shows the ns-one theme**
- The preview page at `docs/site/design-system/components.page.ts:27-46` loads one theme stylesheet, `packages/fresh-ui/registry/theme/tokens.css`. That file only has rules for ns-one (`:root` and `[data-theme='ns-one']`, lines 282–691).
- `tools/docs-site/fresh-ui/preview.tsx:11-16` sets `data-theme` to the preset's language and `data-flavor` to its flavor, for example `studio` and `utility`. The selectors for those values only exist in `packages/fresh-ui/registry/theme/presets/<id>.css`, and nothing ever loads those files. `generate.ts:297-301` also skips `/theme/` when building `components.css`.
- Result: the default `studio-utility` preview, and 23 of the 24 presets on `/create/`, render with ns-one token values. The fonts, data attributes and side-panel text change, but the components don't actually take on the chosen theme. That breaks the "truthful fixed presets" requirement and the plan's promise that the preview uses each preset's shipped theme CSS.
- The browser test doesn't catch this. `tools/fresh-ui-browser/docs-tests/components.spec.ts:59-62` only checks the `data-flavor` attribute, not the resolved token values.
- **Fix:**
  1. Have `components.page.ts` publish each `registry/theme/presets/<id>.css` under `/assets/fresh-ui/`, or have `generate.ts` copy them there.
  2. Have `preview.tsx` load the stylesheet for the selected preset, either instead of `tokens.css` or with the preset loaded last.
  3. Add a browser assertion that a computed `--ns-*` value in the preview frame matches the value in `packages/fresh-ui/registry/theme/tokens.json` for at least two different presets, such as `studio-utility` and `studio-cloud`.

**Required before the sign-off commit (not a code defect)**
- The final browser matrix result for all four projects (light/dark × 390/1280), run after the prop-table overflow fix, recorded in `.llm/runs/orch-divybot-6555241894--s7/slice-1-evidence.md`.
- The final `deno task --cwd docs/site build` plus `check:links` result on that exact tree. `slice-1-evidence.md:8-9` currently says both are still pending.

**Checked and fine for this slice**
- **Generator coverage:** pages come from the registry's component and block items, not a hand-kept list (`generate.ts:26-29`). A new item without a required rich example fails the build with a clear error (`examples.ts:101`). Missing output and stale inputs are both rejected (`check.ts:6-58`). The test covers adding a registry entry and changing an input.
- **ns1_ reuse:** `encodeUiPreset` and `decodeUiPreset` are imported directly from `packages/cli/src/kernel/domain/ui/ui-preset.ts`. The code puts the real `style-utility` registry style item in the preset (`generate.ts:139`, `builder.ts:51`), and `font`/`iconLibrary` choices are rejected (`builder.ts:16`).
- **Fixed axes:** the side panel shows each preset's own accent, density, radius, fonts and menu values, and no independent axes are invented (`builder.ts:53-60`). The flavor control just picks a Studio preset.
- **Base paths:** the site's `base_path` plugin rewrites the generated `href`/`src` values. The builder reads the iframe's already-rewritten `src` rather than the `data-preview-url` attribute (`builder.ts:28`). Both scripts fetch the catalog relative to their own location. The browser config tests under `/netscript/`.
- **Build integration:** `build:fresh-ui` runs before Lume and `check:fresh-ui` runs after the build (`docs/site/deno.json:4,15-16`). The generator type-checks the examples before bundling (`generate.ts:256-270`).
- **Prop docs:** props come from native `deno doc --json --private` on the copied consumer sources. Compound-component props keep their owning interface, and `extends`/type aliases are emitted as signatures (`read-props.ts`, `generate.ts:171-206`). The test compares against real `button.tsx` output.
- **Scope:** the edit to `tools/fresh-ui-browser/docs-tests/components.spec.ts` is outside the original writable surface, but it is recorded in `drift.md:7`.

**Non-blocking**
- The build intermediates live in a directory named after this run, `.llm/tmp/s7-docs/` (`generate.ts:11`, `components.page.ts:7`). Consider a neutral name, since the docs build will keep using it after this run.
- `preview.tsx:14` writes the Figma source density label (e.g. `chunky`) into `data-density`. Nothing in the shipped CSS reads that attribute, so it's harmless, but the field could easily be mistaken for the token density value.
