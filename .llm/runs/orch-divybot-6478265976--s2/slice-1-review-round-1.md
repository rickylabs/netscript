# Slice 1 review round 1

**FAIL_FIX**

**1. `packages/fresh-ui/registry.json` now freezes values that the old manifest derived from their sources, and nothing checks them for drift.**

Before this change, `packages/fresh-ui/registry.manifest.ts` built 85 legacy items from live sources:
- **Theme items** came from `...generatedThemes` in `registry.theme-items.generated.ts`. That file is generated from `registry/theme/theme-items.json` by `scripts/build-tokens.ts` and `scripts/embed-token-assets.ts`.
- **The `theme-previews` file list** came from `PREVIEW_TOKEN_FILES` in `src/tokens/domain/token-output.ts`, which is derived from `TOKEN_PRESETS`.
- **Desktop and AI dependency versions** came from `FRESH_UI_PACKAGE_VERSION` in `src/package-metadata.generated.ts`. `.llm/tools/generate-publish-assets.ts` rewrites that constant during a release.

The new manifest is a projection of a static JSON snapshot, so all three are now hard-coded:
- `registry.json:3569`, `:3611` and `:3687` pin `jsr:@netscript/sdk@0.0.8/...` and `jsr:@netscript/ai@0.0.8`. The next version bump updates `package-metadata.generated.ts` but leaves `registry.json` alone. The published registry, and anything built from it by `ui:add`, would then install the previous release's SDK and AI packages.
- Running `tokens:build` or `tokens:check` still regenerates and checks `theme-items.json` and `registry.theme-items.generated.ts`. The registry that actually ships no longer reads either file. A change to a token preset would pass every existing gate while the installed theme items stay stale.
- `registry.theme-items.generated.ts` is still emitted, but nothing reads it any more. That leaves two sources of truth for theme items.

This is a slice 1 issue, not deferred build work: slice 1's gate is that the legacy projection stays compatible, and these values were correct by construction before the change.

**Required fix (either option):**
- **(a)** Generate the derived parts of `registry.json` from the same sources: theme items, the preview file list, and the `@netscript/*` versions. Then add a check mode wired into `tokens:check` or `check:assets-barrel`, and into the version-bump path in `generate-publish-assets.ts`.
- **(b)** Add a focused test that fails when those parts differ from their sources:
  - theme items vs `generatedThemes`
  - preview files vs `PREVIEW_TOKEN_FILES`
  - every `jsr:@netscript/*@` specifier vs `FRESH_UI_PACKAGE_VERSION`

With either option, also add a parity assertion over the full legacy shape: `files` (source and target), `dependencies`, `registryDependencies`, `css` and `tags`. The current tests only check the count of 86 items plus the catalog fields in `tests/registry-doc-drift.test.ts`. Neither proves that the other legacy fields of the 85 items are unchanged.

There are no other blocking findings for slice 1. The pinned schemas, the MIT license file, the README's SHA-256 values, the publish includes, the `/registry-v2` export, Ajv already being in both lockfiles, name/path safety, and the `style-utility` exclusion from the legacy projection all look acceptable for this slice.
