**Verdict: FAIL_FIX** (one small blocker, about the dependency record)

This is a review of the source only. The final zero-exclusion reproducibility run and the 52-case browser rerun are still pending, so this verdict doesn't stand in for them.

### B1. The Pagefind override isn't measured in the run record, and the record now says something false
- **What changed:** `docs/site/deno.json:17` maps the pinned Lume plugin's `npm:pagefind@1.3.0` to `npm:pagefind@1.5.2`.
- **Lock entries added in `docs/site/deno.lock`:**
  - the specifier `npm:pagefind@1.5.2` (`:44`);
  - `pagefind@1.5.2` (`:453-465`);
  - seven `@pagefind/*@1.5.2` platform packages, including the new `freebsd-x64` and `windows-arm64` (`:278-328`);
  - the workspace dependency `npm:pagefind@1.5.2` (`:768`).
- **Old entries left behind:** the `pagefind@1.3.0` specifier, package and five platform entries are still there (`:43,273-323,442-452`). They're unreferenced once the remap applies.
- **The run's drift file is now wrong:** it still says the nested lock change "adds only lightningcss-wasm1.29.2 … and three pinned Lume module hashes; no existing entries change or disappear" (`drift.md:7`). Its Pagefind paragraph (`drift.md:9`) explains why 1.5.2 was chosen but never measures the lock change. The supervisor requires dependency changes in the lock to be "explicitly measured" (`supervisor.md:5`).
- **Required fix:** update `drift.md` with the exact Pagefind lock change listed above. Then either remove the unreferenced 1.3.0 entries using native lock tooling, with no other changes, or state that they're intentionally kept and why. No code change is needed.

### Checked, no blockers
- **Deterministic IDs:**
  - The `afterRender` identity pass is registered before `pagefind(...)` and before `aiTooling()` (`docs/site/_config.ts:134-210,219`).
  - Tab, panel, `aria-controls`/`labelledby`, comparison `select`/`label` and diagram namespaces now come from the page URL plus the element's position on the page (`_config.ts:144-198`).
  - No `Math.random` or `randomUUID` is left in owned templates or filters. The only matches are inside code samples in content pages.
  - Diagrams are inlined once at render under a fixed namespace, then given their final per-page namespace. The B3 build guard runs first (`_config.ts:182-198`).
- **Token provenance in the style policy:**
  - A raw custom property in the bundle passes only if its exact `[selector, property, value]` exists in a token-layer stylesheet (`tools/docs-site/style-policy.ts:168-184`).
  - Only the built `styles/docs.css` is marked as the token bundle, and standalone partials keep their full checks (`tools/fresh-ui-browser/docs-tests/docs.spec.ts:432-437`).
  - The negative controls fail as they should, both in a maintained source and in the bundle: an authored raw custom property, a changed value and a wrong selector. An exact copy of the token layer passes with no findings (`docs.spec.ts:494-518`).
- **Reader fixes:**
  - The built bundle contains no `@import` and does include tokens and component rules.
  - The chip stack gap measures 8 px between all four chips (`docs.spec.ts:118-129`).
  - Permalinks are named after their heading (`_config.ts:231`).
  - The reference lane is found by its stable `id` (`docs/site/_data.ts:41,135`).
  - `dotenv` is registered as plain text (`_config.ts:129`).
- **Pagefind version choice:** pinning the specific upstream release that fixes deterministic output, through the docs import map and without patching output or excluding search files, is a sound approach. The 52-case browser rerun has to confirm the 1.5.2 runtime and fallback UI work with `search.js` and the existing assertions.

### Not blocking
1. **The override could silently stop applying.** If the Lume plugin's specifier ever changes, the import-map key won't match and determinism would quietly regress. Have the reproducibility check also assert the Pagefind version recorded in the built `pagefind/pagefind-entry.json`.
2. **Headings are still read twice by screen readers.** The permalink anchors are still inside their headings, so each heading's accessible name still repeats ("X Permalink to X"), as noted in an earlier review.
