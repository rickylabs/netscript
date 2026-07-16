# Worklog: fix #773 — render_ui recursion hole

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-773-beta10-stabilization--render-ui-recursion` |
| Branch | `fix/773-beta10-stabilization` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Design

### Public Surface

- No exported symbol changes.
- Copy-source entry: `FRESH_UI_REGISTRY_CONTENT['src/ai/render-ui.tsx']` must exactly match the
  owning source file.
- CI contract: `deno task check:assets-barrel` must remain green for every PR targeting supported
  integration branches.

### Domain Vocabulary

- `RENDER_UI_MAX_DEPTH` — existing maximum recursion budget.
- `RenderUiFallbackReason` — existing fallback vocabulary including `max-depth`.
- embedded registry content — generated source copied into consumer-owned projects.
- asset freshness — byte equality between each manifest source and its generated embedded string.

### Ports

- None. Generation uses the existing filesystem edge tool; no new abstraction is justified.

### Constants

- `RENDER_UI_MAX_DEPTH` — unchanged at `6`.
- Fresh UI registry key — existing `src/ai/render-ui.tsx` manifest path.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove the shipped renderer is bounded and generated assets cannot drift in CI. | targeted registry/source tests; `check:assets-barrel`; scoped/package/framework gates | `packages/fresh-ui/registry.generated.ts`, registry regression test, `.github/workflows/ci.yml`, run artifacts |

### Deferred Scope

- Dynamic execution of generated TSX text — exact source equality composes with the existing
  nested-array behavior test and avoids a new temp-module test harness.
- Broader generated-asset tooling refactor — the existing shared generator and task are sufficient.

### Contributor Path

Edit the owning registry source, run `deno task gen:assets-barrel`, and commit the regenerated
artifact. CI's `check:assets-barrel` step and the focused registry equality test reject omissions.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-16 | bootstrap | research and design | Issue #773 read via API; source/embed mismatch and unwired existing gate confirmed. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Reuse the existing generator and freshness task. | It owns all affected generated barrels and already encodes reproducibility. | plan D1/D3 |
| Test embedded/source equality at the registry layer. | It fails on the exact stale-copy condition while source tests prove behavior. | plan D2 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| PLAN-EVAL dispatch belongs to the external supervisor for this Tier-D slice. | minor | yes |
| Frontend overlay's `.claude/05-frontend.md` is absent. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Issue API read | GitHub REST API with `resolveGithubToken` | PASS | Full issue body, comments, labels, milestone, and events read. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Generated registry freshness | NOT_RUN | planned `check:assets-barrel` | Reproduction must run first. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Nested-array bounded rendering | NOT_RUN | planned targeted test | Source test exists; embed is stale. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Copy-source Fresh UI consumer | NOT_RUN | planned registry equality and scaffold runtime | — |

## Handoff Notes

- Evaluator should inspect the pre-regeneration reproduction, the one-line embedded behavior delta,
  the registry equality regression, and CI gate placement first.

