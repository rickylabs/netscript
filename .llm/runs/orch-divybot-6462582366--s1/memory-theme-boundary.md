# Theme boundary and preview fixture

App `lib/theme.ts` imports only `theme-preset.json` and `fonts.json`. Development design middleware sets request-local `state.themePreview` after the existing MODE refusal; its dynamic helper owns the full manifest import. `_app.tsx` reads state and uses the configured metadata otherwise. Add a template through manifest.ts, scaffold-template-assets.ts and write-app-files.ts, then regenerate the embedded carrier.

Preview CSS is opt-in: `ui:add theme-previews` copies all preview files; `tokens build --previews` builds them with overrides. Browser CI must explicitly opt in after scaffolding. Clean preserves `theme-preset.json` and uses the lightweight token-config entrypoint. The CLI port passes raw JSON strings; only the external engine adapter parses/validates compiler-specific types.

Scaffolding may add @fresh/init to the root lock through its upstream initialization. Restore only that unneeded generated lock delta; never delete the lock or caches. Leak-check writes directly into its slice directory; copy raw output privately and retain only a sanitized public summary for this owner's privacy constraint.
