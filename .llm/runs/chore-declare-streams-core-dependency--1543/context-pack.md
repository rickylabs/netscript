# Context Pack: declare the plugin-streams-core dependency

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-declare-streams-core-dependency--1543` |
| Branch | `chore/declare-streams-core-dependency` |
| Current phase | `gate` |
| Archetype | `3 - Runtime/Behavior`; `5 - Plugin Package` |
| Scope overlays | none |

## Current State

Base `38f2ce735` silently publishes despite undeclared imports. S1 fixed the issue-named two members
but IMPL-EVAL found four additional importing workspace members. S2 adds the exact established
specifier to all four after a workspace-wide static-edge census separated module imports from
package-name strings. All cycle-2 gates now pass at the corrected member scope.

## Completed

- Read the requested skills and harness/doctrine references.
- Verified the baseline, omissions, sibling pattern, and all six imports.
- Recorded `PLAN-EVAL: N/A` before implementation.
- Applied the two manifest additions.
- Captured every requested gate exit and the lockfile's exact two-line movement.
- Proved `check:mcp-export-corpus` also fails at the untouched base and left forbidden
  `packages/mcp` unchanged.
- Preserved evaluator commit `4f194dbb1` and accepted its `FAIL_IMPL` completeness finding.
- Confirmed CLI E2E has five real imports; corrected the triggers public-string misclassification.
- Refreshed exactly four lock member-dependency lines and completed cycle-2 validation.

## In Progress

- Final diff review, commit, explicit-refspec push, and PR evidence update.

## Next Steps

1. Commit the four manifest lines, four lock lines, and corrected run artifacts.
2. Push the explicit refspec and update the draft PR evidence without changing labels/state.
3. Stop for owner-dispatched IMPL-EVAL cycle 2.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Explicit declarations | issue #1543 / sibling pattern | Consistency/readability, not release integrity. |
| Acceptance box 3 N/A | base dry-run | No new undeclared-import check. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `packages/plugin-workers-core/deno.json` | changed | Added exact streams-core dependency. |
| `plugins/triggers/deno.json` | changed | Added exact streams-core dependency. |
| `deno.lock` | changed | Added one resolved member-dependency line for each touched manifest. |
| `packages/sdk/deno.json` | changed | Cycle 2: declare streams-core. |
| `packages/plugin-sagas-core/deno.json` | changed | Cycle 2: declare streams-core. |
| `packages/plugin-auth-core/deno.json` | changed | Cycle 2: declare streams-core. |
| `packages/cli/e2e/deno.json` | changed | Cycle 2: declare streams-core for five real gate imports. |
| `.llm/runs/chore-declare-streams-core-dependency--1543/` | new | Harness state and evidence. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS with one unchanged pre-existing generated-corpus failure | S2 root/scoped/publish green; MCP corpus note retained unchanged |
| Fitness | PASS | `quality:scan` and `arch:check` exits 0 |
| Runtime | N/A | no behavior change |
| Consumer | PASS | S2 root/scoped checks and dependency provenance exit 0 |

## Open Questions

- None.

## Drift and Debt

- Drift: pre-existing MCP export-corpus staleness remains; S1 completeness and string/import
  misclassification are recorded for correction in S2.
- Debt: none created, deepened, or resolved.

## Commits

- See the draft PR's commit list + per-slice PR comment after delivery.
