# Navigation slice validation

Full rebuilt-source browser suite108/108 PASS across light/dark390/1280.
Focused structured test wrapper142/142 PASS: contract renders/catalog,
ActionMenu/Popover runtime, actual ui:add copies for13 new components,
frozen-v1 authoring negative controls and native registry v2. Scoped source
checks6+3, lint9, browser fixtures2/spec1 checks and browser lint2 PASS.
Quality gate (quality scan + dependency/doctrine checks) PASS.
Every new CSS variable resolves to an existing theme definition.

`deno doc --lint --frozen packages/fresh-ui/interactive.ts`: FAIL123 diagnostics.
An isolated full checkout of exact pre-slice c788023 reproduces123 identical
(code, message, package-relative file) diagnostics. No additions/removals.
They concern existing Accordion/Combobox/Dialog/Popover/Sheet/Tabs/Tooltip
namespaces; no new ActionMenu API diagnostic. This is baseline attribution,
not a claim that global documentation lint is green. The comparison-only
worktree was removed after the read-only command; no resources were started.

Native details needs bubbling focusout for island focus-exit dismissal.
Application menus promote popovers before paint and choose a native autofocus
entry edge, avoiding lost rapid keys. Hydrated button triggers suppress only
the duplicate native toggle; explicit submit/reset form actions remain native.
Outside dismissal keeps destination focus. Nested collection traversal excludes
child menus, choice state is caller-owned, and Escape closes one submenu level.
No new global listeners or alternate positioning engine.

Local Linux review captures retain Utility anatomy, token roles and zero serious/
critical axe. They are visual review evidence, not a cross-platform pixel gate.
All publication/carrier and whole-phase readiness checks remain required.

Correction final: browser112/112, focused142/142, quality PASS/exit0 and
publication preflight/docs accuracy111 PASS. Same reviewer round2 PASS. The
mobile native-dialog boundary regression failed before the Escape guard, then
passes at all four viewport/scheme combinations. Registry design/doc-drift9/9
PASS after matching collection documentation order.
