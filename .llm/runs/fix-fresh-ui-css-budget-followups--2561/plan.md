# Plan & Design — READY FOR REVIEW

Archetype6 tooling plus frontend validation overlay. No shipped component/markup/token
changes. Existing package public surface and dependencies remain unchanged.

Locked design:
1. Planned gzip raise to28000, raw220000 unchanged. Fixed, explicitly reviewed growth;
   no automatic budget increase with file count. Document the policy at the constant
   and in package guidance.
2. Normalize source paths relative to the package before excluding registry/theme.
   Exercise the real test under a theme-named checkout, with positive and negative cases.
3. A maintained .llm/tools/css entrypoint loads committed original CSS/token/markup
   inputs, compares parsed ordered rule contracts and invokes the existing full Utility
   computed-style/screenshot replay. The fixture is self-contained and provenance-hashed.
4. Browser tests prove declaration/selector/media changes, removals and order changes
   fail. Unsupported nesting must fail closed rather than produce an inferred equality.
5. Run the reproducible replay in the Fresh UI browser CI lane and classify its inputs
   as Fresh UI changes. No screenshot baseline re-recording; before and after run together.

PLAN-EVAL N/A: bounded validation follow-ups with explicit contracts and existing engines;
no new public/runtime architecture. Mandatory independent read-only implementation review.

Slices: (1) plan and draft PR; (2) policy/path fix, maintained comparator and fixtures,
CI wiring, meaningful regressions and full replay, independent review/sign-off;
(3) delivery evidence/current-head reconciliation. Under30 implementation files expected.

Risks: corrupt/stale fixture inputs, unsafe archive paths, a vacuous CSS parser comparison,
checkout-specific behavior, policy loosening without evidence. Mitigate with schema/hash/
inventory checks, safe relative paths, real Chromium negative controls, actual-test location
fixtures, and explicit fixed ceilings. No new architecture debt expected.

Gates: focused package/budget and browser-tool tests; full338+FreshUI suite; original265
specimen replay/2388000comparisons and CSS rule equivalence; scoped check/lint/fmt,
quality/architecture, release preflight, four carrier generators and all root check tasks,
Deno2.9.7. Runtime explicitly UNPROVEN if unavailable (validation-only scope). Final PR
checks green or policy-skipped. No production visual change or unrelated export-doc cleanup.
