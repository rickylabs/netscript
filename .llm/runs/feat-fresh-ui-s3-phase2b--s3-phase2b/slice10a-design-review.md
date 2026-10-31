# Independent AI10a design review, final

PASS (slice 10a design checkpoint, round 2: Marker, Trace and Attachment)

The revised checkpoint (`.llm/runs/feat-fresh-ui-s3-phase2b--s3-phase2b/slice10a-checkpoint.md`) fixes the round-1 blocker without widening the locked scope. Implementation may start.

- **Attachment state is now perceivable** (lines 37-50):
  - Every non-idle state renders a static, visually hidden state-label part (Uploading, Processing, Error, Done) that callers can localize through `stateLabel`. It's readable text, not a live region.
  - The glyphs stay decorative.
  - At xs horizontal, `description` is visually hidden but stays in the accessibility tree, the state label stays accessible at every size, and progress is still omitted visually per the ledger, while the state label carries the busy meaning.
  - **Tests:** the gate list (line 98) adds SSR state text per state × size, including xs errors, and browser accessibility and strict axe checks. Descriptions must stay in the accessibility tree.
- **Trace improvements, beyond what round 1 required** (lines 18-29):
  - Both the aggregate and each line get static, visually hidden status text (Running, Done, Error, Pending) that callers can localize through `statusLabel`, so status no longer depends on glyph colour either.
  - The aggregate is a `div` with a header and a native `ol`, and `Trace.Line` is an `li`, documented to be placed only inside Trace or a native list. That gives sequence semantics for free.
  - Collapsible lines nest a native `details`/`summary`, and static lines have no tab stop.
- **Pending glyph:** a CSS ring, so no Icon glyph is added and Icon/Z1 stay unchanged (line 72).
- **Unchanged from round 1 and still sound:** L2 independence, the ledger scope and axes, the controlled-refusal, unchanged-prop and programmatic-toggle policy, the strict checker from the first fixture, the full gate set, the under-30 budget, no token, backend or dependency changes, and deferrals 10b, 11/12 (including the owner's additive-extension rule) and 13.

**Advice for implementation:**
- Inside a collapsible `summary`, put the status text where it becomes part of the summary's accessible name, and assert that name in the browser.
- Declare the new `stateLabel`/`statusLabel` props and the visually hidden parts in I5/I7 and the JSON contract before rendering them, so the strict checker sees canonical parts only.
- Since `Trace.Line` is an `li`, the contract-render fixtures should render it inside its list parent, so strict-checker and axe results aren't skewed by an orphaned `li`.
