# Plan: restore generated browser-log child resources

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1577-aspire-browser-logs--impl` |
| Branch | `fix/1577-aspire-browser-logs` |
| Phase | `plan` |
| Target | `packages/cli` Aspire helper generator |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Archetype

Archetype 6 applies because the changed published surface is generated output from the NetScript
CLI. The package's current doctrine verdict is **Keep**: preserve the kernel/surface split.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A2 | Generated published behavior must be explicit and safe at its boundary. |
| A8 | Keep the behavior in the existing focused registration generator. |
| A14 | Positive and negative semantic tests preserve the endpoint safety boundary. |

## Goal

Emit an awaited browser-log child registration for enabled `Type: 'app'` resources that receive an
HTTP/HTTPS endpoint, immediately after endpoint binding, while leaving endpoint-less task/desktop
resources unchanged.

## Scope

- Add endpoint-gated `await <app>.withBrowserLogs();` emission.
- Reconcile the stale endpoint-bearing app test with an ordering assertion.
- Preserve and make explicit the endpoint-less task negative assertion.
- Preserve the browser integration package pin assertion and correct shipped help text.

## Non-Scope

- No service/plugin generator behavior, port, health-check, dependency, or help-text source change.
- No runtime E2E; the orchestrator owns that serialized gate.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Emit only when `type === 'app' && needsHttpEndpoint(type, entry)`. | Browser logs are the frontend app default, while explicit endpoint presence is the safety boundary. |
| D2 | Emit directly after `withHttpEndpoint`, before the health probe. | The child requires an HTTP/HTTPS parent endpoint and the requested placement is after binding. |
| D3 | Await the call. | The exact pinned generated API returns a thenable `ExecutableResourcePromise`. |
| D4 | Convert the stale `MINIMAL_APP` absence test to positive + ordering evidence. | Its setup is endpoint-bearing, so it encoded the removed #781 limitation rather than a background-resource contract. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Help source update | safe to defer | Existing text already describes the restored behavior and becomes truthful when this lands. |
| Runtime E2E | safe to defer | Explicitly prohibited here and delegated to the orchestrator. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Calling an unavailable promise wrapper method | Exact pinned-package restore and generated module inspection before emission. |
| Attaching browser children to non-web executables | Explicit type + endpoint predicate and negative task/desktop tests. |
| Moving browser setup before endpoint allocation | Test source ordering by substring indices. |
| Lock churn from validation | Record baseline SHA-256 and stop if `deno.lock` changes. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-18 | avoid | Assert focused generated semantics and ordering, not a whole-file snapshot. |
| AP-25 | avoid | Keep generation pure; introduce no host-side effects. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-19 / static | yes | scoped check/lint/fmt wrappers |
| package tests | yes | `deno task --cwd packages/cli test` |
| quality/doctrine | yes | `deno task quality:gate` |
| JSR surface rubric | yes | no export/dependency delta; package/static gates recorded |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| none | none | Focused behavior does not deepen known package debt. |

## Validation Plan

1. Run focused generator/config tests during implementation.
2. Run the five owner-specified gates verbatim.
3. Compare `deno.lock` hash and raw Git status against baseline.

## Drift Watch

- Any pinned API shape differing from the restored generated module.
- Any required edit outside generator/tests/run artifacts.
- Any `deno.lock` mutation.

