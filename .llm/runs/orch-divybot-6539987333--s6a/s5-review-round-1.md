**Verdict: FAIL_FIX.** There is one blocker, and the visual gaps you listed are acceptable as scoped.

**Evidence matches the frozen source.** All 21 files match `s5-source-hashes.json`. The last source edit (the README, 09:04:08) came before the final capture (09:04:23). Gates: 112 tests, check/lint/fmt on 4 files with no findings, the quality gate, the legacy 262×2 comparison, and 60 fixtures / 684 measurements with zero errors. Every token the diff references exists in both the light and dark Utility blocks.

### Blocker: two unguarded legacy changes repaint every non-NS One preset
- **Where:**
  - `citation-chip.css:14` changes the chip border from `--ns-primary-border` to `--ns-primary-stroke`, outside the Utility guard.
  - `markdown.css:81` makes the same swap on the prose blockquote edge.
- **Why the gates miss it:** in NS One, `--ns-primary-stroke` is `var(--ns-primary-border)`, so it paints the same. The legacy comparator only loads NS One tokens, so it passes.
- **Why it's a real change:** in about 22 other presets the two roles differ. For example:
  - macos-27: tint `#8ec8f6` vs stroke `#0063e1`
  - tonal: `#c2b5f5` vs `#6550b9`
  - pixel: `#fcb452` vs `#faab35`

  Every legacy citation chip and blockquote in those themes goes from a soft tint to a strong brand stroke.
- **Why it isn't allowed:** the plan defers other styles, and `drift.md` doesn't mention the change, which contradicts the "legacy visible paint preserved" claim.
- **Utility doesn't need it:** the guarded citation-chip rule already sets the border to `transparent`, and there's a guarded prose blockquote rule at `markdown.css:259`.
- **Fix:**
  1. Revert both lines to `--ns-primary-border`.
  2. If Utility needs the stroke role, bind it only inside the guarded rules.
  3. Extend `check-legacy` to run at least one non-NS One preset (for example tonal or macos-27) besides NS One, then rerun the legacy and browser gates.

### Verified OK
- **Syntax highlighting is safe:**
  - highlight.js escapes the source before adding spans. Unknown or missing languages fall back to Preact text.
  - The tests cover hostile `<script>`/`onerror` input across html, typescript, unknown and missing languages.
  - The copy payload stays the original source.
  - The legacy `hljs-*` colours only apply under `.ns-markdown`, so a standalone CodeBlock in a legacy theme doesn't change colour.
- **Lockfiles:** both locks add only `highlight.js@11.11.1` with its integrity. The package lock also rewrites three better-auth peer keys without version or integrity changes; this is recorded in drift, and the tests pass under `--frozen`.
- **ModelSelector:** `DetailsHTMLAttributes` is a pure type widening for the existing `open`.
- **Everything else is guarded:** all other new CSS is inside the Utility guard, and the other deletions in the diff are docs, comments and JSX.

### The scoped visual gaps
- **Acceptable:**
  - **Composer layout.** It wraps into three rows in narrow cells. The legacy layout already wraps, and the markup puts the model selector in `tools`, not `actions`. Making it a single inline row would need new anatomy.
  - **No textarea height role / 16rem MCP frame.** No named role exists, and inventing a value would break plan rules.
  - **Native desktop dialogs.** The shipped component asks the OS to open alert/confirm/prompt dialogs, so drawing the Figma dialog would mean simulating new anatomy.
  - **Plaintext tool args/results.** The string API has no language prop.
- **Fix in passing or record:**
  - The composer toggles render at 28px with 14px text. The Figma Toggle sm is visibly smaller, and that size is what forces the wrapping.
  - Desktop-dialog launchers are three solid ink buttons. The legacy hierarchy was like that too, but the locked screens use one primary per group, so consider secondary/outline for the launchers.
  - With a user message plus typing state, the dots are grey on the ink bubble and barely visible.
  - The tool-call error result box has no red edge, unlike the reference.

### Non-blocking, for S6 to prove
- **Inline npm import.** `code-block.tsx` is the only registry file that imports an inline `npm:highlight.js@11.11.1/lib/common`, and it ships in the foundation collection.
  - Markdown declares `npm:highlight.js@^11` and imports through the import map instead.
  - Prefer a bare `highlight.js/lib/common` import, with the dependency aligned to `npm:highlight.js@^11`.
  - Either way, S6 `scaffold.runtime` must prove the copied CodeBlock type-checks and builds under the Fresh Vite plugin.
- **Bundle weight.** `lib/common` is heavy. It is already present wherever Markdown is used, but watch client bundles if Message or CodeBlock end up hydrated in islands.
