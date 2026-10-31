**PASS**

This is the independent Anthropic IMPL-EVAL and slice review of the PR #2437 S8b review repair (working diff on `660da01f`). It is documentation-only, and I found no blockers.

**Blocker 1: the 13 theme H2s are required once, in order. Fixed.**
- `docs/site/_plugins/design-system.ts` defines `THEME_SECTIONS` (8 spec + 5 extension sections). `validateSections` rejects a missing, duplicated or out-of-order section. `parseTheme` calls it, so any bad theme stops the build.
- Headings only count when they are real H2s. Ones inside HTML comments, fenced code blocks or indented code are ignored, and `###` lines don't match.
- `loadDesignSources` also rejects the build if the `_template/DESIGN.md` headings differ at all from the contract, so the template can't change without the validation changing too.

**Blocker 2: the test fixture uses independent fixed lists, and source deletions are caught. Fixed.**
- `REQUIRED_THEME_H2S` and the guidelines list for sections 1–8 are written out by hand in the fixture. Nothing is imported from the production constants or read from the source under test.
- The fixture checks each required theme section and each guidelines section (1–8) against these fixed lists. It also has a test that deletes Colors from both the input and the output and requires a failure.
- The three named regressions were red before the fix: `review-negative-red.json` shows 0 passed / 3 failed, each with "Missing expected exception". After the fix they pass (`review-tests-green.json`). Extra checks cover each H2 being missing, fenced or duplicated, plus reordering and deleting any guidelines section.

**Blocker 3: guideline cross-links use real IDs and must exist. Fixed.**
- `guidelineAnchor` in `docs/site/_plugins/design-system-render.ts` takes the ID that the configured Markdown engine actually produces. It then checks that the ID appears in the full rendered guidelines page and throws if not. No hand-written `#…` guideline anchors are left in the generator.
- A renamed referenced heading fails the build. Renaming it trips the section check before any link is built. The anchor check has its own test, which removes the ID and expects an "anchor" error.
- The fixture also confirms that every `/design-system/guidelines/#…` link on all 15 pages points to an existing ID. Separately, `check-internal-links.ts` checks link fragments when the site is built.

**Polish: all three verified.**
- **CSS:** each of the 15 pages links `/assets/design-system/section.css` and none has inline `<style>`; the fixture asserts this.
- **Thumbnails:** the gallery uses 480px thumbnails, generated at build time from the originals with Lume's pinned Sharp helper. Nothing new is committed (`_site/` is gitignored, and the docs lock and binary assets are unchanged). The audit shows 34 images and 0 committed thumbnails.
- **TOC:** it now reads "Theme values" › "Values: Colors / Typography / …", separate from the prose "Colors". The `tonal--fixed-toc.png` screenshot confirms the labels are distinct.

**Independent re-run:** I ran `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --cwd docs/site -- --no-lock --allow-read _plugins/design-system/renderer-fixture.ts` without `--output`. It exited 0 with 13 passed and 0 failed, and the working tree was unchanged afterwards.

**Hygiene:** the public review notes and edited run files contain no absolute paths, session IDs or process listings. The resource report gives counts only.

**Non-blocking notes:**
- The section-5 regression matches its error with the loose regex `/5/`.
- The rename regression is caught by the section check, not by the anchor code. The anchor code is covered only by the separate ID-removal test.
- `assertCompleteTheme` now checks required H2s only, not every H3/H4 heading in the real themes.
- The misorder test is built from a duplicate heading, so it doesn't fully isolate the ordering check.

**Sign-off:** I approve committing this repair as the substantive slice sign-off. The full runtime gate (`deno task e2e:cli`) is still **UNPROVEN**: it exited 1 at the Aspire environment check before scaffolding, and Docker wasn't available for cleanup. That needs a provisioned runner before merge. This approval does not cover runtime readiness.
