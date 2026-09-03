# Plan — #1906 slice 3

## Profile

- Archetype: CLI/tooling (Archetype 6), applied to its E2E harness.
- Package verdict: `packages/cli` is **Keep**.
- Runtime validation is hosted through `ci:full`; no local Aspire lease is acquired.

## Locked decisions

1. Empty the polling allowlist; never add another observer or restore a snapshot poll.
2. Convert the remaining listener-readiness poll through `watchResourceUpdates`, with one rich
   snapshot after the observed aggregate event.
3. Preserve D-101's one pre-fault subscription across both health directions and its structured
   failure-code assertion.
4. Retain non-resource waits only with a precise effect-level classification.
5. Preserve every existing ceiling duration while renaming resource-state bounds as failure
   ceilings.

## Open-decision sweep

- Must resolve now: none.
- Safe to defer: none within the fenced inventory and Bucket C.

## Commit slices

1. **S1 — pinned RED.** Empty/pin the allowlist and capture the remaining poll as an expected
   failure. Files: guard/test and run artifacts. Gate: focused structured test receipt.
2. **S2 — fenced GREEN.** Convert the remaining poll, preserve the already-correct fenced files,
   and add fake-subscription tests. Files: six fenced sources, focused tests, run artifacts. Gates:
   focused test wrapper and polling guard.
3. **S3 — Bucket C.** Classify or convert each named site and record the exact disposition. Files:
   eight named sources as needed plus run artifacts. Gate: focused tests/inspection.
4. **S4 — evidence.** Run the brief's quality/static/suite gates and write durable receipts. Files:
   run artifacts only unless a gate reveals an in-scope defect.

## Risks

- Missing an event by subscribing late: inject/test a follower seam and assert startup order.
- Follow lines lack per-check reports: detect aggregate health first, then perform exactly one
  snapshot for detailed attribution.
- Misclassifying an HTTP/telemetry retry: document the exact effect observed, not just the API used.
- Ceiling regression: preserve numeric duration and explain each retained value as a hung-test cap.

## Deferred scope

Generated AppHost templates, `packages/cli/src/**`, root config/lock changes, local runtime
execution, Bucket B, and any issue work outside #1906's expanded observation inventory.
