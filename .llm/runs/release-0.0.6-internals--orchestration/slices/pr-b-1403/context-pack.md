# Context pack: PR-B #1403

## Current state

- Draft PR #1570 is open from bootstrap commit `059576fcd`.
- The formal quality-rail plan revision 4 passed PLAN-EVAL cycle 5.
- RED-first fixtures cover B1 and B3 and currently fail because both planned contracts are absent.
- B1/B3 implementations make the focused fixtures green. B2 exposes the passed-plan contradiction
  recorded as `drift.md` D-1: the final 36 roots contain 54 known A14 failures while this slice is
  forbidden to change A14 and is required to keep `arch:check` green.

## Locked implementation

- Discover exactly the 36 top-level package/plugin units; never use every workspace member.
- `packages/cli/e2e` is nested and excluded, with the reason written into doctrine.
- `arch:check` consumes discovery in the same change that removes the curated task list.
- The PR selector includes `packages`, `plugins`, and `.llm/tools`, reports empty explicitly, and
  diffs `BASE...HEAD`.
- Findings are triaged only; package/plugin source is out of scope.
- `triage.md` records 1 actionable `plugin-streams-core` doctrine warning plus a 2-entry temporary
  #1549 allowance register for changed-tool comment false positives. The focused package quality
  scan is green with zero findings and zero allowances.

## Orchestrator decisions applied

- R-5 moved into PR-B. A14 is lexical-origin-aware and retains a synthetic unresolved RED case.
- The two tool-comment false positives now have reversible #1549 per-line allowances; current
  triage is 1 actionable package finding plus a 2-entry temporary allowance register.
- Final wrapper roots are the owned `.llm/tools/quality` and `.llm/tools/fitness` trees.

## Next

Commit and push the resolved B1–B3 implementation with generated assets, rerun the final-head
idempotence/status check, and update draft PR #1570. The orchestrator then re-syncs against main and
owns the ready transition plus separate-session IMPL-EVAL.
