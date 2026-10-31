# Independent AI10b design review

PASS (slice 10b design checkpoint: MessageScroller and Questionnaire)

The checkpoint (`.llm/runs/feat-fresh-ui-s3-phase2b--s3-phase2b/slice10b-checkpoint.md`) locks native, truthful and well-isolated behavior for I3/I6 inside the approved plan, including integration with the same Shell chat fixture. Implementation may start.

- **MessageScroller:**
  - **Inputs:** a required non-blank label for a focusable native viewport; `followEnd` (true by default) and a finite, non-negative `endThreshold`; a localizable `scrollLabel`; and `Item`.
  - **Height:** owned by the caller, with no invented page height.
  - **`data-scrollable`:** *derived* from real geometry (none/up/down/both), never a writable prop. SSR honestly reports `none`, and all four states are proven in the browser.
  - **Pinning:**
    - The first mount follows the end only when `followEnd` is true.
    - Later growth follows only while the reader is pinned.
    - Scrolling away unpins, and coming back re-pins.
    - Turning `followEnd` on later never moves an unpinned reader.
  - **Observers and lifetime:** a ResizeObserver on the viewport and content plus a MutationObserver on the content catch streaming without parent renders. Work is coalesced through a locally owned animation frame, and every observer, listener and frame is cleaned up. There are no global or document listeners and no message engine, and native scroll anchoring and keys stay intact.
  - **Scroll-to-latest button:** a native button with `aria-controls` that stays mounted. It's visible when content is below, stays visible while focused after activation (so focus is kept), and uses `visibility: hidden` when pinned and unfocused to leave the tab order. `aria-disabled` comes with guarded inert activation. Focus never moves into the viewport, and scrolling is instant.
  - **Glyph:** the existing `arrow-right` rotated 90°, so no new glyph.
- **Questionnaire:**
  - It's one real `form` with native `onSubmit`/FormData that's useful before JavaScript, and it never nests inside another form.
  - **Question step:** named radios or checkboxes in a `fieldset`/`legend`, with description and error IDs associated and `aria-invalid` truthful.
  - **Freeform step:** a named `textarea`.
  - **Complete step:** no answer controls or hidden persisted values.
  - Actions sit *outside* the disabled answer fieldset, so hosts can offer Previous, Skip or Edit, and progression and validation stay with the host.
  - Shortcut text is decorative only, with no new hotkeys.
  - Option values must be unique and non-empty.
- **Refusal and reset:**
  - Before proposing a change, every owned input is restored physically, including the radio siblings the browser unchecked, and text likewise.
  - Unchanged controlled props are reconciled on every render.
  - The caller's `onReset` runs first and can prevent it. Otherwise native reset runs, and then a guarded microtask reconciles *only* owned inputs, with no synthesized change or submit callbacks. An unmount guard covers queued work, and other supplied fields keep their native reset.
- **Constants and gates:**
  - Ledger geometry only: subtle 1 px rules, the 24 × 60 viewport padding, 640 max content width, the selected primary stroke and selected surface, and the 6/4 gaps. No new token values, style, dependencies or backend.
  - The gate list is complete: strict SSR on both scopes, a real browser scroll-state and keyboard matrix, two-root isolation and teardown, the same Shell chat geometry and streaming, native radio and checkbox keys, refusal, submit, reset, no-JS and hydration, focused Firefox and WebKit, `ui:add` fidelity, wrappers, quality, publish, the doc-lint baseline and all four carriers.
  - The under-30 budget is tight but has a declared split rule that doesn't weaken any gate.
  - Deferrals 11, 12 (including the owner's additive extensions) and 13 are explicit.

**Implementation advice:**

1. **First follow before paint.** Do the initial follow-to-end in a layout effect, so the first visible frame is already at the end without a flash. Assert it after real hydration.
2. **Observer setup.** Use `subtree`, `childList` and `characterData` on the MutationObserver, so text streaming into an existing message counts. Prove two scrollers on the same page never wake each other's frames.
3. **Nested forms.** HTML parsing silently drops a nested `form`. Document that Questionnaire must never be placed inside another form, and that hosts can compose a multi-step flow by rendering only one Questionnaire per form.
4. **IDs and names.** Use `useId` for the title, description and error IDs and the `aria-controls` target, so SSR and hydration agree. The default radio name `answer` is scoped per form, so two Questionnaires on one page won't collide, but test that.
5. **No live region.** MessageScroller deliberately adds no live region. Say in the README that new-message announcements belong to the host.
