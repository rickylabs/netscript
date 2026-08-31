# Plan: reconcile milestone cluster state with live PR state

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-harness-cluster-state-liveness--1753` |
| Branch | `fix/harness-cluster-state-liveness` |
| Phase | `plan` |
| Target | internal harness validator |
| Archetype | N/A — repository maintainer tooling, not a shipped package/CLI |
| Scope overlays | none |

## Goal

Make a validator-green result impossible when a nonterminal recorded leaf has a stale live PR head
or an open milestone leaf PR is absent from cluster state.

## Scope

- Inject a read-only source with separate open-PR listing and PR-head reading operations.
- Emit compact structured findings containing issue, PR, lane, recorded head, and live head.
- Explicitly exclude coordinator-artifact PRs.
- Treat merged/terminal leaves as non-live and GitHub/export unavailability as fail-closed.
- Add a read-only JSON-export adapter for CLI use without network calls in tests.

## Non-Scope

- No mutation of GitHub or cluster state.
- No render-format change.
- No edits under `.llm/tools/agentic/`, `deno.json`, packages, plugins, or generated corpora.
- No self-dispatched IMPL-EVAL.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | The validator receives a `MilestonePrSource` port with list/head methods. | It is the smallest seam that tests both reconciliation directions without live GitHub. |
| D2 | CLI reconciliation reads an explicit JSON export via `--github-prs <path>`. | It remains read-only and fits the hard file boundary; missing/unavailable input fails closed. |
| D3 | Findings are structured separately from schema `errors`, and either makes `ok: false`. | Callers can distinguish mutable-state drift from schema defects while preserving current error behavior. |
| D4 | `coordinator-artifact` is an explicit live-PR role and is ignored only for missing-leaf checks. | Exclusion is auditable rather than inferred from title or branch naming. |
| D5 | Terminal cluster leaves and live merged PRs do not create liveness findings. | Merged work is no longer active and must not manufacture a false red. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Fresh-export creation mechanism | safe to defer | External coordinator tooling can create the read-only export; this slice defines and validates its consumer contract only. |
| Network-backed source implementation | safe to defer | Explicitly outside the authorized boundary and unnecessary for the injected validator port. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Existing schema tests become false red when no source exists | Inject a valid fixture source through the shared test helper. |
| Closed/merged PRs are mistaken for missing active leaves | Reconcile only open listed PRs and skip terminal state leaves. |
| Coordinator artifact PR is mistaken for a leaf | Require explicit `coordinator-artifact` role and test it. |
| Source outage restores the old silent green | Emit a `source-unavailable` finding and return `ok: false`. |
| Parallel leaf collision | Enforce the declared path ceiling; stop before any `.llm/tools/agentic/` edit. |

## Commit Slices

| # | Slice | Proving gate | Files |
| - | --- | --- | --- |
| 1 | RED: injected stale-head and missing-leaf fixtures fail against the current validator | captured focused test exits non-zero for both asserted regressions | validator test + run artifacts |
| 2 | GREEN: reconciliation port, structured findings, exclusions/fallbacks, and JSON adapter | captured focused harness tests and scoped check/lint/fmt exit zero | validator, validator test, run artifacts |

## Validation Plan

| Order | Gate | Command | Expected result |
| --- | --- | --- | --- |
| 1 | RED | structured test wrapper on `validate-milestone-cluster_test.ts` | non-zero before implementation |
| 2 | Focused test | same structured test wrapper | PASS after implementation |
| 3 | Harness suite | `deno task harness:milestone:test` | PASS |
| 4 | Scoped check | structured check wrapper over the two TypeScript files | PASS |
| 5 | Scoped lint | structured lint wrapper over the two TypeScript files | PASS |
| 6 | Scoped format | structured format wrapper over the two TypeScript files | PASS |
| 7 | Diff hygiene | `git diff --check` | exit 0 |

## Drift Watch

- Any required file outside the intended list.
- Any need for an agentic import or generated-corpus update.
- Any contract change beyond liveness reconciliation.
