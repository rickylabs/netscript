PASS

All four round-1 blockers are resolved in the updated plan:

- **B1, fixture seam:** Decision 5 now fixes the fixture field names (`contracts`, `keyboard` with `component`/`scenario`/`keys`/`expectation`, and `props`). `tests/contracts/styles.ts` is the only place source styles are registered, the declared `registeredContractStyles` ID list is kept separate, and registry `kind: style` items and token presets are explicitly excluded. All of this lands in slice 1, before any category work.
- **B2, browser gate:** The plan now names a dedicated Playwright suite under `tools/fresh-ui-browser/` with its own config, fixture and bundle/server. Keypress and focus/ARIA/value assertions are required, so metadata alone never counts as proof. Gallery routes don't change, so `axe-baseline.json` stays as it is. Each new fixture must have zero serious or critical axe findings, and screenshot provenance is stated. All of this sits inside the authorized browser-tool scope.
- **B3, registry order:** Slices 2–7 and 9–11 each edit the manifest and regenerate their carriers before the installed-source proof. Slice 8 now only reconciles, writes docs and gathers evidence, matching the 2b pattern.
- **B4, issue closure:** Neither PR closes #2416. Both use `Refs` only, per the owner's explicit instruction, and the plan explains why. Remaining work is named: real alternate-style sources stay in S4–S6. Cockpit retargets the stacked 2b PR after 2a merges, using normal merges and no force push. This is recorded in both the plan and the drift log.

Two non-blocking notes for implementation and IMPL-EVAL:

1. CI's existing `fresh-ui-quality` browser job only runs the default Playwright config. The new gap suite will therefore be local evidence unless a workflow is changed, and `.github/` is outside the authorized write surface. Record a durable receipt for each run, and don't present the suite as a required remote check.
2. The slice table doesn't say which slice creates the shared gap-suite config and bundle/server. Build them in slice 2, the first slice that needs a keyboard proof.