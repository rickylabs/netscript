# Drift

- Intake: QueryResult duplication already removed by #2503 hydration repair. Preserve
  the single source and add the requested drift regression rather than refactoring again.
- Environment: rtk absent; run focused underlying commands and retain unfiltered evidence.
- Owner's specific Refs/draft/READY workflow overrides generic dispatcher close/early-ready
  boilerplate and repository default labels. No labels will be applied.
- Scoped formatter initially refused the two CLI test files because the root configuration
  excludes all CLI sources. Use source-quality.json, copying the root rules and style
  without its directory exclusions, for the three owned TS files; preserve coverage refusal.
- Browser coverage clarification: the full 265-fixture Utility comparison uses explicit
  studio/utility. The identical selector/CSSOM contract proves unchanged matching for
  all aliases; the existing Badge browser tests also exercise all three aliases. Full
  parity is Chromium-only. Native nesting is now required by these Utility CSS blocks.
- The run's compare-rule-contract.mjs is a one-off baseline evidence replay, not a new
  maintained product/tooling interface. It depends on the existing browser harness's
  pinned installation. No reusable framework abstraction was introduced.
- Additional full-export doc-lint reports 124 inherited findings in 16 unchanged source
  files. Evidence is disclosed separately; no existing debt was deepened by this change.
- Delivery metadata: close-gate rejected an unchecked PR-body assertion about all remote
  checks while those checks were still running, including close-gate itself. Replace
  that circular assertion with the completed/current invariant that READY is withheld
  until all required checks pass or policy-skip. Remote CI stays explicitly pending;
  no code/test/check exemption. Owner requested correction and normal push.
