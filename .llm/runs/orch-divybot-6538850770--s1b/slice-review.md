# Slice review (read-only, independent): Tokens v2 S1b token implementation

**Status: not a final verdict.** I made no edits and ran nothing. Tests, carriers and the CI gates are still running, so this is a code review only, not a PASS. Overall the core routing is sound and matches the approved plan. I found two medium issues in the report data, one medium public-API risk, and several low-severity gaps. One process item blocks sign-off.

## Checked against the plan: no findings

- **Theme set routing.**
  - Theme and Theme B are never iterated directly (`figma-token-source.ts:96`). Shared names resolve once, through Theme set's A/B alias.
  - Border width, shadow y, shadow blur and shadow x are all read from Theme set (`:127-146`, `:226-231`). The brutal-only special case is gone.
  - `figmaModes` sets the inactive collection to its declared default (`token-presets.ts:85-97`).
- **Core overlays removed.**
  - `applyPresetOverlay` and `PRESET_ROLE_MAPS` no longer exist. `LEGACY_ROLE_MAP` is only used for NS One.
  - The legacy fallback skips any name Figma exports (`:163`).
  - None of the hard-coded node roles collide with an exported WEB name; I grepped the export to confirm.
  - The test that every exported name equals its source value runs on the final output (`theme-set.test.ts:45-87`), so any overwrite would fail it.
- **Duplicate guards.** Shared names must match by type and code syntax with equal counts (`:64-74`). Any other duplicate WEB name throws (`:75-87`). Collection order is sorted and tested in reverse (`theme-set.test.ts:91`).
- **The four cross-type names.** They are migrated to `-width` (`name-migrations.json`), and stale migrations are rejected (`:103`).
- **Public contract (plan-eval condition C3).** `themeSet?` and `schemes?` are optional and additive. The new metadata fields are optional, and the `themeMode` doc comment is updated (`token-contract.ts:54-67`, `:134-137`).
- **Presets.** All 24 presets match the B3 table. Every Theme and Theme B mode has a preset (`theme-set.test.ts:16-43`). All three faithful presets resolve every variable in every non-theme collection.
- **Contrast coverage.**
  - Chart pairs: 225 (15 non-Studio chart roles × 13 surfaces, plus 10 Studio roles × 3), all at 3:1.
  - Syntax pairs: all 7 at 4.5:1 on `code-bg`.
  - The per-scheme filter is validated. Removing a chart or syntax pair fails, and threshold changes fail (`check-token-contrast.ts:78-141`).
- **Exclusions and report.** Exclusions are regenerated from zero, and a pair is excluded only on an exact match (`report-token-contrast.ts:21,43-59`). The report test ties each JSON row to its exclusion and pair (`contrast-report.test.ts`).
- **Default CSS.** It equals the committed `tokens.css`, keeps the legacy prefix, and the test still asserts the 6,000-byte gzip limit (`output.test.ts:350-373`).

## Code findings

**F1 (medium; public-API risk). The Italic encoding gives `--ns-weight-em` and `--ns-studio-weight-em` two value types.**
- Italic presets emit `italic`. Signal, Brutal and Terminal alias the body style, so they emit `400`/`500`.
- The DTCG value is `400` while the CSS value is `italic`. DTCG/Style Dictionary consumers therefore read Regular, and CSS readers read italic.
- In CSS, `font-weight: var(--ns-weight-em)` is invalid in the Italic presets, and `font-style:` is invalid in the numeric ones.
- It meets C1 as written and is recorded (`token-values.ts:95-102`, README:104-106, drift). No in-repo component consumes it yet.
- **For final IMPL-EVAL:** either record it as accepted debt with its cost (a later `-style` name migration), or move to the `-width`-style rename now.

**F2 (medium; report accuracy). `tooltip-*-kbd` is checked as text at 4.5:1, but Figma says it is a fill.**
- The heuristic at `check-token-contrast.ts:44` treats it as a foreground, and the pair registry measures it against `tooltip-*-bg`.
- Figma describes `tooltip/*/kbd` as a "kbd chip fill", which is `surface/d/raised`, the same colour as `tooltip/d/bg`.
- The result is near-1:1 failures, and that pair is the worst row in 23 of the 48 preset/scheme rows in `failing-pairs.md`. Those rows would send the Figma burn-down after values that are equal by design.
- NS One maps `tooltip-kbd` to `inverse-fg`, so the role's meaning is genuinely ambiguous.
- Verify whether this was inherited from S1. Then either reclassify it (kbd text on kbd fill, or a 3:1 boundary check) or mark these rows "classification under review" in the report.

**F3 (medium-low; report provenance). NS One's 7 syntax failures can't be fixed in Figma.**
- These are the `ns-one`/light rows for `code-syntax-*` on `code-bg`, ratios 3.19–4.37 (`failing-pairs.json:150-235`).
- The foreground is a Figma Studio value, but `code-bg` is code-owned: `LEGACY_ROLE_MAP 'code-bg': 'muted'` (`preset-role-map.ts:116`).
- Their exclusion source still says "Figma export #2493" (`report-token-contrast.ts:49-51`). A Figma value pass can't fix these pairs. Attribute pairs that mix NS One mappings and Figma values to the compatibility map.

**F4 (low). The router check doesn't verify alias targets.** `:64-74` compares name, type and code syntax, but not that mode A aliases `Theme/<same name>` and mode B aliases `Theme B/<same name>`. "One token per name" depends on that identity, and a mis-wired router would route silently.

**F5 (low). An orphaned name migration goes undetected.** If a migration's variable disappears from the export, nothing fails (`:80-106`, `format-figma.ts:12-16`).

**F6 (low; tests).**
- `output.test.ts:388-393` finds each context in the same `app.contexts` array and compares it to itself, so it can't fail. It probably meant to compare against `full.contexts`.
- The inactive-collection test (`theme-set.test.ts:89-109`) only perturbs Theme/Studio for set-B presets. Changing Theme B/Bloom should also be proven not to affect set-A presets.
- There is no negative control for the Cupertino, Liquid or Fluent chart surfaces, or for `studio-chart-*`.
- The chart "weakened" control actually raises the threshold from 3 to 4.5.

**F7 (low). The report script hard-codes its provenance string** (`report-token-contrast.ts:18`), and `figma/index.json` carries no commit. The next export would stamp stale provenance into the exclusions.

**F8 (info).** The base gray and accent settings on set-B presets do nothing, because Theme B's ramps alias Primitives directly. Their settings in the preset table are only metadata.

## Process (blocks sign-off)

- **P1.** `worklog.md` stops at the plan gate, and `context-pack.md` still says "no implementation code changed". The leaf profile treats a slice as incomplete until its commit updates both.
- **P2.** `slice-review.md` is empty. The supervisor's sign-off record should cite this review.

## Release risks for final IMPL-EVAL

1. Every gate is still unproven. Confirm the token suites, `tokens:validate/check`, `quality:gate`, `release:preflight`, the native publish-size budget, the JSR audit and `deno doc --lint` for the new public fields, `docs:accuracy`, every `check:*` after carriers are regenerated, and that `docs/site` `deno.lock` churn is reverted.
2. The README says all three faithful presets fully resolve. The test only proves variable resolution. Font builds for Open Sans and JetBrains Mono at the requested weights are unproven until the build passes; `font-requests.json` has no constraints for them.
3. Decide on F1 and F2 and record the outcome. F2 and F3 directly affect the report that drives the open burn-down.
4. `scaffold.runtime` is UNPROVEN until it runs; if Docker is unavailable it stays UNPROVEN.
5. The READY comment must cite the exact head and both report paths. The burn-down box stays open, and the PR uses Refs #2450 only.
