# Context Pack: release-blocking harness hardening

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1087-harness-hardening--release-blockers` |
| Branch | `fix/1087-harness-hardening` |
| Current phase | `plan` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Current State

The requested branch is clean at the exact supplied baseline. All issue bodies and governing skills
were read. Research and design lock four sequential issue commits; no implementation has started.

## Completed

- Harness activation, archetype/overlay selection, issue-body research, source-path research, plan,
  risk register, validation design, and commit slicing.

## In Progress

- Bootstrap commit, draft PR, and separate PLAN-EVAL.

## Next Steps

1. Commit/push the run bootstrap and open the draft PR.
2. Run PLAN-EVAL in a separate local Qwen session with `Agent` denied by session configuration.
3. On `PASS`, implement #1087 and report its pushed commit/evidence immediately.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Guard child inference at a loopback request boundary. | plan D1-D3 | Exact allowlist, terminal abort, redacted JSONL audit. |
| Stage and verify publication content inside gh-pr invocation. | plan D4-D5 | Unique UUID path plus owner/fingerprint check. |
| Make Redis sensitivity a permanent CI negative control. | plan D6-D7 | No bad intermediate commit or force-push required. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1087-harness-hardening--release-blockers/` | new | harness control/evidence artifacts only |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | NOT_RUN | pending implementation |
| Fitness | PLAN_SELECTED | plan gate matrix and Archetype 6 review |
| Runtime | NOT_RUN | pending #1087/#1080 |
| Consumer | NOT_RUN | pending CI and release-note checks |

## Open Questions

- None blocking PLAN-EVAL.

## Drift and Debt

- Drift: owner-assigned Codex supervisor and temporary bootstrap evaluator `Agent` deny recorded.
- Debt: none created.

## Commits

- See the draft PR's commit list + per-slice PR comments.
