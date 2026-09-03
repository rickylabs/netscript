# PLAN-EVAL — feat-app-service-client-wiring--1355 (F8 bounded CDP waits)

- Plan evaluator session: fresh native Claude session, 2026-08-15
- Subject: F8 plan amendment on PR #1664 (`feat/app-service-client-wiring`, draft)
- Evaluated head: `4255a57b921e5efae0fb499a35803d150108e10a`
- Baseline: `2385cdb72602c149c29cc637870ddca3db09e0cd`
- Cycle: F8 PLAN-EVAL (cycle 3, plan-only, bounded CDP waits)
- Prior cycles binding: PLAN-EVAL cycles 1 & 2 (`f7225be98`) PASS; F6/F7 plan amendments binding.

## Attachment identity

| Field              | Value                                                                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session ID         | `aed7b4ad-54d3-4cfb-b496-43c717a9b39d`                                                                                                                           |
| cwd                | `/home/codex/repos/netscript-007-features-1355`                                                                                                                  |
| Requested route    | `formal_plan_evaluation` native-quota fallback — `minimax/minimax-m3 · high` per `lane-policy.md:65` (Codex author quota blocked until 2026-08-20, recorded `0c705a0cb`/`db2aa93b2`) |
| Observed route     | `minimax/minimax-m3` (system identity, MiniMax-M3; effort high; tool budget ample)                                                                              |

## Immutable identity check

- local `HEAD` = `4255a57b921e5efae0fb499a35803d150108e10a` (`feat/app-service-client-wiring`).
- `git status --short` empty. No refusal condition.
- Delta `2385cdb72..4255a57b9` touches **only** `.llm/runs/feat-app-service-client-wiring--1355/{context-pack.md, drift.md, plan.md, worklog.md, reports/f8-plan-amendment.md, leak-report.md}` — all run artifacts; **no** `packages/**`, no test, no template, no fixture, no lockfile mutation.
  - Commit `d8d5ee619 plan(cli): bound CDP waits for F8`: 6 files / +254 −10 lines, all run artifacts.
  - Commit `4255a57b9 fix(harness): restore F8 leak-report to author blob`: 2 files / +20 −2; restores `leak-report.md` byte-for-byte to its `2385cdb72` blob (author provenance correction, supervisor host audit had rewritten `Generated`/`Worktree` lines — `worklog.md` records the correction). Net diff vs baseline for `leak-report.md` is zero.
- Hash verification:
  - `s5-attempt6-scaffold-runtime-20260815-205715.log` SHA-256 = `1bf8cb03aaa3be0ba900254abdaf3065aa9f7c8cae5989bac37ed396a919aaa0` — **matches** `f8-plan-amendment.md:21`.
  - `s5-attempt6-scaffold-runtime-20260815-205715.ndjson` SHA-256 = `ffab7e7f0b7764c7d2e0eca5873fa9d5cfee7c5f278743a8886e7bbba53de356` — **matches** `f8-plan-amendment.md:23`.
  - `s5-attempt6-browser-selection-20260815-205715.json` reports `source = NETSCRIPT_E2E_BROWSER_EXECUTABLE`, `path = /home/codex/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`, `version = Google Chrome for Testing 151.0.7922.34` — **matches** `f8-plan-amendment.md:10-12` and `plan.md:931`.
- NDJSON evidence (`reports/s5-attempt6-scaffold-runtime-20260815-205715.ndjson:137`):
  `behavior.service-client-refetch` `code:143`, `durationMs:900030`, `stdoutTail:""`, `stderrTail:""` — **matches** the amendment's claim of empty stdout/stderr tails and the 900,030 ms exit.
- NDJSON inspection: zero markers for `cdp`, `websocket`, `connect`, `Page.`, `Network.`, `Fetch.`, `Runtime.`, `method`, or CDP command stage between the refetch gate's start and final outer kill. The amendment's "cannot distinguish" attribution is **honest**.

## § 1 Identifying the right unbounded waits (criterion 1)

Source: `packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts`.

All async waits inspected; result:

| Wait                                                    | Bounded?        | Evidence                                                                                                |
| ------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------- |
| `CdpClient.connect` (`:77-84`)                          | **NO**          | `new Promise<void>` with `onopen`/`onerror` settlement only. A socket that emits neither leaves it pending forever. **Real defect.** |
| `CdpClient.send` (`:90-94`)                             | **NO**          | Promise stored in `#pending` map; only `#receive` (`:116-136`) resolves on a matching id. A socket that accepts the send but never returns that id leaves the promise pending forever. **Real defect.** |
| `CdpClient.waitFor` (`:96-110`)                         | YES             | `timeoutMs = TIMEOUT_MS = 20_000` (`:99`, `:5`); explicit `while (Date.now() - started < timeoutMs)`. |
| `awaitBrowserStartup` (`:404-434`)                      | YES             | `Promise.race` against `child.status`; reports exit code/signal/stderr on status-first.                |
| `terminateBrowserProcess` (`:437-451`)                  | YES             | `SIGTERM` → `await child.status` → `await drain`; narrow tolerance only for the one `TypeError` `Child process has already terminated`. |
| `probeBrowserVersion` (`:306-366`)                      | YES             | `Promise.race` against a `BROWSER_VERSION_TIMEOUT_MS = 5_000` timer (`:337`, `:6`).                    |
| `captureBoundedText` (`:369-401`)                       | YES             | Retains only the final `BROWSER_OUTPUT_LIMIT_BYTES = 32 * 1024` bytes (`:7`); truncation explicit.     |
| `waitForCompletedStableBaseline` (`:454-485`)           | YES             | `timeoutMs ?? TIMEOUT_MS = 20_000` (`:460`); explicit `while (now() - started < timeoutMs)`.            |
| `waitUntil` (`:549-556`)                                | YES             | `while (Date.now() - started < TIMEOUT_MS = 20_000)`.                                                   |
| `evaluate` → `client.send('Runtime.evaluate', …)` (`:521-534`) | **NO** (via send) | Inherits the unboundedness of `send`. Bounded only when `waitUntil`/`waitForExpression` enforces an outer poll. |
| `waitForDebugTarget` → `fetch` + `waitUntil` (`:571-584`) | YES (via waitUntil) | Inherits the `waitUntil` bound.                                                                       |

The amendment correctly identifies **exactly two** independently unbounded primitives: `CdpClient.connect` and `CdpClient.send`. The `evaluate`/`Runtime.evaluate` path is acknowledged as crossing the `send` seam (`f8-plan-amendment.md:36-39`). All other waits are bounded. The amendment does not "fix both because both are plausible" — it justifies bounding both by "two executable reproductions, not by changing both merely because either looked plausible" (`f8-plan-amendment.md:42-45`).

**Verdict on criterion 1:** PASS. Identification is from code measurement; scope is bounded to two real defects; the evidentiary limit of the attempt-6 ledger is honestly recorded.

## § 2 Diagnostic bound contract (criterion 2)

`f8-plan-amendment.md:65-77` and `plan.md:966-974`:

- **Connection expiry:** names `CDP WebSocket connection`, the exact URL, and `20000 ms`.
- **Command expiry:** names `CDP response`, the exact method (e.g. `Page.enable`, `Fetch.continueResponse`), and `20000 ms`.

Both errors carry the missing stage evidence. The two primitives are separately attributable: the sentinel URL belongs only to the connection error; the sentinel method belongs only to the send error (proof row "Distinct diagnostics" at `f8-plan-amendment.md:103`, `plan.md:983`).

Normal CDP error responses and socket errors retain existing behavior (`f8-plan-amendment.md:82-84`); the bound does not replace normal settlement. A send timeout deletes its id before rejection so a late response cannot resolve stale work or grow `#pending` (`:71-74`, `:80-83`). A connection timeout detaches `onopen`/`onerror` handlers and closes the connecting socket through the structural seam.

**Verdict on criterion 2:** PASS. The bound contract is diagnostic (operation name, URL/method, elapsed bound), distinguishable, and preserves existing settlement behavior.

## § 3 Bound vs. 900 s suite boundary (criterion 3)

`f8-plan-amendment.md:75-77`: "Twenty seconds is 45 times smaller than the suite's 900,000 ms boundary. Even a late operation has ample time to reject, run the existing F6 cleanup, and return its diagnostic before the suite can send SIGTERM."

Arithmetic: `900_000 / 20_000 = 45`. Confirmed. Measured attempt-6 outer kill at `900_030 ms` (`ndjson:137`) gives 45.0015× margin — tighter than the 45× nominal claim but still > 45× and ample.

F6 cleanup path (`terminateBrowserProcess`) is bounded by `await child.status` + `await drain` (`:448-450`); its narrow tolerance for the `TypeError: Child process has already terminated` (`:444-446`) means an already-exited probe also completes promptly. There is no retry-to-green or stage-guess; the timeout error itself is the missing stage evidence (`f8-plan-amendment.md:88`).

**Verdict on criterion 3:** PASS. The 20 s bound leaves 45× headroom for F6 cleanup and the diagnostic to propagate before any outer SIGTERM. The probe reports rather than races the suite boundary.

## § 4 Deterministic unit-level reproduction (criterion 4)

Proof matrix (`f8-plan-amendment.md:90-104`, `plan.md:976-985`):

| Proof | Reproduction | Watchdog | Independent of |
| ----- | ------------ | -------- | -------------- |
| Never-opening connection | Inert socket — `onopen` and `onerror` never invoked; `connect(url, { timeoutMs })` rejects before watchdog. Error names `CDP WebSocket connection`, the fake URL, and the configured bound. | "much larger test watchdog"; if the bound is removed, the watchdog fails the test quickly rather than hanging the suite. | Browser, Aspire, Docker, network, Aspire helper generation |
| Never-returning send | Socket opens and records the outgoing command; never emits a response for its id; `send('Page.enable', params, { timeoutMs })` rejects before watchdog. Error names `CDP response`, `Page.enable`, and the configured bound. A late matching response does **not** resurrect the removed pending entry. | Same watchdog pattern. | Same |
| Normal settlement | Matching result and matching CDP error arriving before the bound resolve/reject and cancel the timer; existing semantics preserved. | n/a | n/a |
| Distinct diagnostics | Sentinel URL only in connection error; sentinel method only in send error. | n/a | n/a |
| F6/F7 preservation | All termination/drain negatives, delegation, selection, runnable/version probing, startup status/stderr, no-versioned-cache-literal proofs remain green. | n/a | n/a |

Reproduction uses injectable structural socket factory and timeout options on `connect` and `send` (`f8-plan-amendment.md:62-67`); production still constructs `new WebSocket(url)` and uses the `TIMEOUT_MS = 20_000` default. No browser, no Aspire, no Docker, no `scaffold.runtime`, no `fresh-browser` is required.

**Verdict on criterion 4:** PASS. Two deterministic reproductions hang today (a socket that never opens nor errors; a socket that opens but never returns the id) and pass after the bound, with a watchdog ensuring removal of either bound makes the test fail quickly.

## § 5 Path ceiling exactness and sufficiency (criterion 5)

`f8-plan-amendment.md:49-58` and `plan.md:954-962`: exactly two paths may later be modified:

1. `packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts` — owns `CdpClient`, the WebSocket transport, the `TIMEOUT_MS` constant, and the F6/F7 cleanup/selection seams.
2. `packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts` — already imports same-module E2E-internal seams (verified at `:11-19`: `awaitBrowserStartup`, `BROWSER_EXECUTABLE_ENV`, `captureBoundedText`, `probeBrowserVersion`, `selectBrowserExecutable`, `terminateBrowserProcess`, `waitForCompletedStableBaseline`) and owns the deterministic proofs.

The amendment explicitly states the two-path ceiling still suffices: "No new module, gate, suite, task, catalog, template, fixture, package barrel, README, SDK/Fresh, `docs/**`, or `deno.lock` path is required. Any compiler-proven need for a third path stops for another amendment and fresh Tier-A review." (`:55-58`).

Sufficiency check:
- `CdpClient` is module-private (no `export` on line `:62`) inside the source file. Adding an injectable socket factory and timeout option to `connect`/`send` requires **only** edits inside that file plus the test that imports from it.
- The existing test imports already cover same-module seams; adding a deterministic `CdpClient` test requires **only** extending the same test file (the structural factory can be exposed through an internal `CdpClient` export or through a new `connect(url, opts)` signature — both are within the ceiling).
- No third path is forced by the contract.

**Verdict on criterion 5:** PASS. Path ceiling is exact, narrow, and the amendment explicitly affirms sufficiency.

## § 6 Prior guarantees preserved (criterion 6)

### F6 teardown contract

`packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts`:

- `:251-258` — `collectBrowserRefetchEvidence` `finally` block: `client?.close(); await terminateBrowserProcess(child, stderr.drain);` then `Deno.remove(profile, { recursive: true }).catch(() => undefined)`. Same drain passed to `terminateBrowserProcess`; no discard sink.
- `:437-451` — `terminateBrowserProcess` unchanged: SIGTERM with one tolerated `TypeError`, await status, await drain; raw `pipeTo` promise preserved.
- `:254` — only call to `terminateBrowserProcess` from the probe; bare `child.kill('SIGTERM')` appears only inside the helper itself (`:442`).

F6 proofs in `service-client-runtime-probe_test.ts`:

- `:520-551` — `browser termination tolerates a naturally exited child and awaits its drain` (natural-exit).
- `:553-600` — `browser termination sends SIGTERM to an active child and awaits its drain` (active-SIGTERM).
- `:602-636` — `browser termination propagates unrelated kill and drain errors unchanged` (three-negative: unrelated `TypeError`, non-`TypeError` with the message, rejecting drain).
- `:638-667` — `browser refetch probe keeps the stable baseline and response-stage resume` (delegation/source-wiring). Inspects `service-client-browser-probe.ts` source and asserts `await terminateBrowserProcess(child, stderr.drain)` in the `finally` cleanup slice (`:657-658`) and forbids `child.kill('SIGTERM')` in the cleanup slice (`:658`).
- `:660-666` — forbids the literal `chromium-1232`/`chromium-1234` strings in source and test (no-versioned-cache-literal).

### F7 selection and startup diagnostics

`service-client-runtime-probe_test.ts`:

- `:278-292` — `browser executable override is exclusive and preserves validated selection metadata` (strict override/no-fallback).
- `:294-335` — `invalid browser overrides fail specifically without probing a fallback` (empty, missing, non-file, non-executable, spawn-failing, timed-out, non-zero, unrecognized; each names `NETSCRIPT_E2E_BROWSER_EXECUTABLE`, the path, and the reason).
- `:337-370` — `built-in browser candidates are returned only after a runnable probe succeeds`.
- `:372-427` — `browser version probe distinguishes path and process failure classes`.
- `:429-440` — `configured managed browser is validated when the runtime override is present`.
- `:442-476` — `browser startup reports early status and bounded stderr instead of a target timeout`.
- `:478-495` — `bounded browser output drains to EOF and retains only a marked tail`.
- `:497-518` — `live browser target failure preserves cause without inventing child status`.

All F6 and F7 proofs remain testable against the post-repair source. The amendment explicitly forbids relaxing selection or startup to compensate for the CDP timeout (`:102-104`).

**Verdict on criterion 6:** PASS. F6 teardown contract (no discard sink, same drain, natural-exit / active-SIGTERM / three-negative / delegation proofs) and F7 selection/startup diagnostics (strict override, runnable/version probing, bounded startup, no-versioned-cache-literal) are intact and explicitly required to remain green.

## § 7 Other plan-text

- The amendment explicitly does **not** classify the live attempt-6 refetch behavior as pass or fail (`f8-plan-amendment.md:25-30`); it refuses to guess which stopping stage the ledger concealed. This is the right evidentiary posture.
- Repair is **plan-only** at this head (`f8-plan-amendment.md:4`, `plan.md:990`); no source, test, fixture, runtime, browser, Aspire, Docker, lease, evaluator, readiness/merge/metadata, issue, quarantine, lockfile, or documentation mutation is authorized. The diff confirms the changeset is run-artifact-only.
- Attempt 7 is prohibited until repair receipts (four fresh exact-head binding receipts: `check`, `test`, `publish-dry-run`, `arch-check`) attest the committed content and a second fresh Tier-A accepts that evidence (`f8-plan-amendment.md:113-118`, `plan.md:986-990`).
- The session was instructed to write only `f8-plan-eval.md`; this verdict observes that constraint and does not implement, edit product, run gates, take a lease, flip readiness, merge, or post PR comments.

## Verdict

`PASS`

All six F8 criteria are met:

1. The amendment identifies the right unbounded waits from code measurement, not plausibility; the scope taken is justified by the two independently reproducible defects, and the ledger's evidentiary limit is honestly recorded.
2. The bound contract is diagnostic — names `CDP WebSocket connection` vs `CDP response`, the URL vs method, and the `20000 ms` bound; the two runtime-indistinguishable primitives become separately attributable.
3. The 20 000 ms bound is 45× below the 900 000 ms suite boundary, with ample headroom for F6 cleanup and diagnostic return before any outer SIGTERM.
4. The reproduction is deterministic and unit-level — inert socket and never-returning send — failing today and passing after the bound, with watchdog tests ensuring removal of either bound makes the test fail quickly rather than hanging the suite. No browser, Aspire, Docker, or runtime suite is required.
5. The two-path ceiling is exact, narrow, and the amendment explicitly affirms sufficiency; no third path is forced by the contract.
6. F6 (no discard sink, same drain, natural-exit / active-SIGTERM / three-negative / delegation proofs) and F7 (strict selection, runnable/version probing, bounded startup, no-versioned-cache-literal) remain green by construction and are explicitly required to remain so.

No fixes required. The amendment is ready for fresh Tier-A disposition.

## Notes

- **N1.** Already-decided items complied with: PLAN-EVAL exists; no expensive gate, browser, Aspire, Docker, lease, evaluator, readiness/merge/metadata, or quarantine mutation is part of this amendment or attempted by this session; gate class unchanged; the diff is run-artifact-only.
- **N2.** The two-commit delta (`d8d5ee619` + `4255a57b9`) is fully accounted for. `4255a57b9` is a provenance correction of a supervisor-side `leak-report.md` rewrite; its net diff against the baseline is zero for `leak-report.md`, and F8 plan content is untouched. This is appended provenance, not a substantive edit.
- **N3.** The observed model identity is `minimax/minimax-m3 · high` per the `formal_plan_evaluation` native-quota fallback recorded in `lane-policy.md:65`. This matches the supervisor's documented fallback for a plan-only changeset while the Codex author account is quota-blocked until 2026-08-20 (`0c705a0cb`, `db2aa93b2`).
