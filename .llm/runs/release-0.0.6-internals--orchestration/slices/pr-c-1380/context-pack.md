# Context Pack: PR-C #1380

## Current State

Draft PR #1585 is open from the required bootstrap commit. S1 makes `arch:check:repo` reuse the
already-landed discovered-root path and applies the narrow leading quote/backtick guard to A14
fixture-data lines. The focused tests and repo gate pass; S2 doctrine measurement work is next.

## Completed

- Read the five named skills, harness activation/run-loop/gates, doctrine 01/06/09/10, relevant debt, and live issue/comments.
- Opened and labelled draft PR #1585 with milestone 0.0.6; no CI-skip labels.
- Implemented and verified S1.

## In Progress

- S2: measured doctrine tables, provenance, debt closure, engineering-reference plan, RFC mapping, and tests.

## Next Steps

1. Enumerate and classify the 36 live roots from current files.
2. Refresh doctrine 06/10 and add executable doc contracts.
3. Update debt/RFC records, then run and commit S2 gates.

## Key Decisions

- `arch:check:repo` uses `--all-roots`; `discoverDoctrineRoots()` remains the single selector.
- A14 ignores only lines whose first non-whitespace character is a quote/backtick.
- Box 5 is attributed to `e391f3aec` / #1403, not reimplemented.

## Drift and Debt

- Drift: none.
- Debt: the 2026-06-21 accepted-red repo-doctrine entry is scheduled for closure in S2.

## Commits

- See draft PR #1585 and its per-slice comments.
