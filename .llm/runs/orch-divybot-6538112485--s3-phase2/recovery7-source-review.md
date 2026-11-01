# Independent recovery7 integration source review

PASS (recovery 7 integration source review: parent at `186a3e94` onto main `43aa891e`, plus the 16 uncommitted integration files)

The combination keeps main's automatic highlighting and Utility roles together with every topic behavior, and it fixes a silent merge loss. I found no blockers.

- **Integration discipline:**
  - All 258 main paths that don't overlap are exactly main's, and the root, Fresh UI and docs locks have zero topic change.
  - The ten maintained conflicts are combined one by one and recorded in `recovery7-resolutions.md`, while the bounded driver only regenerated derived files.
  - Nothing is claimed as unchanged UI. The full matrices were run again.
- **The highlighter** (`packages/fresh-ui/registry/components/ui/code-block.tsx:120-178`):
  - `highlightedLines` calls the public `hljs.highlight(source, { language, ignoreIllegals: true }).value` once over the complete displayed source. That's main's pinned 11.11.1 build, with no private `_top`/`_emitter`, no per-line lexical reset and no `highlightAuto`, so SSR and hydration produce the same output.
  - The splitter only tokenizes the upstream output's own `<span class="…">`, `</span>` and newlines. At each newline it closes the open stack and reopens it on the next line, so the escaped text and nested scopes survive across lines without parsing arbitrary HTML.
- **`CodeRows`:**
  - It's a child component per tab with one `useMemo([source, language])`, so there are no hooks inside the parent's `map`, and adding or removing tabs at runtime is covered by tests.
  - The `getLanguage` check makes unknown languages fall back to escaped text.
  - It regroups fragments for rows that contain their own newline.
  - **Caller content wins:** `line.content ?? …` (lines 167-169). Caller strings and `Token`s never reach the `dangerouslySetInnerHTML` path, which only ever receives the splitter's output, with a hostile-source test proving it's escaped.
  - Raw clipboard text, numbering, signs, variants and the topic tab, diff and callback APIs are unchanged.
- **Silent merge loss fixed:**
  - The registry `code-block` entry had two `dependencies` keys, and `JSON.parse` kept only the last one, dropping main's `npm:highlight.js@^11`.
  - It now has one canonical list containing both `npm:highlight.js@^11` and `jsr:@netscript/fresh-ui@0.0.8` (`registry.json:2345-2348`), with a duplicate-key check across all registry objects.
  - A new negative test fails if highlight.js is removed, and installing CodeBlock *alone* first proves the parser and runtime mappings exist before Markdown could hide a missing one.
  - The frozen legacy baseline and its named repairs are preserved, including main's Markdown range guard.
- **Styling:**
  - Main's class-role bindings now set the existing local ink, and the contextual 80% mix still applies to automatically highlighted classes.
  - Both the classic `Token` matrix (28 cells per project) and the automatic seven roles × four surfaces pass measured AA with colour kept, and the existing gate isn't relaxed.
  - Main's Badge `info`, Donut palette, Prose examples and Utility Card, Pagination, CommandPalette, PageHeader and floating roles are combined with the topic variants. No token values changed.
- **Evidence:**
  - The full package passed 622/0/0.
  - The full parent Chromium matrix passed 318/0/0 including touch, the focused CodeBlock and fidelity cases passed 44, and 12 real Firefox/WebKit cases passed, honestly scoped.
  - The wrappers passed with nothing dropped, along with quality, preflight, docs accuracy, export drift, the 259-page site build and native publish (0 slow types).
  - The 124 doc-lint failure stays explicit under #2531, with 0 new and 0 removed diagnostics.
  - Review threads on #2488: 0 unanswered.
  - The two fixture prototype failures were fixed in the fixture inputs without relaxing any assertion.

**Non-blocking:**
- In diff mode, removed and added rows are highlighted together as one source. Interleaved old and new lines can occasionally carry lexical state across them, for example a removed line that opens a comment. That's acceptable for display, and the raw copy excludes removed rows. Mention it in the README next to explicit `content`, which hosts can use to override.

Next: the focused 16-file source and carrier commit with run artifacts, then all four committed-source carriers, quality at the current head, native publish refresh and the same evidence review. Only after that comes the exact-lease parent force-push against `71d8df6f…`, followed by the child `d0d8d922` restack with its own review, gates and lease before any 11b source. 11b, 12 and 13 are still required. No READY, labels or early promotions.
