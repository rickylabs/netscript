# Independent coordinator-repair evaluation

Same separate read-only owner-selected Opus5.5high evaluator, following the coordinator CHANGES at49fb038. Private identifiers omitted.

# Repair slice review (PR2560, against 49fb038)

**Verdict: PASS.** Both review blockers and the smaller requested items are actually fixed in the source, and each fix has a test that fails without it. I found no new blockers.

## Blocker 1: no runtime Google Fonts

- **No remote font loading left:** nothing under `tools/docs-site/` or `docs/site/` refers to `fonts.googleapis.com` or `fonts.gstatic.com`. The generator and catalog no longer read the font URLs in `registry/theme/fonts.json`, so that dead metadata is gone.
- **Docs fonts stay self-hosted:** `docs/site/_includes/layouts/base.vto:12-13` still loads only the site's own font file and `fonts.css`.
- **Preview has no font injection:** `tools/docs-site/fresh-ui/preview.tsx` only swaps the same-origin preset stylesheet and sets attributes. The new `data-preset` attribute gives the browser test a reliable readiness signal.
- **UI note is explicit:** `render.ts:160` and `README.md:26-28` say other font families fall back to the stacks each preset declares.
- **The test fails for the right reason:**
  - In `components.spec.ts:198-258`, every request to another origin is recorded, blocked and fails the test. It covers the builder's first load, all 24 preset selections and all 52 component previews.
  - Run against the old build, it caught both Google Fonts requests and failed (exit 1). The repaired build passes: 158 passed, 6 census-only skips.

## Blocker 2: decoder size cap and named errors

- **Cap comes first:** `ui-preset.ts:53` rejects input over 4,096 characters before any URL, base64 or JSON parsing.
- **Three named errors:**
  - `UiPresetTooLargeError` for oversized input.
  - `UiPresetMalformedError` for bad URLs, base64, UTF-8, JSON, schema or plain ids.
  - `UnsupportedUiPresetVersionError` for an unknown `nsN_` prefix (`ui-preset.ts:58`) or a version other than 1 inside the payload (`:66`). These are two separate checks, and the catch-all at `:71` keeps the version error from turning into "malformed".
- **Outputs are bounded too:** `encodeUiPreset` (`:81`) and `uiPresetUrl` (`:89`) refuse to produce anything over the cap.
- **Bad URLs get normalized:** in `builder.ts:76-83` an invalid `?preset=` sets the status message, keeps the default preset, and the final `refresh()` replaces the URL with a valid code. Browser lines 193-195 confirm this with a 5,000-character code.
- **Valid codes unchanged:** round-trips of codes, shared links and plain ids still work, including a plain id exactly at the limit (`ui-preset_test.ts:18-23, 39-40`). Valid codes encode exactly as before, so the earlier token and render proof still holds.
- **Negative control:** with the cap removed, a valid 1 MB code was accepted and the test failed (exit 1); with the cap restored it passes. The existing callers, `resolve-preset.ts` and `ui-preset-command.ts`, need no changes.

## Smaller items

- **Edit links:** generated pages now point `edit_source` at `/design-system/components.page.ts` (`render.ts:118,131,151`). `generate_test.ts:52-53` checks that the file exists. The browser test checks the edit link on all 54 generated pages: the builder, the index and the 52 references.
- **One byte budget:** `DOC_PAGE_BYTES` is gone. `check.ts:2` imports MCP's `DOC_CONTENT_BUDGET` directly, and that constant's source file is now part of the freshness hash (`generate.ts:40`).
- **Scope notes:** `drift.md` records the independent accent, radius, font, icon, density and menu pickers as remaining scope, and the matching note is on #2420.

## Non-blocking notes

1. The plain-id pattern `^[a-zA-Z0-9][a-zA-Z0-9-]*$` is stricter than before. An odd id now gets "malformed" instead of "Unknown token preset". All shipped ids are kebab-case, so nothing valid changes.
2. The third-party-request check runs on the builder and the preview pages. The outer reference pages are only fetched as HTML text, outside the interceptor. They already use only the self-hosted fonts, so the risk is low.
3. The full census runs only in the `light-1280` browser project. That is acceptable because the 12 representative cases run in every project.

## Still open (administrative, not missing work)

- Refreshing the token and render proof: valid codes encode the same as before, so this is a formality.
- Final root `check:*` results on the new head.
- Coordinator CI, including the runtime run, on the final head.
- The READY transition, still draft / Refs #2420 only / no labels.

Local `scaffold.runtime` is still **UNPROVEN** because Docker is unavailable; it is not a pass. The mixed component/workflow guidance and transfer-size observations stay advisory and deferred, as you asked.
