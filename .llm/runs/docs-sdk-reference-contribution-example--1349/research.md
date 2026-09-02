# Research — docs-sdk-reference-contribution-example--1349

## Re-baseline

- Carried-in source: issue #1349, PR #1927, and `/home/agent/observability/1349-evidence-block.md`.
- Re-derived against `origin/main` at `4720596fcd0a4c00d72616bec9739be8796718fe` on 2026-09-02.
- Contribution counts: `packages/sdk/README.md` = 18, `docs/site/services-sdk/sdk.md` = 17,
  `docs/site/reference/sdk/index.md` = 0. The README count increased from the carried-in count of 14;
  the coverage conclusion did not change.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The reference page is the only one of the three requested docs surfaces with no contribution coverage. | `grep -ci contribution` against the three paths. |
| 2 | `CreateServiceClientOptions.contributions` accepts a literal tuple constrained by `ValidateSdkClientContributions`. | `deno doc --filter CreateServiceClientOptions packages/sdk/src/client/mod.ts`. |
| 3 | `SdkClientContribution` is a six-field descriptor: `protocol`, `id`, `context`, `headerKeys`, `responseCache`, and `prepare`. | `deno doc --filter SdkClientContribution packages/sdk/src/client/mod.ts`. |
| 4 | The guide already explains auth/locale composition narratively; the reference should be a compact surface inventory plus one independently compiling composition example. | `docs/site/services-sdk/sdk.md`, section `Typed request contributions`. |
| 5 | The Pages build job invokes `deno task docs:snippets` for snippet compilation. | `.github/workflows/pages.yml`, `Check documentation snippets`. |
| 6 | PR #1927 is still open at the research checkpoint, so its row-7 evidence must be rechecked before the closing PR is opened. | GitHub PR #1927 metadata fetched 2026-09-02. |

## jsr-audit surface scan (package/plugin waves)

- N/A: this is a consumer-documentation-only slice and changes no package or plugin source/export.

## Open questions

- None for implementation. PR #1927 merge state is a close-gate precondition to recheck before opening the PR.
