# Worklog: Hybrid semantic documentation retrieval RFC

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `docs-rfc-mcp-hybrid-retrieval--hybrid-semantic-doc-retrieval-rfc` |
| Branch | `docs/rfc-mcp-hybrid-retrieval` |
| Archetype | `2 - Integration` (described target) |
| Scope overlays | `docs` |

## Design

Design is intentionally not locked at bootstrap. Before the RFC authoring slice, this section will
name the exact public API, domain vocabulary, port and adapters, constants, composition root,
commit slices, deferred scope, and contributor path required by the selected Archetype 2 profile.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 0 | Activate the run and establish the mobile review surface | clean diff; explicit-refspec push; draft PR metadata | `.llm/runs/docs-rfc-mcp-hybrid-retrieval--hybrid-semantic-doc-retrieval-rfc/*` |
| 1 | Research and lock the RFC architecture | source-alignment and Plan-Gate author checklist | run artifacts; RFC |
| 2 | Validate and hand off to separate PLAN-EVAL | docs/RFC checks, exact diff, lock hygiene, structured comments | run artifacts; RFC |

### Deferred Scope

- All feature implementation and runtime validation — acceptance of the RFC precedes those lanes.

### Contributor Path

Read the eventual RFC contract and rollout slices, then use the companion tracking issue to open
separate implementation work only after acceptance.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-08-09 | 0 | activation | Read all selected skills and required harness/RFC authority; verified baseline, identity, managed daemon, and remote-control process. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Select PLAN-EVAL | Architecture and technology choices are decision-heavy. | Owner brief; `gates/plan-gate.md` |
| Do not launch evaluator | The owner requires author handoff to a fresh native Fable 5 medium session. | Owner brief; generator ≠ evaluator invariant |

## Drift

See `drift.md` for the authorized author-lane override and the unavailable read-only remote-control
status subcommand.

## Gate Results

Gate tables will be populated with raw evidence during the handoff slice. No runtime gates will be
run because the owner explicitly prohibited starting runtime resources.

## Handoff Notes

- PLAN-EVAL is selected but has not run. No `plan-eval.md` exists until the separate evaluator
  session writes it.

