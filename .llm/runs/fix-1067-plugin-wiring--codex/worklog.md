# Worklog: plugin wiring, producer failure, and doctor truth

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1067-plugin-wiring--codex` |
| Branch | `fix/1067-plugin-wiring` |
| Archetype | 6 CLI/Tooling + 5 Plugin + 3 Runtime/Behavior |
| Scope overlays | service |

## Design

### Public Surface

- `netscript plugin install` — converges every installed resource’s references.
- `netscript service generate` / `netscript generate aspire` — reconciles before helper emission.
- `DurableStreamProducer` / `createDurableStream` — same type surface, stricter missing-discovery failure semantics.
- `netscript plugin doctor` — reports config and live AppHost resource truth.

### Domain Vocabulary

- `DeclaredPluginReferenceMap` — desired outgoing edges keyed by installed plugin/resource identity.
- `InstalledPluginResourceSet` — keys present across appsettings plugin/background sections.
- `AppHostInspection` — discriminated `not-running` or `running` snapshot with named resource states.
- `AppHostResourceState` — resource name plus health/state sufficient for doctor classification.

### Ports

- Existing filesystem/process ports remain the IO seams.
- A narrow doctor AppHost inspector dependency isolates Aspire process/JSON behavior from the use case.

### Constants

- Existing canonical manifest names and appsettings keys remain authoritative; no hardcoded host-side plugin-name table.
- Stable doctor check ids for AppHost absent, resource missing, and resource unhealthy outcomes.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove order-independent declared-edge reconciliation and fail-fast stream discovery | permutation/main-red proof; plugin-streams focused tests; `scaffold.plugins` | CLI reconcile/install/generate tests and adapter(s), `packages/plugin-streams-core`, sagas/triggers manifests, run artifacts |
| 2 | Prove doctor can fail on config, plugin contribution, absent AppHost, missing resource, and unhealthy resource | focused doctor tests plus scoped gates | doctor use case/adapter/composition tests; allowed plugin doctor specs only if evidence demands; run artifacts |
| 3 | Prove residual clean-public schema, published saga registry runtime, and all-four no-samples acceptance | focused consumer/E2E tests and touched-unit gates | CLI E2E/integration tests and fixtures only; no saga engine/store/runtime edits; run artifacts |

### Deferred Scope

- Network connection timeout/retry redesign — 0.0.5 candidate.
- Saga engine/store fixes #1064/#1065/#1066 — concurrent owner.
- Broad doctor telemetry protocol — this slice uses the narrow live resource snapshot needed now.

### Contributor Path

Declare plugin edges in `scaffold.plugin.json`; the generic reconcile reads declarations and the
installed appsettings inventory. Add doctor runtime checks through the AppHost inspection contract,
then prove a negative state in the colocated doctor test. Add consumer acceptance at the existing
CLI E2E/dependency fixture rather than importing workspace source directly.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-03 | plan | bootstrap/research | Skills loaded in required order; baseline hashes verified; producer warn/drop path read and reported before source change. |
| 2026-08-03 | plan-eval | evaluator canary | `agentic:provider-canary` returned `blocked`, `credential: absent`, and `auth_required` for the canonical Qwen route; no evaluator launched. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| One run with three commits, not supervisor sub-PR groups | Owner mandates one branch, push per slice, and no PR edits. | owner brief + harness supervisor definition |
| Reconcile all entries at install/generate boundaries | Implements the supplied equation by construction. | owner contract / plan D1–D2 |

## Gate Results

All implementation gates are `NOT_RUN` until separate-session PLAN-EVAL returns `PASS`.
Formal plan gate is `BLOCKED`: the canonical local open-model evaluator credential is absent.

## Handoff Notes

- PLAN-EVAL should challenge installed identity mapping, explicit user references, AppHost JSON
  truth source, the main-red proof method, and the published dependency-mode test transport.
