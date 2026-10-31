# Independent9c-a design review

PASS (slice 9c-a design checkpoint: the responsive SidebarShell family)

The checkpoint (`.llm/runs/feat-fresh-ui-s3-phase2b--s3-phase2b/slice9ca-checkpoint.md`) locks a complete, truthful single-identity shell unit inside approved decision 5 and the 9c0 Dialog policy. I found no unresolved public API or ownership question that would force rework. Implementation may start.

- **Compatibility:** the existing SidebarShell inputs, copy target, `ns-dashboard` class API and the SidebarToggle default export, selectors, labels and icons are all kept. The new ports are declared with defaults:
  - `layout`, `sidebar` (plus the `nav` alias), `sidebarVariant`;
  - `rail`/`railContent`/`mobileRailContent`;
  - `session`/`thread`/`composer`/`topbarBrand`;
  - controlled or uncontrolled `sidebarOpen` with the Dialog reason vocabulary;
  - nav item `level`/`disabled`/`count`/`marker`/`chevron`, and native collapsible `details` sections.

  Breakpoint is correctly a measured value, not a prop, and the phantom-prop corrections are marked as audited baseline fixes.
- **Native ownership:**
  - **Static mode (server-only):** a single sidebar inside one native `details` that starts open. It works without JavaScript, with no hidden off-screen focusable links.
  - **Hydrated mode:** exactly one branch, either the desktop `aside` or the public native modal Dialog for mobile and tablet, with the browser owning focus, inertness, Escape, backdrop and focus return.
  - There's no document key handler, hand-rolled focus trap, body-overflow override or event bus.
  - The forced-close behavior follows 9c0.
- **Toggle:** the protocol is scoped to the toggle's own shell root, through a non-bubbling request and state notifications, and requests are validated.
  - `aria-controls` is only published once the target is connected, and `aria-expanded` follows the real open state, so a refusal doesn't flip it early.
  - Two shells never control each other.
  - The legacy explicit-selector path restores the exact previous body overflow.
  - The required compatibility case of a server-only shell with an independently hydrated toggle is included.
- **Focus on breakpoint changes:** if the focused node is removed, focus moves to the same link where possible, otherwise to the trigger or the first link. Focus outside the replaced branch is left alone, and listeners are removed on unmount.
- **Visual and contract:** the N4/N5 renders take precedence over the old ink-chrome note, using existing tokens only. The geometry constants come from the ledger (280/56/1200), and `data-sidebar-mode` is declared as a canonical axis rather than a private exemption.
- **Scope and gates:** under 30 source files, 119 → 120 native items with one new support library, and the frozen legacy snapshot is untouched. The browser list is thorough, including both breakpoint edges, no-JS, two-shell isolation, chat and docs geometry, and listener cleanup. Deferrals (9c-b, #859, later promotions, extensions 12a/12b) are explicit.

**Implementation risks to watch (advice only):**

1. **Hydration order.** The first client render must exactly match the server's static markup. Only switch to the measured branch afterwards, in `useLayoutEffect` to avoid a painted flash. Assert in the browser that there are no hydration-mismatch warnings or console errors, and document the brief expanded-to-collapsed shift on mobile.
2. **Stable IDs.** Use `useId` for the sidebar, controls and section IDs so they match between the server, hydration and both branches. A toggle's `aria-controls` must never point at an ID from the branch that was just removed.
3. **Fresh island boundary.** Whole-shell hydration means page `children` and slots cross into an island. Prove the installed consumer with real JSX children through Fresh's island serialization, as well as SSR, and document what can't be serialized, such as functions in navigation items, alongside the server-only fallback.
4. **The `:has()` hide rule.** Make it narrowly scoped, keyed on the connected, enabled toggle's `aria-controls` matching this shell's ID. Test that a disabled or disconnected custom toggle never hides the built-in control, including in Firefox and Safari.
5. **Unmounting the modal.** When the viewport becomes desktop while the mobile Dialog is open, the content is removed without a `close` event. Make sure no stale `native-close` or `escape-key` callback reaches a controlled host, and that the focus handoff runs after the new branch has mounted.
6. **Nested disclosures.** Collapsible sections inside the static `details` need their own non-blank labels and must stay operable with Enter and Space in both branches. Include one browser case for a section inside the mobile modal.
