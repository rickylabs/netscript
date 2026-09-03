# F8 plan amendment — bounded and attributable CDP transport waits

Date: 2026-08-15  
Scope: plan/run artifacts only; no source, test, fixture, runtime, browser, Aspire, or Docker mutation

## Attempt-6 attribution

S5 attempt 6 proves F7 and moves the runtime frontier. The strict selector reports source
`NETSCRIPT_E2E_BROWSER_EXECUTABLE`, path
`/home/codex/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`, and version
`Google Chrome for Testing 151.0.7922.34`. F4's `generated.service-client-contract` and F5's
`generated.deno-fmt-check` pass again. The browser therefore genuinely starts; executable selection,
service-client generation, and generated formatting are not the attempt-6 failure.

The sole red is `behavior.service-client-refetch`. Its child exits **143** (`128 + SIGTERM`) after
**900,030 ms**, at the suite's outer command boundary, with empty stdout and stderr tails. The raw
evidence remains append-only:

- `reports/s5-attempt6-scaffold-runtime-20260815-205715.log`, SHA-256
  `1bf8cb03aaa3be0ba900254abdaf3065aa9f7c8cae5989bac37ed396a919aaa0`
- `reports/s5-attempt6-scaffold-runtime-20260815-205715.ndjson`, SHA-256
  `ffab7e7f0b7764c7d2e0eca5873fa9d5cfee7c5f278743a8886e7bbba53de356`
- `reports/s5-attempt6-runtime-failure.md`

The NDJSON contains no probe progress or CDP-operation marker between the child command start and
the outer kill. It therefore **cannot distinguish** a WebSocket connection that never settles from
a CDP command whose response never arrives. This amendment does not guess which one occurred and
does not classify the live refetch behavior as pass or fail; the probe returned no behavioral
evidence.

Focused code measurement identifies two independently unbounded primitives:

1. `CdpClient.connect(url)` resolves only from `socket.onopen` and rejects only from
   `socket.onerror`. A socket that emits neither event leaves the promise pending forever.
2. `CdpClient.send(method, params)` resolves or rejects only when `#receive` sees the allocated
   command id. A socket that accepts the send but never returns that id leaves the promise pending
   forever. This affects `Page.enable`, `Runtime.enable`, `Network.enable`, `Fetch.enable`,
   `Page.navigate`, `Fetch.continueResponse`, and the `Runtime.evaluate` calls made through the
   existing helper.

The other candidate waits are already bounded: `waitUntil`, `CdpClient.waitFor`, browser version
probing, and DevTools-target startup. Both unbounded primitives are real defects under deterministic
no-event/no-response transports, even though the attempt-6 ledger cannot identify which was the live
stopping stage. The later repair is therefore justified by two executable reproductions, not by
changing both merely because either looked plausible.

## Exact path ceiling

The later F8 repair may modify exactly the same two E2E-owned paths as F6/F7:

1. `packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts`
2. `packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts`

The source file owns `CdpClient`, the WebSocket transport, its timeout constant, and the F6/F7
cleanup/selection seams; the existing test file already imports same-module E2E-internal seams and
owns their deterministic proofs. No new module, gate, suite, task, catalog, template, fixture,
package barrel, README, SDK/Fresh, `docs/**`, or `deno.lock` path is required. Any compiler-proven
need for a third path stops for another amendment and fresh Tier-A review.

## Bounded CDP transport contract

The later repair keeps `CdpClient` internal to the E2E source tree and exposes only the minimum
same-module test seam; nothing is added to a CLI package export. `CdpClient.connect` gains an
injectable structural socket factory and timeout option. The production default still constructs
`new WebSocket(url)`. `CdpClient.send` gains a timeout option while production callers retain the
default.

Both production defaults use the existing `TIMEOUT_MS = 20_000` bound:

- connection expiry rejects with an error naming **CDP WebSocket connection**, the exact URL, and
  `20000 ms`;
- command expiry rejects with an error naming **CDP response**, the exact method such as
  `Page.enable` or `Fetch.continueResponse`, and `20000 ms`.

Twenty seconds is 45 times smaller than the suite's 900,000 ms boundary. Even a late operation has
ample time to reject, run the existing F6 cleanup, and return its diagnostic before the suite can
send SIGTERM. Tests pass smaller explicit bounds but assert the same diagnostic shape.

Each timer is cancelled on its normal open/error or result/error settlement. A send timeout removes
its command id from `#pending` before rejecting, so a late response cannot resolve stale work or
grow the map. A connection timeout detaches its open/error settlement handlers and closes the
connecting socket through the same structural seam; cleanup errors are not converted into a
successful connection or silently treated as a command response. Normal CDP error responses and
socket errors retain their existing behavior.

This is deliberately narrower than adding stage logging, retry, reconnect, or a new transport
module. The timeout error itself carries the missing stage evidence. There is no retry-to-green and
no attempt to infer refetch success from process state.

## Cheap deterministic proof matrix

All proofs live in `service-client-runtime-probe_test.ts` and exercise the exact `CdpClient`
primitive used by the browser probe. They require no browser, network listener, Aspire, Docker, or
runtime suite.

| Proof | Executable assertion |
| --- | --- |
| Connection never opens/errors | Inject an inert socket whose `onopen` and `onerror` are never invoked. Call `CdpClient.connect` with a short production timeout and race it against a much larger test watchdog. Require the production rejection to win and name `CDP WebSocket connection`, the exact fake URL, and the configured millisecond bound. If the timeout is removed, the watchdog fails the test quickly instead of hanging the suite. |
| Send response never arrives | Inject a socket that opens, records the outgoing command, and never emits a response for its id. Call `send('Page.enable', ..., shortBound)` and race against the same larger watchdog. Require the production rejection to win and name `CDP response`, `Page.enable`, and the configured bound. Emit a late matching response afterward and prove it does not settle or resurrect the timed-out pending operation. |
| Normal transport settlement | For the same injected socket seam, open successfully and return a matching result before the bound; require the value and no later timeout. Also deliver a matching CDP error and retain rejection semantics. This prevents the bound from replacing normal response handling. |
| Diagnostic distinction | The connection test must not contain a command-method diagnosis; the send test must not contain connection/URL-only wording. The distinct sentinel URL and method make the two previously indistinguishable waits separately attributable. |
| F6 cleanup preservation | Keep all natural-exit, active-SIGTERM, unrelated-`TypeError`, message-only non-`TypeError`, rejecting-drain, and production-delegation tests green. Source wiring still passes the single raw bounded stderr drain to `terminateBrowserProcess`; no discard sink or broad catch returns. |
| F7 selection/startup preservation | Keep strict override/no-fallback, runnable/version selection, bounded startup stderr/status, managed-browser measurement, and no-versioned-cache-literal proofs green. Selection and startup code are not relaxed to compensate for a CDP timeout. |

The pre-repair source inspection establishes why each inert transport remains pending today; the
post-repair watchdog tests make removal of either bound fail deterministically without waiting for
the repository or suite timeout. After implementation, run the focused deterministic file and the
four ordinary exact-head binding gates (`check`, `test`, `publish-dry-run`, `arch-check`) only after
content is committed and clean, with fresh receipts and sufficiency recomputed over the named set.

## Stop and release conditions

F8 is plan-only until a fresh Tier-A passes this amendment. **Attempt 7 is prohibited** until the
two-path repair is released, its focused tests pass, four fresh binding receipts attest one exact
content head, their contracted set recomputes sufficient, and a second fresh Tier-A accepts that
evidence. A later `scaffold.runtime` still requires a new coordinator-owned singleton lease and
preflight at the immutable evidence head. `fresh-browser` remains conditional on a passing scaffold
gate and clean inter-gate audit.

All six attempt histories and their SHA-256 records, `receipts/f6-test.json` and
`receipts/f7-test.json` as superseded reds, every earlier S4/F4/F5/F6/F7 report and receipt, the
Fresh 45 and SDK 3 carried `PRE_EXISTING_FAIL` baselines with plugin-streams named separately, and
all recoverable quarantine directories remain append-only. This amendment authorizes no product or
test mutation, expensive gate, browser, Aspire, Docker, lease, evaluator, readiness/merge/metadata,
issue, quarantine, lockfile, or documentation mutation.
