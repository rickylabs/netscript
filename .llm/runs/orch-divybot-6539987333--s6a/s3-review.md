**Verdict: PASS** for the S3 surfaces/feedback slice. S4–S6 were not assessed.

**The evidence matches the frozen source.** All 20 files in `s3-source-hashes.json` match on disk. The source was last modified at 08:10:22, and the capture ran after that, at 08:10:45. Gates:
- tests: 93 pass, 0 fail
- scoped check, lint and fmt: 3 files, 0 findings
- legacy comparison: 262×2 with no changes
- quality gate: exit 0
- browser capture: 92 fixtures, 230 measurements, zero errors

**Cascade and roles:**
- **Tokens:** every `--ns-*` role the S3 diff references exists in both the light and dark Utility blocks, including the eyebrow font and weight and `tracking-wide`. The three info roles also exist in NS One.
- **Isolation:** every new rule sits behind the Utility guard, including bare `studio`. The two exceptions are an unscoped formatting change to the card transition and the new Badge `info` rule, which is additive and falls back to the secondary roles. No existing fixture renders `info`, so the legacy result can't change, and the legacy comparison confirms it.
- **Specificity:** the Utility badge rules tie the non-NS One badge override at (0,6,0) and win because they come later; measured colours confirm this.
- **Existing parts:** all are reused. The only part hidden is the toast `eyebrow`, and the title already falls back to the type label.
- **Badge `info` contract:** the type, the real render fixture, the catalog TS and `contracts.json` move together. `plannedValues` is removed.

**Measured and visual checks against Figma:**
- **Card:**
  - Transparent fill, radius 0, no shadow, and a top hairline only (side and bottom borders 0px), as `review-card` specifies.
  - Native keyboard focus gives a 2px solid outline in the ring colour in both schemes.
  - The title uses the heading role and the description uses small text in `muted-fg`.
- **Alert, inline-notice and toast:**
  - The fill and border come from the subtle and border status roles. Title, icon and symbol use the tone's text colour, and the description uses `fg`.
  - The dark-mode tints match `review-alert` and `review-toast`.
  - The toast timer sits at the bottom in the text tone. Dismiss gets the 2px ring on focus.
- **Toast runtime placement:** bottom-end at 16px in every case.
  - desktop: x=904 in LTR and x=16 in RTL
  - mobile: full width minus 16px insets
  - this matches the Figma toaster position
- **Badge:** mono, sentence case, radius 2. All seven tones resolve in dark, including the new `info`.
- **Avatar:** square at 24, 32 and 40. Presence uses `inset-inline-end`.
- **Progress:**
  - The track is sharp and uses `material-track`. The fill is the marker, plus the semantic colours.
  - In RTL the track mirrors. Under reduced motion the legacy static 42% fill still applies, because Utility only turns off the animation.
- **Empty-state, separator and section-divider:** their roles match the comparison table.

**Non-blocking, carry forward:**
1. **Indeterminate progress looks empty in the `progress-*.png` galleries.** The infinite sweep was captured while the bar was off the track. This is a capture artefact, not a CSS defect: the reduced-motion path is static. Freeze or reduce motion for loading fixtures in the S6 summary capture so the gallery isn't misleading.
2. **The toast enter/exit animation still slides on +X.** That's inward for the LTR end position but outward-origin in RTL. It's existing motion and minor; mirror it under `:dir(rtl)` if it's ever touched.
3. **The card footer keeps a `border-subtle` top divider.** The Figma footer part shows none. Confirm against the as-built ledger in the S6 design refresh.
4. **`filter-form.css` is S2-owned in the plan but was carried in S3.** `drift.md` records this, so ownership is traceable.
5. **The `badge.tsx` change will affect the generated carriers** (the embedded registry and the export corpus). Their freshness stays an S6 gate, as you stated.

**Figma-only, not regressions:**
- card `rule`/`sm`/`selected` variants and the stat card
- badge outline/solid/plain styles and dot/icon/remove parts
- alert neutral/important/strong variants and action/dismiss parts
- the inline-notice trailing action
- toast default/loading types, actions and stacked toaster
- the spinner tone axis
- circular progress and value labels
- empty-state media and actions
- filter chips
