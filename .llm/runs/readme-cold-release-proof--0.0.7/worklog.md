# Worklog: cold README published-release proof

2026-09-03 10:24Z: primary coordinator found and repaired a real acceptance gap while auditing
the six remaining 0.0.7 issues. #1881 explicitly forbids a warm-machine quickstart proof. Original
workflow was warm by construction; no completed cold verdict is claimed.

- RED: structured release-canary-workflow_test.ts returned 7 PASS / 1 FAIL, specifically
  `production README is the first runtime on a cold, uncached runner`: inherited Aspire cache.
- GREEN: the same structured test returned 8 PASS / 0 FAIL after the bounded workflow reorder.
- Selected TypeScript check: 1 file / 1 batch / zero diagnostics.
- An invocation accidentally selected nonexistent release-canary-workflow_test_test.ts; wrapper
  correctly refused with zero tests. Corrected selection above is the real GREEN, not that exit.
- Initial format finding was fixed by deno fmt; final lint/format/YAML/review/CI are recorded next.
- No Aspire or Docker resources were created. No existing image, volume, network or run was deleted.
- Owner final-candidate ruling: integrate the two remaining product PRs and this acceptance fix,
  preflight the frozen source, publish one intended final canary, then stable only after the exact
  green publish/production pair and linked issue acceptance. No speculative extra canary dispatch.
