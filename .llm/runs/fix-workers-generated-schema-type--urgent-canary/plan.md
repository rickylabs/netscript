# Plan

Scope: finish existing PR #2035 against issues #2034 and #2069; retain published branch history. Archetype 5; no new public export.

Locked: verify real generated consumers and doctor rather than rewriting correct code; retain the existing policy matcher and compiler. PLAN-EVAL: N/A for bounded evidence/CI repair with the issue contract already fixed.

Slices: S1 bootstrap and refresh focused evidence, no new product code planned; S2 independent evaluator and final evidence, only after gates.

Gates: scoped check, test, lint, format; quality scan and doctrine fitness; workers JSR/doc audit; generated consumers; scaffold.runtime; current-head CI; independent IMPL-EVAL. Risk: historical green evidence may be stale; refresh against exact head. Runtime unavailable: owner must provide a working runtime or explicitly decide the gate exception. No exception inferred. Open decisions: runtime gate availability must resolve before readiness. Deferred: unrelated plugins, release cut, merging. No new debt accepted.
