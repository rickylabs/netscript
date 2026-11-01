**Verdict: FAIL_PLAN** (round 1 of 2)

The overall design is right: Theme set routing, the reused name collision decision, and the full list of languages. But three gaps would let a faithful run of this plan still overwrite Figma-owned values or measure the wrong surfaces. I read only the run files, the assignment, the token code and the export README and JSON. I made no edits and ran nothing.

## Blocking

**B1. The code that writes its own values over presets is never addressed.**
- `figma-token-source.ts:297-385` (`applyPresetOverlay`) does three things for `bloom`, `cupertino`, `liquid` and `terminal`:
  - it points core roles at pack roles through `PRESET_ROLE_MAPS` in `preset-role-map.ts`;
  - it hard-codes Bloom and Liquid fonts, radii and type sizes;
  - it patches Liquid's dark `success/text`.
- `addNodeRoles` (`:389-470`) adds more fixed values: radii, Liquid colors, and Terminal key styles that depend on the preset id.
- Figma now owns these values in Theme B, and they disagree with the code:
  - `radius/card` is Bloom **32**, but the code sets **22** (around `:340`);
  - `radius/card` is Liquid **14**, but the code sets **16** (`:382`).
- If these overlays stay, code overwrites Figma values. That breaks "Figma owns values" and means the four Theme B presets are only partly their own.
- **Fix:** decide overlay by overlay. Remove each one where Theme set now supplies the role. Keep only pure name aliases that have no Figma counterpart. Add a regression test that fails if an overlay overwrites any name Figma exports.

**B2. "Chart surfaces" is never defined.**
- The plan doesn't name the backgrounds. The source defines them in `variables-change.md:634-637`:
  - `surface/bg`;
  - `card/bg`, composited when it is translucent;
  - `surface/card`;
  - the theme's own base surface where one exists (`cupertino/surface-*`, `liquid/surface/*`, `fluent/solid/base`).
- The plan also doesn't say which foreground names are measured. There are three sets:
  - Scheme `chart-1…5`;
  - Theme set `chart-l|d-*`;
  - Studio flavor `studio-chart-l|d-*` (`studio-flavor.json:460+`).
- **Fix:** name each foreground set, the background set per preset with paint stacks, and how pack ownership works for the three faithful presets. `ownedRole` and `PACK_PREFIXES` in `check-token-contrast.ts:12-32` decide which pack roles a preset may read, so this decides whether Fluent 2 Web can measure `fluent-*` surfaces at all.

**B3. The new presets' settings and the meaning of existing ids are not specified.**
- Six new presets need ids and settings, none of which the plan gives: Ledger, Signal, Glass, macOS 27, Apple Classic and Fluent 2 Web.
  - The settings for each are Theme set, Theme or Theme B mode, gray, accent, flavor and source density.
  - The ids must be unique against `studio-ledger` and `studio-signal`.
- Four existing ids change meaning. `bloom` currently maps to Tonal, `cupertino` and `liquid` to Glass, and `terminal` to Signal (`token-presets.ts:49-55`). This is a visible value change for any app whose `theme-preset.json` names one of them. Record it as an intended change in `drift.md` and the PR.
- Theme B has its own gray ramps (Terminal's canvas aliases `Theme B/gray/l/1`). So "the existing fixed gray/accent model" may not apply to Theme B presets. State what Base gray and accent each one fixes, and where they have no effect.
- Re-check the code paths that test the preset id: `'brutal'` at `:189` and `'terminal'` at `:462`.

## Non-blocking (fold in with the fix)

- **N1. "Resolves fully" needs a definition for the faithful presets.** Suggested test:
  - every alias resolves;
  - no exported name falls back to NS One (`:117-128` fills missing names from NS One today);
  - no code overlay applies;
  - `font-requests.json` covers the Theme B fonts (Funnel Sans, Inter, Geist Mono, Open Sans).
  
  Then report which of the three faithful presets ship.
- **N2. Pairs measured in one scheme only need a contract change.** `TokenContrastPair` only filters by preset, and `applies()` at `check-token-contrast.ts:24` ignores scheme. Name the new field. The foreground pattern at `:39` won't catch `code-syntax-*` or `chart-*`, so the required-coverage rule must be its own named check with a negative-control test. The code background is `code-bg`: white in Light, `gray/d/2` in Dark.
- **N3. The gate list hedges.** The plan says "applicable `check:*`"; the brief says every one. Also list explicitly:
  - regenerating the four carriers;
  - reverting `docs/site` `deno.lock` churn;
  - registry-template lint;
  - `arch:check`;
  - the 6,000-byte gzip budget for default NS One CSS and the app CSS bounds (`README.md:192-196`). This one is at risk because Scheme grows from 399 to 462 variables and Theme from 146 to 340.
  
  Name a gate for each commit slice.
- **N4. Add a guard against other shared names.** I confirmed the new export has exactly the same four Scheme COLOR / Studio FLOAT name collisions, so reusing `name-migrations.json` is valid. Write that check down as the recorded decision the brief asks for. Also assert that no other web name is shared across collections besides the Theme / Theme B / Theme set triple. The importer loop at `:62-88` would silently keep the last write for same-type duplicates, and `role()` only catches type conflicts.
- **N5. New exclusions need provenance.** Say what source and reason text they get (for example, a link to the failing-pairs report), and whether the inherited-S0 tag stays.
- **N6.** Make the Theme set modes `A`/`B` and the collection names constants. The worklog only says "as needed".
- **N7.** Each token's `figma` metadata should record Theme set plus the Theme or Theme B mode it resolved to.

## Passes

- **Routing:** the matrix was queried with `--json` and recorded. The owner's evaluator override is quoted word for word in `worklog.md` and `supervisor.md`. The evaluator is from a different vendor family and runs read-only. The plan limit of 2 rounds is noted.
- **Deduplication:** #2493 only exports values, no other PR implements this, and there is no triage comment. The plan correctly emits one token per name through Theme set. It also fixes the direct `'Theme'` reads at `:97` and `:184`.
- **Language completeness:** every mode is accounted for, 24 presets in all.
  - The 10 Theme modes: Studio becomes NS One plus the 7 Studio flavors; Ledger, Signal and Glass are new; Filigrane, Tonal, Brutal, Fluent, Tactile and Pixel already exist.
  - The 7 Theme B modes each get their own preset.
  
  This matches the source's resolver check of 23 scenarios plus NS One.
- **Report and process:**
  - The report fields cover the brief, and the background paint stack is a superset of "background role".
  - The burn-down stays open, and the PR uses Refs #2450 with no labels.
  - READY waits for every required check green at the exact head, and runtime is UNPROVEN without Docker.
  - All seven design checkpoint items are present.
- **One hazard to keep out of the PR body:** the generic assignment text says the body must end with `Closes rickylabs/netscript#2450`. Because the PR is in the same repository, that line would auto-close #2450 and contradict the owner's open burn-down. The worklog already records that the owner's process wins.

**To get a PASS:** amend `plan.md` for B1–B3, add N1–N3 to the plan's steps or gates, and note N4–N7 in the worklog.
