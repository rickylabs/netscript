# Independent AI10a source review

PASS (slice 10a source review: Marker, Trace and Attachment)

The uncommitted unit implements the round-2 checkpoint with correct native semantics and status that's always readable. I found no blockers.

- **Trace** (`packages/fresh-ui/registry/components/ui/trace.tsx`):
  - **Root:** a `div` with `data-status` (running/done/error), static visually hidden status text that callers can localize through `statusLabel`, an optional header and a native `ol` for the lines (lines 48-77).
  - **Lines:** each `Trace.Line` is an `li` carrying `data-status` (four values), `data-open`, `data-collapsible` and `data-connector`, plus a decorative connector (lines 125-143).
  - **Collapsible lines** use a native `details`/`summary`:
    - The `summary` click calls `preventDefault()` and makes exactly one proposal through `change` (lines 159-168). A controlled refusal never toggles the element.
    - Changes the browser makes itself go through `onToggle`. For controlled lines it puts the DOM back *before* telling the owner, and the follow-up `toggle` event can't loop because the state already matches (lines 151-157).
    - A dependency-free layout effect reconciles the physical `open` on every render, which covers unchanged controlled props after an outside change (lines 98-101).
  - **Static lines** have no tab stop.
  - The summary holds presentation only: decorative glyph, title, status text, duration and description, so descriptions stay visible when collapsed. Interactive `children` go in the collapsible content.
  - The glyphs are the existing L0 `check` and `circle-alert`; pending is an empty span drawn as a CSS ring, and the chevrons are `aria-hidden`.
- **Attachment** (`attachment.tsx`):
  - It's non-interactive, with `data-state` (five values), `data-size` and `data-orientation`.
  - Every non-idle state renders static, visually hidden state text that callers can localize through `stateLabel` (lines 97-101), at every size, not as a live region.
  - **Compact (xs horizontal):** the description is visually hidden but kept in the accessibility tree (lines 83-91), progress is omitted visually, and the decorative state glyph moves to the end (lines 82, 102).
  - Actions are caller-owned native controls outside the content, and nothing is uploaded or fetched.
- **Marker** (`marker.tsx`): a presentation `div` with `data-variant`, an `aria-hidden` icon, and `label ?? children`, so `0` and empty content are kept. It has no tab stop, role or live region.
- **Boundaries:** none of the three L2 items imports another. Icon comes through the declared `primitives` mapping, with no new glyph, token or dependency.
- **Evidence:**
  - 36 Chromium cases and 28 focused Firefox and WebKit cases covering accept, refuse, outside-DOM changes and unchanged props.
  - 437 final installed and contract tests, 121 broader registry tests and 4 embedding and closure tests.
  - The wrappers passed with nothing dropped, and quality and native publish passed before the commit.
  - Both the raw 124-diagnostic doc-lint and the 123-diagnostic set are recorded as unchanged under #2531, not called green.

**Non-blocking:**
- Because the description sits inside the `summary`, the summary's accessible name also includes it, which can make long names. That's a deliberate trade-off for keeping it visible when collapsed, and fine for short descriptions. Mention it in the README so hosts keep descriptions brief.
- `.ns-attachment__description` is an unscoped wrapper (no `data-scope`), so the strict checker ignores it. That's acceptable, but don't move any canonical axis onto it in the future.

Next: the source commit, then the four committed-source carriers and the quality and publish refresh, evidence review, privacy, push and comment. AI 10b, Docs and Desktop (11), extensions and the style harness (12) and the final gates (13) are still required. No READY.
