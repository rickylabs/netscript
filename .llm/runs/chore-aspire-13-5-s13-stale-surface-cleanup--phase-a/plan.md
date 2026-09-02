# Plan: S13 stale version-bound surface cleanup and parity phase 2

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-aspire-13-5-s13-stale-surface-cleanup--phase-a` |
| Branch | `chore/aspire-13-5-s13-stale-surface-cleanup` |
| Phase | `plan` |
| Target | `packages/mcp`, `packages/cli`, validation tooling, generated carriers |
| Archetype | `6 — CLI / Tooling` (largest affected archetype; MCP's Archetype 2 seam folds within the slice) |
| Scope overlays | `docs` for the one MCP README contract line and run artifacts |

## Archetype and Doctrine Verdict

`packages/cli` is Archetype 6 and `packages/mcp` is Archetype 2. Both have a current **Keep**
verdict. The slice preserves the CLI kernel/surface split and MCP's port/adapter boundary.

## Goal

Land the ratified D-17 endpoint chain, remove every S13-owned stale surface, and implement complete
phase-2 parity enforcement without flipping CI before its three upstream dependencies reach main.

## Scope

- RED-first focused tests for D-17, generated templates, Windows env output, consumer CI, wording,
  unused constant removal, MCP process detection, and parity phases.
- Pure endpoint selection in the MCP domain with Aspire process IO behind an injected port and a
  shared banner-tolerant parser/adapter at the infrastructure edge.
- S13 manifest cleanup, regenerated asset/publish carriers, and a deterministic manifest refresh.
- `--phase 2` enforcement and stale-manifest checking while phase 1 stays default.

## Non-Scope

- No `docs/site`, skill behavior prose, resource emission, version pins, archival rows, AppHost
  start, containers, or runtime E2E.
- No CI phase-2 flip unless S1 #1727, S9 #1759, and S11 #1771 are all on `main`.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D-17 | explicit → `NETSCRIPT_TELEMETRY_ENDPOINT` → `ASPIRE_DASHBOARD_PORT` → injected `aspire_ps` → named default, preserving `source` | Coordinator-ratified in D-60. |
| P2 | Phase 2 enforces every non-archival manifest row; compat fixture asserts 13.5.3; lockfile skips. | Epic D-13/D-16. |
| IO | Domain code consumes a small injected port; only infrastructure executes `aspire ps`. | A7/A11 and the user boundary. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| CI phase-2 flip | safe to defer | Mechanical dependency check at the final slice; no implementation redesign. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Sync endpoint construction could hide process IO. | Keep selection pure and inject an edge-owned reader; test the S2 and empty-array shapes. |
| Generated assets mask source-template drift. | Change source first, then run both checked-in generators and freshness gates. |
| S1 is absent from this stack. | Import only the phase-1 validation contract needed for phase-2 evolution; retain phase 1 default and record convergence ordering. |
| Phase-2 sweep mistakes historical evidence for current surface. | Derive exclusions only from manifest `archival:*` rows plus ignored `.llm/runs/**` and `.llm/tmp/**`. |

## Anti-Patterns and Fitness Gates

Avoid AP-2/AP-3 (IO in domain/application), AP-5/AP-11 (helper/port without a real seam), AP-8
(leaky public surface), AP-14 (unbounded process IO), AP-18 (duplicated template truth), AP-21/AP-22
(structural drift). Required evidence: scoped wrapper check/test/lint/fmt, `quality:scan`,
`arch:check`, asset/publish freshness, emitted samples, Claude mirror, parity phases, manifest
freshness, and package JSR checks. No new debt is planned.

## Commit Slices

1. RED-first executable contracts plus activated run artifacts.
2. D-17 resolver, shared injected Aspire-ps edge, and MCP README line.
3. S13 cleanup/templates/env/consumer CI plus regenerated carriers and manifest.
4. Parity phase 2 and both-phase tests, retaining phase 1 default.
5. Exact-head gates, dependency/flip disposition, and evaluator handoff artifacts.
