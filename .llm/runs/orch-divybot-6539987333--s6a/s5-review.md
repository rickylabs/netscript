**Verdict: PASS.** The round-1 blocker is fixed and the legacy check can now catch that kind of regression.

**Evidence matches the frozen source.** All 21 files match `s5-source-hashes.json`. The only edits since the first review are the two reverted CSS files (09:15:21), and both final captures ran after them: the main capture at 09:19:29 and the citation capture at 09:20:36.

**The blocker is fixed:**
- In `citation-chip.css` and `markdown.css`, the diff now only adds lines inside the Utility guard. The base citation-chip border and the prose blockquote edge are back to `--ns-primary-border`.
- The only lines the diff still removes are the CodeBlock and ModelSelector comment/JSX/type lines from round 1. No legacy CSS line is changed.

**The legacy check is stronger and proven to work:**
- `check-legacy` now loads the real token file for NS One, tonal and macos-27, and sets `data-theme=<preset>` with `data-scheme=light|dark`, so each preset's own light and dark blocks apply.
- The final run is 262 fixtures × 3 presets × 2 schemes with zero differences.
- The run before the fix (`s5-legacy-negative.json`) flagged the tonal citation-chip border changing from `oklch(0.806…)` (the `primary-border` tint) to `oklch(0.508…)` (`primary-stroke`). That shows the new check catches exactly this regression.

**Other gates:**
- Browser: 58 fixtures + 2 supplemental, zero errors.
- The CSS revert just restores the HEAD lines, so carrying over the earlier 112 tests, check/lint/fmt on 4 files, and the quality gate is sound.

**Bookkeeping, not blocking:**
- **Measurement count mismatch.** `s5-gates.json` records 670 + 18 = 688 measurements, and the supplemental citation file contains 18. `s5-comparison.md` and your brief say 684 (14 supplemental). Fix the count in S6.
- **Carried into S6.** The inline `npm:highlight.js@11.11.1/lib/common` import in the copied CodeBlock still needs the S6 `scaffold.runtime` type-check and Fresh Vite build proof. If you switch to a bare `highlight.js/lib/common` import, align it with Markdown's `npm:highlight.js@^11` at the same time.
- **Recorded, unchanged.** The accepted anatomy gaps and the four visual notes are in `s5-comparison.md` and drift, with no claim of exact parity:
  - composer toggles at 28px/14px
  - equal-emphasis desktop launchers
  - muted typing dots on the ink bubble
  - no red edge on the tool-call error result
