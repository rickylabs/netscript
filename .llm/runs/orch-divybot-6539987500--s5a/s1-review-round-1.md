**Verdict: FAIL_FIX** (S1 slice review; the plan still holds)

The six Figma-derived documents are composed correctly and match the previous script byte for byte. The resolver is the problem: it is no longer generated from code. It is copied from the embedded copy of the very file it writes. So the resolver half of S1's byte-equality claim proves nothing, and resolver freshness is no longer actually checked.

## What's correct

- **The six computed documents are byte-identical in construction to the old script.** These are primitives, presets, semantic, light, dark and density. The composer in `packages/fresh-ui/src/tokens/adapters/figma-token-sources.ts` uses the same shared-context loop and the same `$schema`-first object order. It also keeps `context: shared` before `...result.schemes.light` in `semantic.tokens.json`.
- **The document set matches.** The embedded `sources.generated.ts` holds exactly seven documents. The composer overrides six of them, `component.tokens.json` passes through, and the script skips it. That gives the same seven written files as before.
- **The legacy input is safe in check mode.** It now comes from `legacy.generated.ts` instead of `tokens/legacy.json`. `tokens:sources:check` runs `tokens:embed:check` first, so the embedded copy is proven fresh before the import check.
- **The inputs aren't mutated.** `importFigmaTokens` sorts a copy of the collections, so the embedded snapshot used by the test is untouched.
- **The public surface is fine.** `figmaTokenSources` has an explicit `TokenSources` return type, so no slow-type risk. `FigmaCollection` and `FigmaVariable` both have JSDoc.

## Required fix

**The resolver is circular.** The old script built `tokens.resolver.json` inline, deriving the theme contexts from `TOKEN_PRESETS`. Now the composer returns `structuredClone(defaultTokenSources().resolver)`. That value comes from `sources.generated.ts`, which `embed-token-assets.ts:69` builds by reading `tokens/v2/tokens.resolver.json`, the same file the script writes. As a result:
- `import-figma-tokens.ts --check` compares the resolver with an embedded copy of itself, so it can never be stale.
- In `tests/tokens/figma-sources.test.ts`, `assertEquals(sources.resolver, baseline.resolver)` is true by construction.
- If a preset is removed from `TOKEN_PRESETS`, its stale theme context stays in the resolver and passes every check. `validate-token-sources.ts` only resolves presets that exist, so it would catch an added preset but not a removed one.
- The supposedly generated resolver can now only be edited by hand.

**Fix:**
1. Move the previous resolver literal into a pure domain function, for example `tokenResolver()`, that builds the theme contexts from `TOKEN_PRESETS` with default `ns-one` and the same `resolutionOrder`.
2. Have `figmaTokenSources` use that function instead of the bundled copy.
3. Keep the test's comparison against `defaultTokenSources().resolver`. It then becomes a real check that the derived resolver matches what's committed.

## Recommended (doesn't block this slice)

- **Restore the alias check in the composer.** The old script ran `assertSemanticAliases` on presets, light and dark before writing anything. CI still covers this through `validate-token-sources.ts` and the build-time check in `style-dictionary.ts`. But the composer is now public and S5 will feed it untrusted user themes, so calling the check inside it keeps the old fail-before-write behaviour.
- **Note for S3:** the `tokens.ts` module doc says "Not a browser import", and that entrypoint pulls in Style Dictionary. The plugin bundle should import the composer module directly, not through `tokens.ts`. It should also avoid sharing the bundled `component.tokens.json` object with callers that might change it.

I reviewed the four S1 files plus the embed script, `default-token-sources.ts` and `figma-collections.ts`, without running anything. The gate results in the private run logs aren't covered by this verdict.

OPENHANDS_VERDICT: FAIL_FIX
