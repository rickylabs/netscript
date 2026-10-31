# IMPL-EVAL re-review: PR #2467, phase 1 of #2416, head bdb959d10

**Verdict: PASS.** The round-1 ActionMenu blocker is fixed and I found no new concrete blockers in the repair. I made no edits and ran nothing.

## The round-1 blocker is resolved

- **Trigger and Content:** the `data-scope='dropdown-menu'` overrides are gone. Both now take the scope from `usePopover`'s getters, which is `popover` by default (`ActionMenu.tsx:56-63` and `:106-116`). That means `floating.css` (`[data-scope='popover'][data-part='content']` and the trigger/anchor rules) matches the menu again.
- **Item and Separator:** both use the `ACTION_MENU_SCOPE = 'popover'` constant (`ActionMenu.tsx:23-24, 147, 159`). `floating.css` only targets the content, trigger and anchor parts, so items and separators pick up no floating styles.
- **No stale scope left:** searching the repo outside run records finds no remaining `dropdown-menu` scope.

## The checker and contract still hold

- **Fixture:** `utility-composites.tsx:297-311` now uses `scope: 'popover'` and requires all four parts. Every part it renders is declared in the dropdown-menu contract (`overlays/3.ts:159-217`).
- **Attribute values:** the content's `data-state='open'` is a declared value. `closed` is kept as a compatibility value, scoped to trigger, content and item.
- **Records:** the delegation note is in both the typed catalog (`overlays/3.ts:303`) and `contracts.json`, and the existing catalog test requires the two to match. `naming-decisions.md:14` records the decision.
- **New test:** `tests/runtime/action-menu/floating-scope.test.tsx` renders the real compound component. It checks the order and `popover` scope of all four parts, the content's `data-state='open'` and `popover='auto'`, and that the shipped `floating.css` contains the matching content selector.

## Parity evidence

- **Positive runs:** `resume-parity.json` (authored CSS) and `resume-migration-css-parity.json` (CSS produced by the CLI migration) each cover 188 specimens with `ok: true`. Across all four viewport/scheme combinations they show zero differences and identical screenshots.
- **Negative control:** `resume-action-menu-negative.json` reintroduces the old scope and fails with `ok: false`. It reports an ActionMenu content z-index of `10` before versus `auto` after, in every combination.
- **Disclosed limit:** in this Chromium build the old-scope bug doesn't change geometry, so the screenshots alone wouldn't catch it. The comparison now includes z-index, which closes that gap honestly.

## Outside this verdict

The supervisor's two READY conditions are still open, and I have not verified them:
- the new 299-test package run reaching PASS (`resume-package-tests.json` is still the earlier 298-test run);
- generated-carrier freshness on this head.

Docker/Aspire runtime acceptance remains unproven, as already disclosed; per your instructions I did not treat it as a code blocker.

**Overall verdict: PASS.**
