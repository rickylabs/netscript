# docs/user-site visual-regression fix worklog

## Design

- Public surface: static Lume docs site under `docs/site`, using `_includes/layouts/base.vto` and the
  already-linked `/styles/docs.css` stylesheet.
- Domain vocabulary: documentation components (`hero`, `card`, `featureGrid`, `callout`,
  `apiTable`, `tabbedCode`, `learningPath`, `breadcrumb`, `nextPrev`), global docs chrome, prose
  code rendering, mobile overflow.
- Ports: Lume build (`deno task --cwd docs/site build`), local static server with `/netscript/`
  prefix, Playwright Chromium visual sweep.
- Constants: base URL `/netscript/`; desktop viewport `1280x900`; mobile viewport `390x844`.
- Commit slices:
  1. `fix(docs): load component styles from docs stylesheet` — move invalid component CSS/JS
     front-matter into global CSS/layout, remove leaked blocks from all 9 components, and prove with
     build, grep, scoped fmt, Playwright screenshots.
- Deferred scope: build-time highlight.js unescaped-HTML warnings remain as pre-existing content
  highlighter warnings; browser console checks are clean.
- Contributor path: component markup remains in `docs/site/_components/*.vto`; visual rules now live
  in `docs/site/styles/docs.css` under "Documentation components"; tabbed-code enhancement lives in
  `docs/site/_includes/layouts/base.vto`.

## 2026-06-19 Slice 1

### Root Cause

Confirmed. All 9 component files started with Vento comments before `---`, so Lume did not parse the
front matter at byte 0. The `css:` front-matter blocks rendered as literal body text, and component
styles were never emitted into the built head. `tabbedCode.vto` also had an invalid `js:` block in
the same path.

### Changes

- Moved component CSS for breadcrumb, hero, card, feature grid, callout, learning path, API table,
  tabbed code, and next/previous pager into `docs/site/styles/docs.css`.
- Removed all `css:`/front-matter blocks from `docs/site/_components/*.vto`.
- Moved the tabbed-code progressive enhancement script into `docs/site/_includes/layouts/base.vto`.
- Added inline prose-code wrapping while preserving fenced-code horizontal scrolling, fixing mobile
  overflow on `/netscript/tutorials/durable-workflow/`.

### Screenshots

Before:

- `.llm/tmp/run/docs-visual-fix/screenshots/before-desktop-landing.png`
- `.llm/tmp/run/docs-visual-fix/screenshots/before-mobile-landing.png`
- `.llm/tmp/run/docs-visual-fix/screenshots/before-mobile-tutorial-durable-workflow.png`

After sweep:

- Full set: `.llm/tmp/run/docs-visual-fix/screenshots/*.png`
- Representative: `.llm/tmp/run/docs-visual-fix/screenshots/desktop-landing.png`
- Representative: `.llm/tmp/run/docs-visual-fix/screenshots/mobile-tutorial-durable-workflow.png`
- Report: `.llm/tmp/run/docs-visual-fix/reports/visual-sweep.json`

### Gates

| Gate | Result |
| --- | --- |
| `deno task --cwd docs/site build` | PASS, `Site built into _site`, 142 files generated |
| Built HTML grep: `css: \|` | PASS, 0 matches |
| Built HTML grep: `js: \|` | PASS, 0 matches |
| Built HTML grep: stray `---` delimiter | PASS, 0 matches |
| Component selector spot-check | PASS, `.ns-hero {` appears in CSS only, 0 HTML matches |
| `deno fmt --check` scoped to touched docs files | PASS, 11 files checked |
| Playwright Chromium visual sweep | PASS, 36 visits, 0 failures, 0 console errors, 0 page errors, 0 leaks, max overflow 0 |

Build still prints pre-existing highlight.js unescaped-HTML warnings during static generation. The
Playwright browser console check across the audited pages reports zero errors.

## Completion Entry

- Implementation commit: `c911e97`.
- Final verdict from implementation session: source fix applied, visual sweep green, screenshots and
  report saved under `.llm/tmp/run/docs-visual-fix/`.
- Ready for separate evaluator session; not merged.
