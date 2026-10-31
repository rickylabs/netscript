**Verdict: PASS** for the S2 actions/forms slice. This is not a verdict on PR readiness.

**The evidence matches the frozen source.** All 11 CSS files match the SHA-256 values in `s2-source-hashes.json`. The sources were last modified at 07:58:15, and every final artefact was written after that:
- legacy check at 07:58:26
- tests at 07:58:27
- quality at 07:58:39
- capture at 07:59:35

**Gates:**
- **Browser capture:** 114 fixtures, 542 measurements, zero errors.
- **Tests:** 95 of 95 pass, exit code 0, no failures.
- **Legacy check:** 262 fixtures × 2 schemes, computed styles unchanged.
- **Quality:** no FAIL counts. The warnings are existing doctrine warnings in other packages.

**The capture assertions now test the right things:**
- It waits for finite animations to finish before measuring.
- The error and ring colours are read from the live tokens, not hardcoded.
- It asserts invalid borders across rest, hover, focus and active, and that a focused control has a solid 2px outline in the `ring` colour.
- It checks button heights of 28/32/40/32 for sm/md/lg/icon, disabled opacity of 0.38, and that hover paint differs from rest.
- It checks that the switch thumb moves in the negative direction in RTL and that reduced-motion transition duration is 0s.

**Round-1 blockers are resolved, by measurement:**
- **Invalid states hold.**
  - An invalid input stays at the `destructive` colour on hover and focus, and focus adds the 2px ring.
  - A checked invalid checkbox and a checked invalid switch keep the red border in all four states.
  - Working through specificity agrees: the invalid rules beat the `:where(:hover)` and `:checked` rules, and legacy rules stay lower.
- **Hover is real now.** Primary goes from 0.2435 to 0.3677 lightness. Ghost goes from transparent to an 8% tint, then 12% when pressed. An input's border goes from `input-border` to `border-control`.
- **Label typography matches the ledger.** The field label is now Host Grotesk, which is `font/label`. When the field is invalid, the label, the error icon and the error text use `destructive-text`, matching `review-field`. `field-light.png` shows this.
- **Scope matches the token build.** The guard now also accepts the bare `studio` theme with no flavor, which is the selector the token build emits for Utility.

**Non-blocking, carry forward:**
1. **Dark switch off-thumb is nearly invisible** (`switch-dark.png`). The `surface/card` thumb sits on the `muted` track, while the Utility reference shows a grey thumb you can see. This follows the spec because no base forms ledger exists, so record it as a visual gap for the design refresh. It is not a regression.
2. **The filter-form surface** uses transparent `card-bg`. S3 owns this, as you documented.
3. **The `Button size='icon'` fixture overflows** because the fixture misuses the component. The real IconButton renders correctly, and this is documented in `s2-comparison.md`.
4. **Figma-only anatomy is still deferred, not regressed:**
   - xs and link button variants
   - sm switch, sm input and input icons
   - indeterminate checkbox
   - optional and eyebrow label variants
   - toggle and button groups
