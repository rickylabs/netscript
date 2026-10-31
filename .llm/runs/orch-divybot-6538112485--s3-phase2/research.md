# Research — 2026-10-31

Re-baselined against main 204a71b. Phase 1 (#2467) is present. Its public catalog
has 87 entries (66 shipped), while the handoff inventory has 104. The 17 missing
identities are L9–L12, I3–I7 and X2–X9. Existing contracts already include all
Data display and Desktop identities, but need an audit against the completed
ledgers. Do not duplicate them or rewrite their public vocabulary silently.

Read the earlier S3 memory first. RTK is absent; Deno 2.9.7 and gh are present.
No memory connector is available; retained run memory is the durable memory.
No orchid-triage comment or phase-2 implementation PR was found.

Handoff #2486 is open, on docs/figma-library-handoff at a83663e. Its README was
read first. The branch snapshot is a read-only input in the project runs area.
Read component-spec.md and ledgers (dd2, layout, ai, desktop-docs); ledgers win.
Review PNGs and five Utility archetypes are the visual acceptance inputs.
S2 #2468 is still an open draft, currently repairing collection updates. Use
main's registry manifest now, merge main when S2 lands, and reconcile using its
registry rather than creating another installer or registry schema.

## Inventory and boundaries

Phase 2a gaps: ButtonGroup, Toggle, ToggleGroup; RadioGroup, InputGroup,
InputOTP, Slider, Calendar, DatePicker; NavigationMenu, Menubar,
LocationMarker, Stepper; AlertDialog, HoverCard, ContextMenu; Item, Kbd,
Chart, Collapsible, Carousel. Existing DropdownMenu is ActionMenu: retain it.
Existing Label eyebrow, Pagination pager, CodeBlock, CommandPalette, Alert,
PageHeader and shell need explicit docs-gap/archetype audits, not duplicate
components. The screen inputs are dashboard, orders, settings, sign-in and
command palette. Record which existing components cover each.

Phase 2b gaps: ScrollArea, Resizable, AspectRatio, Direction; MessageScroller,
Marker, Trace, Questionnaire, Attachment; FilePathChip, AttributeChip, Toc,
FileTree, Figure, AnchorNav, RuledGrid and Hero. Desktop has no absent P0/P1
entry; audit its existing contracts. Token changes belong to #2450.

JSR planned-surface scan: extend the existing contracts subpath with explicitly
typed serializable data. New copied components use typed Preact props and VNode
returns, no backend/network integration or import attributes. Existing runtime
public subpaths remain the composition seams. No new dependencies/lock edits.
Preserve the existing 123 component doc-lint baseline; new exports need JSDoc.
Generated registry and CLI embeds must be refreshed in every source slice.
