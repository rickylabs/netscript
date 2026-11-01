# AI10b design checkpoint — MessageScroller and Questionnaire

## 1. Public surface

Finish I3/I6 as independent copied registry components: inventory104/94/10 becomes
104/96/8. Each gets TSX/CSS, registry/style/collection registration, actual
installed fidelity, strict contract renders and real native keyboard/browser
evidence. No L2-to-L2 imports, token values, dependency versions or glyph changes.

MessageScroller takes nonblank label for the native focusable viewport, children,
followEnd(defaulttrue), endThreshold(default1 finite nonnegative CSS pixel),
scrollLabel(default "Scroll to latest"), native root attributes/class.
MessageScroller.Item optionally supplies the native item div and children.
Caller supplies a finite root height or constrained flex/grid parent; no invented
fixed page height. data-scrollable is DERIVED none|up|down|both, not a writable
prop. SSR truthfully emits none and useful content; browser geometry supplies the
actual state after hydration. No manufactured SSR overflow values.

First mount follows the end when followEnd=true; false preserves initial native
position. Later child/text/size changes follow only while already pinned and
followEnd permits it. Native scrolling away unpins, returning repins. Enabling
followEnd later must not jump an unpinned reader. ResizeObserver on viewport and
content plus MutationObserver on content handle streaming/descendant growth
without parent rendering. Coalesce geometry through a locally owned animation
frame; disconnect observers/listeners and cancel frames on cleanup/reconfigure.
Native scroll anchoring remains available; no global/document listeners or
message fetch/state engine. Native viewport keys and child controls stay intact.

A native scroll-to-latest button has aria-controls/localizable label. It is
visible when content is below; after activation it stays visible WHILE FOCUSED
even when pinned, preserving focus. Keep it mounted; pinned/unfocused uses
visibility:hidden to leave native tab order. aria-disabled indicates no content
below, with guarded inert activation. Neither following nor activation moves
focus into the viewport. Use native instant scrolling, no smooth-scroll engine.
Top/bottom edge rules use subtle one-pixel borders, not gradients. Existing L0
arrow-right rotated90degrees supplies the downward glyph without a new icon.

Questionnaire is a real form, never nested in another form. Props: step
question|freeform|complete(defaultquestion), required title, optional description,
error, progress, actions, children, options; multiple(defaultfalse),
name(default "answer"), disabled(defaultfalse), value/defaultValue readonly string
arrays(defaultempty), onValueChange; text/defaultText(defaultempty), onTextChange,
placeholder; native form attributes/class including onSubmit/onReset/action/method.
Each option has unique nonempty value, label, optional decorative shortcut text
and disabled. Reject duplicate/empty values. Single mode uses the first accepted
value; multiple uses membership. No automatic progression/actions/business
validation: caller supplies button types, native onSubmit/FormData handling and
outcomes. Native form submission remains useful before JavaScript.

Question step uses named native radios/checkboxes inside fieldset/legend;
title names form/group, description/error IDs associate with controls. Freeform
uses a named native textarea with those same relationships. Complete has caller
content/actions without answer controls/hidden persisted values. Progress is
caller content. Actions are OUTSIDE the disabled answer fieldset, allowing host
Previous/Skip/Edit; caller buttons own disabled state. Children are extra content.
Shortcut text is decorative, not a global digit/letter keyboard binding.

Before proposing a controlled choice change, physically restore ALL owned inputs
(native radios uncheck siblings). Text refusal likewise restores accepted DOM
value before callback. Uncontrolled state owns only this form. Every parent
render reconciles unchanged controlled props after outside DOM mutation.
Native reset invokes caller onReset first, honoring prevention. Otherwise allow
native default reset, then a guarded microtask reconciles ONLY owned inputs to
initial uncontrolled defaults or accepted controlled state. Other supplied
native controls retain platform reset behavior; reset synthesizes no change/
submit callbacks. An unmount guard prevents queued work touching removed forms.
Choice rest/hover/focus/selected/disabled uses accepted checked/disabled state
plus native hover/focus CSS, not custom key handling. Canonical choice axes and
multiple are scoped separately from root data-step. Error text/aria-invalid
remain truthful, with no automatic live region or invented successful submission.

## 2. Domain vocabulary

Pinned means within endThreshold of native scroll end. followEnd permits pinned
following; it does not command an unpinned reader to move. scrollable describes
available directions from current geometry. Item is a message boundary.
Choice is a native answer option; step is host-owned presentation. Value is
accepted option values; text is a freeform answer. FormData is native submission.
Shortcut is a visual hint, never a newly installed hotkey.

## 3. Ports

Preact hooks/types, cn, existing L0 Icon, native scrolling/button/forms,
ResizeObserver/MutationObserver/requestAnimationFrame/queueMicrotask. Ownership
is per instance with cleanup and no global state. No new library or backend.
MessageScroller MUST integrate the SAME existing Shell chat fixture: session,
composer and viewport retain bounded independent geometry at390/1280.

## 4. Constants

Named public unions for steps/scrollability; named threshold, field name, label
and textarea-row defaults. Validate threshold and option identities before DOM.
Existing --ns-* typography/surface/border/focus/space/shadow roles only. Ledger
wins: scroller subtle border rules, viewport24x60 padding (responsive narrow),
content max640 (spec720), existing control radius/R.float; Questionnaire selected
primary/stroke border and selected surface, input radius, gap6 choices/gap4
item/field and small shortcut cells. Fixed geometry is ledger layout, never a
new color/token value.

## 5. Commit slices and gates

One complete unit, target fewer30 source/carrier files: four new TSX/CSS; native
registry JSON/embeddings/copy carriers; ai/4+ai/5+JSON; provider fixtures and
focused render/API tests; inventory/post-v1/install guards; browser fixture/spec/
route/SSR writer/server and SAME Shell chat fixture/spec; README and required
canonical MCP carriers. Split complete independently reviewed units if actual
budget requires it; no weakened gates. Run/context in source and sign-off commits.

Strict SSR fixtures assert anatomy/API/derived defaults and reject undeclared
attributes on both scopes. Questionnaire covers three steps, single/multiple
accepted/rest/disabled states, escaping, errors/IDs/zero content and exact native
naming/defaults. Scroller SSR remains truthful none, browser proves all4 states.

Real Utility light/dark390/1280: measured scroll states; native viewport
Arrow/Page/Home/End; pinned/unpinned append/streamed text/descendant growth and
resize; followEnd toggles; stable latest-button focus; native child Tab/links;
RTL/no overflow; two-root isolation; observer/frame teardown. SAME Shell chat
tests session/composer/viewport geometry and streaming while reading. Questionnaire
tests radio arrows/Space/Tab, checkbox Space/multiple, disabled options, controlled
refusal with native sibling restoration, text refusal/acceptance, native submit/
FormData, host steps/error, no invented hotkey, native/prevented reset including
other supplied native fields. Useful no-JS SSR and actual hydration. Focus
continuity, zero page/console errors, captures and zero serious/critical axe
findings/allowances, including freeform/error/complete. Focused Firefox/WebKit
cover native scroll/control/reset/SSR cases without claiming full certification.

Actual ui:add TSX/CSS byte fidelity/compile/lint/SSR and runtime dependency
closure; source/browser wrappers0dropped; broader quality/architecture/template
guards; preflight/docs accuracy/export drift/site build; native member publish,
exact accepted doc-lint baseline; all four committed-source carrier checks.
Same evaluator design/source/evidence PASS, then privacy-dependent push/comment.

## 6. Deferred scope

No message transport, virtualization/infinite history, wizard/validation engine,
upload or agent runtime. Docs/Desktop11, declared additive extension/all-style
harness12 and full final13 remain required. Future nineteen promotions follow
the Utility canary. No new style/token values. Current runtime/required remote
CI stay unproven; no READY.

## 7. Contributor path

packages/fresh-ui/README.md documents copied imports, finite viewport ownership,
pinned/follow behavior and button focus; native form composition/value/text/
FormData/reset ports, decorative hints and host-owned progression.

## Native reset refinement after the real browser prototype

The first five Chromium interaction cases passed, but uncontrolled radio reset
failed: queued reconciliation can run before the browser's reset default action,
so later native reset cleared the radio. Do not assume a microtask is necessarily
after the native default action. Preserve the same public ports and semantics by
synchronizing each OWNED input's native reset default in the per-render layout
reconciliation: defaultChecked is accepted checked state when controlled, initial
defaultValue membership when uncontrolled; textarea.defaultValue is accepted text
when controlled, initial defaultText otherwise. Write current checked/value after
the default property so native dirty-value rules cannot alter accepted state.
Native reset now independently restores the correct owned values, regardless of
microtask ordering. The guarded reset microtask synchronizes local state to that
same native default and keeps controlled accepted state. Other supplied controls'
defaults/properties remain untouched, and caller prevention still wins. This is
platform reset metadata, not a second form engine or a timer/RAF reset workaround.
The same independent reviewer must approve this refinement; all original browser
reset/refusal/FormData/prevented-reset/no-JS and three-engine gates still apply.

## Native scroll anchoring refinement after WebKit measurement

Chromium52 and Firefox26 cases passed. WebKit's append case exposed a real race:
before top2260/height2580/client320/pinned, after top2209/height2691/client320.
Appending grew content by111px while native anchoring adjusted top upward51px.
The resulting native scroll event ran before the observer frame and incorrectly
un-pinned the reader. Preserve native anchoring rather than disabling it.

Track the last measured scroll/client heights locally. A scroll event coincident
with changed geometry keeps an already pinned state until its scheduled
measurement, unless there is native reader intent. Observe wheel, pointerdown,
touchstart and scrolling-key keydown ONLY on this viewport, passive where
appropriate, without preventing or synthesizing any event. Intent lasts until
the next locally owned measurement; schedule that measurement even when input
does not cause scrolling, so an inert wheel/press cannot leave sticky state.
During that measurement, reader intent suppresses following and derives pinning
from the real position. Geometry-only scroll events preserve prior pinning and
allow the observer frame to follow. Ordinary scrolls with unchanged geometry
still unpin or repin normally, including host/scripted scrolls in normal use.
No new public prop/key map, global listener, scroll animation or pointer manager.

Test the measured WebKit append, pinned/unpinned growth and resize, native reader
input racing content growth, input that does not scroll, button focus, independent
roots and cleanup in all three engines. Include explicit local intent-listener
cleanup. This refinement requires the same independent design review before
implementation, and does not waive the original failed case.
