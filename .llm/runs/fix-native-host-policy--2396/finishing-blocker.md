# #2396 finishing disposition — 2026-10-31

BLOCKED: the coordinator-approved one-name repair cannot satisfy public doc lint.

`AuthzDecision.code` references `ProcedureErrorCode`; that native alias is defined by
`typeof PROCEDURE_ERROR_CODES[keyof typeof PROCEDURE_ERROR_CODES]`. Both prospective
23/22-name facades fail with exactly the constant reference. The identity-preserving
candidate exports both names as types and passes at24/23. All43 native-name omission
controls fail, so none of the existing closure names can absorb the growth.

The separate read-only PLAN reviewer independently found this load-bearing dependency
(round1 FAIL_PLAN) and approved an explicit stop branch (same-session round2 PASS).
No facade, native auth implementation, assertion, export map, debt bound or expiry was changed.
The existing PR comment6541305379 had already reported the same two-name candidate; this
run confirms it at the refreshed source union rather than treating the one-name decision
as authorization for further growth.

Question for the coordinator: authorize exactly the two native identity names and bounds
24 workers /23 streams, retaining the fixed deadline and independent debt review, or require
a separately reviewed native public-type representation change?

Recommendation: authorize the two type-only names. The reviewable source-only proposal is
finishing-proposed-closure.patch; prospective debt amendments must name BOTH native names,
#2492 as the cause, exact24/23 totals, unchanged2026-11-10, no extension or further growth.
Type-only exports add no runtime binding. The alternative changes the canonical native type
representation and needs its own explicit scope/design review; no such redesign was applied.

Incoming main is merged normally and carriers regenerated canonically. The blocked source
is intentionally kept as-is. Current doc lint and the original public test remain red; no
new completed acceptance, ready-to-merge status or accepted new F-5 debt is asserted.
Required hosted runtime and post-publish graph remain unproven and coordinator/release-owned.
