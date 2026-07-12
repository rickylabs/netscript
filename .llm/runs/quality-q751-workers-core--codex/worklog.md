# #751 workers-core quality slice

## Preflight

- Baseline: `3b3d615bb535d985e49a4d2dcdcce5e03097babc` (required prefix matched).
- Branch: `quality/q751-workers-core`.
- PLAN-EVAL: owner-waived in the slice brief.
- Archetype: 3 (runtime/behavior); no scope overlay.

## Short plan

1. Re-baseline the package with the quality scanner and preserve runtime/public contracts.
2. Replace genuine type findings; retain only invariant upstream/generic boundary casts with
   line-local concrete allowances.
3. Run scanner, scoped check/lint/fmt, tests, doc lint, publish dry-run, architecture gate, and
   lock-hygiene checks.
4. Obtain separate-session IMPL-EVAL, commit the slice and this worklog, then push without opening a
   PR.

## Design

- Contract first: public exports and runtime values remain unchanged.
- The package's typestate builders and Zod/oRPC/stream adapters cross invariant generic APIs that
  TypeScript cannot represent without a conversion; those sites are audited explicitly rather than
  blanket-suppressed.
- No dependency, version, generated-output, or lockfile changes are in scope.

## Evidence

- Initial scanner: 50 findings (49 invariant casts, one documentation `any` example), 0 allowances.
- Final scanner: 0 findings; 14 concrete invariant/upstream boundary allowances (43 of 49 casts
  removed outright).
- Scoped check: 110 files, 0 diagnostics.
- Scoped lint: 110 files, 0 diagnostics.
- Scoped format: 110 files, 0 findings.
- Package tests: 25 passed, 0 failed.
- `doc:lint`: recorded 4 pre-existing `private-type-ref` diagnostics, 0 missing JSDoc; an attempted
  export exposed 62 transitive oRPC diagnostics and was reverted, leaving the baseline count
  unchanged.
- `deno publish --dry-run --allow-dirty`: green without `--allow-slow-types`; one existing
  dynamic-import warning.
- `deno.lock`: unchanged.
- Architecture gate: green (`FAIL=0` for `plugin-workers-core`; five pre-existing doctrine warnings
  recorded).
- First IMPL-EVAL: `FAIL_FIX` on the rejected blanket 49-allowance draft; implementation was revised
  before commit.
- Final separate-session IMPL-EVAL: `PASS`; evaluator independently reproduced the required gates.
