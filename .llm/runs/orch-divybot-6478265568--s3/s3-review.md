**FAIL_FIX.** One blocker: two CLI scaffold templates still use the old badge modifier classes that slice 3 removed from the CSS. Everything else I checked in the fresh-ui migration is clean.

## Blocker

**The CLI scaffold templates still use the removed badge modifiers.**
- **Where:** `packages/cli/src/kernel/assets/app/routes/(_components)/health-view.tsx.template:9` uses `ns-badge ns-badge--success`. `packages/cli/src/kernel/assets/app/routes/examples/telemetry/(_components)/telemetry-view.tsx.template:74` uses `ns-badge ns-badge--secondary`. The same markup is embedded in `packages/cli/src/kernel/assets/embedded.generated.ts` (lines 41 and 83).
- **Why it breaks:** `badge.css` now only styles `:where(.ns-badge)[data-variant=…]`, and there is no compatibility alias for `ns-badge--*`. A newly scaffolded app gets the new registry CSS, so its default health page and the telemetry example render bare, unstyled badges.
- **Why parity didn't catch it:** the parity run only covers the fresh-ui specimens, not CLI-owned templates.
- **Fix:** add `data-variant='success'` and `data-variant='secondary'` to those two templates. Then regenerate `embedded.generated.ts` with its existing generator. A badge alias in CSS would also work, but only layout utilities are meant to stay as aliases.

## Checks that passed

- **Modifier coverage:** I compared against the pre-migration copy in the baseline source archive. Every block and element modifier selector in its component CSS is gone, including the skeleton element modifiers. They have all been replaced with `:where(...)` plus an attribute, so specificity is unchanged.
- **Leftover modifiers in fresh-ui:** none in registry or runtime TSX. The only remaining `--` classes are the layout aliases in `layouts.css`, and some `ns-render-ui--*` and `__row--header` hooks in `render-ui.tsx` that had no CSS before slice 3 either.
- **Button icon + small size:** the old `.ns-btn--icon.ns-btn--sm` combination maps to `[data-icon='true'][data-size='sm']`, which SidebarToggle sets. IconButton keeps `data-size='md'` plus `data-icon='true'`, which matches `:is([data-size='icon'],[data-icon='true'])`. Specificity is (0,2,0) and (0,1,0), the same as before, and the source order is unchanged.
- **Conditions and accessibility:** I checked button, checkbox, switch, label, input, select, textarea, progress, avatar, card, separator, panel, toast and skeleton. Each new attribute matches its old class condition: `required && !srOnly`, disabled and error mapping, indeterminate to `data-state='loading'`, `data-content='agent'`, and the toast `data-type`. The ARIA attributes are unchanged, apart from Button gaining `aria-busy` while loading.
- **No collisions:** theme presets contain no component selectors. No `Button` call site passes trigger props or `data-state` that Button's own `data-state` would overwrite.

## Non-blocking notes

- **Axe baseline keys are now stale.** `tools/fresh-ui-browser/axe-baseline.json` allowlists violations by selectors such as `.ns-badge--success.ns-badge` and `.ns-btn--destructive.ns-btn`. The migrated markup no longer produces those selectors, so the browser contract gate will report them as new violations. Before the slice 5 gate, re-key the affected entries, recording the moved targets as evidence.
- **Spinner `data-part` follows the caller's override.** Button's loading spinner uses `data-part={props['data-part'] ?? 'root'}` (`button.tsx:90`). A Button passed `data-part='trigger'` therefore puts `trigger` on its spinner too. The slice 5 conformance work should pin it to `root` or `spinner`.
- **Parity recheck pending.** The parity report was generated before the final scope-only annotations, so it still needs the recheck you mentioned.

I made no edits and didn't run any tests or builds.
