**Verdict: FAIL_FIX.** Two blockers, both against the locked renders. Everything else in S4R holds up.

**What checks out:**
- **Evidence matches the frozen source.** All 9 files match `s4r-source-hashes.json`. The last source change (08:36:15) came before the capture (08:37:12). The gates are clean: 94 tests pass, check/lint/fmt found nothing, the quality gate passes, the legacy check is 262×2 and the browser capture has 97 fixtures, 406 measurements and zero errors.

**Blockers:**

1. **In light mode, an off switch looks the same as an on switch** (`switch.css:91`).
   - **Cause:** `--ns-border-control` is `#202020` in Utility light, which is the same ink as `--ns-primary`. The capture confirms it: the off and checked tracks are both `oklch(0.2435)`, and the only difference is where the thumb sits (`switch-light.png`).
   - **Locked reference:** the off track is `#8d8d8d` in light (sRGB 141) and about `#6c6c6d` in dark.
   - **Fix:** use `var(--ns-input-border)` for the off track. It's an existing role, `#8d8d8d` in light and `#6e6e6e` in dark, so it matches the locked render in both schemes. It is also the off-track border colour already in use.
   - **Keep:** the explicit checked rule and invalid-border precedence.
   - **Add to `capture-utility`:** an assertion that the off track background differs from the checked track background in both schemes. The current assertions let this through.

2. **Field labels are smaller than the locked render** (`label.css`, the `--ns-text-label` binding).
   - **Locked reference:** labels like "Customer email" and "Tracking number" are sans, about 14px, weight 500, with normal letter-spacing. Their cap height is about 10px at 1×, close to the input text size.
   - **Actual:** about 11px with label tracking (`field-light.png`), so it reads as a small, letter-spaced caption.
   - **Why this outranks the S2 decision:** the locked render now outranks the library's 11px `type/label`.
   - **Fix:** bind Label and the field label to the existing strong roles: `--ns-text-strong` (14px), `--ns-weight-strong` (500), `--ns-leading-strong` and `--ns-tracking-strong`. No new values are needed.
   - **Keep:** the neutral invalid label colour and the red `destructive-text` error.

**Verified OK:**
- **Badge:**
  - Every Utility variant is now outlined in `currentColor` with a transparent fill and a 6px dot, which matches the locked "● Paid / ● Shipped / ● Refunded".
  - The new `[data-variant]` rule (0,6,0) overrides the per-variant fills through source order, and the tone text colour still comes from the variant rule.
  - The dot is `aria-hidden`, and the legacy themes hide it with `display:none`. A hidden flex child adds no gap, so the legacy layout is unchanged.
  - The TS catalog, `contracts.json` and the fixture's `parts` all agree.
- **Avatar:**
  - Initials always render. Under Utility, the photo is hidden and the initials appear in a grey square, with the agent avatar in ink.
  - The legacy themes hide the initials next to an image with `.ns-avatar > img + [data-scope='avatar']` (0,2,1). The Utility `display:contents` rule (0,6,0) wins over it.
  - The image has `alt=''` and the initials are hidden in legacy, so screen readers don't hear duplicate content.
- **Legacy comparator:** I don't see it masking real regressions.
  - The before run uses the HEAD markup and CSS; the after run uses the current markup and CSS.
  - Nodes hidden with `display:none` are dropped from both runs. If a node that used to be visible became hidden, the counts and order would shift, and the scope/part key in each row would expose the mismatch.
  - The variant specimens are unchanged.
- **Field:** the invalid label is neutral (`fg`) and the error text uses `destructive-text`, as in the locked render.
- **Dark switch:** off and on are distinct, and both match the locked render.
- **Selected nav:** the decision that the composed locked screen and the transparent `nav-active` win over the state sheet is recorded in drift. That settles the S4 carry item.

**Non-blocking:**
- Every Utility badge gets a dot, including non-status uses such as the scaffold top bar's muted app badge. That's acceptable under the owner's rule, but S6 screenshots should confirm it reads well.
- The avatar part `when` text in the catalog is still the generic phrase. Consider noting that initials are always emitted.

After the two fixes, re-freeze the source and rerun the capture (with the new switch assertion), the legacy check, the tests and the quality gate.
