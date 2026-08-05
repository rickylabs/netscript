# Worklog

## Design

- Public surface: GitHub Actions event contract only.
- Domain vocabulary: code triggers versus metadata triggers; next-trigger label state.
- Ports: workflow event payload into existing classifier.
- Constants: allowed pull-request trigger set and forbidden metadata set in the policy test.
- Commit slices: event/policy change; validation/handoff.
- Deferred scope: concurrency semantics for synchronize events.
- Contributor path: update the workflow event set and its adjacent policy test together.

## 2026-08-05

- Read #1219 first and confirmed drift from the #1214 `ci.yml` pattern.
- Removed `labeled` and `unlabeled` from the workflow trigger set while retaining code/lifecycle events and ref-scoped cancellation.
- Added a policy matrix proving metadata events are absent and both skip labels still suppress all expensive tiers on the next pull-request trigger.
- Focused event/classifier/draft policy: 58 passed; workflow YAML parse, scoped lint, and scoped fmt passed.
- Reconcile: #1219 remains the sole closing issue; labels and 0.0.5 milestone remain correct.
