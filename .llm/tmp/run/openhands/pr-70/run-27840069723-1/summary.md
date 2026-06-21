# IMPL-EVAL — S3 streams (PR #70)

## Verdict: **PASS**

Adversarial independent evaluation of `fix/cap-caveat-s3-streams` (capability-caveats slice S3).
Branch commits: `03b77f2d` (fix) + `00532221` (harness evidence). Merge-base with `origin/main`: `159db1fe`.

## Summary

S3 correctly chose the **reject-path (option b)** authorized by the brief's STOP-rescope guard and
pre-approved by the maintainer. Rather than silently no-op'ing or half-building a transport, the
diff replaces `publish` (previously `async () => {}`) with `Promise.reject(unsupportedOperation('stream.publish'))`,
and `subscribe` (previously returning a no-op unsubscribe) with a synchronous `throw unsupportedOperation('stream.subscribe')`.
Regression tests use `assertRejects` / `assertThrows` against the newly-introduced
`StreamUnsupportedOperationError`, so they would **fail** on any silent-success regression. A
durable-transport + consumer-SDK debt entry was added to `arch-debt.md`.

## Changes (three-dot diff — 10 files, all in-scope)

| File | Role |
| --- | --- |
| `plugins/streams/src/public/stream-api.ts` | Error class + rejection semantics |
| `plugins/streams/src/public/mod.ts` | Re-exports error + helper |
| `plugins/streams/mod.ts` | Public barrel re-export |
| `plugins/streams/tests/public/stream-api_test.ts` | 2 focused regression tests |
| `.llm/harness/debt/arch-debt.md` | Debt entry (lines 354-370) |
| `.llm/tmp/run/cap-s3-streams/{brief,worklog,drift,commits,context-pack}.md` | Run artifacts |

Two-dot diff vs `origin/main` shows unrelated churn in CLI / workers-core / deno.lock / removed run
artifacts — these are **not branch changes** but post-branch `main` advances (PRs #66, #68 merged
after the branch fork point). Branch itself contributes zero unrelated changes.

## Validation

| Check | Command | Result |
| --- | --- | --- |
| Focused regression tests | `deno test --allow-all plugins/streams/tests/public/stream-api_test.ts` | 2/2 pass |
| Streams plugin tests | `deno test --allow-all plugins/streams` | 7/7 pass |
| Lock hygiene | `git diff origin/main...HEAD -- deno.lock` | empty ✓ |

## Findings (adversarial)

1. **Contract evidence independently verified** — `StreamProducerPort` (`stream-producer-port.ts:4-16`)
   exposes only `upsert` / `delete` / `flush` / `close`. `DurableStreamProducer` wraps `@durable-streams/client`
   `IdempotentProducer` for State Protocol entity events. **There is no subscribe / topic-consumer /
   generic pub-sub API** anywhere in `plugin-streams-core`. The claim "real one-shot/durable
   delivery could not be wired within this slice" is factually correct.

2. **Test quality** — Both tests would **fail on a silent-success regression**:
   - `assertRejects(() => producer.publish({id:'evt-1'}), StreamUnsupportedOperationError)` + asserts `error.operation === 'stream.publish'`
   - `assertThrows(() => consumer.subscribe(...), StreamUnsupportedOperationError)` + asserts `error.operation === 'stream.subscribe'`
   - No mocks; directly exercise the real `defineStreamProducer` / `defineStreamConsumer` handles.

3. **Debt entry accurate** — `arch-debt.md:354-370` ("durable topic publish/subscribe transport deferred"):
   correctly identifies the existing transport, the missing consumer channel, the rescope scope
   (new cross-package runtime contract + consumer SDK), and the closure gate (real transport with
   producer delivery + consumer subscribe/unsubscribe semantics + tests proving delivery).

4. **Lock hygiene** — Three-dot diff `deno.lock` is empty. The worklog notes the Codex session had
   to restore Deno resolution churn during impl — this is documented, not hidden.

5. **Reject-path approved + appropriate** — Maintainer pre-approval matches the existing S2 reject
   precedent; the STOP-rescope guard explicitly authorized option (b); the diff is minimal and
   honest instead of half-building a durable transport that doesn't fit an M-sized slice.

## Remaining risks

- **Stale branch** — merge-base is 2 PRs behind `origin/main` (#66 CLI guidance, #68 OTel spans).
  Trivial rebase risk since the branch only touches `plugins/streams/*` and the debt file, none of
  which were modified by those two PRs, but the CI merge-check will need the branch updated before
  merge.
- **Future durable-stream work** — The debt entry correctly gates closure on both producer delivery
  and a consumer SDK with tests. Next slice touching streams must resolve the cross-package runtime
  contract before turning rejection back into delivery.
- **Minor**: `unsupportedStreamOperation` helper is unused outside the two call-sites in this file.
  Acceptable — exported helper with 2 internal callers + 0 tests is fine, and the worklog already
  notes "operation ids stay local string literals because there are two call sites and no registry yet."
