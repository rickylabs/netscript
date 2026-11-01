## Summary

Share the repeated Utility root selector through native CSS nesting while preserving specificity, rule order and computed styles. Add raw/gzip component CSS budgets beside the publish budget, plus complete-output regression checks for the QueryResult source already shared by the page and resource generators.

| Combined component CSS | Before | After | CI ceiling |
| --- | ---: | ---: | ---: |
| Raw bytes | 270,183 | 215,981 | 220,000 |
| Gzip bytes, Deno 2.9.7 | 27,152 | 26,527 | 27,000 |

The selector appears 54 times across 52 sheets, down from 528. Shipped CSS inventory and bytes must match source before either size assertion. The unchanged test rejects the original payload at both limits.

## Scope

- Archetype 6 / Fresh UI registry and CLI generator regression tests.
- No public API, token, markup, dependency or lock changes. Native CSS nesting is required for the consolidated Utility rules.

## Slices

- [x] Plan and acceptance gates — e5fa366.
- [x] CSS consolidation, size budgets, QueryResult drift checks and independent review.
- [x] Reviewed implementation committed and pushed — ddbd0f2.
- [ ] Final remote check reconciliation.

## Validation

On **Deno 2.9.7**: 338 Fresh UI test results; 25 focused CLI tests; all 60 generated-scaffold browser tests; package/scoped check, lint and fmt; 52-file CSS formatting; quality/architecture; release preflight; JSR audit/native publish; four carrier generators and all 14 root `check:*` tasks pass.

Utility parity: 265 fixtures, two widths × two schemes, 2,388,000 computed-style comparisons and four identical screenshots. Legacy comparisons: 265 fixtures × three presets × two schemes, zero differences. Chromium's parsed CSS contract preserves all 1,161 ordered selectors/declarations/media conditions. Full Utility parity uses explicit studio/utility; Badge tests exercise all three aliases. Browser evidence is Chromium-only.

**Runtime and container cleanup UNPROVEN locally:** the exact `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` command exited 1 at Aspire preflight because Docker is unavailable. All 25 entries with unproven resource ownership were left untouched.

**Remote CI is pending. No READY claim has been made.**

## Harness

Run: `.llm/runs/orch-divybot-6555139912--2524/`. Independent read-only Claude Opus 5.5/high IMPL-EVAL: **PASS**, including verification of all 50 source hashes. Requested effort is not independently attested. Evidence: `gates.json`, `evaluate.md`, `utility-parity.json` and `rule-contract.json` in that run.

## Drift / Debt

No new architectural debt. Additional full-export doc-lint reports 124 inherited findings across 16 byte-identical baseline source files; see `doc-lint-baseline.json`. The earlier QueryResult duplication was already removed in #2503; this PR protects that shared source against drift.

## Definition of Done

- [x] Implementation and local required checks complete; runtime limitation explicitly reported.
- [x] Independent implementation review passes; no lock or unrelated churn.
- [x] Owner delivery policy retained: Refs only, no labels, Cockpit merges.
- [x] READY is withheld until every required remote check passes or skips by workflow policy at the delivered head.

Refs #2524
