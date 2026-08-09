# Drift: #1333

No implementation drift. Planning finding: issue row 10 is observational and cannot be truthfully
closed by repository implementation evidence; #1090 already owns the controlled adoption study.
This is a must-resolve scope/closure decision for the milestone owner before implementation.

## 2026-08-09 — observational row relocated

The owner moved row 10 to #1090 and approved rows 1-9 for implementation. This resolves the
planning finding without weakening or deleting the observational criterion.

## 2026-08-09 — bounded derivation at the validation limit

The locked `<project>-web` rule would exceed the existing 64-character name contract for a maximum
length project. S1 keeps the suffix and trims only the project prefix to fit; ordinary names and the
no-duplicate-suffix rule are unchanged. A unit test fixes the boundary. This is a validation-edge
refinement, not a scope or naming-policy change.
