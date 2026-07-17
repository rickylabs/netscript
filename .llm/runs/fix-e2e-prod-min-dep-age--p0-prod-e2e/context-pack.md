# Context Pack

- Phase: Plan-Gate
- Baseline: current `origin/main` at `8a8a9537`
- Problem: direct published plugin-ai lifecycle `deno x` lacks the release-harness minimum-age
  override and fails for roughly 24 hours after publishing.
- Scope: entire e2e published-NetScript command sweep, one command fix, anchored unit test, README
  clarification, exact shipped-CLI follow-up call sites.
- Next: commit/bootstrap draft PR, obtain separate-session PLAN-EVAL PASS, then implement S1.

