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

## 2026-08-09 — one template, two intentional destinations

Research during S2 found `service add --with-client` also consumed the old manifest key while
writing the #1373-approved `apps/<app>/lib/<service>.ts` path. S2 moves init's canonical example to
resource-local `(_lib)` but keeps service-add's public destination and points it at the same query
template. Duplicating the template or changing the already-accepted service-add topology would be
unrelated drift.

## 2026-08-09 — route schema makes zod an app-owned direct dependency

The planned resource-local route contract imports `zod`, but the generated Fresh app manifest did
not own that dependency even though the workspace root catalog did. A fresh generated-consumer
check failed with TS2307. S3 adds `zod: "catalog:"` to the app import map and locks that ownership
in the app-manifest test. This is required by the planned typed route/form contract and preserves
central catalog control; it is not a dependency-version fork.
