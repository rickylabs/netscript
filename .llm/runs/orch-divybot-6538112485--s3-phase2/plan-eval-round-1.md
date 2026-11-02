FAIL_PLAN

I checked the plan's load-bearing claims against the tree at 204a71b and they hold. The catalog has 87 contracts, 66 of them shipped, which matches `packages/fresh-ui/tests/contracts/catalog.test.ts:15,21`. L9–L12, I3–I7 and X2–X9 are absent; L1–L8, I1/I2/I8–I12, X1, K1–K6 and D1–D14 are present. Data display has exactly five unshipped entries (D6, D7, D9, D13, D14), so the 21 + 17 = 38 gap split adds up. The research, locked decisions, risk list, deferred scope and the JSR surface scan are adequate. Four plan-gate boxes fail:

**B1 — Open-decision sweep: the style-fixture interface is not locked, and deferring it forces rework (decision 5, slices 2–7 vs. 12).**
- **Problem:** Decision 5 says the style provider supplies real renders, prop metadata and keyboard scenarios. But `ContractRenderFixture` in `tests/contracts/style-provider.ts` has no prop-metadata or keyboard-scenario fields. If the interface is only extended in slice 12, every fixture written in slices 2–7 and 9–11 has to be redone.
- **Problem:** "Discover every registered source style" has no defined registration source. Today the only provider is a `utility` constant exported from `render.test.tsx`. Registry items with `kind: 'style'` in `registry.manifest.ts` are shared CSS blocks, not source styles, so the term clashes with existing vocabulary.
- **Required change:**
  - Lock the extended fixture and provider shape (exact field names for prop metadata and keyboard scenarios) in Locked decisions, and land it in slice 1, or a new slice before slice 2.
  - Name the single place where source styles are registered and how the checker enumerates them. State explicitly that registry `kind: 'style'` items and token presets are excluded.
  - Limit slice 12 to the checker, the missing-style refusal and the four mutants.

**B2 — Gate set and slice files: the browser, keyboard and visual proof gate is unnamed.**
- **Problem:** Slices 2–7 and 9–11 claim "browser keys", focus entry/return and screenshot comparison, but never name the tool or the files. The repo already has a Playwright + axe harness in `tools/fresh-ui-browser/`, run by the `fresh-ui-browser` CI job. It works on the scaffold design gallery, which lives in CLI template source (`packages/cli/src/kernel/assets/app/routes/(design)/design/...`), and its `axe-baseline.json` fails on any new target, and on any new route that has zero allowance.
- **Required change:**
  - Name the browser runner and its spec files as the keyboard/visual gate.
  - Say whether new components are added to the gallery templates. If they are, list those templates plus `embedded.generated.ts` in each category slice and confirm they fall within the authorized write surface.
  - State the axe policy: new components add zero serious/critical findings, and the baseline is not loosened.
  - State the screenshot provenance rule (CI-pinned image versus local captures).

**B3 — Commit slices: phase 2a registry ordering contradicts the per-slice proofs.**
- **Problem:** Slice 2 claims "installed sources", and the gate set says consumer copies are exercised through the registry. The plan also says every source slice includes its generated carriers. Yet registry manifest edits for phase 2a sit in slice 8, while phase 2b slices 9–11 each carry their own registry edits. As written, slices 2–7 can't produce their stated proof.
- **Required change:** Put each category's manifest entries and regenerated carriers (`registry.generated.ts`, the CLI embedded assets and publish assets) in that category's slice, and limit slice 8 to reconciliation, docs and evidence. Alternatively, drop "installed sources" from slices 2–7 and make slice 8 the proving point. Either way, the 2a and 2b slices should follow the same pattern.

**B4 — Open-decision sweep: the issue-closure decision is not recorded.**
- **Problem:** Decision 2 says both units stay "linked to #2416 without claiming completion of untouched acceptance". It doesn't say whether the final 2b PR fully resolves #2416. If it does, AGENTS.md requires a closing keyword (`Closes #2416`) in its body. If it doesn't, the remaining acceptance must be named.
- **Required change:**
  - Record which PR carries `Closes #2416` (or why none does, plus the remaining scope).
  - Confirm phase 2a uses a plain reference with no closing keyword.
  - Confirm the stacked 2b PR is retargeted to main by merging, not force-pushing, after 2a lands.

Nothing else blocks. The gate set, the single `scaffold.runtime` run per review unit, Docker-unavailable counting as UNPROVEN, the token freeze, no new dependencies, and the plan to split slices under 30 files are all acceptable.

This review was read-only, so I did not write `plan-eval.md`. The supervisor will need to record this verdict in the run.