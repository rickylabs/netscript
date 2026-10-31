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

The zero-retry single-attempt property already holds on baseline and is retained as a boundary guard. Slice 2 adds DLQ assertions so a failing zero-retry job also proves durable terminal handling. A baseline revert cannot truthfully make the original single-attempt property itself fail.

An initial shutdown negative-control attempt exposed a test cleanup issue: KvPollingAdapter.stop aborts its owned signal, but a caller-supplied listen signal remains caller-owned. Tests now always abort that signal in finally, including assertion-failure paths. The retry negative controls above completed after this correction.
