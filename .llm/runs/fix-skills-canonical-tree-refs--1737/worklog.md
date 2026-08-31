# Worklog: canonical shipped skill references

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-skills-canonical-tree-refs--1737` |
| Branch | `fix/skills-canonical-tree-refs` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | none |

## Design

### Public Surface

- Shipped skill prose under `skills/`, installed by `netscript agent init`.
- No TypeScript export or CLI command surface changes.

### Domain Vocabulary

- **canonical skill tree** — `.agents/skills/`, installed for every supported host.
- **derived mirror tree** — `.claude/skills/`, emitted only for Claude hosts.
- **shipped skill body** — a `*/SKILL.md` file listed by `skills/manifest.json`.

### Ports

- None; this slice introduces no external dependency or test seam.

### Constants

- `.claude/skills/` is the forbidden mirror reference detected by the regression test.

### Commit Slices

| # | Slice | Gate | Files |
| - | - | - | - |
| 1 | Prove shipped skill bodies cannot name the mirror tree (RED). | Focused Deno test fails with both paths. | `skills/canonical-tree-references_test.ts`, run artifacts |
| 2 | Point the two shipped bodies at the canonical tree (GREEN). | Focused test, sync/check, scoped static gates. | `skills/netscript/SKILL.md`, `skills/netscript-operate/SKILL.md`, run artifacts |

### Deferred Scope

- None.

### Contributor Path

Add a shipped skill file to `skills/manifest.json`; the manifest-driven regression test will scan
its body automatically.

## PLAN-EVAL

`N/A` before implementation: issue #1737 completely specifies the two-line correction and required
test, #1675 already locks canonical ownership, and the re-baseline found no open decisions.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-31 | S1 | research | Confirmed exact lines 43 and 50 and exactly two shipped-body matches. |
| 2026-08-31 | S1 | RED | Focused test exited 1 and named both offending manifest paths. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Scan manifest-listed skill bodies | Covers the entire shipped contract without hard-coding filenames. | `skills/manifest.json`; issue #1737 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Baseline advanced from the original brief to `eaea940b`. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| RED regression | `deno test --allow-read skills/canonical-tree-references_test.ts` | FAIL (expected), rc=1 | Actual offenders: `netscript/SKILL.md`, `netscript-operate/SKILL.md`; 0 passed, 1 failed. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Canonical ownership | FAIL (expected RED) | Focused test, rc=1 | Both source defects are now regression-protected before repair. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Runtime behavior | N/A | Scope analysis | No runtime behavior changes. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| VS Code-only scaffold | NOT_RUN | Shipped body invariant | Focused invariant directly guards the dangling path. |

## Handoff Notes

- IMPL-EVAL is mandatory and supervisor-dispatched after the PR is opened and final gates pass.
