# Independent AI10b source review

PASS (slice 10b source review: MessageScroller and Questionnaire)

The uncommitted unit implements the original design and both native refinements (reset defaults and scroll anchoring) without changing scope. I found no blockers.

- **MessageScroller** (`packages/fresh-ui/registry/components/ui/message-scroller.tsx`):
  - **Inputs:** a blank label and an invalid `endThreshold` throw (lines 49-52).
  - **SSR:** `data-scrollable` starts as `none` (line 58) and is then *derived* from real geometry (lines 73-84). It's never a prop.
  - **First mount:** follows the end in a layout effect only when `followEnd` is true and only once (lines 115-118). Re-running for a `followEnd` change re-measures without jumping, so turning following on later never moves an unpinned reader.
  - **Following:** it only follows when pinned, `followEnd` is on and there's no reader intent (line 74).
  - **Anchoring fix:** a native scroll during a geometry change while pinned, with no intent, keeps the pin and lets the scheduled frame follow (lines 92-101). Otherwise it measures and unpins normally.
  - **Reader intent:** a one-measurement flag set by `wheel`, `pointerdown`, `touchstart` and scrolling-key `keydown` on the viewport. It skips editable targets and Space on buttons and links, never calls `preventDefault()` or synthesizes events, and always schedules a frame, so it can't stick (lines 102-114).
  - **Growth detection:** a ResizeObserver on the viewport and content plus a MutationObserver (`childList`, `subtree`, `characterData`) feed a single locally owned frame.
  - **Cleanup:** the cleanup function removes all five listeners, disconnects both observers and cancels the frame (lines 131-141).
  - **Viewport and button:** a named `region` with `tabIndex=0`, and a native scroll-to-latest button with `aria-controls`/`aria-disabled` and a guarded click that never moves focus. The `arrow-right` glyph is rotated, so no new icon.
- **Questionnaire** (`questionnaire.tsx`):
  - **Form:** one real `form` with `aria-labelledby` pointing at the `legend`, and a `fieldset` that disables only the answers. Progress, children and actions sit outside the fieldset.
  - **Validation:** duplicate or empty option values throw.
  - **Controls:** named native radios or checkboxes with `aria-describedby`/`aria-invalid`. Shortcuts are decorative `aria-hidden` `kbd` elements with no handler. Freeform is a named `textarea`, and the complete step has no answer controls.
  - **Refusal:** a controlled change first restores *every* owned input, including the radio siblings the browser unchecked, then proposes (lines 191-203). Controlled text resets the DOM value before reporting (lines 229-234).
  - **Reset defaults:** on every render, `defaultChecked`/`defaultValue` are set from the accepted (controlled) or initial (uncontrolled, captured once at mount) state, and the current values are assigned last (lines 107-120). So a native reset is correct regardless of microtask timing.
  - **Reset handling:** the caller's `onReset` runs first and can prevent it. The guarded microtask only resets owned inputs and local state, with an unmount and connection guard and no synthesized callbacks (lines 140-154).
- **Native radio behavior:** WebKit stops ArrowDown at the last enabled radio instead of wrapping. That's correctly treated as native: the dedicated case compares source against bare HTML in the same engine, with no engine-specific waiver or custom key manager, and it's documented in the README.
- **Evidence:**
  - 60 Chromium cases (light/dark × 390/1280) and 60 Firefox/WebKit cases, honestly not full dark or preset certification, plus 40 Shell regression cases including the same chat fixture.
  - 453 final contract tests plus real `ui:add` TSX/CSS fidelity, compile, lint and SSR, embeddings and closure, and 121 registry tests.
  - The wrappers passed with nothing dropped, along with quality, preflight, docs accuracy, the prose site build, export drift and member publish (0 slow types).
  - Zero console errors, zero serious or critical axe findings and zero allowances, including the error, freeform and complete states.
  - The 124 doc-lint failure stays explicit under #2531.

**Non-blocking:**
- Controlled freeform text reassigns `value` on refused input, which can move the caret to the end in some engines. That's inherent to native controlled refusal; mention it in the README.

Next: the source commit, then the four committed-source carriers, quality at the actual head, native publish refresh, evidence review, privacy, push and comment. 104/96/8/125, 26 files. Docs and Desktop (11), the declared extensions and all-style harness (12) and the final gates (13) are still required. No READY.
