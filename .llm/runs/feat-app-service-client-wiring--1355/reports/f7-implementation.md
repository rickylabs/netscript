# F7 implementation — strict browser selection and observable startup

## Scope

Fresh Tier-A passed the F7-C1 amendment at `a2e9515f5`. Product/test mutation stayed inside the
reviewed two-path ceiling:

1. `packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts`
2. `packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts`

No package barrel, gate registry, suite, task, template, fixture, lockfile, README, or `docs/**`
path changed.

## Implemented contract

- `NETSCRIPT_E2E_BROWSER_EXECUTABLE` is a strict override. An explicit empty or invalid value fails
  against that source/path and never enters the built-in candidate loop.
- Both override and built-in candidates must pass the same file, executable-bit, bounded
  `--version`, exit-zero, and recognized Chrome-family checks before selection.
- Selection retains the executable path, selection source, and observed version. The live headless
  launch carries the same source/path into spawn, early-exit, and DevTools-target errors.
- Browser stderr is continuously drained through one bounded 32 KiB tail capture. The same raw
  failure-capable drain is passed to F6's `terminateBrowserProcess`; no discard sink or second
  reader remains.
- Startup races the existing target promise against the captured child-status promise. A status
  winner reports code, signal, and retained stderr; a target rejection preserves its cause/text and
  does not invent an exit code.
- F6 termination semantics, response-stage `Fetch.continueResponse`, completed-and-stable baseline,
  and the settled `baseline + 1` refetch assertion are unchanged.

## Deterministic cheap proof

The first focused run exposed two test-assumption defects and was not called green: on this Deno
runtime an invalid executable image becomes a shell child that exits 127 rather than throwing at
`spawn`, and the self-source read passed a file URL as a string rather than a `URL`. The spawn-error
contract remains directly exercised through the injected override probe/call log; the process-level
test now asserts only failure classes the runtime can deterministically produce. Both corrections
stayed in the approved test path.

The corrected structured focused suite ran with the measured managed Linux browser supplied only as
the runtime environment value and passed **22 / 0**:

```text
NETSCRIPT_E2E_BROWSER_EXECUTABLE=/home/codex/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome \
  deno run --allow-read --allow-write --allow-run --allow-env \
  .llm/tools/run-deno-test.ts -- --allow-all \
  packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts
```

The selector's direct measurement returned:

```json
{"path":"/home/codex/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome","source":"NETSCRIPT_E2E_BROWSER_EXECUTABLE","version":"Google Chrome for Testing 151.0.7922.34"}
```

Focused structured check selected three related probe files with zero diagnostics; focused lint
selected the same three with zero findings; focused format check selected the same three in one
batch with zero failed batches and zero findings. The source/test regression constructs the two
forbidden cache-directory names at runtime and asserts neither appears in either file, so no
versioned managed-cache path is encoded in product or test source.

## Pending exact-head evidence

The product/test and this run record must be committed first. Then `check`, `test`,
`publish-dry-run`, and `arch-check` will run serially through `run-gate.ts` with distinct F7
invocation IDs at that one immutable content head. Receipts remain pending until that clean-head
boundary exists.

All five S5 attempt logs and hashes, the superseded-red `f6-test.json`, every prior report/receipt,
and the Fresh/SDK attributed baselines remain append-only and unchanged. No runtime lease,
`scaffold.runtime`, `fresh-browser`, Aspire, Docker, evaluator, readiness, or metadata action ran.

## Binding stop

At immutable content head `e45144db643f6bde85552a615812c8371e4ce792`, `f7-check.json` passes
with zero diagnostics and `f7-test.json` fails only while the unchanged teardown walker traverses
the preserved Postgres-owned S5 attempt-5 workspace. The test gate reports 4,236 passed, 1 failed,
19 ignored, and 4,256 total—exactly eight more total results than F6, matching the eight added F7
tests. `publish-dry-run` and `arch-check` were not started and no receipts were authored. Exact-set
sufficiency is `INSUFFICIENT`; see `reports/f7-binding-test-failure.md` for full attribution.
