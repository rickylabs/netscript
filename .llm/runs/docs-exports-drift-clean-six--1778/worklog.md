# Worklog: adopt six clean package references

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-exports-drift-clean-six--1778` |
| Branch | `docs/exports-drift-clean-six` |
| Archetype | N/A — docs tooling policy |
| Scope overlays | docs |

## Design

### Public Surface

- No product public surface changes. `AUTHORITATIVE_MAPPING` gains six internal policy records.

### Domain Vocabulary

- `PackageMapping` — binds one package export map to one published reference page.
- `SymbolCoverage` — declares whether the page guarantees entrypoints or a complete symbol inventory.

### Ports

- Package `deno.json.exports`, reference Markdown, and `deno doc` are the existing checker inputs;
  no new port is introduced.

### Constants

- `AUTHORITATIVE_MAPPING` — the finite set of package/page policies enforced by the gate.

### Commit Slices

| # | Slice | Gate | Files |
| - | - | - | - |
| 1 | Bootstrap the harness decision record. | Artifact review | `.llm/runs/docs-exports-drift-clean-six--1778/**` |
| 2 | Adopt the six package policies and record all gates. | Required gate set | `.llm/tools/docs/check-exports-drift.ts`, run artifacts |

### Deferred Scope

- Repairing symbol omissions — belongs to later #1777 slices and would violate the hard boundary.
- IMPL-EVAL — supervisor-dispatched separate session after this implementation handoff.

### Contributor Path

To adopt another package, compare its `deno.json.exports` with its reference export table, probe
`complete`, choose the strongest page-true mode, and add one reason that explains that page's scope.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-30 | 1 | research | Read required skills, harness docs, both issues, existing mappings, six pages/export maps, and both asset generators. |
| 2026-08-30 | 1 | policy probes | Six-package entrypoint probe exits 0. Complete probes: `cron` exits 0; other five exit 1 with concrete symbol omissions. |
| 2026-08-30 | 1 | plan gate selection | `PLAN-EVAL: N/A` — complete issue contract, hard boundary, empirical decision rule, and fixed gate set leave no unresolved plan decision. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| `cron`: `complete` | All symbols and entrypoints are inventoried; complete probe exits 0. | Page, export map, `checkDrift` probe |
| Other five: `entrypoints-only` | Pages guarantee their entrypoint topology while curating or summarizing symbol details; complete probes expose omissions. | Pages, export maps, `checkDrift` probes |
| No asset generation | `.llm/tools/**` is outside the rendered-site/external-bundle corpus and explicit publish asset inputs. | Both named generator sources |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| None so far | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Required commands | See final gate log after implementation. | NOT_RUN | Pending mapping edit. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Docs source alignment | PASS | Page/export review and complete probes | Policy decisions are evidence-backed. |
| Scope separation | PENDING_SCRIPT | Final path diff | Must prove zero `docs/site/**` changes. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Runtime behavior | N/A | No runtime source changed. | — |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Published reference drift | NOT_RUN | `deno task docs:exports-drift` pending | — |

## Handoff Notes

- Inspect the six reasons first, especially why only `cron` claims `complete`.
- Re-run complete-mode probes if any page or export map moves before evaluation.
