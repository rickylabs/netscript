# F7-C1 plan amendment — managed-browser selection and observable startup failure

## Stop boundary

This corrects the unreviewed F7 plan at `ff0ede997`; its host-capability premise was stale. No
source, test, template, fixture, generated asset, lockfile, README, or `docs/**` path changed. No
test or gate ran; there was no browser, Aspire, Docker, evaluator, runtime lease, attempt 6,
readiness transition, or metadata action.

## Corrected measurement and classification

S5 attempt 5 completed 70 steps with 69 passed, 1 failed, and 0 skipped. F4/F5 stayed green, and F6
allowed the probe to expose a startup verdict rather than dying in teardown. Refetch behavior is
still unknown because no CDP connection, navigation, mutation, or request-count assertion ran.

The host has two measured runnable Linux Chromium binaries:

```text
/home/codex/.cache/ms-playwright/chromium-1232/chrome-linux64/chrome
  -> Google Chrome for Testing 151.0.7922.10
/home/codex/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome
  -> Google Chrome for Testing 151.0.7922.34
```

The probe's list contains neither and has no explicit override. Its `/usr/bin/*` entries are absent,
so it selects Windows Chrome; missing WSL binfmt interop makes that child exit 2 with
`Syntax error: word unexpected (expecting ")")`. The probe discards stderr and ignores early status,
turning the selection error into a timeout. This is an allowlist/selection defect plus a startup
diagnostic defect—not an environmental capability gap. Path translation and loopback remain
refuted causes.

Attempt-5 pretty and NDJSON logs remain unchanged with SHA-256
`ff349b40f7f70341934e170df7c67d147c0ed983173b41871421755ad55e062b` and
`e35d6fbcbdfc0b046be3fec29fa5dee0b0369094645b75cb42fca1e0350bbc16`. All five attempt logs,
`f6-test.json`, prior reports/receipts, and attributed Fresh/SDK baselines remain append-only.

## Exact later path ceiling

Only these two already-owned paths may change after fresh Tier-A approval:

1. `packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts`
2. `packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts`

No third path is planned. No versioned Playwright/Puppeteer cache path may be hard-coded in either
path. Any third path stops for another amendment and Tier-A review.

## Strict executable selection

The portable override is `NETSCRIPT_E2E_BROWSER_EXECUTABLE`, documented in adjacent source JSDoc,
errors, and focused tests. The same-module selector returns path, source, and validated browser
version. It runs a bounded `<path> --version` probe and requires an existing executable file, a
bounded successful launch, exit 0, and recognizable Chrome/Chromium/Edge output.

If the variable is present, including empty, it is exclusive: empty, missing, non-file,
non-executable, spawn-failing, timed-out, non-zero, or unrecognized values fail with the variable
name, exact path or `<empty>`, and specific reason. There is never fallback after an explicit
override. With no override, built-in candidates are selected only after the same runnable-version
probe; a present Windows PE is not selectable merely because it exists. Exhaustion names failures
and instructs the operator to set the override. There is no skip path.

The current measured cache paths are runtime environment values only. A future lease supplies one
as `NETSCRIPT_E2E_BROWSER_EXECUTABLE`; the repository contains no `chromium-1232` or
`chromium-1234` literal.

## Bounded startup diagnostics

One `captureBoundedText` seam continuously drains a stream while retaining only its final 32 KiB
with an explicit truncation marker. It supports bounded version output and replaces the browser
stderr discard sink. `awaitBrowserStartup` races the DevTools-target promise against child status
and takes the executable selection metadata. Early exit awaits the drain and reports override
source/path, code, signal, and bounded stderr; a genuinely live-child target timeout propagates
with its cause/text preserved and override source/path added, without inventing an exit status. The
same raw drain continues into F6's `terminateBrowserProcess` and remains failure-capable. This is
the startup occurrence of the swallow class F6 removed from teardown.

## Cheap proof matrix

| Scenario | Required assertion |
| --- | --- |
| Managed binary | Preserve both measured Chrome-for-Testing 151 version results. Later pass one path as the environment value and require selector source/path plus recognizable version, while asserting neither versioned cache directory exists in source/test. |
| Override precedence | Inject a probe with an override and another would-be fallback; require exactly one override call and returned override metadata. |
| Invalid override | Empty, missing, non-executable, spawn-failing, timeout/non-zero, and unrecognized values each name the variable/path/reason, and the call log proves no fallback. |
| Immediate startup exit | A real child writes sentinel stderr and exits 2; require override source/path, code, and stderr without timeout wording. |
| Bounded drain | More than 32 KiB retains a bounded marked tail ending in the sentinel and reaches EOF. |
| Live timeout/F6 | A pending status preserves the target-timeout cause/text, adds override source/path, and claims no exit code; source wiring has no discard sink, shares the raw drain with termination, and all F6 proofs remain green. |

The runtime gate must prove settled refetch; skip is not an outcome. Only focused and ordinary cheap
binding validation may follow a future implementation release. A later expensive run requires a new
lease and the explicit managed-browser override.
