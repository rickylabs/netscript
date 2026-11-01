# AI10a design checkpoint — Marker, Trace and Attachment

## 1. Public surface

Three copy-owned registry identities complete I4/I5/I7 and change inventory from
91 shipped/13 pending to 94/10 (104 total). No runtime root export or dependency
is introduced: each registry entry copies its TSX and CSS, depends on cn/theme,
and adds the existing package primitive mapping when it imports Icon. Sources
are independent L2 items; no L2-to-L2 import. The registry is registry.json;
pinned upstream schema and historical v1 snapshots stay unchanged.

Marker is a presentation div with optional icon and label/children content,
variant default|border|separator (default default), native HTML attributes and
class. label takes precedence over children when supplied; zero/empty content
is preserved. It creates no tab stop or role=status. Separator rules are CSS
pseudo-elements: two-pixel boxes with a single one-pixel border edge.

Trace is a div containing a native ordered list of caller-owned rows, with status running|done|error
(default running), optional title and duration, children and native attributes.
Trace.Line owns title, description, duration, children, status
done|running|pending|error (default pending), collapsible (default false),
connector (default true), open/defaultOpen (default false), onOpenChange and
native LI attributes/class. Trace.Line is an li (place it only within Trace or a
native list). It contains native details/summary when collapsible; a static line
has ordinary presentation content and no hidden focus target. summary
contains presentation only; interactive output belongs in collapsible-content.
Title/description/duration are supplied content, never fetched or synthesized.
Both Trace aggregate and Line have static visually hidden status-label text,
localizable with statusLabel; defaults Running/Done/Error/Pending map to status.
Collapsed SSR is useful; native details works before hydration. Controlled
activation proposes once and retains the accepted physical open state on refusal.
Native programmatic toggle events are reconciled without callback loops; every
parent render reconciles the physical element, including unchanged controlled
props. Do not use an ARIA accordion or a new disclosure engine. Trace aggregate
and line axes are independently scoped in the contract.

Attachment is a noninteractive div with title, optional media/description/actions/
progress slots and native attributes/class. State idle|uploading|processing|error|
done (default idle), size default|sm|xs (default default), orientation horizontal|
vertical (default horizontal). Media accepts caller JSX (icon tile or image, with
caller-owned alt text); no download/upload/fetch is performed. Caller actions are
native buttons/links. Busy states render a decorative spinner; error/done render
decorative alert/check icons. Every non-idle state also renders a static visually
hidden state-label part: Uploading/Processing/Error/Done, overridable through
stateLabel. This is readable text, never a live region. Descriptions remain
host-owned. Optional progress accepts caller-owned native progress or
existing Progress composition. xs horizontal visually hides description (retaining it in the accessibility
tree), omits progress and uses a trailing state glyph, per ledger; vertical
keeps description/progress. State-label remains accessible at every size. Busy
state changes retain action identity/focus. No invented remove/retry callback.

## 2. Domain vocabulary

Marker = in-thread event label. Trace = aggregate run summary; Line = one step.
status is caller-owned step/run state; open is native disclosure state; connector
is a visual rail, not a relationship engine. Attachment is presentation of media
and its host-owned state; progress is optional supplied content, never a timer.
These are base items from the approved inventory, not style extensions.

## 3. Ports

Preact types/hooks, native details/summary/buttons/links, cn, existing L0 Icon.
No new package/dependency, backend or style. Internal glyph spinner uses current
semantic roles, with slower motion under reduced-motion. Source style remains
Utility; every new render is checked by the strict base contract checker from
its first shipped fixture. Native attributes pass through; axes/parts are owned.

## 4. Constants

Public unions own the three variant sets and four/three status sets; literal
maps select existing check/circle-alert icons, warning spinner and text roles.
Pending uses a CSS circular border ring; it does not add a missing Icon glyph.
All CSS consumes current --ns-* tokens; no token values change. Ledger overrides:
Trace duration uses mono caption, done check success, running spinner warning;
Marker rules/Trace connector use two-pixel boxes with a one-pixel edge. Attachment
media 40/32/24 and vertical heights96/80/64, padding8/6/4; use current space/size
roles or documented geometric literals, never new color roles. Narrow content
shrinks/truncates without document overflow. LTR/RTL uses logical properties.

## 5. Commit slices and proofs

One complete AI10a source unit, target under30 source/carrier files: six TSX/CSS;
registry.json + generated registry/legacy projection; ai/4.ts + ai/5.ts + JSON;
strict-render-policy + catalog/style-provider fixtures + focused render/API tests;
post-v1 registry guard + actual ui:add install test; browser fixture/spec/route;
README; required MCP carriers. Split only if measured budget exceeds the limit,
and preserve an independently reviewed complete unit. Run notes accompany source
and sign-off commits.

Gates: strict SSR renders cover Marker3 variants, Trace three aggregates/eight
line states and conditional static line, Attachment30 combinations and supplied
slots. Assert derived attributes/markup, escaping, zero values and native child
semantics. Test undeclared attributes on all three scopes; every new identity has
a real keyboard scenario. Browser Utility light/dark390/1280 tests native summary
Enter/Space and Tab, accepted/refused/default disclosure, programmatic toggle,
unchanged-prop reconciliation, nested controls and native links, static/Marker
skip behavior, all status/media/action states and preserved focus. Assert accessible non-idle Attachment text for every state
× size, especially xs errors; descriptions stay in the accessibility tree.
Trace status equivalents, ordered list semantics and static-line tab skipping
are also asserted. Capture light/
dark/narrow/RTL; zero page errors and serious/critical axe, no allowances. Test
reduced motion, geometry and real installed-source fidelity/compile/lint/render.
Source/browser wrappers, quality/architecture, template lint, catalog/registry,
preflight/docs accuracy/export drift, member publish, exact doc-lint baseline and
all four committed-source freshness checks. Same separate evaluator must pass
this checkpoint before code, then source and evidence. Audit public run/diff
added lines before each push; comments contain portable verdicts/counts only.

## 6. Deferred scope

MessageScroller and Questionnaire remain10b; Docs/Desktop and declared x-extension
harness remain11/12. No wizard, upload client, agent runtime, virtualization,
new token/style, future nineteen promotions or automatic announcements here.
Final runtime/full browser/exact-head required green CI remain13. Current runtime
is unproven and draft checks skipped; no whole-task completion/READY claim.

## 7. Contributor path

packages/fresh-ui/README.md documents copied imports, caller-owned state, native
disclosure/control restrictions, media/progress composition and Utility CSS path.
