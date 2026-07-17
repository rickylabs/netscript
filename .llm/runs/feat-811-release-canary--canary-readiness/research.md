# Research — feat-811-release-canary--canary-readiness

## Re-baseline

- Carried-in sources: issue #811, PR #810 and branch `fix/mcp-readme-text-import`, and the user-specified release toolbelt.
- Re-derived against `origin/main` at `a5adb706` on 2026-07-17.
- PR #810 currently contains its harness plan and PLAN-EVAL only. It owns the import-attribute scanner change; this run must call `release:preflight` and must not copy that scanner.
- Existing release tests are green at baseline: `deno test --allow-all .llm/tools/release/` reported 29 passed, 0 failed.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `cut.ts` already centralizes the exact workspace bump through `coordinateVersionBump`, checks old-version residue, calls both release preflight surfaces, runs publish dry-run and `deno ci --prod`, then opens a release PR. | `.llm/tools/release/cut.ts`; `.llm/tools/deps/bump-version.ts` |
| 2 | Real publication is already one atomic workspace command through `run-publish.ts` → `publishWorkspace`; retries skip already-published members. The canary must invoke this path, not publish members itself. | `.llm/tools/release/run-publish.ts`; `publish-workspace.ts`; `publish.yml` |
| 3 | The root workspace declares glob and explicit members, while `publishWorkspace` discovers only direct `packages/*` and `plugins/*`. Completeness must compare the two sets and explicitly exclude `packages/bench` and `packages/cli/e2e`. | `deno.json`; `.llm/tools/deps/workspace.ts`; `preflight-release.ts` |
| 4 | Existing first-publish building blocks already exist: README conformance, tagline byte cap, JSR provisioning, package metadata, and docs-site reference pages. They are not composed into one verdict. | `check-readme-standard.ts`; `check-jsr-tagline-length.ts`; `jsr-provision-packages.ts`; `docs/site/reference/` |
| 5 | JSR's registry API exposes all package versions at `https://jsr.io/@<scope>/<package>/meta.json`, including yanked status. The management API should not be used for version discovery. | https://jsr.io/docs/api |
| 6 | JSR prereleases are excluded from Latest and may be yanked but never deleted. This supports `<target>-canary.N` without changing the stable channel. | https://jsr.io/docs/packages#pre-release-versions; https://jsr.io/docs/packages#yanking-versions |
| 7 | `workflow_dispatch` triggered with `GITHUB_TOKEN` creates a workflow run, and the REST endpoint accepts a workflow filename plus inputs. Commit-status writes require `statuses: write`. | GitHub Actions `GITHUB_TOKEN` docs; Actions workflow-dispatch REST docs; commit-status REST docs |
| 8 | `resolveGithubToken` currently tries env, `gh auth token`, and GCM, but it does not directly read `~/.config/gh/hosts.yml`. Issue #811 ratifies that file as the final local fallback. | `.llm/tools/agentic/lib/agentic-lib.ts:1009` |
| 9 | `github-release.ts` has no canary-pair guard. A status context on the pre-bump SHA can be checked for the current commit or an immediate version-only parent, preserving content identity across the canary and release bumps. | `.llm/tools/release/github-release.ts`; `git show -s --format=%P HEAD` |
| 10 | PR #810's owner correction makes the import-attribute ban conditional: lift only after denoland/deno#35546 is fixed, merged, released, and a text-import probe passes an authenticated canary publish. | PR #810 owner comment 4999659602 |

## jsr-audit surface scan

- Surface scanned: every effective `@netscript/*` member returned by `publishWorkspace`, plus root workspace members used for completeness and lockstep checks.
- New-package risks: missing production README sections, over-cap JSR description tagline, missing license/exports, missing docs-site reference, or an unprovisioned package/repository link.
- Publish risks: a member omitted by discovery, non-lockstep manifest versions, stale or versionless internal specifiers, registry-unsafe import attributes, and dry-run-only false confidence.
- Slow-type/public API risk: no published runtime symbol changes. The existing atomic publish dry-run remains the type-surface gate.

## Relevant debt

- `release provenance — OIDC publish workflow deferred` is stale: the existing `publish.yml` and the beta.10 partial publish prove OIDC is live. This run will close the entry with concrete workflow evidence.
- `ISSUE-167-PROD-JSR-SCAFFOLD-E2E` remains open until an actual canary-pinned `e2e-cli-prod` run is green; workflow code alone is not closure evidence.

## Open questions

- None. Branch lifetime, tag retention, status-context identity, target-version validation, and the #810 integration boundary are locked in `plan.md`.
