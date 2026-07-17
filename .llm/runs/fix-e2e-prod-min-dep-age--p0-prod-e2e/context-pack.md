# Context Pack

- Phase: IMPL-EVAL handoff
- Baseline: current `origin/main` at `8a8a9537`
- Problem: direct published plugin-ai lifecycle `deno x` lacks the release-harness minimum-age
  override and fails for roughly 24 hours after publishing.
- Scope: entire e2e published-NetScript command sweep, one command fix, anchored unit test, README
  clarification, exact shipped-CLI follow-up call sites.
- PLAN-EVAL: PASS, committed by separate evaluator as `4d9ca0f8`.
- Implementation: S1 complete; all requested gates and opposite-family slice review PASS.
- Next: sign-off commit/push, update draft PR evidence, run separate-session IMPL-EVAL. Do not merge.
