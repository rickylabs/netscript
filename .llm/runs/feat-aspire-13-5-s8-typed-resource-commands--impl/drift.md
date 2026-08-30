# Drift — S8 #1720

## D-01 — Standalone fallback absent at the S6 base

The ratified S8 scope says to retain the standalone database-operation path. At `564d465c`,
`operation-runner.ts` instead fails closed when no resident AppHost is detected, and the older
separate db-operation AppHost generator is no longer present. Slice 4 must restore an appropriately
scoped fallback or explicitly escalate a contract change; it must not claim an already-existing
fallback was preserved.

Resolution in slice 4: the fallback now starts the normal project `apphost.mts` only after
`aspire ps --format Json` proves that exact path is absent, executes the same bounded wait and
resource route, and stops only the host it started. It does not revive the removed ad-hoc
`db-operation/apphost.mts`. The existing generic explicit-start dispatcher remains available on
`<db>-cli` for non-typed operations and migrations that carry a name; its IO moved into the shared
emitted `run-tool.mts` edge.

## D-02 — S2 receipt index is narrower than the dispatch summary

The named S2 V12 help receipt covers deploy-family commands rather than full `aspire resource` and
`aspire wait` argv. A separate lifecycle receipt demonstrates wait exit 17; exit 18 is not observed
in the checked-in research receipts. Phase A treats the dispatch contract as locked and unit-tests
both exits. Phase B remains responsible for live CLI evidence.

## D-03 — 13.5.3 TypeScript visibility projection is not bit-combinable

The documentation describes `ResourceCommandVisibility.UI | ResourceCommandVisibility.Api`, but
the restored 13.5.3 `aspire.mts` emits a string enum (`UI = "UI"`, `Api = "Api"`) and
`CommandOptions.visibility?: ResourceCommandVisibility`. The documented bitwise form fails D-19
with TS2322/TS2362/TS2363. Slice 5 therefore omits the property and uses Aspire's documented
default visibility (both UI and API), preserving the intended dashboard and CLI surface without a
cast. The restored declaration and compiler evidence are cited in the slice-5 receipt.

## D-04 — D-39 supersedes the historical inotify/zombie host classification

The supervisor re-proved the host at 2026-08-30T09:27Z: `fs.inotify.max_user_instances=1024`,
Docker client/server 28.5.2 at `tcp://netscript-dind:2375`, and PID 1 is `tini` with zero zombies.
The lifecycle and watch tests are trustworthy. This run therefore treats any restore, `watchFs`,
or lifecycle-test red as a real finding and does not apply the old inotify-128 or zombie waiver.
The separately recorded remote-DinD bind-mount and loopback topology (D-42/D-43) remains the only
runtime-phase limitation; it does not change Phase A's static-only boundary.

## D-05 — Phase-B gate existed but was not registered

At the leased Phase-B preflight, the typed DB gate factory existed but `scaffold.runtime` did not
include it. A focused suite-registry test failed RED (19 passed / 1 failed). The minimal repair
registers it for PostgreSQL runtime suites and excludes it for SQLite; the focused suite-registry
and runtime-gate tests then passed 41/41. This was an S8-owned defect and was repaired before the
single live pass so that a successful suite could execute the requested evidence gate.

## D-06 — Full runtime pass stopped before typed DB evidence

The one authorized `scaffold.runtime` pass exited 1 at `generated.quality-negative` with
passed=26, failed=1, skipped=0. The report records a Fresh hydration TS2345 and missing S6 health
members after the scratch restored configured SDK 13.4.6 under CLI 13.5.3. The critical failure
occurred before runtime startup, so `runtime.typed-db-phase-b` did not execute. No retry or
workaround was attempted. Cleanup and the independent leak reporter proved zero run-owned
survivors; the supervisor relay process was left untouched.
