# Child merge10 source reconciliation — fresh full browser gates pass

Both complete browser runs are terminal PASS on the frozen source.
Current working tree is a normal merge of published parent2be80639 into child
c8218a99. Published childa9078d68 and reviewed Desktopc3d ancestry are retained;
main0af8 is included. No rebase/force-push, source commit or child push yet.

## Maintained behavior and intentional changes

- Parent main integration is already independently reviewed and published.
  Main-only CLI/docs/design-guidance changes and all three locks are preserved.
- Eligible DataTable, StatsGrid and layout Utility selectors use the exact
  compound root with native nesting. Original ordered rules, declarations,
  media and specificity were checked in all three engines. Window/Tray CSS is
  byte-identical to its reviewed replacement; parent brought no post-base
  semantic Utility additions to those files. See explicit disposition.
- MessageScroller's input-frame flag prevents a queued input measurement from
  following the end after an early native scroll consumes intent. Pinning,
  threshold math, listener/key map, DOM/CSS and SSR stay unchanged. Trusted
  one-pixel wheel regression was red first in Chromium/WebKit and is green
  on real source. No new timeout, retry, default prevention or engine branch.
- Caller controls use shipped Button in the AIInteraction fixture and 18 other
  consuming fixtures. Mechanical proof: 84 further tag sites, 12 imports,
  11 headless paint sites, two local token pairs and four unnamed wrappers
  preserving existing generic screenshot selectors. No assertion was loosened.
- One intentional NavigationMenu CSS rule makes only its own noninteractive
  summary label/chevron pointer-transparent. Navigation.spec stays byte-exact;
  the actual click→Tab→Tab-out path was red in all four WebKit projects and is
  now green in all twelve engine/scheme/width contexts. No focus/key controller.
  All 89 other CSS files are hash-identical; the 14 original navigation rules
  remain unchanged, plus one rule with native specificity0,3,1. Three engines
  verify scope, the untouched foreign control and unchanged summary hover paint.

## Native test setup and scope

Remove only OTP's unsupported, unnecessary permission grant; real write, paste,
sanitization and native form assertions remain. Move two exact modal browser-
chrome boundary blocks into named cases asserted in maintained Chromium. The
original modal scenarios run in all three engines with every open/select/modal/
inert/backdrop/Escape/return/callback/axe assertion and added interior Tab/ShiftTab.
Babel assertion multiset186→196, zero losses; each moved block occurs exactly once.

The same evaluator explicitly classified browser-chrome boundary automation as
Chromium-only proof in the private expansion. Isolated plain native dialog
references reproduce the unsupported FF/WK boundary outside product code. No
maintained test exclusion, test.skip, preference change or production workaround.
The two native clipboard read-permission cases retain their established Chromium
scope. Original scenario names and public keyboard metadata remain unchanged.

## Global size check

All90authored/shipped non-theme CSS files:335788raw/44819gzip. Literal2%caps are
342504/45716, each carrying the exact2026-11-01 owner reason. Inventory, equality,
compression, both assertions and5MBcheck logic are unchanged. Real authored CSS
plus canonical carriers rejects raw-only343829/45015 and gzip-only339329/48435;
exact source/carrier restoration and the positive four-result gate pass.

## Current-source evidence

- Scoped source/browser check/lint/fmt pass with zero dropped targets.
- Real-source native56PASS:24Chromium/16Firefox/16WebKit, including8Chromium boundary
  cases; no injected CSS, retries, flaky or skipped cases.
- Expanded focused1288PASS:440Chromium/424Firefox/424WebKit; no retry/flaky/skip.
- Fresh866package/140docs/67CLI PASS; quality/architecture/preflight/accuracy/exports
  and ten other root checks pass. Site260HTML/135registryartifacts; locks unchanged.
- Doc-lint remains exact accepted2531 debt:123TS+1JSON,0new/removed, RAWexit1.
- Both PR thread gates pass:0threads/0unanswered.
- Source711and compiled fixture9remain frozen and exact.
- Complete maintained Chromium803: PASS, zero failed/skipped/flaky/retried.
- Complete affected Firefox/WebKit904: PASS, zero failed/skipped/flaky/retried.

Next: same source review before merge source commit; regenerate
and check all four carriers through six commands, inspect the generated delta,
run actual-head durable quality and native publication after all jobs close,
same evidence review, public audit, a907ancestry check and plain push to2538.

Parent's own2%alignment is required before READY. Four Desktop audits, production
declared x extensions, the all-style harness and whole-phase runtime/final review/
exact-head green-or-explicitly-policy-skipped CI remain mandatory. No early READY,
final report, merge, labels, closing keyword or early19promotions. Raw evidence
stays private; public leak reports contain verdicts/counts only.
