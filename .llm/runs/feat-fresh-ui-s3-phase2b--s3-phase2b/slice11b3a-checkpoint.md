# Desktop11b3a design checkpoint — window chrome and tray controls

Docs11b2 is terminal at a9078d68, source/evidence PASS, PR2538 comment6555004499.
Same separate Opus5.5 high evaluator; failure streak0. No Desktop product code
has been changed. Published Desktop catalog files already exist on main; they
are not unshipped placeholders. No published prop/part/value/key is removed or
renamed to fit an incomplete implementation.

The complete six-component audit is split into two substantial functional units
for the source-file budget:11b3a chrome/menu controls;11b3b dialog/notification/
update/conditional rendering. Both remain required before12/13; no READY. This
is a slicing adjustment within approved scope, not a waiver or owner rescope.

1. **Public surface.** Preserve all existing exports, callback payloads and legacy
   defaults. DesktopWindowChrome still emits only show/hide/focus/reload/close
   after explicit native button activation. Omitted platform/state preserves
   active/enabled compatibility markers and default reload/hide/close order.
   Implement published optional platform macos/windows/linux and state focused/
   blurred/disabled. Add the completed ledger's hover/unfocused states without
   removing blurred (blurred and unfocused are aliases). disabled=true or
   state=disabled disables actual buttons; unfocused is visual, not disabled.
   Host owns focus/capability state; no global window detection or native calls.
   Explicit actions preserve their supplied order. With omitted actions, explicit macos uses close/hide/reload; explicit
   windows and linux use hide/reload/close. Omitted platform keeps the legacy
   reload/hide/close order. Supplied state is emitted verbatim: blurred and
   unfocused share styling but are never normalized. Existing leading/title caller content is preserved.

   DesktopTrayMenu preserves source/items/onAction/disabled/class and the exact
   action-ID callback. Implement published optional type snapshot4kinds,
   state rest/hover/disabled and accelerator boolean(defaulttrue). type is an
   optional single-declaration presentation snapshot on root, not a filter or
   rewrite of the items; entries retain their discriminants/IDs. Examples pass
   matching declarations. Omitted state retains active/enabled legacy markers.
   Root hover snapshot highlights the first enabled action; actual native hover
   and keyboard focus remain CSS states. accelerator=false hides only Kbd text,
   never changes the declaration or invokes a shortcut. Disabled wins.

   Use a native details initially open, preserving useful legacy SSR. Its source
   eyebrow becomes the native summary/menu invoker; inner desktop-menu/items
   parts preserve all existing names. Root remains a named nav. Internal open
   state is synchronized with native toggles, survives parent/item rerenders,
   and has no new public controlled-open port. Summary click uses one controlled
   native-toggle transition after hydration; before JS native details works.
   ArrowDown/Up on summary opens and focuses first/last enabled action. Within
   the menu, Up/Down wrap enabled native buttons; Enter/Space stay native exactly
   once. Escape closes and returns to summary, stopping ownership at this menu.
   Tab leaves naturally and closes without moving focus elsewhere. Action
   activation preserves legacy keep-open preview behavior. No callback on
   render, hover, traversal, disclosure or Escape. Disabled summary/actions are
   unavailable to sequential focus; no user focus is stolen on mount/update.

2. **Vocabulary.** platform/state are caller presentation snapshots, not proof
   of native OS capability. Unfocused aliases published blurred; active/enabled
   remain documented legacy values. A declaration is action/role/submenu/
   separator. Stable action IDs are payloads, not CSS variants. Submenu previews
   remain expanded groups within one menu; their source names and hierarchy
   remain. Role declarations are read-only disabled menu items in the browser
   preview: the native host owns executing OS roles. This does not invent new
   SDK operations or checkbox declaration kinds. Source type snapshot never
   changes callbacks or the tree. Native OS outcomes remain unproven (#859).

3. **Ports.** Existing Preact/cn and native HTML only for these controls. No L2
   import, new dependency family/version, bridge/updater rewrite or native menu
   installation. Keyboard traversal queries only this root's enabled actions
   and uses DOM identity, so duplicate semantic command IDs do not become a new
   rejection rule. SSR/pre-hydration emits no roving tabindex=-1: every enabled action remains
   reachable by native Tab. Roving tabindex is applied only after hydration
   inside the caller island and reconciled after renders and focus changes
   without focusing on mount; no global listener, observer, timer or selector
   interpolation. Native details toggle updates internal state; summary/event
   handling cannot reopen a user-dismissed menu on unrelated parent renders.
   Submenu lists use role=group with labelled ownership, separator is native
   semantic separator, role-only entries are disabled menuitem previews. All
   menu-owned structures satisfy actual axe, not just static role strings.

4. **Constants and Utility geometry.** Existing semantic roles only; no token
   value or source change. Reuse cn rather than adding class helpers. Preserve
   the documented action presentation table and labels. Platform geometry uses
   ledger literals:40px chrome,12px lights at20pitch,46px Windows captions,
   Linux small caption controls. Keep the bottom rule outside layout so height
   remains40. Long title/leading content stays contained; centered layouts
   reserve symmetric actual control width, using a private runtime CSS count
   only if needed, not a new theme token. Logical directions and native focus
   order agree. All five supplied actions remain available and truthful:
   do not draw maximize/zoom while emitting reload. This bounded glyph/content
   difference follows the shipped five-operation capability boundary; it does
   not claim unsupported native maximization. Match actual operation labels.

   Tray uses the ledger's256px frame, existing surface/border/card/overlay roles,
   source eyebrow,32-ish native rows/Kbd anatomy and logical rules. Compose
   overlay shadow from existing shadow-overlay-y/blur/color roles (Utility's
   values may be zero); never invent a missing shadow-overlay shorthand.
   Submenu groups keep readable indentation; native role labels remain inert.
   Existing accelerator strings are caller content; no undocumented platform
   shortcut translation or execution. Strict role-resolution/contrast and
   actual captures compare anatomy/geometry, not cross-environment font hashes.

5. **Ordered source slices, exact metadata and gates.** This unit is expected
   to touch23maintained source/carrier paths:2TSX+2CSS;Desktopcatalog1+JSON;
   registry.json+4native/legacy/CLI projections;README;newSSRprovider/test+styles
   and composite-provider removal of these two old fixtures;strict-policy table;
   actual installed-consumer test;browserfixture/spec/router/SSRbuild/server.
   All paths are reachable from registry or actual tests. No other Desktop
   component is implemented before this unit is terminal.

   Published base names, values, parts and keyboard entries remain. Add missing
   real Window leading slot/metadata and native child keyboard entries without
   changing its presentational frame APG identity. Add state hover/unfocused to
   the shared canonical enum while preserving focused/blurred/disabled and
   compatibility active/enabled. data-platform belongs root; data-state belongs
   root/action. Declare public data-action5values on action because CSS reads it.
   Legacy data-desktop-action is classified narrowly as callback payload only;
   no CSS reads it. Title remains the published text metadata name and existing
   render-content capability; a title/leading slot mapping makes that explicit.

   Tray root type/source/state/accelerator fields remain with documented default
   and snapshot semantics. Add actual items/onAction/disabled and qualified
   Item.type/id/label/accelerator/enabled/role/items metadata. Keep type4values,
   source2values, state3values and active/enabled compatibility. data-type is
   declared on root and the corresponding action-item/role-item/submenu/
   separator parts; data-source stays root; data-state root/action. Add label
   markers to action labels and realize existing desktop-menu part on details.
   Every existing anatomy name remains, with accurate conditional notes.
   Preserve existing Up/Down, Enter/Space, Escape map; native summary/Tab behavior
   is documented and tested. Legacy data-action-id is a narrowly classified
   stable callback payload, never a public visual axis or blanket allowance.

   These two visual identities enter the same strict render checker immediately.
   The two legacy payload classifications are explicit component/part/attribute/
   purpose rows; public axes are never private exemptions. No context-only
   escape is allowed for either. New strict negative tests inject undeclared
   attrs/x attrs/parts/values. Actual SSR covers all platform/state combinations,
   legacy defaults, custom/empty/all5actions, all4entrykinds/sources/states,
   accelerators/disabled/nested/long trees and escaping. Native keyboard tests
   cover all5callback IDs, no render effects, disabled skip, exact-once Enter/
   Space, group traversal, native summary open/close, Escape/Tab focus, parent
   rerender persistence, two-instance ownership and RTL. Reject no valid legacy
   input merely to simplify traversal; read-only OS roles do not fake callbacks.

   Run source/browser structured check/lint/fmt0drops, actual ui:add copied
   TSX/CSS/compile/lint/SSR for these registry IDs, fullpackage, currentfocused
   three-engine/bothscheme390/1280/LTRRTL matrix with strictaxe/no allowances,
   fullChromiumincludingtouch and affectedFFWK, dedicateddocs140 afteractual
   sitebuild, quality/architecture/preflight/docsaccuracy/export/nativepub0slow/
   exactexisting2531doclint attribution. Freeze files/builds before source review.
   After source PASS:explicit source+run commit,4carriers/6commands measured
   delta,actualHEADquality/pub,SAMEevidence review,run-onlycommit/publicaudit0/
   exactleasepush/PRcomment/reconcile before11b3b.

6. **Deferred scope.** Next11b3b audits and repairs the other four actual
   components:published DesktopDialog kind/state and modal keyboard, notification
   state/action and ledger metadata, update ready-event/direct-state boundaries,
   and DesktopOnly SSR/hydration/binding lifetime. Its own checkpoint/review must
   settle exact additions while preserving published base and SDK callbacks.
   It is not optional. Production declared-x/all-style12 and fullphase13 runtime/
   independentfinalIMPL/exactrequiredCI remain required. Native OS effects are
   never inferred from DOM callback tests. Nineteen owner promotions wait for
   Utility canary. No label/closingkeyword/merge/finalreport/READY.

7. **Contributor path.** packages/fresh-ui/README.md explains the six Desktop
   audit boundaries and these controls' real callback/keyboard/snapshot ports,
   which inputs preserve legacy rendering, native roles vs browser preview,
   and actual registry installation. Read ledger-desktop-docs and both reviewed
   PNGs (inspected) before changing Utility geometry. Canonical registry/typed
   catalog remain the production authority; provider declarations cannot change
   the base per style.

## Binding design review conditions accepted

Same evaluator round1 PASS, zero blockers; failure streak0. SSR and JavaScript-
disabled browser cases must prove initially-open details and every enabled
action in the native Tab order. No focus on mount. Arrow roving, Escape and
Tab-to-close require an island; Tab-to-close runs only after focus actually
enters and leaves this menu. The fixed four-row default order above must be
covered by strict SSR, keyboard/callback tests and README. All supplied states
emit verbatim. No product code preceded this PASS.


## Native-tab fixture correction discovered by the full gate

Before this test-only change: the full Chromium gate stopped at257PASS/1FAIL/
533not-run on an unchanged DataTable middle-click case. Focused repetitions
also caught1timeout after16PASS. Native auxclick was uncanceled; ignoring SVG
pointer events did not fix it. An isolated destination comparison passed80cases
(plain/table anchors, instantaneous/100ms presses). This points to child-tab
fixture startup coupling; it does not prove a component fault or a precise
browser root cause. No production DataGrid, CSS, callback or key map changes.

The real fixture server will serve a small linked-session destination instead
of mounting the entire component fixture in that child tab. The existing native
modified/middle-click test will also assert the destination heading. It still
requires a real browser-created tab, real href navigation, correct URL, unchanged
opener URL and zero row callback effects. No mocked tab, synthetic activation,
input delay, timeout increase, retry or allowance is added. The additional
existing DataTable spec makes24 maintained paths, within the same slice budget.
Repeat all20native controls, full791Chrome, affectedDesktop/native-tabFFWK64,
source/browser wrappers and freeze checks before SAMEsource review. Earlier
860package/140docs proofs apply only to unchanged selected package/docs bytes.


## Full Chromium mode correction — before maintained configuration edit

The tiny real destination alone was insufficient: a200-case headless-shell
stress attempt stopped at43PASS/1FAIL/156not-run. This supersedes any earlier
inference that the destination route fully fixed the problem. A private trial
of the same200native modified/middle-click cases using Playwright's full
Chromium channel passed200/200 with0retries/flaky/skipped and the same5s popup
assertion. No product DataGrid or pointer handler change is warranted by these
observations. The precise headless-shell internal cause is not established.

Use channel=chromium on each maintained Chromium project, including touch, as
[documented by Playwright](https://playwright.dev/docs/browsers#chromium-new-headless-mode).
Keep this per-project so the separate Firefox/WebKit projects stay independent.
The installed browser version and existing CI chromium-install command already
include that binary; no dependency or version change. Existing real destination
and its heading assertion remain useful fixture isolation.25maintained paths
remain below30. Regenerate no unrelated product code. Run actual maintained
full791Chrome in this mode, fresh25-source/10-build hash checks and browser
4fixture+2spec+1config wrappers/7lintfmt before SAMEsource review. Preserve the
old headless-shell failures and interrupted predecessor as historical evidence.


## Final containment and wheel-fixture checks — before source edits

A real-browser probe found a missed approved case: a long unbroken leading
slot plus all five supplied operations can make an auto-track parent grow far
beyond its342px frame. The isolated probe measured7665–7777px overflow. A tested
CSS intervention (inline-size containment, clipped/shrinkable identity and
leading, exact symmetric control spans) yields0overflow for all three platforms
while leaving134/80/14px identity space at the locked narrow width. The bar
follows its containing frame; it is not an intrinsic-width badge. Preserve the
native leading control and all five operations; add actual three-platform
fixtures and strict SSR renders before freezing again. Count real control gaps:
macos count*20+4, linux count*32+4, each with12px outer inset.

Full Chromium also exposed a wheel-fixture timing assumption at97PASS/1FAIL/
693not-run. A native wheel/scroll diagnostic reaches offset246 and counter2/3
with the unchanged Carousel. Bring the entire carousel into view and assert
that visible precondition before native focus/hover/wheel. Keep the same single
wheel delta and counter/focus/resize/RTL assertions. No Carousel product change,
sleep, retry, timeout increase or alternate expected result. Include that
existing spec, making26 maintained paths; source budget still below30.
