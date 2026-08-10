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
| 2026-08-10 | 3.2 | implement | Added source-format production check and focused checker unit test to the docs-aware quality lane. |
| 2026-08-10 | 3.3 | implement | Added path-scoped PR trigger to existing Pages build; guarded all Pages/deploy mutations and keyed concurrency per ref. |

## Gate Results

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Source format | `deno task check:source-format` from `docs/site` | PASS | Pure `--no-lock` source walk. |
| Checker unit test | `deno task test:source-format` from `docs/site` | PASS | Focused positive/negative regression suite. |
| Full docs build | `deno task build` from `docs/site` | PASS | Source format, Lume render, and rendered-output all pass. |

## Reconcile Notes

- 3.1: issue #1408 remains open on milestone 0.0.6; required labels confirmed; draft PR opening follows this commit.
- 3.2: PR #1440 has no new reviewer comments or issue changes; D8 and the planned slice remain current.
- 3.3: no new reviewer direction; extending the existing Pages workflow remains the smallest single-source implementation of D8.

## Handoff Notes

- Evaluator should inspect workflow event/permission/concurrency semantics, RED/GREEN provenance, and lock equality first.
