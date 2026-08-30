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
