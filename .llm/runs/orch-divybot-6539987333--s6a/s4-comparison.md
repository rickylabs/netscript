# S4 comparison

Locked Studio Utility screen/state renders supplied in PR #2508 are the highest authority for anatomy and density. Library references below cover remaining anatomy. Actual Preact markup and scaffold preflight; light/dark, pointer/keyboard, RTL/reduced motion and mobile screenshots. Private HTML pairs references and actuals.

| Component | Library reference | Result / explained gap |
| --- | --- | --- |
| app-shell | layout/review-app-shell.png | Page spacing, logical sidebar edge, overlay scrim; existing responsive shell maintained. |
| sidebar | navigation/review-sidebar.png | Ink selected item with square marker, mono uppercase groups, RTL off-canvas edge and focus. |
| top-bar | navigation/review-top-bar.png | 48px token minimum, quiet rule, wrap-safe mobile flow; generated layout now uses the existing contract. |
| sidebar-toggle | navigation/review-sidebar-toggle.png | Sharp 32px control, ink focus, quiet hover. |
| breadcrumb | navigation/review-breadcrumb.png | Body role, current emphasis, focus and mirrored RTL separator. |
| tabs | navigation/review-tabs.png | Locked square selected marker; ink text, hover, disabled and focus. Existing headless keyboard contract retained. |
| stats-grid | layout/review-stats-grid.png | Locked top hairline, mono uppercase eyebrow and 40px/400 KPI. Fixture content differs. |
| page-header | layout/review-page-header.png | Locked page-title and body roles, section spacing; caller supplies actions. |
| detail-layout | layout/review-detail-layout.png | Quiet section spacing; existing responsive columns retained. No new width role invented. |
| data-table | data-display/review-data-table.png | Locked hairline compact rows, uppercase mono headers, ink native selection and leading selection rule. DataGrid and block share scope. |
| table | data-display/review-table.png | Responsive table preserves mobile stacked-label fallback; sharp quiet edge, hairline rows, logical alignment. |
| pagination | navigation/review-pagination.png | Small metadata and inherited Utility controls; existing compact API does not add page-number anatomy. |
| sheet | overlays/review-sheet.png | Sharp raised surface, quiet rule, no blur/shadow, token typography. Existing 520px width retained: no named replacement role. |
| dialog | overlays/review-dialog.png | Raised sharp surface with existing native dialog behavior. Gallery opens and places specimen in flow; runtime tests cover lifecycle. |
| drawer | overlays/review-drawer.png | Shared floating roles; retained native drawer size/placement. No anatomy expansion. |
| popover | overlays/review-popover.png | Sharp raised surface and role spacing; specimen is placed in flow for comparison. |
| tooltip | overlays/review-tooltip.png | Inverse surface/text, compact small text, existing placement. |
| dropdown-menu | overlays/review-dropdown-menu.png | Raised surface, neutral hover and ink keyboard focus. Native action-menu tests pass. |
| command-palette | overlays/review-command-palette.png | Sharp raised panel, no blur/elevation, mono groups and neutral kind badge; keyboard behavior unchanged. |
| chart-block | chart-palettes/review-chart-block.png | Default automatic categories use chart1–5; explicit semantic intent retained. Tracks, axes and text use tokens. |
| donut | chart-palettes/review-donut.png | Chart palette for automatic rings/swatches, explicit error stays red, light center numeral. Shipped 96px SVG retained because no diameter role exists; reference is larger. |
| theme-toggle | actions/review-theme-toggle.png | Sharp 32px control, ink focus and reduced motion. |

S4R reconciles earlier badge/form families to the newly supplied locked authority. The earlier S2/S3 reports remain dated evidence, not an assertion of final locked fidelity.
