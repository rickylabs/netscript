# Slice Review: StreamDB Recovery Closeout (PR #2083)

- **Verdict:** PASS
- **Reviewer:** Independent Google fallback (Gemini 3.8 Flash High)
- **Git HEAD:** `17dbd8ba2ed675bca0f22bb54aa9c39ecc114a79` (`fix/stream-db-recovery-2079`)
- **Review Scope:** Uncommitted working tree diff across four files under `packages/fresh/src/runtime/streams/`, five regression tests, four mutation receipts, and supporting run evidence under `.llm/runs/fix-stream-db-recovery-2079--review-closeout/`.
- **Mode:** Pre-signoff independent slice review (no source modifications, no commits, no pushes). Final IMPL-EVAL follows sign-off commits.

---

## 1. Context & Scope

PR #2083 addresses four review claims concerning `@netscript/fresh` durable stream recovery. Analysis verified the claims against pinned `@durable-streams/client@0.2.6` and `@durable-streams/state@0.3.1` implementations in the dependency cache:

1. **S1 (Listener retention):** Pinned client 0.2.6 registers a `{ once: true }` listener on `options.signal` during `native.stream()` (`stream-api.ts:155-159`), but `session.cancel()` only aborts its internal child controller without unregistering the parent listener. Multi-batch or reconnect loops without parent abort retain one listener per attempt.
2. **S2 (Large catch-up batch):** Pinned client 0.2.6 accumulates array items in `session.json()` via `items.push(...parsed)` (`response.ts:945`). Large catch-up batches (e.g. 200,000 items) blow V8 argument stack limits (`RangeError: Maximum call stack size exceeded`).
3. **S3 (Pending preload settlement):** Pinned state 0.3.1 `preload()` awaits `startConsumer()` before registering its waiter in `dispatcher.waitForUpToDate()` (`stream-db.ts:735-737`). `db.close()` rejects existing waiters via `dispatcher.rejectAll()`, but when called while `stream.stream()` is pending headers/handshake, no waiter exists yet, stranding the caller promise until eventual upstream completion.
4. **S4 (Terminal state guard):** `createStreamDBRecoveryAdapter.read()` previously assigned `state = { status: 'connecting', ... }` before checking whether `signal` was already aborted, corrupting the terminal `'stopped'` status when reads were invoked after `recovery.stop()`.

The uncommitted diff modifies:
- `packages/fresh/src/runtime/streams/create-stream-db.ts`
- `packages/fresh/src/runtime/streams/create-stream-db_test.ts`
- `packages/fresh/src/runtime/streams/stream-db-recovery-adapter.ts`
- `packages/fresh/src/runtime/streams/stream-db-recovery-adapter_test.ts`

---

## 2. Per-Slice Substantive Findings

### S1: Bounded Attempt Listener & Controller Lifetime (PASS)

- **Mechanics:** In `stream-db-recovery-adapter.ts`, each `connect()` cycle instantiates a dedicated `attempt = new AbortController()`. An abort forwarding handler (`abort = () => attempt.abort(signal.reason)`) is attached to `signal` with `{ once: true }`. A dedicated `release()` closure removes this handler via `signal.removeEventListener('abort', abort)` and invokes `attempt.abort()`. `release()` is called in the `connect()` error `catch`, in `consume()`'s `finally` block before subsequent connects, and on adapter `stop()`.
- **Pinned Client Verification:** Because client 0.2.6 attaches its listener to `attempt.signal`, aborting `attempt` or replacing it releases resources cleanly. By decoupling the caller's long-lived `signal` from `native.stream()`, `signal` never accumulates listeners across batches, timeouts, or reconnects.
- **Test Evidence:**
  - `stream-db-recovery-adapter_test.ts`: `StreamDB recovery keeps listener and controller counts flat across batches and timeouts` executed across 256 batches (including HTTP 204 timeout responses and transient network errors).
  - Asserts `peakListeners <= 1` and `peakControllers <= 1` throughout.
  - End-state assertions confirm `0` active listeners on `signal` and `0` un-aborted child signals.
- **Mutation Receipt:** `.llm/runs/fix-stream-db-recovery-2079--review-closeout/mutation-listener.json` confirms reverting the attempt isolation causes `AssertionError: Retained abort listeners grew to 2` (exit 1).

### S2: Stream Text Consumption & Large Catch-up Payloads (PASS)

- **Mechanics:** In `stream-db-recovery-adapter.ts:163-164`, `session.json<T>()` was replaced with:
  ```ts
  const parsed = JSON.parse((await session.text()).trim() || '[]');
  const items: T[] = Array.isArray(parsed) ? parsed : [parsed];
  ```
  This eliminates `items.push(...parsed)` argument spreading across call stack boundaries while retaining finite response framing via `session.text()`.
- **Classification of Failures & Malformed Data:**
  - *Malformed JSON:* In client 0.2.6, `session.json()` wrapped syntax errors in `DurableStreamError('PARSE_ERROR')` with `status: undefined`. Under `isRecoverableReadError()`, errors with undefined HTTP status are non-recoverable. With `session.text()` + `JSON.parse()`, invalid JSON throws `SyntaxError`. `SyntaxError` is not a `TypeError` and does not carry status 404/429/5xx, so `isRecoverableReadError()` correctly classifies it as unrecoverable, transitions status to `'failed'`, and propagates the error without futile retries.
  - *Transient Network Interruption:* A network drop while streaming chunks during `session.text()` rejects with `TypeError` (Fetch standard). `isRecoverableReadError()` matches `TypeError` and schedules exponential backoff retry.
  - *Empty/Whitespace Responses:* Handled safely by `.trim() || '[]'` evaluating to `[]` without throwing syntax errors.
- **Test Evidence:**
  - `stream-db-recovery-adapter_test.ts`: `StreamDB recovery consumes 200000 ordered catch-up events and resumes the checkpoint` verified 200,000 sequentially ordered objects without exceeding stack depth, and successfully resumed next fetch from `large-checkpoint`.
- **Mutation Receipt:** `.llm/runs/fix-stream-db-recovery-2079--review-closeout/mutation-large-json.json` confirms reverting to `session.json()` fails with `RangeError: Maximum call stack size exceeded` (exit 1).

### S3: Abort-Aware Preload Settling on Stop & Dispose (PASS)

- **Mechanics:** In `create-stream-db.ts`, `defaultCreateStreamDB` introduces an instance-level `lifetime = new AbortController()`. `stop()` aborts `lifetime` alongside `recovery.stop()` and `db.close()`. The returned `preload()` method enforces:
  ```ts
  async preload() {
    lifetime.signal.throwIfAborted();
    await abortable(db.preload(), lifetime.signal);
  }
  ```
- **Pinned State Verification:** Addresses the gap in `@durable-streams/state@0.3.1` where calling `db.close()` while `startConsumer()` awaits initial connection fails to reject callers of `preload()`. Wrapping with `abortable(..., lifetime.signal)` guarantees that an immediate `stop()` or `dispose()` rejects all in-flight `preload()` calls immediately with `DOMException` (`AbortError`).
- **Test Evidence:**
  - `create-stream-db_test.ts`: `createNetScriptStreamDB immediate stop and dispose settle pending preload on a healthy server` verifies both `stop()` and `dispose()` settle pending preload and subsequent preload attempts with `DOMException`.
  - `create-stream-db_test.ts`: `createNetScriptStreamDB stop settles concurrent preloads while response headers are pending` verifies multiple parallel preloads blocked on fetch headers reject promptly when stopped.
- **Mutation Receipt:** `.llm/runs/fix-stream-db-recovery-2079--review-closeout/mutation-preload.json` confirms reverting produces `AssertionError` (exit 1, 2 failed tests).

### S4: Stopped Terminal Status Preservation (PASS)

- **Mechanics:** In `stream-db-recovery-adapter.ts:78`, `signal.throwIfAborted()` is executed at the entry of `read()`, immediately before resetting `state = { status: 'connecting', ... }`.
- **Behavior Verification:** When `recovery.stop()` has placed the adapter in terminal `'stopped'` state, subsequent calls to `recovery.stream.stream()` immediately throw `DOMException` without mutating `state.status` to `'connecting'`.
- **Test Evidence:**
  - `stream-db-recovery-adapter_test.ts`: `StreamDB recovery rejects reads after stop without changing terminal status` asserts rejection with `DOMException`, status remaining `'stopped'`, and zero HTTP requests dispatched.
- **Mutation Receipt:** `.llm/runs/fix-stream-db-recovery-2079--review-closeout/mutation-stopped-status.json` confirms reverting changes status to `'connecting'` instead of `'stopped'` (exit 1).

---

## 3. Independent Verification & Gate Evidence

| Gate | Command | Result | Evidence |
| --- | --- | --- | --- |
| **Focused Streams Tests** | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/fresh/src/runtime/streams/stream-db-recovery-adapter_test.ts packages/fresh/src/runtime/streams/create-stream-db_test.ts` | **PASS (0)** | 13/13 tests passed, duration 916 ms. No async leaks or dangling timers. |
| **Streams Directory Tests** | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/fresh/src/runtime/streams/` | **PASS (0)** | 14/14 tests passed, duration 2,106 ms. |
| **Full Fresh Test Suite** | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/fresh/` | **PASS (0)** | 295/295 tests passed, 0 failed, 0 ignored, duration 10,560 ms. |
| **Quality Scan** | `deno task quality:scan` | **PASS (0)** | Zero unexpected findings, allow count within ceiling (7/7). |
| **Architecture Fitness** | `deno task arch:check` | **PASS (0)** | Zero doctrine errors across all packages and plugins. |
| **Consumer Types Check** | `deno task check:streams-types` | **PASS (0)** | Stream consumer type check clean. |
| **JSR Publish Dry-Run** | `deno task --cwd packages/fresh publish:dry-run` | **PASS (0)** | JSR packaging dry run succeeded without export errors. |
| **Doc Lint Comparison** | `deno task doc:lint --root packages/fresh --pretty` | **BASELINE PARITY** | Exactly 43 diagnostics (26 privateTypeRef, 17 missingJSDoc), 10 in streams entrypoint, identical to post-main baseline `17dbd8ba`. Zero added diagnostics. |
| **Root Check** | Inspected from `.llm/runs/fix-stream-db-recovery-2079--review-closeout/gates.log` | **PASS (0)** | 3,188 files, 27 batches, zero failures. |

---

## 4. Evaluator Disposition & Recommendation

- **PLAN-EVAL Status:** Justified `N/A`. Repairs preserve the existing public `NetScriptStreamDB` contract and internal adapter seams without introducing new architecture, public surface, or dependencies.
- **Hygiene & Safety:** No unhandled rejections, leaked controllers, or unbounded event listener accumulation. Lockfile remains unchanged.
- **Disposition:** The uncommitted slice repairs for S1 through S4 are verified and ready for sign-off commits. Following commit creation, exact-HEAD IMPL-EVAL can proceed in this session.
