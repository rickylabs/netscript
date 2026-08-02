# Context Pack

- Objective: make acceptance-evidence mirroring idempotent while preserving strict failures.
- Branch/base: `fix/1049-mirror-idempotent` / `8b69d78f0`.
- Locked design: distinguish known checked boxes from unknown text; validate duplicate and empty
  evidence for both states; return only unchecked mappings.
- Scope: two validation source/test files plus this run directory.
- Status: implementation and all requested validation complete; PLAN-EVAL explicitly waived by
  owner; local commit pending.
