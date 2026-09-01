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

Base `38f2ce735` silently publishes despite the two omitted declarations. Both manifests now use the
exact `jsr:@netscript/plugin-streams-core@0.0.6` pattern from `plugins/workers`. All slice-owned
gates pass; one requested generated-corpus gate has a confirmed pre-existing base failure.

## Completed

- Read the requested skills and harness/doctrine references.
- Verified the baseline, omissions, sibling pattern, and all six imports.
- Recorded `PLAN-EVAL: N/A` before implementation.
- Applied the two manifest additions.
- Captured every requested gate exit and the lockfile's exact two-line movement.
- Proved `check:mcp-export-corpus` also fails at the untouched base and left forbidden
  `packages/mcp` unchanged.

## In Progress

- Final diff review, commit, explicit-refspec push, and draft PR creation.

## Next Steps

1. Commit the owned diff.
2. Push the explicit refspec and open the labeled draft PR at milestone `0.0.7`.
3. Stop without IMPL-EVAL or ready-for-review transition.

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
| `.llm/runs/chore-declare-streams-core-dependency--1543/` | new | Harness state and evidence. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS with one pre-existing generated-corpus failure | Root/scoped/publish green; MCP corpus fails identically at base |
| Fitness | PASS | `quality:scan` and `arch:check` exits 0 |
| Runtime | N/A | no behavior change |
| Consumer | PASS | root/scoped checks exit 0 |

## Open Questions

- None.

## Drift and Debt

- Drift: pre-existing MCP export-corpus staleness; forbidden sibling scope, recorded without fix.
- Debt: none created, deepened, or resolved.

## Commits

- See the draft PR's commit list + per-slice PR comment after delivery.
