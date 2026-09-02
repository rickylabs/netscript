# Context Pack: Slice G consumer guidance and hosted acceptance hook

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-cli-resource-slice-acceptance--1354-g` |
| Branch | `feat/cli-resource-slice-acceptance` |
| Current phase | `implementation complete — commit/push/PR handoff` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

Exactly the eight amended product files are implemented on Slice F head `8c27ffe164fc8dab8e16796e602693e6dea95c1e`. PR #1891 authorized item 8; focused tests are 55/55 and the full CLI suite is 1716/1716. All permitted author-lane static, asset, publish, docs, JSR, doctrine, and quality gates are green. Hosted runtime remains CI-owned.

## Completed

- Read the requested skills, harness workflow, Archetype 6 guidance, relevant doctrine, and locked upstream plan.
- Implemented IDs, resource gate definitions, composition, runtime selection, exact command/stdout tests, rendered guidance, and the authorized runner stdout fixture in exactly eight product files.
- Focused regressions pass 55/55; full CLI tests pass 1716/1716; CLI check reports 0 diagnostics; scoped lint/fmt report 0 findings.
- Asset/publish/docs/JSR/fitness gates all exit 0; doctrine reports `FAIL=0` throughout and quality scan reports 0 findings.
- Recorded `PLAN-EVAL: N/A` per owner direction.

## In Progress

- Final raw status/lock review, commit, exact push, and non-draft stacked PR creation.

## Next Steps

1. Verify the eight-file ceiling and `deno.lock` cleanliness against the exact base.
2. Commit and push `HEAD:refs/heads/feat/cli-resource-slice-acceptance`.
3. Open the required non-draft PR against `feat/cli-resource-slice-activate` with exact labels and milestone.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Generate `users` from client `users`, procedure `list`, with `--partial`. | locked plan/current scaffold | Explicit selection avoids two-client ambiguity. |
| Compose after `service.list`. | locked plan | Before all generated quality/type-check gates. |
| Rerun must report 11 skips and zero writes/conflicts. | planner/stager/reconciler | Eight owned leaves plus three shared files. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| eight amended Slice G product paths | modified/new | Implementation complete, including authorized item 8. |
| `.llm/runs/feat-cli-resource-slice-acceptance--1354-g/*` | new | Required harness context and blocker evidence. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS | Focused 55/55; full CLI 1716/1716; check 980 files/0 diagnostics; lint/fmt 8 files/0 findings. |
| Fitness | PASS | `arch:check` and `quality:gate` exit 0; `FAIL=0`; scanner findings 0. |
| Runtime | hosted only | Local run prohibited. |
| Consumer | static PASS / hosted pending | Guidance and resource definition tests pass; runtime execution is CI-owned. |

## Open Questions

- None in the author lane; hosted runtime and separate IMPL-EVAL remain downstream gates.

## Drift and Debt

- Drift: captured-stdout reachability required item 8; PR #1891 authorized and resolved it.
- Debt: none.

## Commits

- Slice G implementation is committed at local `HEAD`; exact pushed SHA and PR number are recorded in the final handoff after remote creation.
