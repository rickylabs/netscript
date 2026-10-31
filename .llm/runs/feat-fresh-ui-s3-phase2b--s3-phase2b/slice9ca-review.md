# Independent9c-a source review

PASS (slice 9c-a source review: the responsive SidebarShell family)

I found no blockers in the uncommitted shell family. It implements the reviewed checkpoint with native ownership, real refusal handling and clean lifetimes.

- **Static to hydrated** (`packages/fresh-ui/registry/components/ui/sidebar-shell.tsx`):
  - The first render has an unknown breakpoint, so the server and the first client render both produce the same open native `details` (lines 186, 206-224).
  - A layout effect then measures the two media queries and switches to exactly one branch (lines 102-127): the desktop `aside` or the public native Dialog. That happens before paint, so hydration matches.
  - The derived `data-breakpoint` attributes are left out until measured.
  - All three branches use one `useId`-based ID (`sidebarId` on the `details`, the Dialog content and the `aside`), so `aria-controls` stays valid when the branch changes.
- **Open state and refusal:**
  - `changeOpen` respects controlled `sidebarOpen`. A forced `native-close` only announces the real state, without scheduling a reopen (lines 95-100), which follows the 9c0 policy.
  - Moving from mobile to desktop drops the dialog by switching branch, not by calling `close()`, so no stale close callback reaches the host.
  - `popstate` and link navigation close the mobile modal through the same port.
  - Media-query listeners and the root and `popstate` listeners are removed on cleanup (lines 121-126, 162-167).
- **Focus handoff** (lines 129-149):
  - It's only recorded when the focused element is inside the replaced sidebar or drawer and the change crosses the desktop boundary.
  - It's applied in a microtask that can be cancelled, after child layout settles, preferring the same `href`, then the visible enabled trigger, then the first link.
  - Focus elsewhere is left alone.
- **Toggle protocol** (`registry/lib/sidebar-events.ts`, `registry/islands/SidebarToggle.tsx`):
  - Shared constants and payload types live in one place.
  - Requests are validated as `{ open: boolean }`, are non-bubbling, and are only accepted when `event.target` is this shell's root. State is read from the real `details`, `dialog` or `aside` of the toggle's own shell, so two shells can't cross-control each other.
  - In static mode the toggle drives the native `details` and listens for its `toggle` event. In hydrated mode it sends a request and reflects the real announced state, so a refusal never flips `aria-expanded` early.
  - The explicit-selector legacy path keeps its behavior and restores the exact previous body overflow. Switching from default to explicit selectors clears stale `aria-controls`.
- **Contract:**
  - `data-sidebar-mode`, `data-sidebar-presentation` and the other root axes are canonical. `data-sidebar-presentation` avoids the bare legacy `data-sidebar` selector.
  - The new N4 group Enter/Space keyboard metadata matches the native disclosure.
  - The phantom-prop corrections are marked as baseline fixes.
  - 104/91/13 unchanged, native items 119 → 120 (one support library), and the frozen v1 snapshot is untouched.
- **Evidence:**
  - 40 browser cases with zero serious or critical axe findings on the real mobile modal, desktop sidebar and chat layouts.
  - Two focused Firefox and WebKit isolation cases, honestly marked as not full engine certification.
  - A real installed Fresh production consumer (390/1280) where JSX slots serialize through the island exactly once, with no console errors.
  - 418 + 3 related contract, runtime and registry cases; scoped wrappers, quality/architecture, preflight, docs accuracy, export drift and the native publish dry-run all pass.
  - The 124 doc-lint failure stays visible as debt #2531, with an unchanged diagnostic set.

**Non-blocking:**

1. **Hard-coded English labels.**
   - The static summary text is the literal "Sidebar navigation" (line 220) instead of `navLabel`. Use `navLabel`, or a dedicated label, so a localized `navLabel` matches the visible summary.
   - The drawer description, the "Close sidebar" and "Open sidebar" labels and the chat region name "Conversation" are also English constants. Consider optional label props, as SidebarToggle already has `openLabel`/`closeLabel`, before the shell is widely localized.
2. **Toggle on desktop.** In hydrated desktop mode the toggle reports `aria-expanded="true"` for the `aside`, but its request is ignored. Make sure the managed toggle is hidden or inert at desktop widths, so a visible control never announces itself as expandable while doing nothing. Add a short assertion to the browser spec.
3. **Private browser setup.** The private Firefox/WebKit library setup and the Fresh consumer server (owned port) are test-environment mechanics. Confirm the owned process and artifacts are cleaned up before push, as you've stated.

Next, the source commit, the N4 metadata contract rerun, the four carriers afterwards, then evidence review, privacy, push and the PR comment. The StatsGrid/DataTable 9c-b slice comes after that.


## Final source delta review

PASS (slice 9c-a final source change after the earlier PASS)

The only product change since my PASS is the requested one, and it adds no blocker.

- **Summary label:** the static native summary now renders `{navLabel}` (`packages/fresh-ui/registry/components/ui/sidebar-shell.tsx:215-221`), so a localized `navLabel` matches the visible text. Its default ("Sidebar navigation") gives the same output as before, and the new SSR custom-label assertion covers it.
- **Desktop toggle:** an explicit browser check now confirms the managed toggle is hidden at desktop widths. The CSS already hid it, so behavior is unchanged.
- **No other changes:** no API, enum, token, lock or dependency change. Leaving the other English defaults as documented defaults, without adding unplanned localization props, is acceptable and should be recorded as a future localization task.

Before the source commit, the in-flight reruns must finish green on these exact bytes: 356 contract tests, 40 browser cases and the source wrappers. Then run the four carriers after the commit. The owned consumer process is reported stopped, and the raw captures stay private and out of Git. No READY.
