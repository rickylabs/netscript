# Context Pack: typed plugin CLI contribution RFC

## Run Metadata

| Field          | Value                                          |
| -------------- | ---------------------------------------------- |
| Run ID         | `docs-rfc-plugin-cli-contribution--1502`       |
| Branch         | `docs/rfc-plugin-cli-contribution`             |
| Current phase  | `plan-eval` after S0 commit/PR handoff         |
| Archetype      | 4 — public DSL/builder (future implementation) |
| Scope overlays | `SCOPE-docs`                                   |

## Current State

The leaf is reconciled to the exact required live `origin/main` baseline. Research and the Design
checkpoint are complete; the RFC file does not exist and must not be authored until a fresh native
Claude/Fable 5 medium session records PLAN-EVAL `PASS`. S0 docs gates are green and the current diff
is limited to the required run directory. The exact plan head is the S0 commit containing this file
and is recorded in the draft PR's PLAN handoff comment.

## Completed

- Read all selected skills and required harness/archetype/doctrine/RFC sources completely or in the
  explicitly relevant full sections.
- Verified branch/base/cleanliness/no-upstream and live #1502/comments/PR absence.
- Inventoried CLI root/plugin/generate help and public plugin/CLI APIs with `deno doc` before
  focused source reads.
- Fetched and mapped live #904–#908/comments plus #424, #946, #1477, #1474 context, and #1354.
- Searched live issues for competing general command contribution/generation seams.
- Applied the JSR rubric to every planned public surface and measured current full export-map doc
  lint for `@netscript/plugin` and `@netscript/cli`.
- Locked public ownership, mount/router/help/completion/errors, discovery/bootstrap/isolation/order,
  absent UX, generator transaction, capabilities, doctor, manifest pointers, compatibility,
  migration, duplicate audit, and future epic shape.
- Created required PLAN-EVAL and IMPL-EVAL placeholders without an author verdict.

## In Progress

- S0 commit, explicit-refspec push, draft PR, taxonomy, milestone, phase comments, and separate
  evaluator handoff.

## Next Steps

1. Fresh native Claude/Fable 5 medium evaluator reads the S0 plan head and records `PASS` or
   `FAIL_PLAN` in `plan-eval.md`.
2. If `FAIL_PLAN`, this same author thread fixes only the plan/research artifacts and re-requests
   separate evaluation.
3. If `PASS`, resume this author thread for S1–S4 RFC authoring; keep the PR draft.
4. After RFC/gates, a fresh opposite-family session performs IMPL-EVAL; Tier-A topic review remains
   orchestrator-owned.

## Key Decisions

| Decision                                                                                    | Source                                | Notes                             |
| ------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------- |
| Public owner is existing `@netscript/plugin/cli`; host adapter private in `@netscript/cli`. | doctrine + live exports + D1          | No new package.                   |
| One host-declared extensible mount per contribution; nested children only.                  | #904/#908 + D3                        | No arbitrary top-level commands.  |
| Descriptor-only help/completion; lazy selected-handler bootstrap.                           | #905 + D4–D8                          | No plugin I/O for discovery/help. |
| Host-neutral generation plan and host-owned transaction.                                    | current gap + RFC 0005 + D11–D13      | Preview is zero-write/effect.     |
| Matching installer/runtime pointers after manifest forward-compat prerequisite.             | live `.strict()` + RFC 0005 + D14–D15 | Duplicate-audit #1474.            |
| Deploy and DevTools are independent consumers of the same seam.                             | #1502 + D17                           | No cross-imports.                 |

## Files Changed

| Path                                                               | Status | Notes                                          |
| ------------------------------------------------------------------ | ------ | ---------------------------------------------- |
| `.llm/runs/docs-rfc-plugin-cli-contribution--1502/supervisor.md`   | new    | Identity and requested/observed routes.        |
| `.llm/runs/docs-rfc-plugin-cli-contribution--1502/research.md`     | new    | Live inventory, duplicate map, JSR audit.      |
| `.llm/runs/docs-rfc-plugin-cli-contribution--1502/plan.md`         | new    | Locked plan, gates, risks, slices, epic shape. |
| `.llm/runs/docs-rfc-plugin-cli-contribution--1502/worklog.md`      | new    | Design checkpoint and evidence log.            |
| `.llm/runs/docs-rfc-plugin-cli-contribution--1502/context-pack.md` | new    | Resumable handoff.                             |
| `.llm/runs/docs-rfc-plugin-cli-contribution--1502/drift.md`        | new    | Route/current-state/JSR drift.                 |
| `.llm/runs/docs-rfc-plugin-cli-contribution--1502/plan-eval.md`    | new    | Separate evaluator placeholder.                |
| `.llm/runs/docs-rfc-plugin-cli-contribution--1502/evaluate.md`     | new    | Later separate IMPL-EVAL placeholder.          |
| `.llm/runs/docs-rfc-plugin-cli-contribution--1502/receipts/`       | new    | Structured/durable S0 evidence.                |

## Gates

| Gate family | Current status                      | Evidence                               |
| ----------- | ----------------------------------- | -------------------------------------- |
| Static      | PASS for S0 docs scope              | `worklog.md`; `receipts/`              |
| Fitness     | design/research/docs gate complete  | `plan.md`; `research.md`; `worklog.md` |
| Runtime     | N/A / global expensive gate not run | docs-only scope                        |
| Consumer    | research inventory complete         | live issues/RFCs and `research.md`     |

## Open Questions

- PLAN-EVAL verdict only. Remaining exact spellings, copy, numeric limits, and rollout duration are
  safe FCP/implementation-policy choices listed in `plan.md`; no package/lifecycle decision is open.

## Drift and Debt

- Drift: attached author route, accepted-but-unshipped consumer seams, shallow existing `./cli`, and
  current plugin doc-lint baseline are recorded in `drift.md`.
- Debt: no new or deepened architecture debt; source implementation is forbidden in this leaf.

## Commits

- S0 plan head: the commit containing this artifact; exact SHA is recorded in the draft PR's PLAN
  handoff comment and final supervisor report.
- See the draft PR commit list and per-slice comments after push; V3 uses no `commits.md`.
