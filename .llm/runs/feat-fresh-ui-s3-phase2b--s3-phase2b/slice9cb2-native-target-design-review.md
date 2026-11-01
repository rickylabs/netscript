# Independent cross-engine native link refinement review

PASS (slice 9c-b2 cross-engine native-link forwarding refinement)

The refinement is a minimal, platform-only fix for the measured WebKit failure, and you may implement it. A copied untrusted modified click doesn't open a new tab in WebKit, while the real anchor with `target=_blank` does in all three engines. It adds no `window.open`, router, bus or user-agent branch.

**Why it holds up:**
- It only applies to Ctrl/Meta primary-button clicks on the row body of an owned link activation. It temporarily sets `target="_blank"` and calls the real `HTMLAnchorElement.click()`, which uses the platform's own link activation within the current user activation. Then it restores the exact original `target` in a `finally`: the previous value, or removes it if there was none.
- `click()` runs activation synchronously, so the target is resolved before it's restored.
- Unmodified body clicks keep the copied-click forwarding, and button rows are unchanged.
- **Event handling:** calling `stopPropagation()` on the original only after a successful forward gives ancestor observers exactly one delegated activation instead of the original plus a clone. All existing guards stay: independent controls, nested rows, in-row selection, trusted-only input and primary button.
- **No API change:** keyboard (Tab/Enter/Space), selected parts and the base contract are unchanged, with no new public field.
- **Evidence standard:** the real native baselines (`Control` and `target=_blank` direct-anchor passes in WebKit) were measured first, and the failure is recorded without a waiver. That's the right bar.

**Implementation requirements (not blockers):**

1. **Define the other modifiers.**
   - Apply the `target=_blank` path only when exactly Ctrl or Meta is held, without Shift or Alt.
   - For Shift (new window), Alt (download) or any combination, *don't forward at all*. A body click with those modifiers should never fall back to a same-tab navigation the user didn't ask for, and the visible native link stays the direct path.
   - Add one browser test proving that Shift+click on the body causes neither same-tab navigation nor `onSelect`.
2. **Platform modifier differences.** On macOS, Ctrl+click opens the context menu and produces no `click`, so only Meta reaches the handler. On Linux and Windows, Ctrl is the new-tab modifier. Keep both, as proposed, and record that your Linux run's Meta-on-direct-link failure is the expected platform behavior, not a product defect.
3. **Fresh client navigation.** Prove in the real installed Fresh consumer, not only the gap fixture, that the partial-navigation interceptor ignores the forwarded click while `target="_blank"` is set. That means a new tab opens, the current page doesn't navigate, and the original `target` is restored afterwards.
4. **One activation, nothing left behind.**
   - Assert one new page per modified click (for example `context.waitForEvent('page')`), with the current URL unchanged.
   - Assert the anchor's `target` attribute is identical before and after, both with and without a caller-supplied `target`.
   - Assert the root observer sees exactly one click.
5. **Run it in all three engines after implementing.** Chromium, Firefox and WebKit must each pass the modified-click, unmodified-click, Shift-guard and text-selection cases before the source review. The README should document that row-body clicks are delegated activations and that the raw native event semantics come from the direct link.

The rest of the unit's gates, the independent source review and the evidence review are still pending. The full goal (AI, Docs, Desktop, extensions and the final gates) stays active.
