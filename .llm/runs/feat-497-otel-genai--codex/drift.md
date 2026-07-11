# Drift

- D1 (carried): PLAN-EVAL owner-waived by the slice brief.
- D2: Full telemetry export-map doc lint reports nine pre-existing findings (private type references and one missing JSDoc) outside this slice. The new `ai.ts` subpath initially exposed two private upstream type refs; these were removed via a public structural contract, and its focused `deno doc --lint` is clean. Unrelated baseline cleanup is deferred.
