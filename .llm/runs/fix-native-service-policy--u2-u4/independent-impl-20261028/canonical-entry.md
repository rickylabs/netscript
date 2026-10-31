## packages/service — residual F-1 builder and type-module size (#1386 L2)

- **Reason:** The service builder and public type module already exceeded their F-1 size caps before
  #1386 L2. The CORS contract and middleware registration add lines to those existing modules. CORS
  policy itself is extracted to the focused `src/middleware/service-cors.ts`; further decomposition
  of the existing builder and public types remains separate work.
- **Owner:** NetScript service maintainers / architecture follow-up.
- **Target:** Next service architecture decomposition pass, before the stable public API line.
- **Linked change:** [Leaf X-1386, PR #2193](https://github.com/rickylabs/netscript/pull/2193).
- **Created:** 2026-10-10.
- **Status:** open; residual size debt recorded, no closure claimed by this leaf.
- **Gate:** F-1. Close when `src/builder/service-builder-impl.ts` is within its 500-line cap and
  `src/types.ts` within its 300-line cap, with the service package suite and CORS conformance still
  green. `arch:check` currently exits zero with these size warnings.
- **U4 health-registration delta (root disposition, 2026-10-27):** Numeric F-1 remains
  **DEBT_ACCEPTED**, not PASS. Only health state / `installHealth()` may grow the existing
  `service-builder-impl.ts` baseline of 629 physical/logical lines by at most 32 (maximum 661,
  using the same count convention); no broad decomposition or size waiver is granted.
  - **Owner:** NetScript service migration coordinator + rickylabs.
  - **Remediation deadline:** 2026-11-10 or the stable API line, whichever is earlier; no automatic
    extension. Remediate this additional growth within the existing builder decomposition debt.
  - **Authority:** `.llm/runs/fix-native-service-policy--u2-u4/plan.md` revision 4 and
    `root-policy-addendum.md` targeted owner disposition. Independent PLAN-EVAL must assess this
    bounded delta before implementation; this entry does not authorize source by itself.
  - `src/types.ts` stays inspect-only at its existing 335-line baseline. Runtime, behavior-test,
    docs, publication/release and independent review gates remain required. This F-1 delta does not
    waive F-10: all affected test files must stay at or below 480 physical lines; an explicit
    conditional focused health-order proving owner may be selected before implementation.

