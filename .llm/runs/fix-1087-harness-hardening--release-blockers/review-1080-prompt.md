use harness

# Opposite-family slice review: #1080 mandatory real-Redis CI regression gate

## SKILL

- `.agents/skills/netscript-harness` — apply the substantive slice-review and verdict rules.
- `.agents/skills/netscript-tools` — validate evidence, command failure semantics, and lock hygiene.

You are the separate Claude/Fable reviewer for a Codex-authored normal implementation slice. Review
only; do not edit source. Write the compact verdict to:

`.llm/runs/fix-1087-harness-hardening--release-blockers/review-1080.md`

Review the uncommitted diff after `3f3cc6cb8`, especially `.github/workflows/ci.yml`, root tasks,
and the new `redis-regression-gate.ts` plus tests.

Acceptance boundaries:

1. The required `check-test` CI job has a healthy Redis service and job-level
   `NETSCRIPT_TEST_REDIS_URL`; both named real integrations execute, not skip.
2. Missing env fails the explicit gate before test launch, so an ignored integration cannot make CI
   green silently.
3. The normal gate verifies the exact two test names were observed with `ok`, not merely exit 0.
4. The negative control mechanically removes exactly #1075's `atomicTail` field/wrapper, runs both
   test files, requires each named regression to report `FAILED`, and restores the adapter in
   `finally`, including thrown command paths.
5. If the real branch regresses to pre-#1075 behavior, the preceding normal CI step turns red; the
   permanent negative-control step proves sensitivity without committing broken source.
6. CI/task permissions, workflow syntax, test ordering, output evidence, cancellation behavior,
   and lock/source hygiene are safe; no test can pass for an unrelated failure.

Observed author evidence:

- Missing env: task exit **1** with `refusing silently skipped Redis tests`.
- Current real Redis: both named tests printed `ok`; 4 passed, 0 failed, one unrelated restart test
  explicitly ignored because no container-control env is supplied.
- Negative control: both named tests printed `FAILED`; each observed **16 actual winners vs 1
  expected**; outer proof passed and `git diff --exit-code` verified adapter restoration.
- Full affected package suites + gate unit tests: **151 passed, 0 failed, 2 unrelated ignored**.
- Gate pure tests: **3 passed, 0 failed**.
- Root `deno task check` is still running under shared-host contention; do not assume a verdict from
  its lack of output. Focused validation is complete.

Inspect implementation and workflow directly. Your artifact must include `Verdict: PASS` or
`Verdict: FAIL_FIX`, severity-ordered findings with file/line evidence, explicit assessment of all
six boundaries, and any independently run gates. Pay special attention to false-positive negative
control passes and whether CI truly turns red when the checked-in adapter regresses.

Do not spawn sub-agents or workflows. Do not modify any file except the named review artifact.
