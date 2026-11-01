# Drift

- None in product scope. Environment differs from skills' assumptions: gh exists, RTK does not. Use gh and focused native shell commands.
- Owner override governs evaluator model, assigned branch, Refs-only/no-label PR policy, and cockpit merge. This is explicit authorization, not an inferred exception requiring confirmation.

- PLAN review identified `.github/scripts/ci-classify-changes.test.ts` pins the bounded flag. Add this existing workflow contract test to declared scope before implementation; update it to reject the allowance when CI switches to strict.
- PLAN correction scopes stable ingestion into a composed native Pagefind plugin with real Lume/native shuffled-input fixture and root-compatible test bridge, all under the previously declared Pagefind integration surface. Root configured quality scan covers docs/site, so include quality:gate even though no framework package changes.
