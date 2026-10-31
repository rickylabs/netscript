# Direct-dispatch compatibility correction

## SKILL

Use netscript-harness, netscript-doctrine, netscript-tools and netscript-pr. Read-only, blockers only, no profiles/ files.

S2 command-postgres CI found a concrete PR regression before the known baseline failure: packages/plugin-sagas-core/tests/fixtures/transition-store/saga-relay-cohort.ts.template directly builds WorkerDispatchContext and omits the newly required deadLetters field. Review the focused correction in worker-options.ts, job-dispatcher.ts, job-dead-letters.ts, worker.ts and job-retry_test.ts. The dispatcher extension is now optional, but omitted storage composes the same lazy KV default and namespace; it never skips persistence. Worker itself still always owns a nonoptional port. One composition factory is reused, avoiding duplicated namespace logic.

The new regression creates the prior context shape without the field, initializes an isolated shared real KV, dispatches a failed zero-retry job and asserts the canonical default contains one record. Existing real adapter retry/DLQ tests still run. Dropping the fallback is a negative control. Current uncommitted docs were already reviewed PASS; this correction leaves those semantics intact. Please review only the compatibility correction for blockers. End VERDICT: PASS or VERDICT: CHANGES.
