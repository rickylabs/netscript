# Independent S1 implementation review

Requested/observed Claude Opus 5.5, high effort; same separate read-only reviewer, stdin closed. Final exact-head review will be posted to PR timeline to preserve the reviewed SHA.

The fix is correct, and I found no blockers in the source, tests or evidence. One limit: my session is read-only, so I did not re-run anything. The test, negative-control and gate results below are what `validation.md` and `validation-summary.json` report, and I checked them only for consistency with the code.

## Acceptance against the locked plan

| Requirement | Where | Finding |
|---|---|---|
| First batch without `initial` loads full state with one all-keys read | `denokv-bridge.ts:611-631` | `initialized` is set once, before the await. The full read runs only when no event in the batch has `initial`, uses `getMany(keys)` or per-key `get`, and loads both the state and the equality stamps. `changed = true` forces a first frame even when every key is absent or unchanged. |
| Loading happens before the existing reconciliation | `:633-679` | The batch then goes through the unchanged affected-key loop. A first event whose stamp matches what was just loaded is suppressed. Stale or `null` stamps get re-read as before, which is redundant but harmless (worklog records this). |
| No repeated all-keys reads | flag | The full read can only happen on the first batch, and test 1 pins the read log to `[keys, [a], [a]]`. |
| First-party snapshot costs no extra read | `:613`, test 3 | No batch read is made, and the per-key reads equal exactly the adapter's own snapshot reads. That is the precise count I asked for at plan review. |
| `getMany` stays optional | `:614-616`, test 2 (parameterised) | Covered both with and without `getMany`, and the interface is not widened. |
| Full frames keep untouched, deleted and missing keys | test 1 | Values and versionstamps are checked on the first frame, after a later change, and after a delete (`[null, stamp, null]`). |
| Errors | `:688-692`, test 4 (failure) | A failing full read (the test asserts it requested all keys) rejects the pending `reader.read()`. |
| Cancellation | `:617`, `:695-699`, test 4 (cancel) | Cancelling during the held read aborts the signal, runs the generator's `finally` via `iterator.return`, and the pending read resolves `done`. `validation.md` correctly says this test does not on its own prove the `ended` check, which is only verifiable by code inspection. The check is present at `:617`. |
| Honest JSDoc | `:572-577` | It says plain iterables may lack `ready` and ignore `initial`, that the fallback reads current storage rather than a confirmed snapshot point, that a silent source produces no frame, and that later batches read only affected keys. |
| Test discipline | test file | The Memory wrapper drops `initial` and returns a plain iterable without `ready`. Batch reads are counted through an explicit `getMany`, since Memory has none. Keys are inferred as strings with no casts. Waits are event-driven with bounded deadlines (`deadline` 5 s), with no sleeps. |
| Negative control | `validation.md:5` | With only the bridge reverted to main, the plain-iterable regression fails (0/1) because the untouched stored key is absent. With the fix restored, all 6 new tests pass. |
| Scope and process | supervisor/drift | The new test file is recorded as a scope refinement in `supervisor.md` and `drift.md`. The implementer-effort override I flagged at plan review is now recorded in `drift.md`. Existing suites are unchanged. There are no export, dependency or lock changes. Redis cases are reported as ignored, not passed. |

The evidence holds together: 80 passed, 0 failed, 11 Redis cases ignored (74 at baseline, so +6 from the new tests). The 58-file check, the two-file lint and fmt, the quality, dependency and architecture gate, doc-lint and the scoped JSR audit all exited 0. Skipping a local `scaffold.runtime` is justified because nothing in this change touches scaffold output or runtime wiring.

The code follows the locked plan, and the PLAN-EVAL notes 1–5, 7 and 8 were all addressed (note 6, the empty fallback read when no keys are watched, is harmless). This is my independent sign-off on the S1 slice. It is not merge authority, and the final review at the exact pushed head still has to happen.

VERDICT: PASS
