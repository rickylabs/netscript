# ProcedureErrorCode needs its native constant in public doc closure

Deno 2.9.7 follows both links: AuthzDecision.code -> ProcedureErrorCode ->
typeof PROCEDURE_ERROR_CODES. Re-exporting only ProcedureErrorCode changes the diagnostic
but does not clear either workers/streams singular service facade. Scratch type-only
re-exports of BOTH native names clear doc lint without a runtime binding. Exact prospective
inventories are workers24 / streams23. Existing accepted bounds are 22/21; the coordinator's
2026-10-31 one-name approval allows only23/22, so the tested proposal remains unauthorized.
All43 individual native-name omission controls from the full candidate fail:22 workers,
21 streams. No redundant existing name was found. See finishing-minimality-probes.json.
The proposed source patch is research only and omits the required prospective debt updates;
it must not be applied without an explicit two-name/24-23 disposition and independent debt
re-review preserving2026-11-10, no automatic extension, no additional growth.
