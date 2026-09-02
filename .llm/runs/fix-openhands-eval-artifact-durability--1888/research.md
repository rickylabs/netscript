# Research — fix-openhands-eval-artifact-durability--1888

## Re-baseline

- Carried-in source: issue #1888 defect locations and immutable reproducer run `33533773165` at
  `bb5fd4ad`.
- Re-derived against the supplied base `302409f0c9062ec01005c74eb9c6a82898a26036` on 2026-09-01.
- Current checkout started exactly at the supplied base. The workspace `main` ref has advanced, but
  this leaf intentionally remains pinned to `302409f0c`; `deno.lock` matches that base byte-for-byte.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | Formal evaluators deliberately skip the PR-branch commit-back. | `.github/workflows/openhands-agent.yml`, `Commit run artifacts to PR branch` condition |
| 2 | The artifact upload includes the runner temp dir and compact trace, but not an evaluator-authored `.llm/runs/**/plan-eval.md` or `evaluate.md` left in the checkout. | `Prepare OpenHands artifact paths` and `Upload OpenHands artifacts` |
| 3 | Both shell and JavaScript summary parsers stop at the first valid verdict line, so multiple tokens are silently accepted. | `Materialize OpenHands trace` and `verdictOf()` in the final-comment step |
| 4 | The remote status marker already records phase and immutable evaluated head; local status returns raw trace metadata, so a shared provenance record can make them agree without changing either reader. | `.llm/tools/agentic/openhands/openhands-status.ts`; `.llm/tools/agentic/lib/agentic-lib.ts` |
| 5 | The pinned `actions/upload-artifact@v7` exposes an artifact URL, but that URL expires with retention. A unique Git ref gives the verdict a durable, exact blob URI and avoids the evaluated-head mutation entirely. | Official `actions/upload-artifact` README outputs/retention contract; Git commit/ref semantics |

## jsr-audit surface scan

- N/A: this slice changes GitHub Actions infrastructure and its focused tests only; it does not
  touch a package/plugin or public JSR surface.

## Open questions

- None. Artifact location, summary cardinality, failure behavior, reader provenance, and test scope
  are locked in `plan.md`.
