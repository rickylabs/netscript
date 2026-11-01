# Desktop Utility blocks — explicit merge disposition

The original child1afd and reviewed Desktop sourcec3d have byte-identical Window
and Tray CSS. Both already replaced the old long Utility-root blocks with their
reviewed component class rules. The merged maintained CSS remains byte-exact with
those reviewed files. Every old Utility block below was already absent/replaced
atc3d; none is newly discarded by this integration.

Parent2be's complete Utility rule list for each file is ordered-selector,
declaration and media-equivalent to the child's merge basec587. Therefore the
parent/main brought ZERO post-base semantic Utility additions for these files.
The native-nesting syntax is not allowed to reintroduce the old geometry/state
paint over the reviewed replacements. All90file browser rule/specificity parity
and fresh runtime tests independently verify the final child composition.

## desktop-window-chrome

Reviewed replacement file: `packages/fresh-ui/registry/components/ui/desktop-window-chrome.css`.

1. `& [data-scope="window-chrome"][data-part="root"]` (unconditional): already replaced atc3d; parent equals base.
2. `& [data-scope="window-chrome"][data-part="title"]` (unconditional): already replaced atc3d; parent equals base.
3. `& [data-scope="window-chrome"][data-part="leading"]` (unconditional): already replaced atc3d; parent equals base.
4. `& [data-scope="window-chrome"][data-part="action"]` (unconditional): already replaced atc3d; parent equals base.
5. `& [data-scope="window-chrome"][data-part="action"]:hover:not(:disabled)` (unconditional): already replaced atc3d; parent equals base.
6. `& [data-scope="window-chrome"][data-part="action"]:active:not(:disabled)` (unconditional): already replaced atc3d; parent equals base.
7. `& [data-scope="window-chrome"][data-part="action"]:focus-visible` (unconditional): already replaced atc3d; parent equals base.
8. `& [data-scope="window-chrome"][data-part="action"]:disabled` (unconditional): already replaced atc3d; parent equals base.
9. `& [data-scope="window-chrome"][data-part="action"]` (unconditional): already replaced atc3d; parent equals base.
10. `& [data-scope="window-chrome"][data-part="action"][data-action="close"]:hover:not(:disabled)` (unconditional): already replaced atc3d; parent equals base.
11. `& [data-scope="window-chrome"]` (@media (prefers-reduced-motion: reduce)): already replaced atc3d; parent equals base.

## desktop-tray-menu

Reviewed replacement file: `packages/fresh-ui/registry/components/ui/desktop-tray-menu.css`.

1. `& [data-scope="tray-menu"][data-part="root"]` (unconditional): already replaced atc3d; parent equals base.
2. `& [data-scope="tray-menu"][data-part="source"]` (unconditional): already replaced atc3d; parent equals base.
3. `& [data-scope="tray-menu"][data-part="action"]` (unconditional): already replaced atc3d; parent equals base.
4. `& [data-scope="tray-menu"][data-part="action"]:hover:not(:disabled)` (unconditional): already replaced atc3d; parent equals base.
5. `& [data-scope="tray-menu"][data-part="action"]:active:not(:disabled)` (unconditional): already replaced atc3d; parent equals base.
6. `& [data-scope="tray-menu"][data-part="action"]:focus-visible` (unconditional): already replaced atc3d; parent equals base.
7. `& [data-scope="tray-menu"][data-part="action"]:disabled` (unconditional): already replaced atc3d; parent equals base.
8. `& [data-scope="tray-menu"][data-part="action"]` (unconditional): already replaced atc3d; parent equals base.
9. `& [data-scope="tray-menu"][data-part="root"][data-state="disabled"]` (unconditional): already replaced atc3d; parent equals base.
10. `& [data-scope="tray-menu"][data-part="accelerator"]` (unconditional): already replaced atc3d; parent equals base.
11. `& [data-scope="tray-menu"][data-part="separator"]` (unconditional): already replaced atc3d; parent equals base.
12. `& [data-scope="tray-menu"]` (@media (prefers-reduced-motion: reduce)): already replaced atc3d; parent equals base.

