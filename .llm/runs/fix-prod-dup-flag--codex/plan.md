# Plan: published workers-api duplicate dependency-age flag

- Archetype: 6 (CLI/tooling), internal E2E fixture subtype; no overlays.
- Locked decision: rewrite only the config filename, then add the dependency-age flag only when the
  workers block lacks it. Use a pure internal helper so both published template shapes are unit tested.
- Open decisions: none. Helper naming/location is resolved with the owning scaffold gate.
- Slice: helper + published-mode call site + two-shape unit test; prove with focused test and scoped
  package check/lint wrappers.
- Risks: local-mode conflict with #627 (mitigated by leaving its branch unchanged); string rewrite
  silently missing (mitigated by existing postcondition plus semantic tests).
- Deferred: product templates, full scaffold runtime, published verification, and refactors.
- Gates: focused e2e unit test; scoped check/lint for `packages/cli`. Full runtime is owner-reserved.
- Debt: none. PLAN-EVAL is owner-waived as drift D1.

