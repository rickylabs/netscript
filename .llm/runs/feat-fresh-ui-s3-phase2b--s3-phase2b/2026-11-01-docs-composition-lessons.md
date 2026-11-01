# Docs composition lessons — 2026-11-01

- Content blocks must measure their own container inside real Shell columns.
  Root inline-size containment plus a declared inner layout part lets CSS query
  the component's own width without JavaScript or a parent integration contract.
- Complementary ranges avoid fractional-width gaps. Test767.5/1100.5 with an
  independent native CSS query reference; do not infer the expected band from
  the component's own display.
- Reset selectors must match desktop Nth-child specificity before medium-band
  end-cell removal. A real failing case caught missing rules in a two-column
  layout that still inherited a desktop third-cell exception.
- A component owns only its own parts. Generic descendant data-part selectors
  can restyle unrelated nested components and override forced inner views.
  A real failing mobile Hero changed a feature card title16to48; immediate
  root/layout/display-or-aside chains preserve nested source-style ownership.
- Caller composition includes existing focus stops: CodeBlock has a native
  focusable content region between Copy code and the following path controls.
  Its public prop is filename, not name. Use the existing Button link API for
  a themed outline navigation action instead of styling a raw anchor by hand.
- Keep keyboard stress cases separate from Utility review examples. Raw native
  buttons are useful for control behavior; ledger-shaped reference cards show
  title/body/action anatomy without confusing the visual comparison.
- Assert that scripted replacements matched. A formatted multiline capture list
  defeated a compact-string replacement and bypassed the intended hover branch.
  Corrected exact selectors and fresh browser executions replaced interrupted
  runs; interrupted runs never count as passing evidence.
- Standalone browser tooling may not inherit root formatter discovery. Explicit
  matching single-quote/100-column settings plus the structured fmt wrapper
  catches the difference without a broad repository formatting change.
- Package/native publication, actual docs and component browser results prove
  different surfaces. Keep raw accepted doc-lint debt visible, and do not call
  working-tree quality or draft-skipped CI exact-head readiness.

- WebKit dark mode can render unthemed native buttons as white on UA gray.
  The strict contrast gate caught1.81in caller fixtures. Use the existing
  themed native Button at the caller; retain strict axe and token values.
