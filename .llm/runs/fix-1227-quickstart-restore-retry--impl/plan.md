# Plan: retry Quickstart Aspire restore without cascading PGDATA failure

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1227-quickstart-restore-retry--impl` |
| Branch | `fix/1227-quickstart-restore-retry` |
| Phase | `plan` |
| Target | `packages/cli/e2e` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Archetype and doctrine verdict

The nested E2E harness validates the Archetype 6 CLI/tooling package. The current doctrine verdict
for `@netscript/cli` is **Restructure**, but this focused semantic-test slice neither deepens nor
attempts that existing structural remediation.

## Goal

Retry Quickstart Aspire restore on centralized `timeout`/`canceled` classifications with exactly
three bounded attempts, and report missing PGDATA setup state as an explicit skip.

## Scope

- Quickstart restore retry policy and its focused semantic tests.
- Central command-gate skip representation only if required to emit an honest `skipped` verdict.
- PGDATA verification's missing-setup handling and tests.

## Non-Scope

- Publish/release logic, canary dispatch, other gates' retry behavior, timeout changes, dependencies,
  generated output, and the live `e2e:cli` suite.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Use `CommandGateDefinition.retry` and `CommandGate`; no local retry loop. | Existing centralized policy already executes and records attempts. |
| D2 | Retry only `timeout` and `canceled`; keep `maxRetries` within `1 | 2`. | Matches the incident classes and typed bound. |
| D3 | Mirror runtime's 180 s / two-retry budget; no cache addition because runtime has no explicit NuGet cache seed. | Parity without novelty. |
| D4 | Missing PGDATA setup state emits `skipped` with an explicit message. | Prevents secondary failure signals. |
| D5 | Do not alter the 180 s timeout or other gates. | Locked scope. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Retry execution mechanism | resolved | Existing `CommandGate` policy. |
| Missing-state signal | resolved | Existing `GateVerdict` value `skipped`; add only the smallest command-result mapping required. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Retry accidentally becomes unbounded. | Assert exactly `maxRetries + 1` requests and attempts. |
| The policy retries unrelated failures. | Configure only `timeout` and `canceled`; retain assertion/nonconfigured no-retry tests. |
| PGDATA absence passes silently. | Assert `skipped` and exact explanatory message. |
| Validation mutates `deno.lock`. | Compare lock against baseline after each test/gate; stop if unexpected. |

## Anti-Patterns and fitness gates

| Item | Status / evidence |
| --- | --- |
| AP-9 premature local abstraction | Avoid: reuse `CommandGate` retry policy. |
| AP-18 giant snapshots | Avoid: assert semantic verdict, attempts, failure classes, and message. |
| F-3 / F-10 / F-19 | Scoped check/lint/fmt, focused unit tests, explicit nested-E2E quality scan, `quality:gate`. |
| F-CLI runtime behavior | Focused fake-executor tests; live E2E explicitly prohibited by owner. |

## Commit slices

1. Bootstrap harness run and draft PR — run artifacts; prove clean baseline and locked plan.
2. Retry + teardown semantics — focused RED→GREEN tests, implementation, all requested gates,
   worklog/context update, explicit lock check.

## Deferred scope

- Live canary and full CLI E2E are owned by release orchestration and explicitly prohibited here.
- Existing CLI restructure debt is unchanged.

