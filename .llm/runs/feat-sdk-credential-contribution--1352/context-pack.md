# Context Pack: typed bearer credential contribution (#1352)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-sdk-credential-contribution--1352` |
| Branch | `feat/sdk-credential-contribution` |
| Current phase | `implement` |
| Archetype | 2 Integration + 4 Public DSL/Builder + 5 Plugin Package |
| Scope overlays | service contract/client guidance; no local runtime |

## Current State

The leaf is activated and re-baselined on current `origin/main`. The standing S5 design is locked,
PLAN-EVAL is recorded N/A, no implementation source has changed, and the lock remains identical to
the current base.

## Completed

- Loaded harness/doctrine/toolchain/PR/JSR instructions and relevant doctrine/archetype/gate docs.
- Read the locked S5 plan and RFC factory/security/reference contracts.
- Used `deno doc` before broad source reads for SDK, service, auth-core, and plugin surfaces.
- Recorded doc-lint and JSR pre-change baselines.

## In Progress

- Slice 1: auth-core factory, metadata, and focused non-disclosure tests.

## Next Steps

1. Commit/push this bootstrap and open the draft PR with complete requested metadata.
2. Implement and gate auth-core.
3. Implement plugin/auth manifest and starter resource.
4. Update docs, run the complete allowed gate set, and hand off for separate IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Consume only public contribution seam | clustered plan/RFC | No SDK internal or service source edits. |
| Explicit availability and selection | clustered plan/RFC | Manifest references do not activate contributions. |
| Credential values absent from durable evidence | owner directive | Tests report only booleans/counts; run artifacts contain none. |

## Files Changed

Only scoped run artifacts are added at bootstrap; implementation files are pending.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | baseline captured | `research.md` |
| Fitness | baseline captured | JSR audits and doctrine review |
| Runtime | prohibited locally | fake in-process transport only is planned |
| Consumer | pending | public subpath/reference/type probes |

## Open Questions

- None.

## Drift and Debt

- Drift: historical lock baseline updated to current-main hash; `rtk` unavailable.
- Debt: no new debt planned; pre-existing findings are named in `research.md`.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
