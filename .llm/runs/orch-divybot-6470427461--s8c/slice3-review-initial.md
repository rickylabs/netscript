**Verdict: FAIL_FIX**

I found two blockers. The rest of the slice 3 checks pass (listed at the end).

### Blocker 1: tab names now prefer the filename, so the homepage database tabs all have the same name

- **Where:** `docs/site/_components/tabbedCode.vto:8`.
- **Problem:** The tab button text is `tab.filename || tab.path || tab.label`. The homepage runtime group in `docs/site/index.vto:52` has four tabs (`postgres`, `mysql`, `mssql`, `sqlite`), and all of them set the same filename, `my-app/ — workspace root`.
  - The built `docs/site/_site/index.html` (lines 134-137) shows four tabs all named "my-app/ — workspace root". Keyboard and screen-reader users can't tell which database each tab is for. The Copy label, `Copy ${tab text} code` in `docs/site/assets/docs/tabs.js:32`, repeats the same name.
  - Without JS, the shared header is hidden (`docs/site/styles/components.css:318`). Each panel's own header only shows the filename and "Shell", because `tab.label` is never passed to `codeBlock` (`tabbedCode.vto:16`). So the database label disappears completely.
- **Fix:**
  - Make `tab.label` the tab name, falling back to filename or path only when there is no label.
  - Show the selected tab's filename in the shared header, updated on activation in the same way as `data-tab-language`.
  - Make sure each panel exposes its `tab.label` without JS, for example by passing it into the panel header.
  - Add browser assertions: the homepage runtime tabs have the distinct names postgres, mysql, mssql and sqlite, and with JS disabled each panel shows its label.

### Blocker 2: the build-time code headers leak into Markdown twins, `llms-full.txt`, the CLI carriers and Pagefind

- **Where:** `docs/site/_config.ts:236-278` (the fence framing) and `docs/site/_plugins/ai-tooling.ts:196-252`.
- **Problem:** Fences are now framed inside the article before `aiTooling` turns the article into Markdown.
  - The twin converter only skips `aria-hidden` elements and buttons. So `.ns-code-header` is written out as inline text with no separator. Examples from `docs/site/_site/durable-workflows/sagas/index.md:57`, `:218` and `:268`: `plugins/sagas/order-saga.tsTypeScript`, `netscript.config.tsTypeScript`.
  - The current build has 698 such lines across 150 twins. They also flow into `llms-full.txt` and the CLI carriers built from it.
  - Pagefind now indexes the header label on every fence. It also indexes the gutter line numbers, because Pagefind doesn't skip `aria-hidden`.
  - This breaks the plan's requirement that clean Markdown twins are preserved.
- **Fix:**
  - Have `ai-tooling.ts` skip `.ns-code-header` (or a dedicated twin-ignore attribute on it). The fence info string already carries the language.
  - Add `data-pagefind-ignore` to the code header and the gutter. That covers framed fences and the `codeBlock` component.
  - Add an assertion that a twin with a filenamed fence contains no standalone language-label line and no `…tsTypeScript`-style joined text.

### Checked and passing

- **Grammars are real and registered.** Every label key is registered with a real upstream grammar at the existing highlight.js version, and `_config.ts:164-166` asserts that the two lists match:
  - dotenv uses the INI grammar and jsonc uses the JSON grammar (which supports comments);
  - html and xml use the XML grammar;
  - plaintext and prisma are explicit plain-text entries.
- **Unknown languages fail the build.** `_config.ts:240-241` asserts on every `.ns-prose pre`, including component blocks, before skipping already-framed ones.
- **The source fence test is sound.** `tools/docs-site/code-languages_test.ts` respects nested fence lengths, requires more than 100 fences, and has negative cases for unknown fences and missing registrations.
- **Copy uses the selected panel.** In tabs, Copy reads only the visible panel's `pre code`, and gutters stay outside `code`.
- **Keyboard behaviour is complete.** Arrow keys, Home and End all work, focus follows selection, and roving `tabindex` is in place.
- **There is one header in each mode.** When enhanced, the shared header shows and the per-panel headers are hidden (`components.css:318`, `components.css:328`). Without JS, all panels are visible with their own headers, and Copy buttons stay `js-only`.

Per your instructions I didn't assess the tab ID randomness (slice 5) or syntax colours (slice 6). This verdict is based only on the source and the current build output above; I haven't seen the remaining no-JS and exclusion browser runs.
