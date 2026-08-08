# Worklog: production command composition kit RFC

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-rfc-command-composition-kit--rfc` |
| Branch | `docs/rfc-command-composition-kit` |
| Archetype | Docs delivery describing Archetypes 1–6 implementation surfaces |
| Scope overlays | `SCOPE-docs`, `SCOPE-service` |

## Design

This checkpoint records the RFC/document surface before the RFC file is created. Exact product
types remain research inputs until the re-baseline slice locks them.

### Public Surface

- `rfcs/0000-command-composition-kit.md` — draft RFC only; no product export changes.
- Future public command entrypoint, unit-of-work capability contract, receipt/audit/outbox records,
  typed failures, and command telemetry vocabulary — names and ownership must be locked in S1/S2.

### Domain Vocabulary

- command — one caller intent applied within one supported store transaction.
- receipt — durable idempotency outcome keyed by command identity and canonical request hash.
- audit record — same-commit actor/correlation evidence, not a mutable event log.
- outbox message — same-commit delivery intent relayed at least once after commit.
- capability/refusal — adapter truth describing which guarantees exist and why execution may refuse.

### Ports

- unit-of-work store capability — needed only where a database adapter can expose one transaction-scoped client.
- outbox relay store/transport — separate post-commit runtime seam; it cannot enlarge the transaction boundary.
- telemetry/redaction policy — injected observability seam with bounded attributes.

### Constants

- RFC status: `Draft`; RFC number: `0000` until maintainer acceptance.
- Claim vocabulary: `one-store`, `at-least-once`, `idempotent replay`, `same-commit`, `refused`.
- Lifecycle status progression for this run: `status:research` → `status:plan` → `status:plan-eval`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| B0 | Activate the harness and expose the run on a draft PR. | raw git identity/status; artifact presence | `.llm/runs/docs-rfc-command-composition-kit--rfc/*` |
| S1 | Re-baseline proposal, code, exports, tests, docs, live board, and primary adapter guarantees; lock the plan. | evidence inventory; `deno doc`; plan-gate readiness check | run `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md` |
| S2 | Define the exact public contracts, semantic laws, capability matrix, failure/telemetry/security model, and examples. | source-alignment audit; focused probes | RFC plus run artifacts |
| S3 | Complete worker/saga boundary, conformance/failure injection, compatibility, staging, docs/scaffold impact, issue decomposition, and handoff. | docs/RFC/link/format/diff gates | RFC, run artifacts, `final-handoff.md` |

### Deferred Scope

- Product/package/plugin implementation — belongs to #1363 and follow-on implementation slices.
- Cross-store coordination and distributed transactions — explicitly refused.
- Relay deployment/operations — specified only as the narrow boundary necessary to consume outbox rows.
- Formal cross-RFC review and final adversarial evaluation — launched by the root orchestrator, not this generator.

### Contributor Path

Start at the RFC's semantic laws and capability matrix; implement contract-first in the staged issue
order, then add each adapter only after its injected-failure conformance suite proves the advertised
capabilities.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-08 | B0 | bootstrap | Read all named skills and required RFC/harness/doctrine/evaluator authority; verified pinned branch/base. |
| 2026-08-08 | B0 | session health | Agentic runtime status made no changes and returned `MISSING_IDENTITY`; preserved the staged attached-thread receipt. |
| 2026-08-08 | B0 | live issue check | Confirmed #1361–#1364 and source PR #1347 exist; detailed re-baseline continues in S1. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Keep this PR docs-only and RFC number `0000`. | RFC lifecycle and issue #1361 scope. | `rfcs/README.md`, #1361 |
| Use all Archetypes 1–6 as implementation-surface constraints, with docs/service overlays for this run. | The design crosses contracts, adapters, DSL, runtime, plugins, and CLI generators but this PR changes none of them. | Doctrine chapter 06; harness archetypes |
| Do not launch evaluators or a second Codex session. | Owner reserves review/evaluation for the root orchestrator; mobile-visible thread must remain singular. | implementation brief; `codex-wsl-remote` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Runtime controller could not correlate the active staged thread to persisted runtime identity. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Branch/base identity | raw git `rev-parse`, `merge-base`, `status` | PASS | Branch and base exactly match the brief. |
| Mandatory authority read | complete file reads | PASS | RFC process, doctrine, gate/evaluator files and selected profiles read before RFC authoring. |
| Docs/link/format gates | pending S3 | NOT_RUN | No RFC file exists yet. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-5/F-6/F-7 planned surface audit | PENDING_SCRIPT | S1 `deno doc` and JSR/export scan | Design-time only; no package edits. |
| F-13 runtime invariants | PENDING_SCRIPT | S2/S3 RFC laws and conformance plan | Design-time only. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Product runtime | N/A | RFC/docs-only scope | No product behavior changes. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Existing service/scaffold surfaces | NOT_RUN | S1 source analysis pending | Analysis only; no scaffold generation mutation. |

## Handoff Notes

- Root orchestrator should inspect the final RFC contracts and capability matrix first, then compare
  every unresolved question with #1361 acceptance and the final `research.md` evidence table.

