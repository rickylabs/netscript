# Drift — feat-runtime-shutdown-orchestrator--1231

## D6 composed PLAN-EVAL waiver

- **Expected:** a separate local PLAN-EVAL before implementation.
- **Actual:** the owner explicitly requested the same D6 composed-evaluation rule as the preceding
  slice.
- **Disposition:** `COMPOSED_WAIVER`; no local PLAN-EVAL is launched. Formal IMPL-EVAL remains.
- **Scope impact:** none.

## Existing JSR module-tag blocker

- **Plan expectation:** the planned public surface would retain the clean package JSR baseline.
- **Actual:** the package audit found the existing `./rpc-path` export lacked an `@module` header,
  although full-export `deno doc --lint` did not flag it.
- **Disposition:** add the missing module header only; no symbol, behavior, or export-map change.
- **Scope impact:** one adjacent public-entrypoint documentation correction required to earn the
  issue's “Archetype gates green” acceptance box.
