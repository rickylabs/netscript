# Tier-A review 2 — F8 implemented (PR #1664)

- Reviewer: features topic supervisor (Tier-A), reviewer/orchestrator only
- **Content head (attested by every gate): `4f50b5a026120b5a3b0195fa1b6f495f08e2b46c`**
- **Final head (adds supervisor evidence only): `388f2b642a0d6e0ece4e346ea60f857928409beb`**
- Author: Codex `gpt-5.6-sol · high`, thread `01a004f9-f033-7592-a0bc-63927753fb43`
- Plan authority: F8 amendment, PLAN-EVAL `PASS` (Minimax M3), Tier-A ACCEPT at `20337441788`

## Slice history

| Commit | Author | Outcome |
| --- | --- | --- |
| `3299992e4` `fix(cli): prove CDP waits fail with context` | Codex | **CHANGES_REQUESTED** — non-gated scoped lint/fmt regression |
| `4f50b5a02` `fix(cli): restore scoped CDP probe cleanliness` | Codex | **ACCEPTED** |
| `388f2b642` `harness(cli): record F8 supervisor gate evidence` | **this supervisor** | evidence only, no product bytes |

## Path ceiling — held on both commits

`3299992e4`: probe source, probe test, leaf worklog. `4f50b5a02`: probe source, leaf worklog. A
filter for anything outside the two authorized product/test paths plus the append-only harness
worklog returns **nothing** on either. No third path, no `deno.json`, no lockfile, no `docs/**`, no
template, no barrel, no quarantine mutation.

## Contract conformance — read against the source, not the commit message

`CdpClient` gained a structural `CdpSocket` seam (not a `WebSocket` class dependency), an injectable
`createSocket`, and per-call `timeoutMs`. Production defaults are unchanged: `new WebSocket(url)` and
`TIMEOUT_MS = 20_000`. All seven production `send` call sites — `Page.enable`, `Runtime.enable`,
`Network.enable`, `Fetch.enable`, `Page.navigate`, `Fetch.continueResponse`, `Runtime.evaluate` —
take the default.

| Contract requirement | Verified |
| --- | --- |
| Connection expiry names `CDP WebSocket connection`, the URL, the bound | yes — and the test asserts it excludes `CDP response`/`Page.enable` |
| Command expiry names `CDP response`, the method, the bound | yes — and the test asserts it excludes the connection wording and the URL |
| Timers cancelled on normal settlement | `settle` clears on both open and error; `resolve`/`reject` wrappers clear; `#receive` clears `pending.timeoutId` |
| Send timeout deletes its id **before** rejecting | `if (!this.#pending.delete(id)) return;` — the guard also makes a double-settle impossible |
| Late response cannot resolve or resurrect stale work | `#receive` returns early on an unknown id; test emits a late matching response and asserts pending stays 0 and the handler never ran |
| Connection timeout detaches handlers and closes via the seam | sets `onopen`/`onerror` to `null`, then `socket.close()`; test asserts `closeCount === 1` and both handlers `null` |
| A failing `close()` never becomes a success | wrapped in `try`/`catch` that still **rejects**, with the cause attached |
| Normal CDP error responses and socket errors unchanged | error response still rejects with the server message; `onerror` still rejects `failed to connect to <url>` and does **not** close (test asserts `closeCount === 0`) |
| No stage logging, retry, reconnect, or new transport module | none added |

## Proof quality

`CDP_TEST_TIMEOUT_MS = 25` against `CDP_TEST_WATCHDOG_MS = 1_000` — a 40× margin. If either
production bound were deleted, the watchdog rejects in one second and the test fails fast rather than
hanging the suite. That is the property the amendment asked for, and it is real.

The fake-socket ordering is deterministic, not lucky: `connectFakeCdpClient` queues `emitOpen` as a
microtask *before* calling `connect`, and the `new Promise` executor assigns `socket.onopen`
synchronously, so the handler is always installed before the microtask drains. `withTestWatchdog`
clears its timer in `finally` on every path, so no timer leaks — corroborated by the file passing
under Deno's default resource/op sanitizers.

Three new tests cover all four required proofs (diagnostic distinction is asserted inside the
connection and send tests rather than as a separate case, which is the stronger placement). F6 and F7
proofs are untouched and green.

## The finding I returned, and why

At `3299992e4` the four contracted gates were **all `PASS`** and the named receipt set recomputed
`SUFFICIENT` — and the slice had still regressed quality. Under
`run-deno-lint.ts --root packages/cli/e2e` the probe carried a `prefer-const` occurrence at `:101`,
and `run-deno-fmt.ts` reported one finding at `const timeoutMessage =`. Both commands were **clean at
`20337441788`**, so the slice introduced them.

`f8-lint.json` and `f8-fmt-check.json` also record `PASS` at that head, which looks like a
contradiction and is not: `deno task lint` and `deno task fmt:check` both exclude
`^(packages/(cli)|…)`, so all of `packages/cli` is outside the repo quality gates. **CI could not
have caught this, and neither could the contracted four.** Green gates plus `SUFFICIENT` did not mean
clean code — which is precisely the hole the harness warns about, reproduced here in miniature.

I returned it rather than fixing it myself: the author owns this worktree's commits, and a supervisor
writing product bytes into an author-signed slice is the defect that cost this leaf a full cycle on
2026-08-15. The fix cost was near zero and attempt 7 is expensive; spending a runtime lease on a head
worth amending would have been the wrong trade.

The correction at `4f50b5a02` is 8 insertions / 10 deletions in the source file only, reordering
`const timeoutId = setTimeout(...)` ahead of `const settle = …` and unwrapping the message line. I
re-read it against every contract row above: semantics are identical and both diagnostic strings are
byte-for-byte unchanged.

## Evidence at the content head `4f50b5a02`

| Gate | Outcome |
| --- | --- |
| focused probe test file | **25 passed / 0 failed**, 545 ms |
| `check` | `PASS` |
| `test` | `PASS` (4,240 passed, 0 failed, 19 ignored) |
| `publish-dry-run` | `PASS` |
| `arch-check` | `PASS` |
| `lint` | `PASS` |
| `fmt-check` | `PASS` |
| scoped lint / fmt on `packages/cli/e2e` | 0 occurrences / 0 findings |

Sufficiency recomputed over the **explicitly named** four-receipt attempt-2 set — not a glob:
`SUFFICIENT`, zero reasons, `immutableHead 4f50b5a02…`, every receipt satisfying
`gitHead == actualGitHead ==` that head. No `any`, no `deno-lint-ignore`, and no `as unknown as` was
introduced anywhere in the diff.

The attempt-1 receipts are retained append-only as the superseded record.

## Carried observations — neither blocks

- **R1 (from review 1, still open).** `terminateBrowserProcess` `:448-449` (`await child.status`,
  `await drain`) has no timer. Out of F8 scope, F6-owned, and only reachable now that `connect`/`send`
  are bounded. For a later leaf.
- **R3 (new).** Bounding `Runtime.evaluate` at 20 s narrows one theoretical case: a single
  slow-but-successful evaluate exceeding 20 s used to complete, because `waitUntil` only checks its
  clock between iterations. In practice these expressions are DOM reads and a button click that
  settle in milliseconds, and converting unbounded hangs into diagnosable failures is the entire
  point of F8. Recorded for completeness, not as a defect.
- **R4 (minor surface note).** `pendingCommandCountForTest` is a test-only accessor on a production
  class. It is minimal, explicitly named, and necessary to prove the "map does not grow" requirement.
  Contained: `packages/cli` excludes `e2e/` from publish, `@netscript/cli-e2e` is `"publish": false`,
  and `e2e/mod.ts` does not re-export the probe.

## Resource state

No `scaffold.runtime`, browser, Aspire apphost, Docker container, or lease at any point. `docker ps
-a` empty; no `apphost`/`chrome`/`chromium` process. The temporary baseline worktree used to prove
the lint/fmt regression was created read-only at `20337441788`, removed, and pruned. All four
quarantines, the six S5 attempt histories, `f6-test.json`, and `f7-test.json` are untouched.

## Verdict

**ACCEPT.** Content head `4f50b5a026120b5a3b0195fa1b6f495f08e2b46c` is green on every contracted
gate plus lint/fmt, with a sufficiency recomputation over a named set.

**Attempt 7 is NOT granted** — it is prohibited for this leaf and is not this supervisor's to grant.
No merge, publish, readiness flip, relabel, or issue mutation was performed. The reviewed green head
is reported to the coordinator, who alone may lease a runtime attempt.
