# Utility shell and archetype audit

Authority: the Figma library component spec, ledger-screens.json and the five
light/dark Utility screen pairs under
`.llm/runs/design-system-s4--language-review/figma-library/`. All five light
compositions were inspected directly; their dark pairs remain the visual source
for final scheme checks. This is a component-gap/composition audit, not a claim
of application screenshot parity.

| Archetype | Concrete component seams | Phase2 evidence and remaining work |
| --- | --- | --- |
| Dashboard | AppShell/Sidebar/TopBar, Breadcrumb/Search, PageHeader with tabs/actions, StatsGrid, DataTable/checkbox/badges/avatars, Card rule activity list/Item | New Item and reviewed Card support the activity list; the audited PageHeader supplies a native heading and child-owned tabs/actions. Chart/Carousel are available but this screen does not require them. Full shell composition and baseline StatsGrid/DataTable surface audit remain in Layout2b. |
| Orders | Same shell/header, filter form with Search/Select/DatePicker, DataTable selection/ActionBar, Sheet with Field/Input/Textarea/Select, Alert warning, joined ButtonGroup | DatePicker, ButtonGroup and Alert have real browser keyboard/accessibility evidence. Existing Sheet/form/table primitives remain the public composition seams. Full shell and full application data/selection wiring are not asserted by isolated component tests. |
| Settings | Same shell/header, vertical navigation, Field/Label/Input/Select/Textarea, Slider, Switch, RadioGroup, InputOTP, Checkbox, Alert success, destructive action | RadioGroup/InputOTP/Slider and Alert have actual browser behavior coverage. Vertical destination navigation can use NavigationMenu or native links; it is not an invented new component identity. AppShell layout and baseline composition audit remain Layout2b. |
| Sign-in / onboarding | Card rule, Field/Label/Input/Checkbox, Alert error, Button, Separator, vertical Stepper, Progress and native country Select | Stepper native navigation, rule Card, label association and Alert semantics have reviewed tests. Authentication, account creation and request effects belong to the host. This screen creates no new shell identity. |
| Command | Dashboard beneath modal CommandPalette; Search trigger, grouped results, excerpts/shortcuts, optional filters/footer, ActionMenu/ContextMenu with submenus/choices, Toast/Tooltip | Palette and menu keyboard, controlled refusal, disabled/loading/query states and measured destructive labels have actual tests. Global shortcut registration, backend search and concurrent application notifications remain host concerns; Pagefind backend is approved S8 scope. |

## Shell API findings and ownership

The shipped SidebarShell is the one code source for AppShell, Sidebar and
TopBar scopes. Its actual root inputs are pathname, navigation, brand,
brandBadge, footer, topbarStart, topbarEnd, contentId, navLabel, children, class
and native div attributes. TopbarStart/End are slots, so a NavigationMenu can
provide lane links without a second DocsTopBar identity.

Its current topbar is inside the main column. The phase-one AppShell contract's
layout=chat/docs, rail/nav/breakpoint switches, and several Sidebar/TopBar axes
are research metadata rather than implemented inputs. Mobile CSS alone is not
proof of accessible modal sidebar focus/Escape handling. These are explicit
outstanding Layout2b implementation/audit items, including the docs shell's
full-width header/rail geometry and native mobile navigation behavior. They
must be reconciled before claiming complete phase2 delivery. This audit never
marks those speculative axes complete or treats five static screenshots as
keyboard evidence.

PageHeader is a separate complete slice: real title/eyebrow/description,
optional breadcrumb/actions/tabs/status, responsive heading row, existing
section namespace, and native child interaction. Its contract now describes
that actual surface. Its breakpoint is CSS; no phantom prop is exposed.
