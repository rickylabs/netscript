# IMPL-EVAL — #1405 / PR #1528 (verbatim verdict)

| Field | Value |
| --- | --- |
| Phase | IMPL-EVAL |
| Subject | commit `c491c6989`, PR #1528, closes #1405 |
| Evaluator | DeepSeek V4 Flash 0731 · max, `claude-evaluator-deepseek-v4-flash-0731` preset |
| Session | fresh, separate from generator and supervisor; worktree `/home/codex/repos/ns006-1405-impleval` @ `c491c6989` |
| Route reason | small-impl evaluator lane; local fallback per `drift.md` D-2 (#1524 still open) |
| Duration | 642,836 ms · 5,226 stream events · `is_error: False` |
| Raw stream | `impl-eval-1405-raw.md` |

Verbatim below; nothing edited.

---

**[PHASE: IMPL-EVAL] [VERDICT: PASS]**

Issue #1405's two reason misdescriptions are fixed correctly, behaviour (accepted/rejected/delivered + their `status` classification) is fully preserved, and all four added tests independently guard their own fix.

### Verified
- **Package tests 33/33 green** — `deno task --cwd packages/plugin-streams-core test` → `ok | 33 passed | 0 failed` (includes all 4 new tests).
- **Scoped check** — `run-deno-check.ts --root packages/plugin-streams-core --ext ts,tsx` → 43 files, 1 batch, 0 failures.
- **`deno task quality:gate`** exits 0 — but its configured scan/doctrine roots **omit** `packages/plugin-streams-core` (deno.json:156 `arch:check` root list). I ran the compensating target gates independently: target quality scan → `findings=[]`, `allowCount=0`; target doctrine audit → `FAIL=0 WARN=1 INFO=1` (supervisor 515 lines vs 500 cap — advisory, pre-existing baseline 497, recorded in drift).
- **Revert-A isolation** — reverting only the `#closing`/`#writeRejectionReason` change makes only "close drain rejects a concurrent write as producer-stopping" (test 1) fail; tests 2,3,4 pass.
- **Revert-B isolation** — reverting only the `#failActive` reason selection (+ connect-guard split) makes only "first append refusal …" (test 2) and "non-retryable reconnect failure …" (test 4) fail; test 1 and the retry-exhaustion guard (test 3) pass.
- **Tree restored** — `git status` porcelain empty after reverts; no diff remaining.
- **Behaviour preservation** — the only functional deltas in the diff are reason strings (`#failActive` ternary, `#writeRejectionReason` arms) plus a behavior-neutral connect-guard refactor (supervisor.ts:308-315 — old `!isRetryable || attempt===max` split into two identical conditional pairs, same calls/returns).

### Findings
1. **C2 (advisory) Dead `?? 'producer-failed'` fallback** — `create-durable-stream.ts:132,160`. `writeRejectionReason()` returns `undefined` only when `#accepted === true` (supervisor.ts:483-484); both calls are behind `if (this.closed)` where `closed === !#accepted`. `#accepted` is only ever set `false` (stop/close/fail) and never back to `true`, so the `??` can never fire — not even via a TOCTOU (it cannot flip false→true). Harmless, unreachable defensive code; not blocking. Suggested cleanup: drop the `?? 'producer-failed'` and rely on the switch's `default` returning `producer-failed` when not closing.
2. **C4 (advisory) Reason-vocabulary doc** — the new `transport-refused` is documented only via JSDoc on the union member (producer-contract-v1.ts:86-87). `README.md` describes outcome `status`es generically (README.md:93) and mentions no reason list, so no consumer doc is stale. Additive union member, check passes 43/43, no exhaustive switch exists on `StreamWriteUnknownReasonV1` anywhere in the repo (grep-confirmed; only producer + tests reference it). No blocking doc gap.
3. **C4 (advisory, recorded)** — `quality:gate`/`arch:check` do not cover this package; gate-coverage gap already logged in `drift.md`. The `research-1405.md` cited in the brief is absent from the run dir (only `worklog.md`/`drift.md` exist); the worklog carries the equivalent analysis. Both are run-artifact issues external to the committed change, not code defects.

### Acceptance box check (#1405)
- Box 1 (close-drain reason names closing state, ≠ `producer-failed`): **satisfied** — `#closing` set in `close()` (supervisor.ts:222), default arm returns `producer-stopping` for non-terminal states during drain (supervisor.ts:494); test asserts `producer-stopping` and `assertNotEquals producer-failed`.
- Box 2 (non-retryable append on attempt 1 names refusal, ≠ `retry-exhausted`): **satisfied** — `#failActive` returns `transport-refused` for `!isRetryable(failure)` (supervisor.ts:430-434); test asserts `transport-refused`, `assertNotEquals retry-exhausted`, `appendCalls === 1`.
- Box 3 (genuine exhaustion keeps its own reason): **satisfied** — retryable-at-bound still yields `retry-exhausted` (isRetryable true ⇒ not `transport-refused`); test 3 asserts it and `assertNotEquals transport-refused`.
- Box 4 (tests assert each reason for its own state): **satisfied** — one-at-a-time reverts (above) prove test 1 breaks only under fix-A revert and tests 2/4 only under fix-B revert, i.e. they do not collapse on one mechanism.
- Box 5 (no change to accepted/rejected/delivered, reasons only): **satisfied** — all deltas are `status`-preserving reason strings; no admission gate, settlement `status`, or retry count changed.

### Next
- Merge is clear. Optionally (non-blocking): remove the unreachable `?? 'producer-failed'` fallback and record the supervisor 515-line split as debt if reopening it is ever scoped. Owner: R. Chautems / slice owner on #1405 for the fallback cleanup; no blocking action required for merge.

Sources for the behavioural claims above: `durable-stream-producer-supervisor.ts` (lines 64-65, 221-222, 308-315, 356-363, 423-438, 482-496), `durable-stream-producer-support.ts:90-92` (`isRetryable` = retryable|stale-epoch), `create-durable-stream.ts:131-133,159-161`, `producer-contract-v1.ts:83-89`.
