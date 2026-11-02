**S1 sign-off delta: PASS**

This covers only the four changes since the last S1 PASS. It isn't the final IMPL-EVAL and certifies no browser behavior: `.llm/runs/orch-divybot-6557001595--2570/s1-browser.json` is currently empty, so the browser matrix is not evidenced.

## What the delta does
- **Escape closes the palette** (`packages/cli/src/kernel/assets/app/islands/WorkspaceCommands.tsx.template:10-18`):
  - The keydown listener is now registered in the capture phase on `globalThis`. It is re-registered on each `open` change, so it always sees the current state, and it is cleaned up with a matching `removeEventListener`.
  - Escape only does anything while the palette is open. It calls `preventDefault` and `changeOpen(false)`, which also returns focus to the trigger.
  - The handler doesn't stop propagation, so the palette's own `onOpenChange(false)` can fire as well. That just calls the same close-and-focus routine twice; nothing breaks.
  - Cmd/Ctrl+K now goes through the same `changeOpen` path, so closing with the shortcut also returns focus to the trigger.
- **Platform-specific shortcut hint** (`:8,11,20`): the server render shows `Ctrl K`, and after hydration an effect switches it to `⌘K` on Mac and iOS. Because the switch happens in an effect, server and client markup match at hydration.
- **Settings** (`packages/cli/src/kernel/assets/app/islands/SettingsForm.tsx.template`):
  - The hardcoded `aria-current` on the section rail is gone (`:28`).
  - "Manage sign-in" now uses `appRoutes.signIn.href()` (`:38`).
  - The Appearance section id changed to `appearance-settings` (`:28,35`). This also fixes an earlier bug: the section and the `<Select id='appearance'>` shared the same DOM id, which made the in-page anchor and the label association ambiguous.
- **README** (`packages/cli/src/kernel/assets/app/README.md`): it explains how to extend the page set without forking components or adding demo data. It covers the capability-projection rules, including what may and may not reach islands, plus navigation and typed aliases, the three template-registration steps, and the stale-Vite-module trap. It meets the plan's contributor-path item.
- **App check:** `s1-app-check.json` shows 47 files and 0 diagnostics. You've said it was rerun after these changes; the file has no timestamp, so I can't verify that independently.

## Non-blocking notes
1. The README mixes two audiences. It sits in the CLI source tree and isn't emitted into scaffolds, yet half of it addresses the generated app ("Add pages to `navigation.ts`") and half addresses CLI maintainers (`gen:assets-barrel`, template registration). Before #2571 reuses it, either split it, or state at the top that it is template-maintainer guidance. Also confirm the asset-embedding step doesn't pick up `.md` files, or that it is meant to.
2. `navigator.platform` is deprecated. It works today; switch to `navigator.userAgentData?.platform` with a fallback when convenient.
3. The global capture-phase Cmd/Ctrl+K also fires while focus is in a text field. That matches the Figma command pattern; just confirm it is intended.
4. Once the browser matrix finishes, record Escape-to-close and focus-return results in `s1-browser.json` as evidence for this behavior.
