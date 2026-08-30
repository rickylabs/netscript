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
| 2026-08-30 | 1 | reconcile | Issue #1778 remains open at `status:impl`, milestone 0.0.7; umbrella #1777 remains reference-only. PR #1780 opened non-draft per owner direction with exactly one `status:impl`. No new comments required readjustment. |
| 2026-08-30 | 2 | implement | Added all six policies: `cron` complete; the other five entrypoints-only with distinct page-specific reasons. Mapping grew from 8 to 14. |
| 2026-08-30 | 2 | gate | All eight requested commands exit 0. `docs:readme:check` exits 1 on `packages/bench/README.md` both here and in a detached clean `origin/main` worktree. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| `cron`: `complete` | All symbols and entrypoints are inventoried; complete probe exits 0. | Page, export map, `checkDrift` probe |
| Other five: `entrypoints-only` | Pages guarantee their entrypoint topology while curating or summarizing symbol details; complete probes expose omissions. | Pages, export maps, `checkDrift` probes |
| No asset generation | `.llm/tools/**` is outside the rendered-site/external-bundle corpus and explicit publish asset inputs. | Both named generator sources |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| None | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Export drift | `deno task docs:exports-drift` | PASS (exit 0) | 14 policies; all six adopted. |
| Docs accuracy | `deno task docs:accuracy` | PASS (exit 0) | 199 published pages and 91/91 root/direct public commands checked. |
| Docs links | `deno task docs:links` | PASS (exit 0) | 103 docs; zero broken links/anchors. |
| Publish assets | `deno task check:publish-assets` | PASS (exit 0) | No stale generated output. |
| Assets barrel | `deno task check:assets-barrel` | PASS (exit 0) | Generator produced no tracked diff. |
| Agent docs prose | `deno task check:agent-docs-prose` | PASS (exit 0) | Site built; corpus reported `fresh: true`, no stale paths. |
| Tool type-check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/docs --ext ts` | PASS (exit 0) | 22 files, one batch, zero findings. |
| Lock hygiene | `git diff --exit-code -- deno.lock` | PASS (exit 0) | No lock diff. |
| README standard | `deno task docs:readme:check` | BASELINE FAIL (exit 1) | Only `packages/bench/README.md` lacks `## Install`. |
| Clean-main README standard | Same task in detached clean `origin/main` @ `de57fab0` | BASELINE FAIL (exit 1) | Same single `packages/bench/README.md` finding; temp worktree removal exit 0. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Docs source alignment | PASS | Page/export review and complete probes | Policy decisions are evidence-backed. |
| Scope separation | PASS | `git diff --name-only -- docs/site` produced no paths; command exit 0. | Zero `docs/site/**` files changed. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Runtime behavior | N/A | No runtime source changed. | — |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Published reference drift | PASS | `deno task docs:exports-drift`, exit 0 | Six new policies enforced. |

## Handoff Notes

- Inspect the six reasons first, especially why only `cron` claims `complete`.
- Re-run complete-mode probes if any page or export map moves before evaluation.
- The generator must not self-certify; Tier-A review and separate supervisor-dispatched IMPL-EVAL remain.
