# Worklog: adopt the 0.0.x release scheme

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `version-scheme-0-0-x` |
| Branch | `chore/version-scheme-0-0-x` |
| Archetype | Multi-surface; Archetype 6 for CLI/tooling paths |
| Scope overlays | `SCOPE-docs` |

## Design

### Public Surface

- Release version contract: normal `0.0.x` releases and `<release>-canary.N` candidates.
- Existing `coordinateVersionBump` + `prepareRelease` pipeline; no new CLI command.
- Existing generated package-version constants; no new public exports unless a package lacks an
  internal generated metadata seam and the evaluator approves extending the generator.

### Domain Vocabulary

- **Tier 1** — mutable reference removed because the exact version conveys no contract.
- **Tier 2** — mutable prose retains only maturity stage (`beta` / `pre-1.0`).
- **Tier 3** — exact version required and demonstrably moved by the cut pipeline.
- **Historical** — immutable published-version evidence intentionally exempt from mutation.
- **Cut-owned mechanism** — JSON/lock replacement, generated publish assets, or runtime derivation
  from one of those assets.

### Ports

- Existing filesystem/process edges in release tooling only; no new port is justified.

### Constants

- Existing `CLI_PACKAGE_VERSION`, `NETSCRIPT_RELEASE_VERSION`, `FRESH_UI_PACKAGE_VERSION`,
  `PLUGIN_PACKAGE_VERSION`, and `MCP_PACKAGE_VERSION` are preferred.
- Any new version constant must be generated from the owning package manifest and included in
  `PUBLISH_ASSET_OUTPUTS`.

### Commit Slices

| # | Slice | Gate | Files |
| - | - | - | - |
| 1 | Release contract/process language | skill sync/check + release tests | skills, workflows, release tooling docs/tests |
| 2 | Publishable exact-version derivation | scoped wrappers + package tests + quality gate | affected package/plugin source and generator |
| 3 | Consumer fixtures/current docs | targeted tests + docs links | tests, docs, READMEs, resources/RFC templates |
| 4 | Final census/release proof | release dry-run + raw git restoration | run artifacts and PR body |

### Deferred Scope

- Actual `0.0.2` cut/publish, milestone mutation, history rewrite, unrelated refactors.

### Contributor Path

For a future exact version consumer: first consume an existing owning-package generated constant;
if absent, extend `.llm/tools/generate-publish-assets.ts`, add the output to
`PUBLISH_ASSET_OUTPUTS`, cover freshness, and verify `release:cut --dry-run`. Never add a standalone
version literal to publishable source.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-31 | Plan | Research/design | Reproduced 325 baseline occurrences; corrected manifest/lock floor to 237 and cut-owned floor to 258. |
| 2026-07-31 | Plan-Gate | Evaluator launch | Local Qwen canary BLOCKED: isolated `claude-openrouter` credential absent; no session launched. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Report all-occurrence and reducible-remainder counts | Brief expectation conflicts with cut-owned manifests/locks | `research.md` Findings 2–5 |
| Single sequential run | Owner requires one branch/PR and slices share one release contract | `plan.md` D7 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Owner-established run ID omits canonical suffix | minor | yes |
| At least 258/325 occurrences are necessarily Tier 3 | significant | yes |
| Local formal evaluator credential unavailable | significant | yes |

## Gate Results

All implementation gates are `NOT_RUN` until PLAN-EVAL returns `PASS`.

### Plan-Gate Transport

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Local formal evaluator canary | `deno task agentic:provider-canary --live --profile claude-openrouter --model qwen/qwen3.7-max --effort high --worktree /home/codex/repos/b12-scheme` | BLOCKED | `credential=absent`, `auth_required`; no evaluator session started |
| PLAN-EVAL | separate open-model session | NOT_RUN | Awaiting owner-authorized evaluator transport/authentication |

## Handoff Notes

- PLAN-EVAL should spot-check the 325 census and the 258 cut-owned floor.
- It should reject any plan interpretation that rewrites historical beta releases or commits bumped
  `deno.json` versions.
