# Context Pack: custom workers job registry generation (#1234)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-generate-plugins-custom-job-registry--1234` |
| Branch | `fix/generate-plugins-custom-job-registry` |
| Current phase | `implement` |
| Archetype | `5 - Plugin Package` + `6 - CLI and Tooling` |
| Scope overlays | `docs` |

## Current State

The plan is locked and PR #1239 is draft with `status:impl`. The custom-only installed-plugin test
reproduced the missing-registry RED, then passed after the workers scaffold include overlay was
removed. The full installed-registry integration file passes 9/9.

## Completed

- Read required harness, PR, doctrine, CLI, tools, RTK, and JSR-audit instructions.
- Read live issue #1234 and re-baselined to current `origin/main`.
- Reproduced the custom-only missing-registry failure.
- Mapped plugin/CLI archetypes, doctrine rationale, public contract, E2E workaround, docs, and gates.
- Recorded the milestone D6 composed-evaluation waiver.
- Captured the targeted custom-only test RED before changing the manifest.
- Proved the manifest change GREEN through the same targeted test and the full integration file.

## In Progress

- Commit and push slice 1, then migrate Flow B to public regeneration and update docs.

## Next Steps

1. Open the draft PR with `Closes #1234`, milestone 0.0.5, and required namespaced labels.
2. Change the integration test to a custom-only job and capture RED.
3. Remove the scaffold include overlay and capture GREEN.
4. Migrate Flow B to project config plus public regeneration; update docs.
5. Run merge-readiness gates and composed evaluation, then mark the PR ready.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Delete the entire `profiles.scaffold` registry overlay | `plan.md` D1 | Retain the profile argument for sample configuration; structural defaults discover jobs. |
| No new metadata/profile API | `plan.md` D4 | E2E-only aliases move to generated project config. |
| Custom-only installed-plugin test is the contract proof | `plan.md` D3 | It fails on baseline and exercises the public installed manifest path. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/fix-generate-plugins-custom-job-registry--1234/` | new | Harness research, locked plan, supervisor identity, worklog, drift, and context. |
| `plugins/workers/scaffold.runtime.json` | changed | Removed the closed scaffold sample include overlay. |
| `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts` | changed | Custom-only RED/GREEN contract coverage. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | targeted GREEN | Installed-registry integration: 9 passed, 0 failed |
| Fitness | selected | A5 + A6 + docs overlay in `plan.md` |
| Runtime | RED reproduced | Fresh custom-only scaffold exits 1 on missing registry |
| Consumer | RED reproduced | Public `generate plugins` installed-plugin path |

## Open Questions

- None before implementation.

## Drift and Debt

- Drift: composed evaluation waiver and foreign pre-existing `deno.lock` modification recorded.
- Debt: no new debt planned; existing workers/CLI doctrine debts are not claimed closed.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
