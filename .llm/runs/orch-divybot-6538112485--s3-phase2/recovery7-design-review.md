# Independent recovery7 design review

PASS (recovery 7 design checkpoint: rebasing onto main `43aa891e` and combining Utility behavior)

The checkpoint (`.llm/runs/orch-divybot-6538112485--s3-phase2/recovery7-checkpoint.md`) is a safe, complete integration plan within the owner-authorized recovery. Unlike recovery 6, it correctly treats main's 26 overlapping maintained source changes as real source changes that need fresh testing, rather than claiming the source is unchanged.

- **What's preserved:**
  - All phase 2a APIs and the native keyboard, clipboard, tab and diff behavior.
  - Main's Utility role bindings, automatic CodeBlock highlighting, Badge `info`, the Avatar/Donut/Prose coverage, route bindings and offline docs provenance.
  - The child's reviewed components and the frozen legacy registry fixture.
  - No new identity, token value, chosen upgrade or early promotion.
- **Highlighting ownership is right:**
  - Caller `CodeBlock.Token`/`line.content` take precedence. Main's highlighting only applies when content is absent and the language is recognized; unknown languages stay escaped text.
  - Each tab uses its own language.
  - The raw clipboard payload, row identity, numbers, diff signs and variants stay independent of the markup, and parsed markup adds no focus or key behavior.
- **The parser approach is right:**
  - It uses main's existing upstream common highlighter (same `npm:^11` mapping, matching standalone browser import) and only the *public* `HighlightResult.value`, never the private `_top`/`_emitter`.
  - The complete displayed source is highlighted *once*, so multiline comments, strings and embedded languages stay correct. A small local function then splits only that trusted, already-escaped output (escaped text plus balanced class spans) into per-line fragments by closing and reopening the span stack at newlines.
  - That isn't an HTML parser for caller input. It keeps the decoded text exact and regroups fragments when a caller row itself contains a newline.
  - Lines are never highlighted one at a time.
- **Conflict handling:**
  - A bounded driver regenerates only allowlisted derived files and stops on every maintained conflict, with no compressed carrier chosen from either side.
  - Maintained conflicts are combined individually and recorded.
  - Locks have zero topic delta.
- **Gates:**
  - Full parent package and browser matrices.
  - Meaningful highlighter tests: known and unknown languages, hostile source, multiline and nested syntax across rows, content precedence, per-tab language, exact clipboard and decoded text, numbering, signs and counts, raw line endings, and installed TSX/CSS fidelity.
  - The existing 7-role × 4-surface contrast gate.
  - Wrappers, quality, docs, publish, the doc-lint baseline and all four committed-source carriers.
  - Independent integration and evidence reviews and a mandatory public audit before each exact-lease push, parent first and then child.
- **Scope:** 11b, 12 and 13 stay explicit, with no READY, labels or early promotions.

**Implementation advice:**

1. **Hooks with tabs.** Don't call a memo hook per tab inside a `map`, because the hook count changes with the number of tabs. Use one `useMemo` keyed on the files' `(language, text)` tuples, or a ref-held cache keyed by `language + '\0' + text`. Test adding and removing a tab at runtime.
2. **Injecting markup.** If line fragments go in through `dangerouslySetInnerHTML`, keep that limited to the splitter's own output from `HighlightResult.value`, never caller strings. Add a test that a caller `content`/`Token` is never passed through the HTML path, and a hostile-source test (for example `</span><script>`) proving it comes out escaped.
3. **Language detection.** Use explicit `highlight(code, { language })` for recognized languages only, not `highlightAuto`, so output is deterministic between SSR and hydration. Check `getLanguage()` first so an unknown language falls back to escaped text without throwing.
4. **Contrast in context.** After mapping the `hljs-*` classes to the existing syntax roles, rerun the measured contrast on the tinted diff and highlight rows with the contextual ink mix, so main's role selectors can't override the AA-safe mix.
