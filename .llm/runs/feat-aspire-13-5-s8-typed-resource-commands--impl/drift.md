# Drift — S8 #1720

## D-01 — Standalone fallback absent at the S6 base

The ratified S8 scope says to retain the standalone database-operation path. At `564d465c`,
`operation-runner.ts` instead fails closed when no resident AppHost is detected, and the older
separate db-operation AppHost generator is no longer present. Slice 4 must restore an appropriately
scoped fallback or explicitly escalate a contract change; it must not claim an already-existing
fallback was preserved.

## D-02 — S2 receipt index is narrower than the dispatch summary

The named S2 V12 help receipt covers deploy-family commands rather than full `aspire resource` and
`aspire wait` argv. A separate lifecycle receipt demonstrates wait exit 17; exit 18 is not observed
in the checked-in research receipts. Phase A treats the dispatch contract as locked and unit-tests
both exits. Phase B remains responsible for live CLI evidence.
