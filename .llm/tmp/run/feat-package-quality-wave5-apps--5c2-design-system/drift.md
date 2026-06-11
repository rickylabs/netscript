# Drift — Run 5c2: Official design system

Append-only. Inherits parent 5c drift (D-1…D-8) and 5c1 drift
(D-5c1-1 benign scratch hosting, D-5c1-2 RESOLVED Tier Z = GO,
D-5c1-3 root-exclude lift with accepted root publish-graph churn).

## D-5c2-0 — Run 2 lock: Tier-Z lead component deferred to dedicated wave

- Slice: lock (pre-slice-1)
- Plan reference: design-appendix.md §E.1 Run 2 table (12 slices); lock-time decision
  asks whether to add slice 13 = Tier-Z combobox.
- Decision: **defer** Tier-Z lead component (combobox) to a dedicated post-5c wave.
  Rationale: (a) the 12 locked slices already represent substantial cross-repo work
  (CSS reconciliation, layout-objects, playground/ui:add conversion, /design route
  group, lint gates, component completion, docs, check/lint/fmt, JSR dry-run);
  (b) the cross-repo caveat (R5) means playground validation requires genesis sync
  mechanics that are themselves non-trivial; (c) the Zag×Fresh spike in 5c1 proved
  SSR + hydration works, but shipping a production-grade combobox with full
  accessibility, tests, and docs deserves its own scoped wave rather than being
  squeezed into an already-full run.
- Impact: no rescope of the 12 locked slices; Tier-Z component buildout recorded as
  deferred scope beyond Run 3.

No Run 2 implementation drift recorded yet.
