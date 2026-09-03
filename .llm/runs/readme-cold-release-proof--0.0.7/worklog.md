# Worklog: cold README published-release proof

## Owner-ratified cache correction — 2026-09-03

The first hosted rehearsal33756743492 stopped before README on6 preloaded images; all four
application-state counts were zero. Owner rejected the blanket cache restriction and clarified
Docker is configuration-specific, not universally required by NetScript or Aspire.

Design: retain first-application README ordering and all application/cleanup checks; record images
as diagnostic-only. Amend root README prerequisite prose, not its commands. No daemon replacement,
image pruning, new infrastructure, version change or broader test suppression. Update1881 in place.
PLAN-EVAL remains N/A for this bounded owner-directed correction.

Regression RED7/1 proves the previous all-fields-zero predicate is rejected. Final scoped GREEN
and CI follow this amendment. Existing independent PASS applies to832e53720; the small policy/prose
delta still requires proportional independent review before merge. Do not carry the old PASS as
an exact-new-head evaluation. Owner requested a durable wrap-up, not another evaluator launch now.

Final amendment gates: structured tests8/0, selected check1file/1batch/0diagnostics, selected
format1/1/0findings. Issue1881 acceptance rewritten in place; unproven acceptance remains unchecked.
PR1983 body now distinguishes the old exact-head PASS from pending bounded delta review.

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
