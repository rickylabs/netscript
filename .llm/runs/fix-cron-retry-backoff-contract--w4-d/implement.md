use harness

# W4-D implementation lane — S1 RED only

You are the attached Codex implementation lane for PR #1226 / issue #1104. Work in the clean native
WSL slice worktree `/home/codex/repos/ns005-cron-w4d-impl` on local branch
`fix/cron-retry-backoff-contract-impl`. The PR branch is `fix/cron-retry-backoff-contract` in the
supervisor worktree. The root session is the implementation supervisor and retains push, PR, replay,
and sign-off authority.

## SKILL

- `.agents/skills/netscript-harness` — follow the existing run artifacts and per-slice evidence.
- `.agents/skills/netscript-doctrine` — keep the locked Archetype 2 adapter/shared-policy boundary.
- `.agents/skills/netscript-tools` — use trustworthy focused test evidence and preserve lock hygiene.
- `.agents/skills/netscript-deno-toolchain` — inspect Deno/@std surfaces without ad-hoc tooling.
- `.agents/skills/jsr-audit` — do not damage the package publish surface.
- `.agents/skills/rtk` — compress read-heavy repo commands.
- `.agents/skills/netscript-pr` — understand the supervisor-owned commit trail; do not push yourself.
- `.agents/skills/codex-wsl-remote` — this is one attached thread; never launch a rival session.

## Read first

1. `AGENTS.md`
2. `.llm/runs/fix-cron-retry-backoff-contract--w4-d/context-pack.md`
3. `.llm/runs/fix-cron-retry-backoff-contract--w4-d/plan.md`
4. `.llm/runs/fix-cron-retry-backoff-contract--w4-d/worklog.md`
5. Focused cron types, shared executor, both adapters, and existing tests.

## Locked contract

- Implement is chosen; removal/deprecation is rejected.
- Existing providers are memory and native `Deno.cron`; there is no Deno KV cron adapter.
- `maxRetries` means retries after attempt 0.
- Listener/history semantics remain aggregate: one terminal event and one runCount per invocation.
- No new public export. Queue/task runtime retry policies are out of scope.

## This turn: S1 RED only

Add the smallest deterministic fake-time test that proves today's defect against a configured retry
policy. It must exercise both `MemoryCronAdapter` and `DenoCronAdapter` (capture/stub `Deno.cron`;
never register real cron work), configure at least one retry with nonzero backoff, and assert that the
handler sees attempts `[0, 1]` after fake time advances. On current source it must fail because only
attempt 0 runs.

- No wall-clock sleeps.
- Run the focused test and record the exact nonzero exit/assertion in `worklog.md`.
- Update `context-pack.md` to hand S1 back to the supervisor.
- Do NOT implement retry behavior yet.
- Do NOT edit docs yet.
- Commit the RED test and run-artifact evidence only to this local slice branch with a message that
  names the defect proof. Do NOT push. The supervisor will review and replay it without committing,
  then create the PR branch's sign-off commit.
- The supervisor worktree has a pre-existing local `deno.lock` modification. Your slice worktree is
  clean; do not create any `deno.lock` churn.

End the turn with exactly `DONE` when the RED test and run-artifact evidence are ready for review,
or `BLOCKED: <reason>` if genuinely blocked.
