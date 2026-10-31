# Spec §4.5–4.6 decisions

| Conflict | Phase 1 decision |
| --- | --- |
| Button primary/default; default size | `primary` and `md` stay canonical. `icon` remains a compatibility size; IconButton is the square presentation. `link`/`xs` are specified as planned until their visual implementation. |
| Logical icon names | Contract slots are `icon-start`/`icon-end`; existing `icon`/`iconPosition` remain compatibility props. |
| Badge tone vs emphasis | Variant remains semantic tone, with `info` and emphasis specified separately. Unshipped axes are explicit. |
| Alert default | Canonical `neutral` is in the contract; existing default `info` remains for visual compatibility. |
| Toast error/destructive | Keep settled Figma `type=error` and compatibility payloads; document its destructive token-role mapping. The spec's D6 rename recommendation does not override the built Figma set. |
| Avatar default size / presence | Canonical `md`, keep presence and agent; specify optional badge/group without claiming implementation. |
| Native Select / custom listbox | Preserve the native select and browser keyboard map. Content/listbox is planned, not an ARIA imitation. |
| Field / FormField | Contract identity Field; existing FormField remains supported. Add Field as a compatible source alias only where needed. |
| Empty / EmptyState | Contract Empty state; source EmptyState stays canonical. |
| ActionMenu / DropdownMenu | Contract Dropdown menu; source ActionMenu stays compatible and uses `intent`, not `variant`. Utility retains the delegated `popover` scope on all parts so app-owned floating.css continues to position and hide the menu. |
| Toggle state / selection | Selection is its own boolean axis; pressed is pointer activation. |
| Tabs selected / interaction state | Selection is distinct from disabled/focus/hover; preserve existing runtime APIs and document attribute compatibility. |
| Panel tone / Chart tone | Panel's visual choice becomes variant with a compatibility tone prop. Chart/Donut keep semantic tone. |
| Sheet sides | All four design values are specified; this phase does not implement missing sides. |
| Floating side / placement | `placement` remains canonical. |
| Message align / role | `role` is canonical and determines alignment. |
| Trace / tool status | Separate value sets: trace has pending as well as done/running/error; tool call retains its three statuses. |
| CodeBlock superset | Tabs/lines/numbers are planned; keep existing filename/lang/copy behavior. |
| BEM / attributes | Emit data attributes. Keep base and element classes as stable styling hooks. CSS replacement preserves class specificity. |
| Figma private decoration | Focus and state layers may be CSS pseudo-elements; do not add layout DOM for them. Native controls own internal text/indicator anatomy. |
| Token vocabulary, focus, shadows, copper, outline border | Defer visual/token corrections to S6. This migration preserves the input CSS declarations and verifies computed-style parity. |

Rendered-contract reconciliation: native/headless open/closed, active/inactive, checked/unchecked,
and desktop active/enabled/ready hooks remain explicit `compatibilityValues` on named parts; they
are separate from canonical Figma values. Existing DataGrid selection/header-cell anatomy, tray
roles, Toast title-row and PromptInput send are recorded as Utility compatibility parts. Wrapper
getters now preserve explicit compound part/scope delegation. Drawer composes the native Dialog
runtime and retains its dialog scope; side positioning remains consumer CSS. AppShell's sidebar and
topbar seams are child-component context boundaries. Label's required mark is a pseudo-element.
Native checked state remains a native input property/:checked after uncontrolled interaction.
