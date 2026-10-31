PASS (integration recovery 4: rebase onto `15cffa2` and the color fix, not the final phase IMPL-EVAL)

The single real fix is correct, and the rebase strategy preserves both main's changes and the reviewed phase 2 source. The final gate results are still pending.

- **Color fix (`packages/fresh-ui/registry/components/ui/menu-items.css:35-37`):** destructive menu labels now use the existing measured text role `--ns-destructive-text` instead of the solid-fill `--ns-destructive`. That's the role main's colour law (`tests/tokens/component-colors.test.ts`) requires, and it matches the destructive text binding used elsewhere. No palette value, test exemption or axe allowance was added, and the `MenuItems` API is unchanged.
- **Fixture (`tools/fresh-ui-browser/gap-overlays-fixture.tsx:87-92`):** a real `Delete order` action with `intent: 'destructive'` is added to the ContextMenu between the checkbox and the submenu. The existing traversal assertions still hold: `End` still lands on "More tools", and the arrow-key sequence before it is unchanged.
- **Spec (`tools/fresh-ui-browser/gap-tests/overlays.spec.ts:197-224`):** the new `context-menu/destructive-text-role-and-activation` case:
  - opens the menu with Shift+F10;
  - checks the item's computed colour equals the resolved `--ns-destructive-text`, through an in-place probe, so the check is theme-aware;
  - runs strict axe on the open menu with zero serious or critical findings;
  - checks Enter activates `delete` and closes the menu.

  That's a meaningful test of the role, its contrast and its behavior, not just a snapshot.
- **Rebase:**
  - All five conflicts were in the generated docs carrier, which can't hold conflict markers. Rebuilding it from the combined 259-page site, starting from a parseable copy rather than accepting either stale compressed side, is the right method.
  - The record that all 161 scoped UI source and test files were byte-identical before the color fix is consistent with no feature code being lost.
  - That the failure was a legitimate new guard on main (not a regression) is exactly the kind of case integration should catch.

Still to land before signing off this integration (`.llm/runs/orch-divybot-6538112485--s3-phase2/rebase4-validation.json` correctly lists them as pending):

1. The corrected full package run (601 tests).
2. The menu and navigation browser rerun.
3. The changed fixture and spec wrappers.
4. The corrected quality/architecture run.
5. Carrier generation and freshness checks after the source commit.
6. A force-with-lease push guarded by the recorded old remote.

The original goal stays open as you state: PageHeader, shell, archetype, fidelity, the full phase 2a gates, phase 2b and the additive style harness.
