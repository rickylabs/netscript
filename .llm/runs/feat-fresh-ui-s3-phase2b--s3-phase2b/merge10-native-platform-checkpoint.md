# Native input correction and browser-port test setup — before source edits

The complete1280focused run is1252PASS28FAIL,0skip/flaky/retry. All caller
contrast is fixed. Remaining failures are8unsupported OTP permission grants,
16Chromium-specific browser-chrome assertions in modal tests, and4WebKit
NavigationMenu click-then-Tab failures. Keep that run failed and preserve it.

1. Public surface: no prop/part/value/keyboard-map change. One NavigationMenu
   base CSS rule makes its noninteractive summary label/chevron pointer-transparent,
   so the native summary receives activation. Existing navigation native test
   stays byte-exact. No JS focus controller or new handler. The current text-only
   parts keep their DOM/anatomy; content links remain interactive.
2. Vocabulary: pointer ownership is distinct from keyboard focus. Actual WebKit
   focus tracing shows no focus movement from a clicked Concepts summary, while
   explicitly focused content exits/closes correctly. A mode-verified CSS-only
   prototype restores click→Tab-to-content→Tab-out in all3engines; baseline fails
   WebKit, keyboard-only activation also passes. No speculative blur/rAF fix.
3. Ports: native details/summary and Clipboard API, actual trusted keypresses and
   paste, existing Dialog controls and browser automation. Isolated bare native
   dialogs reproduce Firefox's stuck browser-chrome boundary and WebKit's extra
   DIALOG stop; private focus-pref changes do not fix it and will not ship.
   The observations are consistent with primary Playwright issue39268. No API mock,
   browser preference change, token edit, environment dependency or arbitrary wait.
4. Constants: one selector for the existing label/chevron parts, pointer-events:none,
   independent of theme. Keep all old CSS rules byte-exact; add no Utility theme
   predicate or selector-list parent. The owner's literal measured×1.02 snapshot
   caps and exact dated reasons remain; final full-scope remeasurement still follows
   remaining Desktop/harness. Five-MB cap and every-byte check logic unchanged.
5. Ordered source/gates, same independent design first:
   - Add the one base NavigationMenu rule and explanatory comment; regenerate
     authored/shipped carrier. The existing unchanged native navigation case is
     already RED in all4WebKit projects; private mode-verified CSS candidate
     restores all3engines. Then prove that maintained case GREEN12 with real source.
   - OTP spec: remove only the unnecessary grantPermissions call. Existing trusted
     native editing already enables real Clipboard.writeText; native write/paste/
     sanitization/submit probe6PASS across3engines, no grants/mocks. Keep every
     editing, clipboard, paste and FormData assertion unchanged.
   - Modal specs: MOVE the two exact browser-chrome boundary blocks into two named
     boundary cases. They remain fully asserted in maintained Chromium. Keep all
     opening, selection, native-modal, outside-inert focus, backdrop, Escape, return,
     callback and strict-axe assertions in the original cases for ALL3engines.
     Add interior Tab/ShiftTab assertions there, so both keys still run everywhere.
     No original assertion is deleted or loosened; source assertion multiset proof.
     Request explicit classification of the new browser-chrome-only cases as
     Chromium automation-port proof in the private expanded matrix: bare native
     reference reproduces the unsupported FF/WK boundary, rather than product
     behavior being excused. No test.skip or maintained test exclusion. Other FF/WK
     modal/native keyboard tests continue. The original modal scenario names and
     contract keyboard metadata remain unchanged.
   - No navigation spec modification: do not replace the actual pointer path by
     keyboard activation or focus the content to hide the problem.
   - Scoped TS/TSX wrappers; canonical assets/prose generation before browser jobs.
     Measure updated full90CSS snapshot, literal2%caps and real authored CSS raw-only/
     gzip-only controls with canonical carriers, exact restore and positive gate.
     Old all3engine consolidation parity stays historical;89CSSfiles hash-identical,
     original NavigationMenu rule list/specificities unchanged plus exactly the
     independently approved pointer rule, checked natively in all3engines.
   - Fresh native setup/pointer56case proof with real source/no injected CSS; then
     complete expanded1288focused union. New boundary cases run maintained Chromium;
     the original two modal cases run all3, including interior Tab/ShiftTab, inert
     ownership/selection/cancel/focus return. Browser scope is stated explicitly.
   - Because product CSS changes, refresh ALLpackage866/docs140/CLI67/preflight/
     accuracy/exports/site/exactdoclint/root/quality, not readset-reuse them. After
     focusedPASS run fresh full maintainedChromium803 and affectedFFWK904. No retry,
     flaky, skips, allowance, timeout or assertion relaxation. Same source review
     BEFORE merge source commit; actual-head carriers/quality/native publication
     after all jobs close; SAME evidence/audit/ancestry/plainpush2538.
6. Deferred: no native Dialog runtime rewrite, focus emulation override, keyboard
   prevention or browser-specific production branch. No style contract mutation.
   Parent2%alignment plus ALL4Desktop11b3b/productionx12a/allstyle12b/final13 remain
   mandatory. No earlyREADY/finalreport, merge, label, release or19promotions.
7. Contributor path: NavigationMenu CSS and its unchanged native-disclosure browser
   case. Test setup remains in the existing forms/calendar/overlays specs. Raw
   references/traces/prototypes private; public counts/portable paths only.
