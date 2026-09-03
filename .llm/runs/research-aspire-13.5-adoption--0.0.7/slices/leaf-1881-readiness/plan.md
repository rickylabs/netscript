# Plan: Canary 9 README service-readiness repair

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-readiness` |
| Branch | `fix/canary-readme-service-readiness` |
| Phase | `plan` |
| Target | root README + private CLI E2E production gate |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | docs |

## Archetype

Archetype 6 applies because this repairs a user-executed CLI/Aspire walkthrough and the private gate that proves it verbatim. The nested E2E workspace remains outside the top-level published doctrine denominator.

## Current Doctrine Verdict

`packages/cli` is **Keep**: preserve the Archetype-6 kernel/surface split. This slice changes only the existing E2E quickstart gate and no public package API.

## Goal

Turn Canary 9's 15-minute false wait into an explicit service-readiness boundary followed by a bounded, diagnostic health request, while retaining exact printed-command execution and uploading the cleanup proof.

## Scope

- Print `aspire wait users` in the root README before the health request.
- Capture the users endpoint only after that printed readiness command succeeds.
- Print curl failure/body and total-time flags; give the gate a slightly larger outer bound.
- Upload both cleanup wrapper and child receipts.
- Add focused command, ordering, timeout, and workflow-artifact regressions.

## Non-Scope

- No generated AppHost, service health implementation, package API, dependency, workflow trigger, or Canary 9 artifact mutation.
- No closing of #1881/#863/#1712 until a fresh hosted exact-version run passes all acceptance points.

## Hidden Scope

- Stable gate identifiers and phase arrays must remain aligned with the newly printed command count.
- Port evidence must move from the Postgres wait to the users wait; a hidden runner-only readiness argv is forbidden.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Print `aspire wait users --status healthy --timeout 60 --apphost aspire/apphost.mts`. | It works from the workspace root after DB operations and proves the actual resource before curl. |
| D2 | Print `curl --fail-with-body --show-error --max-time 15 ...`. | HTTP errors retain bodies, transport failures are visible, and users never wait 15 minutes. |
| D3 | Give curl a 20-second outer gate bound. | The printed 15-second bound remains authoritative; 5 seconds allow process/report overhead. |
| D4 | Capture the port only after the printed users wait. | Endpoint allocation alone is not readiness. |
| D5 | Upload both cleanup JSON paths explicitly. | The report already proves cleanup PASS; the missing files prevent independent receipt audit. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Readiness resource/status/time | resolved | `users`, `healthy`, 60 seconds. |
| Curl semantics/time | resolved | fail-with-body + show-error + 15-second max. |
| Issue closure | safe to defer | Remains open until hosted production proof. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| README and runner drift | One canonical expected-command tuple plus root drift test. |
| New command shifts gate evidence | Add one named ID and update tuple/cardinality tests. |
| Curl wrapper kills before curl reports | Outer 20-second bound exceeds printed 15-second max. |
| Cleanup passes but evidence disappears | Workflow test pins both exact artifact paths. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | focused tests | structured test wrapper over README command/domain/presentation tests and workflow test | PASS |
| 2 | scoped check/lint/fmt | structured wrappers over changed TypeScript | PASS |
| 3 | consumer listing | `deno task e2e:cli gates readme.quickstart` | 12 commands + cleanup, exact argv |
| 4 | quality | `deno task quality:gate` | PASS/no new debt |
| 5 | runtime | fresh hosted published-version gate | deferred to coordinator after merge/canary |

## Plan-Gate

`PLAN-EVAL: N/A` — this is a bounded incident repair with exact failing evidence, owner-locked scope, no architecture choice, and no package/API change.

