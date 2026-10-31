**Verdict: PASS** (S5 source review; S6's carriers, root gates and final IMPL-EVAL are not covered)

The URL install path is correct for persistence, ownership transfer, local-edit protection, URL kinds, schema and path validation, override handling and app selection. I found nothing that blocks the slice. The pass counts and the native scaffold run are as you reported them; I only read the code.

## What I verified

**Telling URL kinds apart (`resolve-preset.ts`)**
- Input with no scheme is decoded locally, as before.
- Only http and https are accepted. URLs carrying credentials are refused.
- A non-empty `?preset=` is treated as a share link and decoded locally, with no fetch (the test asserts the call count). An empty `?preset=` is refused.
- Anything else is fetched exactly once, with a 30-second timeout and `redirect: 'error'` in the transport. The fetched text is reused through a wrapped transport, so the follow-up item resolution doesn't fetch again.
- JSON with `version` and no `type` is preset JSON. It must pass strict `UiPresetSchema`, and its `theme` must be a built-in preset id; a nested URL is rejected by test.
- Everything else goes to the S2 registry client, which validates the published schema and safe file paths, and must be `registry:theme` or `registry:base`.
- `--only` together with a URL theme is refused.

**Compile and persist (`figma-theme-files.ts`)**
- `meta.netscript` is parsed strictly, and the preset must be a built-in one.
- `figmaSources` goes through Fresh UI's public `importFigmaTokenBundle` (strict bundle check and name check) and then `figmaTokenSources` (semantic alias check). The build runs through the existing engine with the app's override.
- Sources land in `tokens/source/*` and outputs in `@assets/*`. Both are added as inline registry files, so S2's `uiTargetPath` checks and local-edit checks apply to them.
- The config keeps the previous fields and sets `preset`, `sourceRoot: tokens/source` and the existing or default override.
- A custom `sourceRoot` is refused. One counts as managed only when a theme or base lock item owns both `tokens.config.json` and `tokens/source/tokens.resolver.json`, so sources a user created with `tokens init` are protected.

**Ownership transfer (`transferThemeBaselines`, `apply-remote-preset.ts`)**
- Files owned by an older theme or base item that the new URL will overwrite are moved, with their old hashes, into the new URL's lock entry. This happens before the S2 install with `replaceManaged: true`.
- Unchanged files are replaced, and locally edited files still conflict; the test edits `primitives.tokens.json` and the second URL apply is refused with files unchanged.
- `tokens.config.json` is taken out of every other item and recorded in the URL entry as unmanaged metadata. It is written through the staged plan, and nothing is written to disk until the final `plan.commit`, so a failed fetch, schema check or compile leaves the filesystem unchanged; the tests compare full filesystem snapshots.
- The tests also show a later `buildAppTokens` reproduces identical `tokens.css`, and a second URL takes over the managed sources.

**Init**
- The public `init-command.ts` is now 55 lines and only declares options. `run-init-command.ts` applies the preset after scaffolding and before agent setup, and skips it on dry-run.
- `applyInitPreset` picks `apps/<appName ?? deriveDefaultAppName(name)>`. That is the same derivation `validate-init.ts` uses, and there is no normalization step that could make them diverge.
- The public and maintainer setups wire the same function, with the fetch transport, path adapter and `FreshUiTokenEngine`.
- The CLI test that imports plugin fixtures from `tools/` is excluded from publishing by `**/*_test.ts`.

## Recommended (don't block S5)

1. **Built-in preset after a URL theme.** `ui:apply --preset studio-utility` still compiles from the installed `tokens/source` Figma values, because `sourceRoot` is kept. The user can't get back to the bundled values without editing `tokens.config.json`. Either document this in S6's CLI reference or make built-in preset codes restore the bundled sources, with a test either way.
2. **`init --preset` with a bad URL fails after scaffolding.** The diagnostic is clear, but the workspace is left without agent setup, and a re-run hits "directory exists". Resolving or fetching the preset before `executeInit` would make bad URLs fail fast.
3. **Empty old lock entry.** After a second URL takes over, the first URL's lock entry stays with no files. Drop entries left empty so `ui` listings stay accurate.
4. **Hard-coded `'apps'`.** `apply-init-preset.ts` should use `SCAFFOLD_DIRS.APPS`.
5. **Dry-run.** `init --dry-run --preset <url>` silently skips the preset. Mention it in the dry-run output or validate the URL anyway.

OPENHANDS_VERDICT: PASS
