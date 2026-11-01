# Docs11b1 design checkpoint — section navigation and Shell composition

## 1. Public surface

Ship Toc/X4 and AnchorNav/X7 as real copied components, 100 to102 shipped of104.
Preserve native navigation keyboard contracts and all settled enum values/parts.
One complete unit before RuledGrid/Hero and the six-component Desktop audit.

Toc is callable plus Toc.Item. Root accepts native nav attributes/class,
children (Toc.Item links), links (optional footer controls), label (default
"On this page"), breakpoint desktop|mobile (optional forced preview),
currentId:string|null (controlled), defaultCurrentId:string|null (initial),
onCurrentChange(id, {reason:'hash'|'scroll'}), observe:boolean(default false).
Item accepts native anchor attributes, required href/children, level2|3(default2),
and state rest|hover (optional forced preview, defaultrest). current is never
writable; accepted root currentId always overrides the preview as current.
Root owns current selection, Item exposes aria-current=location only on the
matching same-document fragment. Missing/foreign targets retain ordinary native
link behavior but are excluded from optional section tracking. No preventDefault
for links, hash writing, custom arrow manager, selection focus or live region.

Current state is derived from currentId, initial default, native hash changes,
and (only with observe=true) actual heading geometry. Refused controlled proposals
never change the accepted marker. Native hover/focus remains CSS. Canonical
metadata correction: old unshipped root level becomes Item.level; old unshipped
state prop becomes Item.state rest|hover preview plus derived current on Item
(rest|hover|current attribute vocabulary retained and ALL values renderable).
Current wins over preview state; live hover remains native CSS. No shipped caller
loses a prop. Add all real public ports/qualified slots
and part scoping to the independent canonical catalog before implementation.

Toc desktop is one labelled NAV with eyebrow, rail links and optional links footer.
Mobile is one labelled NAV containing native DETAILS, initially closed, with
SUMMARY eyebrow/current text/decorative marker and chevron-down; rail/footer
inside. Its disclosure is uncontrolled native state, not a variant or synchronized
open prop. Read the accepted current anchor text for mobile current text; before
hydration or when unmatched use label (never fabricate a section). Part current
is mobile summary text; marker is present only for actual current selection.
Mandatory eyebrow/rail/item anatomy has truthful conditional clauses. Preserve
current/marker/chevron parts, not invented hidden placeholders.

With no forced breakpoint, SSR is useful desktop navigation and initial client
matches it; layout-effect matchMedia(max-width:767px) selects the single mobile
branch. Document the hydration shift. Forced mobile SSR is a working closed
native disclosure without JS. Never duplicate caller children/IDs to implement
responsive views. Before replacing its own focused branch, record focused href;
after switching to desktop focus the matching link, or first link; after switching
to mobile focus the native summary. Never move focus outside its own branch.
Native details open state survives unrelated scroll/current parent renders.

AnchorNav is callable plus AnchorNav.Link. Root accepts native nav attributes/
class, children, label(default "Sections"), currentId/defaultCurrentId/
onCurrentChange/observe with the identical policy. Link accepts native anchor
attributes and required href/children; selected link has aria-current=location
and decorative marker. No tabs, roving tabindex or arrow selection. Root state
rest|scrolled is derived from actual pinned geometry plus current position when
observe=true; optional state rest|scrolled accepts explicit caller-owned sticky
presentation when observation is disabled. AnchorNavProps is a discriminated union:
observe:true forbids state (state?:never); observe?:false permits state defaultrest.
A type-negative test proves this; runtime observation also ignores an illicit
state so JavaScript cannot override measured state. Sticky positioning is CSS, its offset
is caller-owned through ordinary style/top/scroll-padding. No hidden scroll
handler changes the URL. Root owns data-state; anchor selection uses native
aria-current, no new undeclared axis. Horizontal overflow is native and focused
links stay reachable without clipped focus rings.

A copied section-navigation support item encodes the shared policy for both,
without L2-to-L2 imports or a new package export. Hooks use refs/context and
native hash/popstate/scroll/resize/ResizeObserver/MutationObserver as needed.
Listen passively in capture for nested scroll containers, coalesce geometry
reads with one requestAnimationFrame and cancel/remove all owned work on unmount.
Discovery reads actual same-document anchor hrefs, decodes fragments safely,
finds headings by document ID (no selector interpolation) and excludes missing
IDs. An empty or foreign hash must not create an invalid current ID. Track the
last heading crossing its nearest scroll container's top plus native computed
scroll-padding-block-start and heading scroll-margin-block-start; choose the
first existing heading before crossing. Window and nested scroll containers both
work. DOM/size changes re-discover targets without loops caused by our own
marker text updates. Passive tracking never writes hash or steals focus.

Original Shell integration composes Toc at the caller through existing railContent
and mobileRailContent. Do not import Toc into SidebarShell. Each branch has its
own explicitly authored content, without duplicated element IDs. Desktop uses
forced desktop and mobile uses forced mobile; Shell CSS owns visibility.

Utility ledger: desktop rail240, item padding5/15 or24,13/20 text, logical leading
hairline/current ink marker; eyebrow20 before rail/footer28 after. Mobile48bar,
20inline padding,14gap, truncated current and native closed disclosure. Anchor
44bar,24gap, existing prose-wide measure, existing topbar rule/width, ink marker,
no Utility shadow or tab underline. Use existing token roles only, no value edits.
Logical properties/RTL, long links, native focus2/2, reduced motion all apply.

## 2. Domain vocabulary

Section ID is an actual same-document fragment target, not app routing. Accepted
current is caller-controlled or local state; hash/scroll are proposals. Observe
means optional passive current tracking. Breakpoint is forced preview or measured
responsive view. Native disclosure open is platform state. Scrolled means actual
pinned/later-section presentation or an explicit caller snapshot, never a fake
navigation/tab state. Footer links retain ordinary app-owned semantics.

## 3. Ports

Preact types/hooks/context, existing cn and public L0 Icon, native nav/a/details/
summary, matchMedia, URL/hash, DOM geometry and observers. One shared copied
support dependency, no JS scroll library/backend/Markdown parser/new dependency.
Browser observers are absent during SSR. User callbacks remain island-owned.

## 4. Constants

Named media query, labels, level/current/reason unions, existing color/type/marker/
spacing/rule roles and ledger geometry. No new theme roles/values or engine fork.
Use existing chevron-down glyph and marker role; no duplicated icon paths.

## 5. Commit slices and gates

This is one navigation unit, target fewer30 source files: fourTSX/CSS + support;
catalog docs2/3+JSON; registryJSON+embedded+native copy/CLI carrier; fixtures+
focused contract tests+provider; post-v1/installer/inventory coverage; browser
fixture/spec/route+Shell fixture; README. Count actual paths and split a complete
unit if needed. Run/context included with source/evidence commits. Existing
canonical carrier generators only; inspect actual delta after source commit.

Strict SSR: desktop/mobile, levels2/3, rest/current, controlled/default IDs,
footer conditional parts, escaped labels/native attrs, Anchor states, native
semantics, no fabricated hash/target/ARIA/tab role; undeclared/wrong-part/invalid
axes fail. Registry style/collections/projection/template equality + actual ui:add
TSX/CSS/helper fidelity/compile/lint/render prove installation closure.

Real browser Utility light/dark390/1280: native Tab/ShiftTab/Enter link hash and
scroll outcomes; native summary Enter/Space/open persistence, closed child skip;
controlled acceptance/refusal, initial/decode/foreign/missing hash, nested scrolling
and native CSS offsets, resize/late heading mutation, cleanup without stale
callbacks; responsive own-focus handoff/other-focus stability; RTL/long text,
44/48/240 geometry/current marker, no document overflow; actual Shell Toc path.
Strict axe/page-console errors, actual captures vs handoff, focusedFirefox/WebKit
for native/hash/disclosure/scroll/focus. No retries/new allowances/engine branch.
Full package tests, affected Shell/browser coverage, scoped check/lint/fmt0drop,
quality+architecture, preflight/docs accuracy/export drift/site build, native
publication0slowtypes, exact inherited doc-lint baseline/no new diagnostics,
all four committed-source carriers and SAME separate design/source/evidence review.
Zero public path/identity audit before every explicit-stage push.

## 6. Deferred scope

RuledGrid/Hero, actual Desktop audit,12a/12b extensions/all-style harness,13full
phase runtime/IMPL/exact-head CI remain REQUIRED; no partial READY. No native
host/updater rewrite, real S4styles, token changes or19later promotions. Existing
accepted2531baseline remains disclosed. No new debt/waiver is accepted.

## 7. Contributor path

packages/fresh-ui/README.md documents copied compound APIs, accepted current and
native hash/observation semantics, SSR responsiveness/forced preview, ordinary
child/footer links and caller composition into Shell rail slots.

## Locked round1 precision corrections

Choice(b) above: Toc.Item state rest|hover is a forced-preview port; current is
root-owned and never writable on Item. Strict fixtures exercise all three actual
attribute values, not an unreachable hover declaration. Item.level and Item.state
metadata are explicitly qualified; root state/level were unshipped placeholders.

Hooks/media/observers/callbacks run only within a caller-owned Fresh island. A
server-only unforced Toc remains useful desktop navigation even at390; strict
SSR plus a script-disabled390 browser case prove no overflow, working links and
no current marker without explicit currentId/defaultCurrentId. Recommend forced
mobile/desktop no-JS composition, as the Shell caller does.

SSR uses controlled currentId whenever it is defined (null explicitly means no
selection), otherwise defaultCurrentId or null; it never reads the hash. After
hydration a valid decoded initial hash is proposed once in an effect with reason
hash; uncontrolled accepts it over the default, controlled only proposes it.
Empty/foreign/malformed/missing targets propose nothing. Matching accepted current
does not fire onCurrentChange. Deduplicate unchanged refused candidates to avoid
observer/parent-output feedback loops; a genuinely changed candidate can propose
again. Passive scroll never rewrites location or focus.

Toc.Item and AnchorNav.Link own aria-current/data-scope/data-part/data-state/
data-level; native attribute spreading happens first and cannot override these.
AnchorNav.Link emits no data-level/data-state at all, even if illicit caller
attributes supply them. Strict SSR caller aria-current/data-* negative controls
prove accepted selection/part scope wins. Root scope/state/breakpoint are owned.

End of scroll: when the owning scroll container is at its maximum (within1CSSpx),
select its last at-least-partly-visible linked heading so short final sections
can become current. Cover window and nested scrolling, independently of offsets.

AnchorNav binding condition: source types discriminate observe:true/state?:never
from observe?:false/state?:rest|scrolled. Runtime observation ignores illicit state.
Strict SSR proves disabled/default/rest/scrolled and observed prehydration rest;
type-negative proves invalid combination, browser proves derived pinned scrolled.

Implementation precision: percentage scroll padding resolves against the owning
scrollport's block extent; actual native window/nested navigation proves it.
New CSS uses the existing font-sans role, with native family and nonempty used-role
checks in every engine/scheme/width. These correct the already locked native-offset
and existing-token policy without new public inputs, wrappers or values.
