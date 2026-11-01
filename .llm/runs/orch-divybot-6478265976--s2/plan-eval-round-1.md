# PLAN-EVAL round 1

**FAIL_PLAN**

Four blocking findings, all from checking the plan against current source. Each would force rework if left until implementation.

1. **The preset flow either can't use `buildAppTokens` or breaks the "reuse, don't duplicate" rule.**
   - `buildAppTokens` (`packages/cli/src/kernel/application/tokens/build-app-tokens.ts:31`) takes `input.preset ?? config.preset`. Only `init-app-tokens.ts` ever writes the strict v1 `tokens.config.json` (`packages/cli/src/kernel/domain/tokens/token-config.ts:15`).
   - So `ui:apply --preset` / `ui:init --preset` that just call `buildAppTokens` leave the old preset in `tokens.config.json`, and the next `tokens build` silently reverts the theme. Plan decisions 3 and 6 never say which file owns the preset or how apply keeps the two in sync.
   - The token engine only accepts a preset id plus an override file path (`packages/cli/src/kernel/ports/token-engine-port.ts:2`). It always writes all five files in `APP_TOKEN_FILES`, fonts and theme together (`packages/fresh-ui/src/tokens/domain/token-output.ts:70`, `build-app-tokens.ts:55`).
   - That means `--only theme,font` can't narrow what gets written without duplicating token compilation. The plan also doesn't say what the base64url preset JSON contains, or whether non-id values would be written into the app-owned `tokens/semantic.tokens.json` override.

2. **The lock/conflict rules don't cover the files that legacy code already rewrites.**
   - Theme items copy into `assets/{styles.css,theme-bridge.css,tokens.json,fonts.json,tokens.css,theme-preset.json}` (`packages/fresh-ui/registry/theme/theme-items.json`). `buildAppTokens` / `tokens build` rewrite five of those same files.
   - `writeStylesAggregator` overwrites `assets/styles.css` on every add. It keeps the app's own styles below `APP_CUSTOM_STYLES_MARKER` (`packages/cli/src/kernel/application/ui/registry-styles.ts:7`, `:43`).
   - Under the plan's per-file SHA-256 plus "edited files are reported, not overwritten" rule, a normal `tokens build` or the user's own custom styles would count as local edits. Later `ui:add`, `ui:update` or `ui:apply` runs would then refuse or skip these files, which changes legacy aggregator behaviour.
   - The plan only says "distinct update path". It needs to say how these managed targets are hashed (or exempted) in `fresh-ui.lock.json` and how preflight treats them.

3. **`ui:remove` isn't in scope, but the lock makes it unsafe to leave alone.**
   - `removeUiRegistryItem` (`packages/cli/src/kernel/application/ui/registry.ts:191`) deletes files and prunes `deno.json`. Slice 4's command list doesn't include it, and nothing says it will prune lock entries.
   - The plan doesn't say whether "installed" now comes from the lock or, as today (`registry.ts:146`), from whether the files exist.
   - With stale lock entries, an unnamed `ui:update` would compare against files that no longer exist, and could reinstall items the user removed.

4. **The theme-docs assumption is wrong.**
   - The canonical `DESIGN.md` / `SKILL.md` files live in `docs/design-system/themes/<language>/`. That's outside the `packages/fresh-ui` publish include, and outside the `--allow-read=.` that `tokens:embed` runs with (`packages/fresh-ui/deno.json:53`).
   - A `registry.json` file path pointing there would also break the plan's own ban on traversal in local source paths.
   - The doc folders are named by language, but presets use ids (`ns-one`, `studio-utility`, … in `packages/fresh-ui/src/tokens/domain/token-presets.ts:39`). The default `ns-one` preset has no doc folder at all.
   - The plan needs to pick the generated carrier for embedding the docs and its freshness gate, which id `<id>` in `.agents/skills/fresh-ui-theme-<id>/` means, and what happens for presets with no doc.

I found no blockers in published JSON schema validation, the static build, credential handling, style-regeneration preflight, or the MCP tools (argv-only output, bounded inputs, existing registry/runner).
