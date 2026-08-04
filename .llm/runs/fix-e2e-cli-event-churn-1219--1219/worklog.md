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

