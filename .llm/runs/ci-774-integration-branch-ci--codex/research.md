# Research — ci-774-integration-branch-ci--codex

## Re-baseline

- Carried-in source: issue #774 and the owner-provided slice brief.
- Re-derived against `origin/main` @ `10162bfdade3d2bbe7465b49d777bf30cca17379` and the actual PR
  base `origin/feat/beta10-integration` @ `2b7d0f8192c23e4c93bcbfcb67fdf531bcbf3c42` on 2026-07-16.
- The issue's trigger diagnosis is current. An additional job-level base filter exists in
  `.github/workflows/e2e-cli.yml`; no other PR workflow has a base-branch restriction.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `ci.yml` limits `pull_request` bases to `main` and `feat/package-quality`, so integration-branch PRs never create `check-test`, `quality`, `deps-report`, or `close-gate`. | `.github/workflows/ci.yml:23-27` |
| 2 | `e2e-cli.yml` receives every PR event but its `classify` job only applies to base `main` or an `e2e-cli-gate` label. Downstream scaffold jobs therefore report skipped/cancelled on ordinary integration PRs. | `.github/workflows/e2e-cli.yml:65-71` |
| 3 | PR #770 targeted `feat/beta10-integration` at `40ecc87c…`; its check runs show successful `code-quality` and `surface-diff`, while `classify changes`, `scaffold-static`, and `scaffold-runtime` were skipped/cancelled. | GitHub REST: `/pulls/770` and `/commits/40ecc87c/check-runs` |
| 4 | `code-quality.yml` has no pull-request base filter; its `branches: [main]` belongs only to the `push` event. `surface-diff.yml` also has no base filter. | `.github/workflows/code-quality.yml:3-12`; `.github/workflows/surface-diff.yml:3-7` |
| 5 | Legacy branch protection reports 404, but active repository ruleset `main-branch-protection` targets `~DEFAULT_BRANCH` and requires `quality`, `check-test`, and `deps-report`. Both asked checks are required on `main`. | GitHub REST: `/branches/main/protection`, `/rulesets`, `/rulesets/18459345` |
| 6 | Neither core CI nor scaffold policy currently emits a consolidated lane ran/skipped summary. Scaffold jobs deliberately return success even when policy-skipped, which makes job conclusion alone ambiguous. | Existing job graph in both workflow files |

## jsr-audit surface scan (package/plugin waves)

N/A. This slice changes GitHub Actions YAML plus tracked harness artifacts; it touches no package,
plugin, public TypeScript surface, dependency, or Deno task wiring.

## Open questions

None that force rework. The visibility surface is locked to dependency-free GitHub job summaries in
both affected workflows, avoiding PR-comment write permissions and cross-workflow race conditions.
