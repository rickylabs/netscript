# Required test-6 repair — Linux process disappearance

Run41155740922 at8664aa3d6 confirms the original test-2 and test-5 fixes: both shards SUCCESS. That full run still fails test-6 (1783 passed/1 failed/7 ignored), then required check-test. Actual failure: the process-tree timeout fixture's read of an owned PID's /proc stat throws generic Linux ESRCH rather than Deno.errors.NotFound after the child exits. Prior READY remains withheld.

The failing file is byte-identical to main, but no failed matching main run supports a flake waiver. This branch repairs the test race under the coordinator's authorization instead.

## Bounded repair

- Extracted the already-tested terminated probe from process-review-regressions_test.ts into test-only process-termination.ts. Both that test and stdin-payload_test.ts now share it; no test imports another test file and no new production abstraction is introduced.
- The shared probe accepts reaped/not-found, Linux ESRCH and zombie state as terminated, preserving the existing50 attempts/10ms polling budget. Permission errors and unrelated errors still propagate.
- The actual wrapper/grandchild cancellation/timeout fixture still verifies status, exit code, bounded elapsed time and owned-PID termination. Its watchdog, signals, real subprocesses and cleanup are unchanged. No skip, timeout increase, task weakening or production executor change.
- Existing deterministic ENOENT/ESRCH/zombie/error controls now exercise the shared helper used by both suites. Added a living-to-zombie control requiring two reads, and an unexpected similarly-worded error control, so arbitrary read errors or living processes cannot silently pass.

## Evidence and remaining gate

Actual CI failure report is retained privately. Local pre-repair executor tests29/0/0 do not reproduce the timing race and are NOT presented as matching failed-main evidence. Repaired executor tests30/0/0, structured check/lint/fmt all3 files zero findings/drops/refusals, canonical preflight/root quality PASS. The prior MCP32/0/0 proof remains valid; combined focused proof and exact-source independent review follow.

Retained same-model separate native Opus review must sign off the bounded test-only change. Then push all final evidence before scheduling a new full non-draft CI run. Renew READY only after current actual8 shard jobs, check-test/quality and whole CI workflow succeed and protected contexts are satisfied at that exact final head. Informational deps-report's unchanged policy skip is reported distinctly, as on green main. No labels, policy override, force push, self-merge or release; no further push after green.

## Accepted source review and main integration

Combined original MCP/executor tests62/0/0 before main integration; after merging main4aa734e2b, expanded eleven-file coverage123/0/4 (four existing Redis environment ignores). Source4ba1c3043 normal merge preserves main's retry/DLQ production byte-for-byte. All six durable gates PASS; retained independent native Opus5.5 High source/local review PASS. See2026-10-31-main-integration-eval.md and validation JSON. Final full CI still pending, no flake waiver or renewed READY until all current required checks succeed.
