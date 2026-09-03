# Context Pack: readiness fixture cache discovery

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-readiness-fixture-cache-discovery--1870` |
| Branch | `fix/readiness-fixture-cache-discovery` |
| Current phase | implement — RED |
| Archetype | N/A — E2E consumer tooling |
| Scope overlays | none |

## Current State

Baseline `d2b33a09b` hardcodes Garnet across injection, expectations, and ownership. The issue's
measured default generator output is Redis. The first commit must be tests only.

## Completed

- Harness activation and PLAN-EVAL N/A decision.
- Focused source/test inspection and two-slice design.

## In Progress

- Generator-backed RED regression for the default cache backend.

## Next Steps

1. Run and commit the RED test alone, then push/open the draft PR.
2. Capture same-flags E2E scaffold output.
3. Implement and test typed discovery.
4. Run the four required wrappers and obtain separate-session IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Discover from generated helper | issue #1870 | Require a unique consistent RESP triple. |
| Preserve synthetic names/keys | issue #1870 | Only real cache resource data becomes dynamic. |

## Drift and Debt

- Drift: RTK is unavailable on this host; focused raw reads are used, structured wrappers remain verdict sources.
- Debt: none.

## Commits

- See the draft PR commit list and per-slice comments after the RED commit is pushed.
