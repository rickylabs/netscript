# Drift Log: `plugin install --no-samples`

## 2026-08-01 — all official plugin barrels are sample-dependent

- **What:** Workers, sagas, triggers, and streams barrels all re-export starter sample files.
- **Source:** `plugins/*/src/adapter/resources/barrel/{barrel.ts,barrel.stub.ts}`.
- **Expected:** The issue explicitly highlighted the workers barrel/runtime glue hazard and asked the
  same question for other structural resources.
- **Actual:** Runtime glue is sample-independent, but every one of the four barrels needs an empty
  no-samples form to remain structural and type-checkable.
- **Severity:** minor
- **Action:** fix
- **Evidence:** research findings 6–7 and plan decisions D2–D3.

