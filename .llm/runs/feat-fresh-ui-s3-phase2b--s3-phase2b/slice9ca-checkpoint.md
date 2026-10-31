# Slice9c-a design checkpoint — responsive SidebarShell family

Predecessor source216a55f6/evidenceaacd5108 is pushed and independently signed
off. Feature tier, Archetype4, same read-only independent evaluator. This is the
complete shell family; the approved conditional split leaves StatsGrid/DataTable
for9c-b. No product source before this checkpoint passes review.

## 1. Public surface

Keep SidebarShell in its existing copy target and preserve pathname, navigation,
brand, brandBadge, footer, topbarStart, topbarEnd, contentId, navLabel, children,
class and native root attributes. Export the existing props interface for copied
consumer use. This remains one app-shell/sidebar/top-bar family, not three new
CLI identities. SidebarToggle keeps its existing default export, selectors,
labels/icons and native button attributes.

Add actual SidebarShell ports: layout dashboard(default)|chat|docs; sidebar
expanded(default)|collapsed|none; nav boolean(defaulttrue, false aliases none);
sidebarVariant sidebar(default)|floating|inset; rail boolean(defaultfalse),
railContent and mobileRailContent; optional session, thread, composer and
topbarBrand Renderable slots; sidebarOpen/defaultSidebarOpen(defaultfalse) and
onSidebarOpenChange(open, {reason}) using the existing Dialog reason vocabulary.
thread replaces children inside the chat thread only when provided. children
remains required and supplies the default main/thread content. Host owns all
business behavior, chat orchestration and document content.

SidebarNavItem retains href/label/icon/matchPrefix/isActive. Add optional level
1(default)|2, disabled(defaultfalse), count Renderable, marker(defaulttrue) and
chevron(defaultfalse). SidebarNavSection adds collapsible(defaultfalse) and
defaultOpen(defaulttrue); collapsible sections use real details/summary and
require a nonblank label. Native ul/li/a semantics replace role=listitem links.
Disabled items have no href or keyboard stop and do not become current. Count,
marker and chevron are presentation without extra tab stops; collapsed links
retain their accessible label. Native hover/focus states remain CSS, not props.

The canonical L1/N4/N5/N10 contracts will describe actual ownership: breakpoint
is measured, not a caller prop; Sidebar variant/collapsible/collapsed and item
axes derive from these ports. Existing names/values/parts remain; remove only
plannedValues that now have real implementations. Correct phantom prop mappings
as earlier audited baseline corrections, with explicit notes. topbarBrand maps
to optional brand; supplied logo/wordmark remain child-owned context parts.
No future P5/P6/P7/P19 promotion is folded into this unit.

## 2. Domain vocabulary and native ownership

Static mode means server-rendered SidebarShell without whole-shell hydration.
It has exactly one Sidebar inside a native details disclosure. It is initially
open so desktop SSR has useful navigation; mobile keeps it in normal flow with
a visible summary. Thus no-JS and server-only consumers have working navigation
and no hidden offscreen focusable links. Expanded mobile navigation before
hydration can shift layout; document this progressive fallback explicitly.

Hydrated mode measures two MediaQueryLists (max-width1024px and640px) and selects
one sidebar branch: desktop aside, or mobile/tablet native modal Dialog with a
280px left panel. This reuses public Dialog.Root/Trigger/Content/Title/Description/
Close, not a Sheet side value that does not exist. The browser owns modal
focus/inertness, Escape, backdrop and focus return. The shell adds no document
keydown/focus trap/body overflow override. Native forced close follows9c0:
report native-close, stand closed immediately, parent accepts false to stay
closed; later accepted open=true parent render can reopen.

sidebarOpen ports govern the hydrated mobile modal only. Static native details
is intentionally uncontrolled; document that distinction. Desktop geometry
removes the modal without asking a controlled host to change its logical open
intent. Returning to mobile projects the current accepted intent. none/navfalse
renders no sidebar or trigger. Native disclosure sections stay keyboard usable
inside either branch. Only one navigation instance is rendered at any time.

Default SidebarToggle resolves its nearest managed shell; explicit selector
overrides retain the legacy standalone path. In static mode it controls that
shell's details and observes native toggle. In hydrated mode it sends a private
request directly to that shell root and observes root state notifications.
No document-wide event bus, no imperative movement of Preact-owned DOM. Keep
aria-controls absent until the target connects, then publish actual target ID
and physical open state, including platform forced closure. Controlled refusal
cannot prematurely flip aria-expanded. Multiple shells never cross-control.

The built-in native summary/managed Dialog trigger stays available until a
working, enabled custom toggle is connected. Scoped CSS :has(native aria-controls)
then hides the redundant built-in control; disabled/unconnected custom buttons
cannot remove access. Server-only shell + independently hydrated SidebarToggle
is a required compatibility case, not just whole-shell hydration.

When a breakpoint change removes a focused sidebar node, preserve the focused
href on the new desktop sidebar when possible; otherwise focus the connected
mobile trigger or first eligible sidebar link. Do not move focus when focus is
outside the replaced branch. Remove owned media-query/event listeners on
unmount; no observer/pointer engine is needed.

## 3. Ports and layout

Use existing Preact hooks, native DOM, public Dialog and copied cn/public-types.
A single sidebar-support registry:lib contains a small private events module
used by BOTH Shell and SidebarToggle, plus a private sidebar-navigation.tsx
used by the shell to keep its component under500lines. Types are imported by
the public copied component as type exports; no unused service abstractions.
Requests are nonbubbling on the resolved own root; state carries actual open
and controls ID. Validate request detail before acting. Static toggle listeners
use native details state. Explicit selector fallback restores the exact prior
body overflow rather than clearing another owner's value, retains popstate and
Escape/backdrop behavior, and does not mutate foreign resources.

CSS grid places app/dashboard/chat topbar in the main column and docs topbar
across the full shell width. Desktop expanded sidebar uses existing sidebar
width; collapsed uses a56px icon rail with readable accessible labels and
native titles. Mobile/tablet uses the ledger's280px native modal panel. Desktop
optional rail is280px with a subtle border; mobileRailContent is its explicit
mobile path. Native CSS keeps hidden alternate rail content unfocusable.
Chat is bounded to the native viewport with session/header, scrollable thread
and composer rows; main min-size0 prevents page overflow. Dashboard/docs content
max width1200 and existing page padding/gap roles. Keep contentId/native main.
MessageScroller10b and Toc11b must later be integrated into this same real
shell fixture before whole-phase proof; placeholders here cannot prove them.

Specific N4/N5 review renders/spec win over the broad old layout ink-chrome
note: Utility light Sidebar/TopBar white, dark graphite, existing bg/fg and
topbar-bg/rule/height tokens. No token values change. Floating8px inset and
existing float radius/shadow; inset rounds the main content. Preserve old
ns-dashboard class API while replacing its unsafe offcanvas selector behavior.
Unknown SSR viewport omits derived breakpoint attributes rather than guessing.

## 4. Constants

One shared copied module owns default selectors, nearest-shell selector,
request/state event names and typed payloads; no duplicate literal protocol.
Name the two media queries and breakpoint resolver in that same module if both
need them; otherwise keep them local to Shell. CSS repeats the platform media
thresholds by necessity and browser tests pin both edges. Constants280mobile/
rail,56collapsed and1200content are geometry from the reviewed ledger/design,
not new token values. Existing CSS role variables supply paint/type/spacing.
data-sidebar-mode static|hydrated is an explicit canonical app-shell axis;
existing legacy data-sidebar/backdrop markers are narrowly classified in12b,
never a general data-* exception. New parts/axes are declared before renders.

## 5. Ordered source commit and gates

One reviewed source unit, target under30sourcefiles:
SidebarShell.tsx(existing lowercase target), SidebarToggle.tsx, two copied
support files, layouts.css, typed L1/N4/N5/N10 catalogs plus contracts.json,
registry.json, post-v1-items.ts, registry embeddings/generatedCLIassetbarrel,
contract composites/shell fixture+focused shell tests, installed consumer
gaps-install tests, browser shell fixture/spec and gap-fixture, README API.
Update explicit runtime and registry dependency repairs for existing copies,
add sidebar-support to post-v1 support, preserve frozen legacy-v1 snapshot.
No104identity or shipped-count change; native119 becomes120 support items.

Required evidence: all affected contracts/native adapter/runtime and installed
copies through real ui:add/compile/lint/SSR; scoped source/browser wrappers
with no dropped files; quality/architecture, registry template lint, preflight,
docs accuracy/export drift and native publish/export documentation audit.
Actual browser light/dark390/1280 plus focused768/exact breakpoint transitions:
no-JS SSR navigation/summary; server shell plus isolated Toggle; single active
nav; native modal focus containment/Escape/backdrop/return/controlled refusal;
none/collapsed/variants; desktop-to-mobile and reverse focused-node handoff;
two-shell isolation; real section summaries/disabled link skip/current/count;
docs fullwidth header/rail mobile path; chat bounded thread/composer geometry;
owned listener cleanup and no global overflow clobber; strict axe0allowances
and local captures compared with N4/N5/L1 Utility references. All new data axes
must be canonical, not private checker exemptions.

Same independent reviewer passes design before source, then substantive source
review before supervisor commit. Commit source before corpus/publication carrier
generation; all4carrier checks, independent evidence review, evidence commit,
privacy auditPASS, push/comment, reconcile. Supporting9c0 negative summary's
top-level failed count will be corrected from1to2 (two listed expected failures).
Raw124doclint failure stays explicit debt2531 with exact identity comparison;
no waiver or all-phase/runtime/CI readiness claim from this unit.

## 6. Deferred scope

StatsGrid/DataTable is the next complete9c-b audit. Remaining AI/Docs/Desktop
and style harness retain the locked2b order; not dropped. Native bridge/updater
proof remains#859. New source styles, token values, post-Utilitycanary19base
promotions, upload/search/backend logic and global routing are separate scopes.
No second Page/DocsTopBar CLI identity, package family or pinned schema edits.

## 7. Contributor path

packages/fresh-ui/src/contracts/README.md documents the shell ports, native SSR
versus hydration boundary, standalone toggle compatibility and extension path.
Follow it to the canonical catalog and copied sources. Public evidence contains
repo-relative paths/verdicts/counts only; raw process logs remain private.
