# F7 plan amendment — observable browser startup failure

## Stop boundary

This is a plan-only artifact. No source, test, template, fixture, generated asset, lockfile, or
`docs/**` path changed. No test or gate ran; there was no browser, Aspire, Docker, evaluator,
runtime lease, attempt 6, readiness transition, or metadata action.

## Disposition and measured cause

S5 attempt 5 completed 70 steps with 69 passed, 1 failed, and 0 skipped. The two earlier runtime
repairs remained proven: `generated.deno-fmt-check` and `generated.service-client-contract` passed,
and F6 allowed the browser probe to return a real startup verdict instead of dying in teardown. The
sole failure is still not a refetch-behavior verdict because no CDP connection, navigation,
mutation, or request-count assertion ran.

The opaque timeout is a leaf-caused diagnostic defect layered over an environmental capability gap:
this host currently has no browser execution path the probe can successfully launch.

Coordinator measurement establishes the mechanism without inference:

1. No Linux browser candidate in the probe exists.
2. The resolver selects Windows Chrome.
3. This WSL instance has no `WSLInterop`/`WSLInterop-late` binfmt registration.
4. The exact argv exits 2 immediately while `/bin/sh` parses the PE file and emits
   `Syntax error: word unexpected (expecting ")")`.
5. The probe drains stderr into a discard sink and does not observe early status while awaiting the
   DevTools target, reducing an actionable child failure to a timeout.

The browser never ran, bound no port, and never received the user-data-dir or loopback arguments.
Path translation and `127.0.0.1` handling are refuted hypotheses and are not planned changes.

The attempt-5 pretty log remains
`reports/s5-attempt5-scaffold-runtime-20260815-2139.log` with SHA-256
`ff349b40f7f70341934e170df7c67d147c0ed983173b41871421755ad55e062b`; its suite-owned NDJSON remains
`reports/s5-attempt5-scaffold-runtime-20260815-2139.ndjson` with SHA-256
`e35d6fbcbdfc0b046be3fec29fa5dee0b0369094645b75cb42fca1e0350bbc16`. All five attempt logs,
`f6-test.json`, prior reports/receipts, and attributed Fresh/SDK baselines remain append-only.

## Exact later path ceiling

Only these two already-owned paths may change after fresh Tier-A approval:

1. `packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts`
2. `packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts`

No third path is planned. Although `findBrowserExecutable()` is in the first path, its candidate
order and selection behavior are explicitly excluded. Any third path or host-policy implementation
requires another amendment and Tier-A review.

## Named internal seams

The probe module will own same-package E2E test seams named `captureBrowserStderr` and
`awaitBrowserStartup`. They are not package-barrel exports.

`captureBrowserStderr(stream, maxBytes?)` immediately and continuously drains a
`ReadableStream<Uint8Array>`, retains only the final 32 KiB by default, and exposes the raw
failure-capable `drain` promise plus `text()`. Truncation is explicit in the text. The tail is chosen
because the terminal browser diagnostic is the most actionable portion; bounded retention prevents
a chatty child from consuming unbounded memory.

`awaitBrowserStartup(target, status, stderr)` races the existing DevTools-target promise against
the child status captured at spawn. Target-first preserves current startup. Status-first awaits the
stderr drain and rejects with numeric exit code, signal, and bounded stderr (or `<empty>`), never a
DevTools timeout. A target timeout while status remains pending propagates unchanged. The same
capture drain is later passed into F6's `terminateBrowserProcess`; no second reader, discard sink,
or swallowed drain is allowed.

## Open coordinator policy

F7 does not decide whether the missing runnable-browser capability should be an explicit
precondition failure, a recorded skip, or an environment provisioning requirement. Explicit fail
would alter resolver policy; skip would weaken a load-bearing gate and exceed this ceiling; a Linux
browser or supported interop is external host work. No new expensive lease is warranted until the
coordinator chooses or supplies the capability.

## Cheap deterministic proof matrix

| Scenario | Required assertion |
| --- | --- |
| Immediate exit | A real child writes a known stderr sentinel and exits 2. With a never-resolving target promise, the shared startup helper rejects with code 2 and the sentinel and does not contain the DevTools-timeout text. |
| Bounded drain | A child writes more than the 32 KiB limit and ends with a sentinel. The rejection has a truncation marker and the tail sentinel, retained stderr stays within the limit, and the pipe reaches EOF. |
| Live timeout | With status pending, a deterministic target-timeout rejection propagates unchanged, proving live timeout and early exit remain distinct. |
| Wiring/F6 | Source assertions require the one bounded capture, status race, and shared raw drain; prohibit the discard sink; and rerun all existing F6 termination/negative/delegation tests unchanged. |

Only focused and ordinary cheap binding validation may follow a future implementation release. No
runtime or browser gate is part of this amendment.
