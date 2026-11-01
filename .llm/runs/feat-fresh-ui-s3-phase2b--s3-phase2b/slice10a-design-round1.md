# Independent AI10a design review, round1

FAIL_PLAN (slice 10a design checkpoint: Marker, Trace and Attachment)

The checkpoint is otherwise complete. The disclosure policy, the independence of each L2 item, the ledger scope, the gates and the budget all hold. One accessibility gap in Attachment has to be fixed in the design before source.

**Blocker: Attachment's state can't be perceived without sight.**

- **Where:** `.llm/runs/feat-fresh-ui-s3-phase2b--s3-phase2b/slice10a-checkpoint.md` §1 (Attachment) and §4.
- **What the design says:**
  - The busy, error and done states show only a *decorative* spinner, alert or check glyph and colour (the destructive border).
  - Descriptions are owned by the host, and no text is added.
  - At xs horizontal the description and progress are *removed* (following the ledger, "xs horizontal omits description and uses trailing state glyph").
- **Why it's a blocker:** an uploading, processing, failed or finished attachment would expose no state at all to assistive technology. At xs, an error would only be visible as a decorative glyph and a red border, which fails WCAG 1.3.1 and 1.4.1. Phase 2a already had a blocker of exactly this kind (Alert's tone label). The ledger's visual omission doesn't permit dropping the information from the accessibility tree.
- **Required change, locked in the checkpoint and contract (I7):**
  - Every non-idle state must have a text equivalent that assistive technology can read. Use visually hidden text inside the attachment, defaulting to "Uploading", "Processing", "Error" and "Done", localizable through an optional caller-supplied label.
  - It's static content, not a live region, which keeps your "no automatic announcement" boundary.
  - The glyphs stay `aria-hidden`.
  - **xs horizontal:** keep any supplied `description` in the accessibility tree (visually hidden instead of not rendered), or document and test that the state text alone stands in for it. The visual ledger rule still applies.
  - **Contract:** declare the new optional label and the visually hidden part.
  - **Tests:**
    - SSR: each non-idle state × size includes its state text.
    - Browser: the accessibility tree or name exposes the state at xs, including errors.
    - Strict axe still at zero.

**What already passes:**
- **L2 independence:** three copied registry identities with no L2-to-L2 import; Icon comes through the existing `primitives` mapping. Inventory goes 91/13 to 94/10, and no token, backend or dependency changes.
- **Ledger and spec scope:**
  - Marker's three variants with icon and label/children, and separator rules drawn by pseudo-elements.
  - Trace's aggregate status (running/done/error) and line status (four values × open), scoped independently.
  - Attachment's 30 combinations and a progress slot. The I7 spec does show "Progress / sm or a Spinner" while uploading or processing.
  - The ledger overrides: mono caption duration, success check, warning spinner, and the media and padding geometry.
- **Disclosure policy:**
  - `Trace.Line` with `collapsible` is a native `details`/`summary` that's useful before hydration, with presentation-only summaries.
  - Controlled refusal keeps the physical state.
  - Programmatic toggles are reconciled without loops, and unchanged props are reconciled on every render. That's the proven Collapsible policy.
  - There's no ARIA accordion, and non-collapsible lines have no hidden focus target.
- **Gates:** under 30 files; the strict checker from the first fixture; undeclared-attribute negatives on all three scopes; real keyboard scenarios; the browser matrix with reduced motion, RTL and narrow layouts; the installed-copy test; wrappers, publish, the doc-lint baseline and all four carriers. The deferrals (10b, 11/12 including the owner's additive-extension rule, and 13) are explicit and not reduced.

**Advice, for the revised checkpoint:**

1. **Pending glyph.** The spec's pending icon is `circle`, and Icon has no plain `circle`, only `circle-check` and `circle-alert`. Lock one approach: add the Lucide `circle` glyph (with the notice, the Z1 enum and fixtures, counted in the budget), or draw a CSS ring. Don't count it as an existing icon.
2. **Trace as a list.** The spec describes Trace as a list. Consider an `ol` with `Trace.Line` rendering `li`, which gives sequence semantics for free, and lock that choice in the contract.
3. **Spinner.** Since L2-to-L2 imports are banned, keep the internal spinner as CSS, as planned, and test that reduced motion slows or stops it.

This is round 1. Revise the checkpoint and resubmit it to the same evaluator before any source.
