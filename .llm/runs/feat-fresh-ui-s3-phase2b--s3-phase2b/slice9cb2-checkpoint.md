# Design checkpoint9c-b2 — DataTable and DataGrid baseline audit

Approved baseline audit following terminal StatsGrid sourcefa3b576c/evidenceaf52a0e7.
Same feature tier, Archetype4 with the contract concern folded in, supplied leaf,
frontend/docs overlays and separate read-only ClaudeOpus5.5 high evaluator. No
production source changes before independent design PASS.

## 1. Public surface

Keep the existing `DataTable`, `Header`, `Body`, `Row` and `Footer` copy targets,
children, classes, native attributes, `interactive` and row `cols`. Add an optional
root `state` (`default`, `selection`, `empty`, `loading`, default `default`) that
owns its actual data attribute and native busy state. Sections stay caller-owned
composition. Fix row `cols` merging so both native string and object styles survive.

Keep the same package `DataGrid` identity, columns/rows, class/label/native props,
row `onSelect` or Fresh `href`, selected row snapshots, controlled `selectedIds`,
`onSelectionChange`, `renderBulkActions` and `renderRowActions`. Correct its DOM to
native table structure and ordinary native child controls. No grid navigation
engine is introduced. Whole row body pointer activation stays available through
an actual button/link inside a cell, with independent child controls above its
stretched hit area. Native activation is a sibling of arbitrary caller-rendered
cell content, never its parent. A row's optional `label` supplies the activation's
accessible name; the fallback is `Open row <id>` and can be localized by the caller.

Widen `DataGridColumn.header` from string to existing `DataGridRenderable`. Add
optional `headerLabel` for mobile text (default: string header, otherwise key),
and `sort` for native `aria-sort` on its header cell. A caller-rendered sort button
owns ordering and state. Add optional `state` and caller-owned `empty`/`loading`
render content to DataGrid. The exported `DataGridState` union is the four canonical
states. When state is omitted, derive empty from no rows, selection from visible
selected rows, otherwise default. Explicit loading/empty renders its supplied
content in one spanning native cell; absent content is empty, with native busy
state conveying loading. No generated message, skeleton or data is invented.

The same canonical D5 contract describes the copied frame and package-driven
content, with qualified compound slots and clear member scopes. Nested frame and
DataGrid roots are intentional composition and must be explicitly allowed for D5
when the later strict harness narrows nested-root policy; no general bypass.

## 2. Domain vocabulary and semantics

Frame, toolbar/header, bulk actions, table, header cells, rows, data cells,
selection checkbox, row activation, row actions, empty/loading body and footer.
The control model is a static table containing independent native controls:

- Table/thead/tbody/tr/th/td, with explicit table roles where CSS layout overrides
  need them; column headers retain their native association.
- Tab/Shift+Tab visit controls. Enter activates links/buttons, Space activates
  buttons and checkboxes. No row keydown handler, roving focus or arrow manager.
- The checkbox owns checked/mixed state. Static rows retain visual `data-state`
  but stop emitting unsupported `aria-selected` on table rows.
- Controlled selection must honor refusal physically, including checkbox checked
  and indeterminate properties, and must not create internal selection state.
  Visible selected counts ignore stale IDs; row snapshot selection remains useful
  without the controlled set. Action slots keep current context and clear behavior.
- Bulk actions are outside the native table and use group semantics; a toolbar
  role is reserved for an implementation with actual toolbar keyboard behavior.

This deliberately corrects the old `role=grid` without grid navigation and whole
button/anchor elements whose `role=row` hid their native action semantics. The old
DOM-shape tests are updated around preserved caller behavior and corrected APG
semantics. References: WAI APG [table](https://www.w3.org/WAI/ARIA/apg/patterns/table/)
and [grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

## 3. Ports and implementation boundaries

Use Preact/native HTML, existing Renderable contracts, current callbacks,
CSS grid tracks and existing semantic tokens. A stretched pseudo-element on the
native activation owns pointer coverage; selection/actions and arbitrary cell
links, buttons, inputs, selects, summaries and tabbable content remain independent.
Preserve native modified link clicks and Fresh navigation. Zero-column rows with
an activation still need a real cell/control; do not silently lose activation.

DataTable owns a native frame retaining `ns-card` styling compatibility, because
Card currently overwrites custom state/variant axes. Compose existing sections;
do not weaken Card's contract or add a generic escape hatch. Apply the same CSS
specificity lesson as StatsGrid. DataGrid has no existing stylesheet anywhere;
add its actual styles to the existing registered `data-table.css`, document that
consumer dependency and verify the real installed frame/CSS carrier.

Use responsive mobile cards with visible noninteractive cell labels. Keep header
controls visible and reachable on mobile; never hide a focusable sort or select-all
control offscreen. HeaderLabel text is separate from the interactive header port,
so mobile labels never duplicate buttons. Preserve native table accessibility
when changing display layout, cover RTL and narrow containers, and contain any
unavoidable fixed-track overflow in the table's own region.

## 4. Constants and contract ownership

Finite state and cell-treatment types are explicit; retain `DATA_GRID_CELL_VARIANTS`.
The typed catalog scopes root state, selected row snapshots, header/button/link
row types, interactive flags and strong/num cell variants to their actual parts.
Audit phantom `breakpoint` as native CSS responsiveness, callbacks as callbacks,
member props/qualified slots and actual parts, including cell-strong/cell-num,
row-link/row-action/actions where the implementation emits them. No broad private
attribute allowlist and no change to the immutable per-style base rule.

Use existing table/Card/space/type/semantic surface and focus roles. No new token
values, dependency/version changes, lock churn, backend ports or new identity.
Only actual native/platform behavior justifies a helper; keep published code under
its existing module boundaries and avoid new suppression or unsafe-cast debt.

## 5. Commit slice and gates

One complete unit under thirty source files: DataTable TSX/CSS; DataGrid source,
public contracts/exports; typed D5 and JSON; README; focused native/browser fixture,
SSR/type/render/provider/selection and actual installed-copy tests; generated
registry/CLI/MCP carriers; this run's checkpoint/worklog/context/drift/evidence.
Split only if a coherent unit requires it; no approved audit obligation is dropped.

Before fixing production code, reproduce the existing child Space/Enter capture
in a real browser negative and record its expected failure. Then prove:

- Native table roles and associations, normal Tab/Enter/Space, row whole-body and
  own-control pointer behavior, independent first-cell/custom cell controls,
  checkboxes, row menus, Fresh links, selected snapshots and controlled acceptance
  and refusal, select-all mixed state, stale IDs and action context/clear behavior.
- Actual default/selection/empty/loading compositions using existing Search,
  filters, menus, Skeleton/EmptyState and Pagination with caller-owned state;
  sorting, filtering, paging and column visibility stay in fixture host logic.
- Utility light/dark390/1280, mobile stacked cards with reachable header controls,
  RTL/narrow containers, no page overflow, strict axe zero allowances and captures.
- Contract render/API tests, copied DataTable source fidelity and compilation,
  registry metadata/embedding/design/doc drift and JSON equality.
- Scoped source/browser check/lint/fmt with no dropped files; quality/architecture,
  preflight, docs accuracy, exports drift, native publish zero slow types and no new
  full-export documentation diagnostic identities against accepted debt2531.

Same independent source review before source commit. Then regenerate/check all
four carriers from committed source, refresh quality/native publication, get the
same independent evidence review, audit both public runs and only added diff lines,
then commit/push evidence and comment on PR2538. Every commit updates this run.

## 6. Deferred scope

No backend sorting/filter/pagination, virtualization, editing, asynchronous data
client, custom grid keyboard manager or new chart engine. The nineteen promotions
remain sequenced after the Utility canary. No new style implementation or token
values. Remaining AI, Docs, Desktop, additive extensions/all-style harness and
final full browser/runtime/exact-head green CI remain required by the assignment.
This unit is not whole-task completion or READY.

## 7. Contributor path

`packages/fresh-ui/README.md` explains both composition surfaces, corrected native
table semantics, row activation/labels, controlled selection refusal, state content,
mobile column labels/sorting and the existing CSS/registry installation path.

## Pointer refinement after the real text-selection prototype

The initial stretched pseudo-element passed child-key isolation but blocked an
actual mouse drag from selecting cell text. Preserve the same native controls and
public API while disabling the pseudo-element's pointer interception. A small,
row-local pointer handler may forward body clicks to its existing native control:
ignore prevented events, descendant controls, nested foreign rows and a noncollapsed
selection touching the row. Ordinary clicks focus the real control and dispatch
its native click activation. Modified and middle link clicks must retain browser
navigation behavior through that control and pass actual new-tab tests; a failure
must be fixed rather than waived. The pseudo-element remains a row focus outline.
No row keyboard handler, pointer state machine, data engine or global listener is
introduced. This refinement needs the same independent design check before its
implementation and all original interaction gates still apply.


## Cross-engine native link refinement checkpoint

Chromium and Firefox passed modified body clicks through a copied MouseEvent.
WebKit passed the same Control-click directly on the native link and a native
target-blank baseline, but did not open a tab for the forwarded modified event.
This distinguishes a forwarding limitation from a browser that cannot open tabs.
Before changing production code, review a platform-only refinement: for Control/Meta
primary body clicks on the owned anchor, temporarily use its native target=_blank,
call the anchor's standard click(), then restore the exact previous target in a
finally block. Keep href/Fresh handling on the anchor; use no window.open, router
engine, global state or user-agent branch. Plain clicks retain their current
path. Stop propagation of the original body event after successful forwarding so
root observers see one activation event rather than two. Verify real native tabs
in all three engines, target restoration, observer count and all original guards.
Other modifier/navigation semantics remain available directly on the visible link.
No implementation of this refinement before the same independent design check.
