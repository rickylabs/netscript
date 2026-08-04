use harness

# W4-D implementation lane — S2 shared retry runtime

Continue the attached implementation thread for PR #1226 / issue #1104 in
`/home/codex/repos/ns005-cron-w4d-impl` on local branch
`fix/cron-retry-backoff-contract-impl`. The root session remains implementation supervisor and
retains replay, sign-off, push, and PR authority.

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-doctrine`
- `.agents/skills/netscript-tools`
- `.agents/skills/netscript-deno-toolchain`
- `.agents/skills/jsr-audit`
- `.agents/skills/rtk`
- `.agents/skills/netscript-pr`
- `.agents/skills/codex-wsl-remote`

## Read first

1. `AGENTS.md`
2. This brief
3. `.llm/runs/fix-cron-retry-backoff-contract--w4-d/{context-pack,plan,worklog}.md`
4. The complete focused cron adapter/shared/types/tests surface.

## Locked contract

- Retain and implement the published options; do not deprecate or invent a third shape.
- The two existing providers are memory and native `Deno.cron`; no Deno KV cron adapter exists.
- `maxRetries` is retries after attempt 0; default is 0.
- Fixed delay = `initialDelay`.
- Exponential delay = `initialDelay * (multiplier ?? 2) ** (retryNumber - 1)`.
- Linear delay = `initialDelay * retryNumber`.
- `maxDelay` caps every policy.
- Handler/context attempts are zero-based `0..maxRetries`.
- Listener/history behavior is aggregate: exactly one terminal `jobRun` or `jobError` and one
  `runCount` increment per invocation; `JobExecutionResult.attempt` is the terminal attempt.
- A registration abort during backoff ends the invocation and must not call the handler again.
- No new public export. Queue/task runtime retries remain out of scope.

## This turn: S2

1. Turn the S1 RED contract green by retaining each job's `maxRetries`/`backoff` options in both
   adapters and applying one shared retry loop in `adapters/_shared.ts`.
2. Use an abortable production wait through existing `@std/async`; do not add a custom public clock.
3. Build a deterministic provider-parity fake-time matrix for BOTH adapters covering:
   - success after retry and visible attempts;
   - exhausted retries and terminal attempt;
   - fixed, exponential, and linear delay sequences;
   - `maxDelay` capping;
   - abort/shutdown during backoff with no next attempt;
   - aggregate terminal listener/history and `runCount` semantics.
4. Use no wall-clock sleeps and never register real native cron work; capture/stub `Deno.cron`.
5. Run the focused test file/suite green with `--no-lock --unstable-cron` and record exact results.
6. Run scoped check/lint/fmt on changed source/tests using repo wrappers, plus the smallest relevant
   architecture/quality gate if practical for this slice. Record honest exit codes.
7. Update `worklog.md` and `context-pack.md` for supervisor handback. Record any drift explicitly.
8. Commit S2 locally with an implementation-focused message. Do NOT push.

Preserve lock hygiene: every Deno command must use `--no-lock` when direct invocation supports it;
do not stage or commit `deno.lock`. Do not add lint ignores, `@ts-ignore`, or unsafe double casts.

End exactly `DONE` when the implementation, green matrix, evidence, and local commit are ready for
supervisor review, or `BLOCKED: <reason>` when genuinely blocked.
