**R2 integration precommit signoff: PASS.** The supervisor can commit this merge slice once it does one thing first.

**Before committing, stage the regenerated prose bundle.** `packages/cli/src/kernel/assets/agent-docs-prose.generated.ts` shows as `MM`. The staged copy is still main's version, and the regenerated copy with our tuning-guide row is only in the working tree. Committing as-is would ship a stale prose bundle, and the freshness check would fail in CI. Run `git add` on it, together with the unstaged run-directory edits, and confirm that `git diff` is empty before committing. The export corpus is already staged correctly.

## Both sides preserved
- **Main's side:**
  - All of `packages/queue` matches `origin/main` `592a446af`, including the new concurrent Redis listener and the poll-interval options.
  - `job-dispatcher.ts`, `job-execution.ts` and `deno.lock` match main exactly.
- **This PR's side:** `plugins/workers/worker/` is identical to the previous reviewed head `6597b6452`.
- **Diff against main:** the same 11 files as before, so the merge changed nothing else.
- **No conflict markers:** none in the staged diff.
- **Tuning guide:** it keeps both sections in order: "Listener recovery after store outages", then main's "Tune Redis pickup latency", then "Abort cleanup budget".
- **Drift record:** it now records the drain-interval interaction from my plan advisory, and marks the Redis abort-callback risk as superseded by main.
- **Privacy:** the run directory contains no host paths, endpoints or process IDs.

## Checks I ran myself
- **Workers tests:** the structured test wrapper on `plugins/workers/worker`, with the Redis URL unset, gave 74 passed, 0 failed, 17 ignored. The ignored tests are all Redis/Garnet integration cases.
- **Export corpus:** the read-only `--check` exits 0.

## Accepted from private receipts, not rerun
- **Workers suite with real Redis:** 111 passed, 0 failed, 6 ignored.
- **Main's Redis concurrency tests:** 8 passed, 0 failed, 6 Garnet skips.
- **Negative controls:** with the budget reset disabled, both real stores fail on budget exhaustion, and the fake-clock negative fails its count assertion.
- **Carrier tests:** 11 passed, 0 failed. I inspected that report; it covers the embedded export corpus, the export flows and mirror-free tests, and the agent-docs bundle build.
- **Static and publish gates:** typecheck (136 files) and carrier check (2 files) pass, as do changed-source lint/fmt (8 files) and quality/architecture/deps. Docs accuracy, prose and corpus freshness, and the workers publish dry-run also pass.
- **Doc lint:** the same 2 private-type-ref findings in core workers contract code, not in this PR; `/worker` is clean.

**One failed receipt, explained:** the first corpus receipt failed because the check was run with `--allow-dirty`, which is only valid when writing the corpus. The valid rerun passed. It's worth a line in the worklog.

**Still to come:** the final review of the exact pushed head, in this session. After that, required CI and both E2E runtime tiers must run at the new head, and the coordinator owns that gate.
