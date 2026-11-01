**Verdict: FAIL_FIX**

The code is mostly in good shape, but two things block sign-off. The diff changed while I was reviewing, so the evidence no longer matches the code. And the label font doesn't match the ledger.

**Timing of evidence vs code.** The Chromium capture and legacy check ran at 07:51, and tests and quality at 07:47. After that, `form-control-styles.css` changed at 07:53 and `checkbox.css`/`switch.css` at 07:56. By my reading, those edits fix the bugs the earlier capture showed, but none of the current CSS has been rendered or tested.

### Blockers

1. **The evidence predates the current CSS, and it can't prove hover.**
   - **What the old capture showed.** In `state-82-light-hover`, an invalid input turned black on hover. In `state-94` focus, an invalid checkbox lost its red border. A checked invalid checkbox showed the `primary-stroke` border instead of red.
   - **What the new code does.** Hover is now `:where(:hover)`, and the invalid rules for choice controls are now `(0,7,0)`. Worked through, invalid should win against hover and checked, but this is only analysis.
   - **The `drift.md` claim.** It says hover is bound to the label and invalid stays red after checked/hover. It was written alongside the code and was never verified in a browser.
   - **Capture method.** Transitions are left on during the state pass. Hover values are captured at the start of the transition: for example, primary hover reads `oklab(0.2435)`, which is just the rest colour. So hover measurements prove nothing.
   - **Weak assertions.** The script only checks radius, shadow and transform.
   - **Fix:** freeze the diff. Turn transitions off in the state pass, or wait for them to end, and keep the reduced-motion check as its own pass. Assert these cases:
     - invalid + hover
     - invalid + focus
     - invalid + checked, for checkbox and switch
     - hover differs from rest
     - focus outline is 2px in the `ring` colour
     - disabled opacity is 0.38
     - sm/md/lg heights are 28/32/40

     Then rerun the capture, `check-legacy`, the Fresh UI tests and `quality:gate`.

2. **Label font is wrong** (`label.css:17`). Both Label and the field label use `var(--ns-font-mono)` with label tracking. In the ledger (`review-label`, `review-field`, and spec §T.label), the default label is `font/label`, which is the sans font. Mono uppercase is the eyebrow variant, and that variant doesn't ship. `field-light.png` shows a tracked mono "N a m e" where Figma shows a sans "Email". **Fix:** use `var(--ns-font-label)`.

### Verified OK
- **Tokens:** all 64 referenced `--ns-*` tokens exist in both the light and dark Utility blocks. The state opacities are unitless (8, 12, 38), so the `color-mix`/`calc` maths is valid.
- **Legacy isolation holds by construction:**
  - Every new rule is behind the Utility `:root` guard.
  - The only change outside the guard reformats the `form-control` transition.
  - `s2-legacy.json` compared computed styles before and after across 262 fixtures with no differences.
- **Buttons:** sizes measure sm 28, md 32, lg 40 and icon 32. The 3D shadow and transform are removed in every state. Focus uses outline width 2 and offset 2 in `ring`. Disabled is 0.38. Loading stays at full opacity, which matches the ledger.
- **Inputs:** radius 0. Focus uses an outline, not a box-shadow. The disabled fill is `muted`.
- **RTL and reduced motion:** the switch thumb translates in the negative direction under `:dir(rtl)`, and transition duration is 0s.
- **Switch thumb travel:** `W − H` is the correct travel distance.
- **Field error colour:** `destructive-text` matches the ledger's dark-red text.

### Non-blocking (fix or record in drift)
- **Bare studio theme.** The token build also emits the Utility tokens for `[data-theme='studio']` with no flavor, but no S2 rule matches that case. The `[data-theme='studio-utility']` branch is never emitted at all. Either align the guard with the token alias or document the difference.
- **`Button size='icon'` fixtures.** They pass a visible "Action" label that overflows the 32px square (`★Action` / `Actio` in `button-light.png`). The non-NS One rule at HEAD already behaves this way, and the real IconButton renders correctly. Fix the fixture rather than the CSS.
- **Invalid field label.** The ledger colours the label for an invalid field. `FormField` already emits `data-state='invalid'`, but the label isn't styled for it.
- **Switch off thumb.** The spec says `surface/card`, but the Utility reference PNG renders a grey off thumb. Confirm against the as-built ledger, which wins.
- **Filter form background.** It uses `--ns-card-bg`, which is transparent in Utility. Other S2 surfaces use `--ns-card`. Settle this with S3, which owns cards.

### Figma-only, not regressions (deferred; no public contract today)
- Button xs size and link variant
- Switch sm, input sm, and input-group icons/clear
- Checkbox indeterminate
- Label optional/eyebrow variants
- Toggle, toggle group and button group
