# App startup and token lifecycle supervisor review

Separate Anthropic-family Claude Opus 5.5, high effort, read-only, closed stdin.

## Initial verdict

**FAIL_FIX — one blocker.** Everything else in the second slice that I checked is consistent with the existing contracts.

I only read the files; I ran nothing. The working tree changed while I was reviewing: `(design)/design/(_shared)/theme.ts.template` gained a `PresetId` return type partway through. My verdict is on that newer version, which also clears a type error I would otherwise have flagged.

### Blocker: the default `theme-bridge.css` points at variables the trimmed `tokens.css` no longer defines

- When `tokens.css` is built for the default NS One preset, `appContextTokens` (`packages/fresh-ui/src/tokens/adapters/format-css.ts:40-64`) drops the other language packs. That trim is intended.
- `formatThemeBridge` (`format-css.ts:123-139`) still builds the bridge from the full, untrimmed token set of the selected context. For every colour token outside the `color` path, including all pack tokens, it writes `--color-ns-<name>: var(--ns-<name>)`.
- In the checked-in default output, `packages/fresh-ui/registry/theme/theme-bridge.css` has 315 `var(--ns-<pack>-…)` references; one example is line 391, `--color-ns-studio-table-row-rule`. `registry/theme/tokens.css` declares none of these packs; a search for `--ns-(studio|liquid|tonal)-…:` finds 0 matches.
- Effect: the default theme still advertises Tailwind utilities for every pack, but they resolve to unset variables and fail silently. That breaks the reference-closure guarantee across the files that ship together.
- The closure test (`tests/tokens/output.test.ts:365-369`) only checks references within `tokens.css`, so it misses this.
- Non-default presets are unaffected: their bridge and `tokens.css` come from the same full context.

**Fix:** build the bridge lines from the same retained token set as the default CSS. For example, share `appContextTokens(selected)` with `formatThemeBridge`, or filter out any token `tokens.css` doesn't declare. Keep the legacy bridge prefix unchanged. Extend the closure test so every `var(--ns-…)` in `theme-bridge.css` must resolve against `tokens.css`. Then regenerate the frozen outputs.

### Checked, no blocker

- **Production routes and the design area:**
  - The app shell (`routes/_app.tsx`) imports only `lib/theme.ts`, which reads the small `theme-preset.json` and `fonts.json`.
  - The full `tokens.json` is loaded only by the design helper. The design middleware loads it lazily, after its development-mode check.
  - The preview theme lives in request state (`ctx.state.themePreview`), not a module-level global.
  - `production-theme_test.ts` follows imports from every non-design route and fails if one reaches `tokens.json` or a design module.
  - The design tokens page binds its route once, with `.withRoute(appRoutes.designTokens)`, and the router defines the three design routes.
- **Preview stylesheets are opt-in end to end:**
  - `PREVIEW_TOKEN_FILES` is exported from the new `./token-config` subpath, which is declared in `deno.json` exports.
  - The registry has a separate `theme-previews` item (kind `lib`, so the stylesheet aggregator's theme lookup ignores it) that copies to `static/presets/*`.
  - `tokens build` writes previews only with `--previews`, through `tokenOutputFile` to `static/`. That matches the `/presets/<id>.css` link the design pages use.
- **CLI token port:**
  - The port takes raw JSON strings, so compiler types stay out of the CLI.
  - `outputFiles` loads only the light `token-config` metadata, and the clean test makes the compiler/source loader throw to prove clean never loads it.
  - Clean keeps `theme-preset.json`, and a later build reuses that preset.
  - `init --force` replaces only the managed `tokens/source` folder, and only after the whole plan has been checked.
- **Builder:**
  - App builds skip Figma output and `theme-items.json`, and the test shows their core files are byte-identical to the full build.
  - Identical density contexts are deduplicated, and the duplicate keeps the same tokens.
  - Default `tokens.css` keeps the legacy byte prefix and is tested against the 6,000-byte gzip budget.

## Single repair verdict

**PASS.** The bridge blocker is fixed, and I found no new blockers caused by the change. I only read the files and ran nothing, so the test results I mention are from your evidence.

- **Bridge and CSS now use the same token set.** `formatThemeBridge` builds its lines from `appContextTokens(context)` (`packages/fresh-ui/src/tokens/adapters/format-css.ts:126`), the same function that trims the default CSS. The bridge still starts with the legacy prefix, and the legacy-bridge assertion at `output.test.ts:100` still checks it.
- **The checked-in default bridge is clean.**
  - `registry/theme/theme-bridge.css` used to have 315 references to pack variables; it now has 3, at lines 172–174 (`--ns-terminal-key-bg`, `-fg` and `-border`).
  - `registry/theme/tokens.css` declares all three, 6 times in total.
  - No line in the bridge points at a variable the CSS doesn't define.
- **The test now covers both files.** The closure check (`output.test.ts:366-369`) reads every `var(--ns-…)` in `tokens.css` and `theme-bridge.css` together and requires each to be declared in `tokens.css`. The `--ns-liquid-tag-green` exclusion and the 6,000-byte gzip check are unchanged.
- **Other presets are unaffected.** `appContextTokens` returns the full token set for any preset other than NS One, so their bridge and CSS output are the same as before.
- **The regenerated output is protected.** The published registry carrier includes `theme-bridge.css`, and `check:assets-barrel` fails if that carrier goes stale.

What still needs proving: the refreshed package, CLI and actual CLI runs against this repair are still in progress, and the full runtime remains unproven at the Docker/Aspire preflight. Both belong in the final IMPL-EVAL evidence.
