# Affected baseline constraints — read before PLAN-EVAL

Source1582; source-only inspection, no architecture/test/publish gate executed here.

- **F-1:** `.llm/harness/debt/arch-debt.md:2809` records OPEN residual service builder/type size debt
  (#1386L2, PR2193). Current logical line counts: `src/builder/service-builder-impl.ts`629 versus
  cap500; `src/types.ts`335 versus cap300 (the latter is inspect-only). The registry targets the next
  service decomposition pass before the stable public API line; it neither closes this debt nor
  independently authorizes new growth in U4. `check-doctrine.ts:367` emits WARN above these caps;
  doctrine09F-1 separately says warn above500/fail above800. The checker counts a trailing empty
  line, so its numerical count can be one higher. No new size suppression or waiver is assumed.
- **F-10:** doctrine09:266 requires `_test.ts` files not exceed500lines. Current affected auth tests
  are middleware326, builder-auth295, define-service-auth219. No matching service F-10 debt entry
  was found in the registry; the F-1 entry does not waive test shape. Preserve every behavior oracle
  while keeping prospective tests within the applicable shape gate. Any necessary additional
  proving-owner split must be explicit and evaluated before implementation; do not golf/skip tests.
- The older service doctrine Refactor entry (`arch-debt.md:638`, F-3/F-11 presets/assets) remains
  open, outside this leaf. U2/U4 do not close it or create generic folders. The service slow-type
  carve-out entry is CLOSED; normal doc/publish gates and reachable new public types still apply.

The evaluator must distinguish recorded baseline debt, a possible newly increased violation, an
actual prospective gate result, and an approved disposition. This note supplies evidence, not
`DEBT_ACCEPTED`, a gate PASS, source authorization or a decomposition redesign.
