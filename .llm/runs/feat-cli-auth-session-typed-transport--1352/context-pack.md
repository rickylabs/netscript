# Context Pack: CLI auth-session typed credential transport

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-cli-auth-session-typed-transport--1352` |
| Branch | `feat/cli-auth-session-typed-transport` |
| Current phase | `implement` |
| Archetype | `6 - CLI Tooling`; SDK boundary `2 - Universal Library` |
| Scope overlays | `none` |

## Current State

Live issue #1352 was audited at baseline `37452f11f`. Rows 1 and 3-7 are shipped by PR #1915;
row 2 is partial because `FetchAuthSessionHttp` preserves two caller-supplied exact URLs but does
not yet route credentials through the typed contribution. The public SDK has no exact-origin
override. The plan therefore retains the adapter and uses only the public auth-core bearer's typed
`prepare` protocol.

## Completed

- Required skills, harness workflow, archetype, gates, doctrine, live issue, merged PR, and PR
  evaluation evidence read.
- Pre-write seven-row audit and SDK public-surface `deno doc` inspection completed.
- Design checkpoint and plan recorded.
- Independent PLAN-EVAL passed in Claude Fable 5 medium session
  `0a21b6d5-3914-41b8-8e75-b78617e78574`; it ruled the narrow composition sanctioned and required
  honest URL-derived transport facts plus a focused redaction regression.

## In Progress

- Commit and publish slice 0, then implement the approved product slices.

## Next Steps

1. Commit/push slice 0 and open the metadata-complete draft PR.
2. Implement slices 1-2, running and recording their gates.
3. Run full requested merge-readiness gates and fresh independent IMPL-EVAL.
4. If all seven rows pass, add one acceptance-evidence block, use `Closes #1352`, and mark non-draft.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| No SDK surface widening | `plan.md` D1/D6 | Full exact-URL SDK migration is not currently expressible. |
| Narrow typed credential migration | `plan.md` D2-D4 | Satisfies caller context, canonical bearer logic, and no server-only import. |
| Preserve URL defect ownership | `plan.md` D5 | Reference #1243; do not fix it. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-cli-auth-session-typed-transport--1352/**` | new | Harness audit, plan, design, and resume state only |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PLAN-EVAL PASS / remaining planned | `plan-eval.md`; CLI doc-lint baseline exit 0, 0 diagnostics |
| Fitness | planned | `plan.md` validation table |
| Runtime | planned | no external runtime permitted/needed |
| Consumer | planned | CLI dry-run only |

## Open Questions

- None before implementation. Any need for SDK widening is significant drift and stops the slice.

## Drift and Debt

- Drift: `rtk` executable absent; focused raw read-only commands are used and recorded.
- Debt: none proposed.

## Commits

- See the draft PR's commit list + per-slice PR comments once slice 0 is approved.
