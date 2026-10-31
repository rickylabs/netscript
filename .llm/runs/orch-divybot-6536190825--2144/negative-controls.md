# Negative controls

Temporarily restore production files from baseline `7907293f3dad3aeb557923809ddcd3435adae151`, execute regressions with the structured test wrapper, then restore fixed files in a finally block. No baseline restoration is committed.

| Control | Expected failure observed |
| --- | --- |
| Baseline job-execution.ts; job-retry_test filter `fails twice` | exit 1; all six local KV adapter/backoff cases fail with actual one attempt, expected three; three Redis cases unavailable |
| Baseline job-execution.ts; filter `shutdown during backoff` | exit 1; replay test fails because baseline never enters retry wait |
| Both baseline registry generators; filter `both registry generators honor` | exit 1; configured handler expected maxRetries 2, baseline emits 3 |
| Remove only production Worker listener rethrow; filter `Worker KV listener` | exit 1; pending messages actual 0, expected 1: the shutdown job was acknowledged and lost |
| Remove only polyglot timeout guard; filter `polyglot timeout` | exit 1; handler attempts actual 3, expected 1 |
| Zero-retry off-by-one mutant skips initial attempt; filter `maxRetries zero` | exit 1; both real KV adapter cases observe 0 calls instead of 1; Redis unavailable |
| Restore S1 dispatcher with no job DLQ; filter `maxRetries zero` | exit 1; both real KV adapters execute once but store zero terminal records instead of one |
| Remove await on terminal job persistence; filter `KV job DLQ persists` | exit 1; both zero/two-retry cases observe the queue callback return before durable write completes |
| Remove DLQ-outage propagation flag; filter `DLQ write outage` | exit 1; the real Worker listener fails the required requeue/claim-release assertions |
| Drop async child snapshot; real HTTP health test | exit 1; durable dead-letter details are absent from the response |
| Remove the lazy KV fallback for a direct dispatcher context without deadLetters | exit 1; the compatibility regression fails instead of durably storing its terminal failure |

The zero-retry single-attempt property already holds on baseline and is retained as a boundary guard. Slice 2 adds DLQ assertions so a failing zero-retry job also proves durable terminal handling. A baseline revert cannot truthfully make the original single-attempt property itself fail.

An initial shutdown negative-control attempt exposed a test cleanup issue: KvPollingAdapter.stop aborts its owned signal, but a caller-supplied listen signal remains caller-owned. Tests now always abort that signal in finally, including assertion-failure paths. The retry negative controls above completed after this correction.
