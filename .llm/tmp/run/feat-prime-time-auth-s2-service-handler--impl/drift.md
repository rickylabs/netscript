# Drift: auth S2 service handler seam

## 2026-06-21 — Corrected — Initial FAIL_RESCOPE overturned by sagas exemplar

**Initial observation:** Replacing the fake auth implementer with
`authContractV1.$context<AuthServiceContext>()` and also trying to remove the handler-map widening
made `os.router(authV1)` fail. The wrapper's structural `.handler()` type returns procedure output
data rather than a native oRPC procedure object.

**Supervisor correction:** This is expected and already accepted in the merged sagas plugin. The
conformant S2 target is sagas parity:

- bind handlers locally through `authContractV1.$context<AuthServiceContext>()`;
- keep the handler export map typed as `Record<string, unknown>`;
- delete the fake implementer, double cast, and handler-local oRPC error mapping;
- confine unavoidable `as any` router composition casts to `plugins/auth/services/src/router.ts`,
  matching `plugins/sagas/services/src/router.ts`.

**Resolution:** The FAIL_RESCOPE entry is overturned. S2 proceeds as a local fix without changing
the contract package.

**Non-blocking note for supervisor/AS7:** Achieving fewer composition casts than sagas would require
reworking the shared contract-wrapper seam to expose the native oRPC `implement()` builder/procedure
types across plugins. That is a framework-wide seam change requiring its own plan and PLAN-EVAL, not
part of S2.
