Review implementation slice 4 for issue #811 in `/home/codex/repos/b10-canary` as the separate
opposite-family reviewer. Use the native Claude Opus 4.8 medium fallback because Fable 5 is
unavailable in this environment. Do not delegate and do not edit any file.

Review the uncommitted diff, especially:

- `.github/workflows/release-canary.yml`, `publish.yml`, and `e2e-cli-prod.yml`
- `.llm/tools/release/github-release.ts` and tests
- `.llm/tools/release/release-canary-workflow_test.ts`
- `.llm/tools/agentic/lib/agentic-lib.ts` and tests

Check the ratified #811 contract: workflow_dispatch stable target; shared `release:canary` cut;
publish-readiness before provisioning; the same dry-run/real-graph/real-publish path as stable;
OIDC and least-sufficient workflow permissions; no GitHub Release or Latest mutation; exact
canary-version dispatch to `e2e-cli-prod.yml` using `return_run_details`; awaiting that exact run
before a success `release/canary-pair` commit status on the pre-bump content SHA; failure status,
job summary, and ephemeral-branch cleanup. Verify stable `release:publish` fails closed unless the
current SHA or an immediate version-only parent's status is green, with source changes rejected.
Verify `resolveGithubToken` has an in-process, secret-safe `~/.config/gh/hosts.yml` `oauth_token`
fallback and synthetic coverage. Look for Actions expression/shell/API errors, races, permission
gaps, tag/ref mistakes, and ways stale evidence could authorize changed content.

Validation already green: 79 focused tests, touched TypeScript check, and Deno `@std/yaml` parsing
for all three touched workflows. Re-run focused evidence if useful. Return findings ordered by
severity with file/line references. End with exactly `SLICE_REVIEW_PASS` if there are no blocking
findings, otherwise `SLICE_REVIEW_FAIL`.

