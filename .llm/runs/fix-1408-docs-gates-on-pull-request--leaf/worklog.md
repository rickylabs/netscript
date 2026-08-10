# Worklog: PR-reachable docs-site gates

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1408-docs-gates-on-pull-request--leaf` |
| Branch | `fix/1408-docs-gates-on-pull-request` |
| Archetype | N/A — infrastructure workflow only |
| Scope overlays | docs |

## Design

### Public Surface

- GitHub required-check surface for docs changes; no product API changes.

### Domain Vocabulary

- `needs_docs` — classifier output selecting docs quality work.
- PR docs build — path-scoped validation run that never deploys.

### Ports

- GitHub Actions events and existing Deno tasks.

### Constants

- Existing task names and `github.event_name`; no new code constants.

### Commit Slices

Slices 3.1–3.6 are enumerated in `plan.md`, each with its proof, gate, and files.

### Deferred Scope

- `diagrams:check` remains local due to its networked Mermaid CLI dependency.
- Separate-session IMPL-EVAL and lifecycle transition remain supervisor-owned.

### Contributor Path

Future docs gate routing changes start in `docs/site/deno.json`, then use `ci.yml` for cheap docs checks and `pages.yml` for built-site checks.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-10 | 3.1 | bootstrap | Fetch/status clean; live issue and baseline verified; PLAN-EVAL N/A recorded. |

## Gate Results

Pending implementation.

## Reconcile Notes

- 3.1: issue #1408 remains open on milestone 0.0.6; required labels confirmed; draft PR opening follows this commit.

## Handoff Notes

- Evaluator should inspect workflow event/permission/concurrency semantics, RED/GREEN provenance, and lock equality first.
