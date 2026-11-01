**Verdict: PASS** (S1 repair review, source correctness only; this is not a merge certification)

The resolver fix is correct and the circular dependency is gone. `tokens.resolver.json` is again generated from code, so `import-figma-tokens.ts --check` is a real freshness check once more.

## What I verified

- **The resolver now comes from code.** `createTokenResolver()` in `packages/fresh-ui/src/tokens/domain/token-resolver.ts` imports only `TOKEN_PRESETS` and the contract type. It reads no generated asset. The composer and the script both use it.
- **Its output is byte-identical to the old script.** The key order matches the original inline literal exactly: `$schema`, `version`, `name`, `sets`, `modifiers`, `resolutionOrder`. Inside `modifiers` the order is scheme, theme, density, with the same defaults and `$ref` strings. The script's `--check` compares exact bytes, so this ordering matters, and it holds.
- **The test now proves something.** The bundled resolver (`defaultTokenSources().resolver`, embedded from the committed v2 file) is now independent of the code-derived one, so comparing them is a real equality check. The exact check on the theme-context keys catches a preset that was added, removed or reordered. That closes the stale-context gap from the first review.
- **The alias check is back, and stricter.** `assertSemanticAliases` runs on presets, light and dark before the shared-context step. The old script ran it afterwards, so the check now also covers tokens that later move into the shared context. It still runs before anything is returned or written.
- **The component document is no longer shared.** `structuredClone(base.documents)` means callers get their own copy of `component.tokens.json` and can't change the bundled one.
- **The six Figma-derived documents and the script are unchanged** from the previous review, which already found them byte-preserving.

## Non-blocking cleanups

- The JSDoc on `figmaTokenSources` still says "with the existing resolver". It would be more accurate as "the code-derived resolver".
- `structuredClone` copies all seven bundled documents, even though six are immediately replaced. Cloning only `component.tokens.json` would avoid copying the large bundled documents on every call.

Gate results are in the private run logs and this verdict doesn't cover them. The S1 gates (`tokens:sources:check`, `tokens:embed:check`, the focused test and the check/lint/fmt wrappers) still need to pass before S1 is signed off.

OPENHANDS_VERDICT: PASS
