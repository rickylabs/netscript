# Worklog: canonical agentic task separator

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-hybrid-launcher-task-separator--1750` |
| Branch | `fix/hybrid-launcher-task-separator` |
| Archetype | N/A — internal tooling |
| Scope overlays | none |

## Design

### Public Surface

- `normalizeTaskArguments(args)` — internal pure boundary used by every finite `agentic:*` parser.
- Existing 26 strict `agentic:*` command surfaces — vocabularies and exit conventions unchanged.

### Domain Vocabulary

- leading task separator — the first argv token when Deno forwards `deno task <name> -- <args>`.
- later separator — a second or non-leading `--`; always an unknown argument.
- strict task entry — an exposed task whose parser accepts a finite token vocabulary and rejects
  unrecognized input.

### Ports

- Existing injected `HybridLauncherDependencies` remains the lifecycle seam; no new port is needed.

### Constants

- `TASK_SEPARATOR` — the sole separator token, `--`.
- `STRICT_AGENTIC_TASKS` in tests — the 26 surveyed task-to-entry mappings.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | RED proves documented task forwarding fails while direct launch works, later tokens stay fail-closed, and parser failure spawns no child | clean throwaway-worktree targeted test wrapper exits non-zero | run artifacts; hybrid/remote parser tests; `task-separator_test.ts` |
| 2 | GREEN centralizes exact-leading normalization across all strict entries and proves lifecycle/dry-run/static gates | targeted tests + structured check/lint/fmt + dry-run capture | shared helper/tests; 26 strict entries; run evidence |

### Deferred Scope

- Live Remote Control supervisor launch — globally serialized and supervisor-owned.
- IMPL-EVAL and ready-for-review transition — separate supervisor session by explicit directive.

### Contributor Path

When adding a finite `agentic:*` task, map it in the separator contract test and call
`normalizeTaskArguments` before command/help parsing; add its finite flags afterward as usual.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-31 | bootstrap | survey | 32 tasks, 26 strict parsers; 21 reject leading `--`, five over-accept it. |
| 2026-08-31 | plan | PLAN-EVAL | N/A: exact mechanical contract and gates are owner-supplied; IMPL-EVAL remains mandatory and supervisor-owned. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| One leading separator only | Matches docs without weakening strict parsing | issue #1750 / plan D1-D2 |
| Shared normalizer | One auditable invariant for all strict parsers | survey / plan D3 |
| README unchanged | Existing example is canonical | `.llm/tools/agentic/README.md:352` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Local `main` advanced after owner locked the slice base | minor | yes |

## Gate Results

Pending RED/GREEN execution.

## Handoff Notes

- IMPL-EVAL should inspect the 26-task survey denominator, exact-one-leading helper, hybrid child
  count/evidence assertions, and byte-identical `deno.lock` proof first.
