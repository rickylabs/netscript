# Context Pack: PR-C #1380

## Current State

Draft PR #1585 contains green S1 and S2 changes. The repo gate uses the discovered-root path; the
doctrine verdict/archetype tables measure the same 36 roots; the provenance, debt, gated-set,
engineering-reference, and RFC-location records have executable content tests. S3 now also corrects
the close-gate rerun guidance and its Claude mirror. The complete final gate matrix is next.

## Completed

- Read the five named skills, harness activation/run-loop/gates, doctrine 01/06/09/10, relevant debt, and live issue/comments.
- Opened and labelled draft PR #1585 with milestone 0.0.6; no CI-skip labels.
- Implemented and verified S1.
- Implemented and verified S2: 36-unit tables, reconciled provenance, accepted-red debt closure,
  documented gate coverage, dated engineering-reference plan, canonical RFC mapping, and six doc tests.
- Implemented and verified S3: label/rerun guidance, repair hint contract, and regenerated Claude skill.

## In Progress

- S4: complete final gate matrix, literal evidence, acceptance mapping, and PR handoff.

## Next Steps

1. Commit and comment S3.
2. Run every requested final gate on the final source head.
3. Commit only final run evidence, push, then rerun any source-sensitive gates if the evidence commit changes their inputs.

## Key Decisions

- `arch:check:repo` uses `--all-roots`; `discoverDoctrineRoots()` remains the single selector.
- A14 ignores only lines whose first non-whitespace character is a quote/backtick.
- Box 5 is attributed to `e391f3aec` / #1403, not reimplemented.

## Drift and Debt

- Drift: none.
- Debt: the 2026-06-21 accepted-red repo-doctrine entry is scheduled for closure in S2.

## Commits

- See draft PR #1585 and its per-slice comments.
