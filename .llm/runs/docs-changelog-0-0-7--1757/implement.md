# Implementation: provisional CLI changelog for 0.0.7

## Outcome

Added `## 0.0.7` to `packages/cli/CHANGELOG.md` using the eleven-row Locked Changelog Map approved
by the post-escalation `PASS_PLAN`. The section has eleven plain consumer-facing bullets and no
release-introduction prose, hashes, PR numbers, attribution, or version bump.

## Baseline decision

The changelog content remains pinned to the independently evaluated range
`v0.0.6..13878a80a50c55b9662099fed64555f2310ae4a3` (33 commits: 17 Include, 16 Exclude).
Before implementation, live `origin/main` advanced to
`f8b4f804cc5fe77054d4f220974eae66becf090c`. The two later commits were inspected and recorded as
Exclude in `worklog.md`; neither changes the locked behavior map. The PR must call the section
provisional and require a top-up before the release cut.

## Derived assets

No regeneration is required:

- `.llm/tools/docs/build-agent-docs-bundle.ts:254-310` rebuilds only rendered site-owned
  `llms.txt`, `llms-full.txt`, and `pages/**/index.md` corpus entries.
- `.llm/tools/generate-publish-assets.ts:33-54` defines a closed `PUBLISH_ASSET_OUTPUTS` list that
  does not include `packages/cli/CHANGELOG.md`.

The required publish-assets, assets-barrel, and agent-docs-prose checks all exit 0 and leave no
tracked derived churn.

## Validation

| Command | Exit | Result |
| --- | ---: | --- |
| `deno task docs:links` | 0 | Pass: zero broken links, anchors, or orphans. |
| `deno task docs:readme:check` | 1 | Pre-existing: only `packages/bench/README.md` lacks `## Install`; independently identical on clean current `origin/main` (`f8b4f804`). |
| `deno task check:publish-assets` | 0 | Pass. |
| `deno task check:assets-barrel` | 0 | Pass. |
| `deno task check:agent-docs-prose` | 0 | Pass: fresh corpus, no stale paths. |
| `git diff --exit-code -- deno.lock` | 0 | Pass: unchanged. |
| `git diff --exit-code -- packages/cli/deno.json` | 0 | Pass: unchanged; version is still `0.0.6`. |

Tier-A review and a separate IMPL-EVAL are intentionally left to the coordinator after this
implementation handoff.
