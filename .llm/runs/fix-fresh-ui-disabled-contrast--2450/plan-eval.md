# PLAN-EVAL #2450 (inactive-contrast follow-up): **FAIL_PLAN**

**Verdict: FAIL_PLAN.** The design is sound and the WCAG scope is correct. It fails on two missing Plan-Gate sections and one gap in the write surface. The fixes are small and can be made in the plan only; this is cycle 1 of 2 for the feature tier.

I made no file writes and launched nothing. I did not read or overwrite the untracked `plan-eval.md` that already exists, so this verdict is independent of it. I did not read any profiles/ file.

## Checked against the tree
- **Counts are correct.** `contrast-pairs.json` has exactly six disabled-foreground pair definitions: `state-disabled-fg` in all presets, three `fluent-text-disabled`/`fluent-text-on-accent-disabled` stacks plus `fluent-text-on-accent-disabled` (four fluent pairs in total), and `tactile-text-disabled`. That gives 24 presets × 2 schemes + 8 + 2 = 58 measured uses. `contrast-exclusions.json` has 531 entries, 56 of them disabled, so 475 remain.
- **Consumer audit: clean.** No `.tsx`/`.md` component uses these four tokens. No preset or bridge CSS aliases an active role to a disabled token; the only reference is the Tailwind bridge alias at `theme-bridge.css:185`. So exempting them does not hide any rendered active text today.
- **Generator flow works.** `report-token-contrast.ts:24` evaluates with no exclusions, and `--write-exclusions` regenerates from `report.failures`. Moving exempt rows out of `failures` before that point removes the 56 entries without hand edits, as the plan intends.

## Findings by area
- **Safety against hiding active failures: mostly strong.** An exemption needs both an explicit annotation and a disabled foreground. A disabled background alone never exempts a pair. Exempt pairs are only allowed at the text threshold, and the total `checks` count is unchanged. Gaps:
  - The `state-disabled-*` pattern also matches `state-disabled-container`, which is a background role.
  - No rule says what happens when an exclusion targets an exempt row.
- **Exemptions vs exclusions: well separated in the worklog Design section.** An exemption is a WCAG classification; an exclusion is an exact source value kept for the Figma pass. But the plan never states that one result can't be both.
- **WCAG scope: correct.** SC 1.4.3 exempts text in inactive UI components. SC 1.4.11 (non-text) is left alone. Read-only, muted and hover text are explicitly excluded.
- **Process: compliant.**
  - The owner's Claude evaluator override is recorded, and it is a different vendor family from the implementer (sol).
  - No labels; Refs #2450 only, with no closing keyword.
  - Exact-head CI runs before READY.
  - `quality:gate` covers both `quality:scan` and `arch:check`.
  - IMPL-EVAL happens before the supervisor's sign-off commit.

## Plan-Gate boxes

| Box | Status |
|---|---|
| Research present and current | ✅ baseline d25f65b, counts verified |
| Decisions locked | ✅ |
| Open-decision sweep | ❌ missing; three unflagged decisions could force rework (repair 2) |
| Commit slices (files, gate, <30) | ⚠️ slices are ordered, but files aren't listed and a required file is missing (repair 1) |
| Risk register | ❌ missing |
| Gate set selected | ✅ |
| Deferred scope explicit | ✅ |
| jsr-audit | ⚠️ effectively N/A (the contrast types aren't re-exported from `./tokens` or `mod.ts`), but the plan doesn't say so |

## Required repairs
1. **Add `packages/fresh-ui/src/tokens/adapters/default-token-quality.ts` to the write surface and the slice file list.** It spreads the generated pair JSON into `TokenContrastPair` and only narrows `minimum` (lines 11–16). The `exemption` field must be narrowed or rejected there too. List every file in the implementation slice, including the generated CLI/MCP copies, and confirm the total is under 30.
2. **Add an open-decision sweep that settles these three points now:**
   - **Collision rule:** an exclusion that matches an exempt row is rejected as stale or unused. This already happens naturally, because exempt rows never reach the exclusion lookup. Lock it and add a test.
   - **What "stale exemption" means:** an annotated pair whose foreground isn't a disabled text role, or whose minimum isn't 4.5, or that applies to no context, is a hard error. The plan lists a test for stale exemptions but never defines them.
   - **Data version:** say whether `contrast-pairs.json` keeps `version: 1`, since the field is additive, or moves to version 2. `default-token-quality.ts:8` checks the version, so this affects the generated CLI/MCP copies.
3. **Add a risk register with a mitigation for each risk:**
   - **A disabled-named token is later used on active text.** Mitigation: record the consumer audit above in `research.md` and require it again in the README for new annotations.
   - **Regenerating exclusions changes entries other than the 56.** Mitigation: a proving check that the `contrast-exclusions.json` diff contains only the 56 disabled deletions.
   - **Old and new copies of the checker and data get out of sync.** Mitigation: tie to the version decision in repair 2.
   - **`scaffold.runtime` stays UNPROVEN because Docker is absent.** Mitigation: exact-head CI is the evidence, or it is recorded as residual risk in the PR.
4. **Tighten the eligibility rule:** the foreground must be a text role (it must pass the existing `foregroundRole()` check in `check-token-contrast.ts`) and also carry the disabled marker. This stops `state-disabled-container` and other non-text roles from qualifying. All six current pairs already satisfy this.
5. **Name a CLI negative control:** for example `--negative-control=exempt-active`, which annotates an active pair and must exit non-zero. It joins the existing `contrast` control and turns the plan's general "CLI negative controls" into a concrete check.
6. **Record jsr-audit as N/A** with the reason: the contract is internal, there's no change to `deno.json` exports or `mod.ts`, and no slow-type risk.

## Not required
- Show the exempt count in the PASS line of `check-tokens.ts:93`. The plan already implies this.
- Keep the two disabled pairs that pass in the exempt list, so all 58 appear, as the plan already states.

Once repairs 1–6 are in the plan, the second round should be a quick PASS. The design itself doesn't need to change.
