# PLAN-EVAL round 1

I'm returning **PLAN-EVAL: FAIL_PLAN** with two blockers, both fixable by editing the plan. This was PLAN-EVAL round 1 of 2 (feature tier), read-only, against baseline `7907293`; I edited nothing.

**What holds up**
- **Research is current.** I checked the main findings against the code:
  - The adapter builds events with a counter id and no idempotency key, and already receives size and modification time.
  - `resolveDedupTtl` always falls back to the 24-hour default.
  - The KV store's `markCompleted` already deletes both keys when the TTL is 0.
  - `resolveKey` puts a caller-supplied key first, which keeps the #2165 precedence.
  - The upstream watcher's field names (`fileInfo.size`, `fileInfo.modifiedAt`) match what the adapter reads.
  - The plugin runtime sends file-watch events through this exact adapter, processor and KV store, so the fix is in the right place.
- **Explicit TTL overrides stay compatible.** A kind-based default that applies only when `ttlMs` is unset leaves both explicit `0` and explicit positive values in force. Definition-key precedence and request headers are untouched.
- **The rest of the gate is met:** locked decisions, open-decision sweep, deferred scope, risk register, gate selection, JSR audit and slice sizing. The run artifacts contain no hostnames, ports, operator paths or session ids.

**Blocker 1: the locked key format can be too long for Deno KV, so some events are silently dropped.**
Plan decision 2 and worklog Design item 4 make the key a "prefixed JSON tuple" that includes the full file path. The current automatic key is a fixed-length SHA-256 hash. Deno KV rejects keys over 2048 bytes, and Linux allows paths up to 4096 bytes.
- I reproduced it locally: an active-claim key built from a valid path of about 2,000 characters gives `TypeError: Key too large for write (max 2048 bytes)`.
- The error is thrown while claiming the key. The adapter passes it to `onError` and the handler never runs, so that file change is lost for good.
- The same raw key also becomes the worker job's `deduplicationId` and appears in the deduplication log line.
- **Fix:** keep the JSON tuple of triggerId/path/kind/mtime/size, but use a namespace prefix plus the SHA-256 of that tuple as the key. All five fields still count, the length is fixed, and #2165 precedence is unchanged. Add a test that runs a path over 2 KiB through the real adapter and the disk-backed KV, and record the decision in plan.md and the worklog Design section.

**Blocker 2: the negative-control plan can't work as written, and it doesn't show which tests prove which acceptance items.**
Plan decision 6 requires every new test to fail when the two production files are reverted. On the current code, several planned tests already pass:
- **Changes with complete metadata:** the current hash covers the payload, which includes size and modification time, so two changes seconds apart already get different keys.
- **Concurrent true duplicate is blocked:** the old code blocks it too.
- **Behaviour the change must keep:** the #2165 precedence, the 24-hour default for other trigger kinds, and explicit `ttlMs`.

The plan also doesn't say what metadata the restart and after-completion tests use. With complete, differing metadata they pass on the old code as well, so they prove nothing.

**Fix:** add a table in plan.md (S1) mapping each acceptance item to its test and to the expected result when production is reverted:
- **Tests that must fail on the reverted code:**
  - Two changes with missing or partial metadata and otherwise identical payloads; both must be handled.
  - The same true duplicate (same metadata) submitted again after completion must be handled. This is the only test that proves the zero default TTL.
  - The persisted-KV restart, run with one of the two cases above.
  - An assertion on the key format and on each of the five fields.
- **Tests that must pass on both versions:** concurrent duplicate blocked while in flight, #2165 precedence, other kinds' defaults, explicit `ttlMs`.
- **Revert one change at a time,** not both together:
  - With only the adapter reverted, the missing-metadata tests must fail.
  - With only the TTL default reverted, the after-completion and restart same-duplicate tests must fail.

  This shows each production change is needed. Without it, the zero default TTL could slip through, because unique per-event keys alone make the missing-metadata tests pass.

PLAN-EVAL: FAIL_PLAN
