# S2 — latest-run-per-name PR checks

## Design

- **Public surface:** `classifyCheckRuns(runs, headSha, mergedAt?)`, `buildPrCheckReport(...)`, and
  the `agentic:pr-checks` task.
- **Domain vocabulary:** check-run input, classified check run, provenance-bearing PR check report,
  the five locked classification values, and the supervisor-required honest `pending` state.
- **Ports:** `gh api` through `Deno.Command` is the sole network adapter; domain classification is
  pure and fixture-tested.
- **Constants:** named exported constants define every classification string; a private set defines
  completed failure conclusions.
- **Commit slice:** one S2 commit adds the tool, pure fixtures, task entry, and this evidence log.
- **Deferred scope:** PR publication, workflow wiring, and supervisor sign-off remain outside S2.
- **Contributor path:** add classification behavior in `pr-checks.ts`, then copy the fixture helper
  pattern in `pr-checks_test.ts`.

## Implementation evidence

All required gates passed on 2026-08-03:

| Gate | Exit | Evidence |
| --- | ---: | --- |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic/github --ext ts` | 0 | 9 files, 1 batch, 0 failed batches, 0 occurrences |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic/github --ext ts` | 0 | 9 files, 1 batch, 0 occurrences |
| `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic/github --ext ts` | 0 | 9 files, 1 batch, 0 failed batches, 0 findings |
| `deno test --allow-read .llm/tools/agentic/github/pr-checks_test.ts` | 0 | 5 passed, 0 failed |

The first format check found one import-layout difference in the new test file. `deno fmt` was
applied to that owned file, then the complete gate set above was rerun green.

## Live read-only demonstration

Command:

```text
deno task agentic:pr-checks -- --repo rickylabs/netscript --pr 1094 --pretty
```

Output (exit 0):

```text
stale-post-merge scaffold CI lane visibility status=completed conclusion=success startedAt=2026-08-03T11:45:28Z
stale-post-merge desktop-native-linux (deb + signed updater) status=completed conclusion=success startedAt=2026-08-03T11:39:36Z
stale-post-merge scaffold-runtime (aspire + docker + postgres) status=completed conclusion=success startedAt=2026-08-03T11:39:36Z
stale-post-merge scaffold-static (deno-only) status=completed conclusion=success startedAt=2026-08-03T11:39:36Z
stale-post-merge classify changes status=completed conclusion=failure startedAt=2026-08-03T11:39:21Z
superseded scaffold CI lane visibility status=completed conclusion=success startedAt=2026-08-03T11:39:15Z
stale-post-merge agent status=completed conclusion=skipped startedAt=2026-08-03T11:39:06Z
superseded scaffold-runtime (aspire + docker + postgres) status=completed conclusion=cancelled startedAt=2026-08-03T11:38:48Z
superseded desktop-native-linux (deb + signed updater) status=completed conclusion=cancelled startedAt=2026-08-03T11:38:48Z
superseded scaffold-static (deno-only) status=completed conclusion=cancelled startedAt=2026-08-03T11:38:48Z
superseded classify changes status=completed conclusion=failure startedAt=2026-08-03T11:38:35Z
superseded agent status=completed conclusion=skipped startedAt=2026-08-03T11:38:22Z
superseded desktop-native-linux (deb + signed updater) status=completed conclusion=cancelled startedAt=2026-08-03T11:38:13Z
superseded scaffold-static (deno-only) status=completed conclusion=cancelled startedAt=2026-08-03T11:38:13Z
superseded scaffold-runtime (aspire + docker + postgres) status=completed conclusion=cancelled startedAt=2026-08-03T11:38:13Z
superseded scaffold CI lane visibility status=completed conclusion=success startedAt=2026-08-03T11:38:22Z
superseded classify changes status=completed conclusion=cancelled startedAt=2026-08-03T11:38:12Z
current-pass Minimax M3 docs accuracy status=completed conclusion=skipped startedAt=2026-08-03T11:37:54Z
current-pass core CI lane visibility status=completed conclusion=success startedAt=2026-08-03T11:36:10Z
superseded scaffold CI lane visibility status=completed conclusion=success startedAt=2026-08-03T11:34:23Z
superseded scaffold-static (deno-only) status=completed conclusion=success startedAt=2026-08-03T11:28:35Z
superseded scaffold-runtime (aspire + docker + postgres) status=completed conclusion=success startedAt=2026-08-03T11:28:42Z
superseded desktop-native-linux (deb + signed updater) status=completed conclusion=success startedAt=2026-08-03T11:28:35Z
current-pass code-quality-repo status=completed conclusion=skipped startedAt=2026-08-03T11:28:13Z
current-pass close-gate status=completed conclusion=success startedAt=2026-08-03T11:28:15Z
current-pass quality status=completed conclusion=success startedAt=2026-08-03T11:28:17Z
current-pass check-test status=completed conclusion=success startedAt=2026-08-03T11:28:16Z
current-pass deps-report status=completed conclusion=success startedAt=2026-08-03T11:28:22Z
superseded classify changes status=completed conclusion=success startedAt=2026-08-03T11:28:22Z
current-pass code-quality status=completed conclusion=success startedAt=2026-08-03T11:28:15Z
superseded agent status=completed conclusion=skipped startedAt=2026-08-03T11:28:11Z
pr-checks PASS rickylabs/netscript#1094 headSha=f186033908d8653615f176cd6578906e9e7162b8 evaluatedAt=2026-08-03T19:26:19.625Z checks=31 currentFailures=0
```

The documented superseded cancelled and failed runs are labeled `superseded`; the post-merge
latest reruns are labeled `stale-post-merge`; neither contributes to `currentFailures`.

## Supervisor review fix — pending checks

The supervisor identified that a latest run with `status !== 'completed'` fell through to
`current-pass`. The classifier now emits the distinct named `pending` classification for that
state. A pure negative-case fixture proves an `in_progress` latest run is `pending`, never
`current-pass`, while the report remains clean with `currentFailures=0`.

All requested gates were rerun after the fix on 2026-08-03:

| Gate | Exit | Evidence |
| --- | ---: | --- |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic/github --ext ts` | 0 | 9 files, 1 batch, 0 failed batches, 0 occurrences |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic/github --ext ts` | 0 | 9 files, 1 batch, 0 occurrences |
| `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic/github --ext ts` | 0 | 9 files, 1 batch, 0 failed batches, 0 findings |
| `deno test --allow-read .llm/tools/agentic/github/pr-checks_test.ts` | 0 | 6 passed, 0 failed |

## Reconcile

- Issue #1170 remains open for supervisor review and eventual PR linkage; this implementation lane
  performed no GitHub mutation, push, or PR action.
- No implementation drift or architecture debt was identified.

## S2 sign-off (Tier-A review)

- 2026-08-03 · Substantive review of `692856e4d`: pure classifier + thin gh adapter separation as
  contracted; latest-per-name by started_at with id tiebreak; provenance (headSha, evaluatedAt) in
  report and exit gate keyed solely on current-fail. Review finding (in-progress runs classified
  current-pass) raised, fixed on the same thread as `pending` with negative test; supervisor
  re-ran tests independently: 6 passed / 0 failed. Live read-only demo against merged PR #1094:
  31 checks, superseded/stale-post-merge labeled, currentFailures=0, exit 0.
