# Plan: listener readiness diagnostics and bounded endpoint allocation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-listener-readiness-diagnostics--0.0.7` |
| Branch | `fix/listener-readiness-diagnostics` |
| Phase | `plan` |
| Target | `packages/cli` generated Aspire helpers and E2E readiness gate |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service` |

## Archetype

`packages/cli` remains Archetype 6. The nested E2E code is its internal command/gate harness, and
the AppHost helper is a generated consumer artifact. This slice adds no command, public export,
extension axis, or layer abstraction.

## Current Doctrine Verdict

**Keep** — preserve the Archetype-6 kernel/surface split. This change stays inside existing role
files and does not deepen the known runtime-gate directory debt.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A6 | Snapshot selection and bounded endpoint resolution are justified policy/test seams, not primitive renames. |
| A7 | Aspire's own `describe` and `logs` commands remain the evidence sources. |
| A8 | Existing files own the changes; no new runtime-gate child is added. |
| A13 | Timeout/failure boundaries return structured diagnostics rather than hanging. |
| A14 | Pure selection tests, emitted helper tests, and generated-workspace compilation are the fitness functions. |

## Goal

Make the Postgres listener-readiness failure distinguish resource lifecycle, missing health
publication, and published unhealthy checks at the deadline, while ensuring endpoint allocation
cannot prevent the first report from publishing.

## Scope

- Capture one final `describe` snapshot and one bounded console-log tail after the existing readiness wait reaches its deadline.
- Format matched state, aggregate health, all published health key/status pairs, and logs into the thrown error.
- Distinguish unmatched, not-Running, Running-without-key, and published-unhealthy states.
- Bound the generated endpoint allocation stage and return an explicit `Unhealthy` result with `data.code = ENDPOINT_UNALLOCATED` only when allocation actually exceeds the bound.
- Keep the existing socket-level 2,000 ms attempt bound and all readiness gate timeouts unchanged.

## Non-Scope

- No local Aspire runtime, containers, scaffold, or full E2E run.
- No edit to `listener-unreachable-fixture.ts` or `resource-state-stream.ts`.
- No use of container logs as the readiness authority and no forced/synthetic Unhealthy state.
- No historical-causality claim for #1844.
- No timeout increase.

## Hidden Scope

- The helper asset's canonical generated carrier must be regenerated if the repository's asset task requires it; it is not hand-edited.
- The generated-workspace compile test must cover the new helper contract.
- Run artifacts and PR phase evidence remain part of every slice commit.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Take exactly one final topology snapshot after the wait deadline; do not add another poll loop. | Preserves #1906's event/evidence discipline while capturing the state that matters. |
| D2 | Tail 20 console-log lines once using the CLI's non-interactive JSON surface; log failure is rendered as diagnostic unavailability rather than replacing readiness evidence. | Logs are useful context but not readiness authority. |
| D3 | Classify the final snapshot from data: unmatched, not Running, Running/key absent, or key/sibling unhealthy. | These states have different owners and remedies. |
| D4 | Use one 2,000 ms total endpoint-allocation budget covering `getEndpoint`, `host`, and `port`. | Matches the existing per-evaluation socket budget, publishes a result in seconds, and avoids sequential 2-second multipliers. |
| D5 | `ENDPOINT_UNALLOCATED` is `Unhealthy` with a description phrased as listener reachability at the published endpoint. | Matches #1952's contract and makes `{}` transient/unknown until the callback completes. |
| D6 | PLAN-EVAL: N/A. | The supervisor brief and addendum lock behavior, scope, hypotheses, gates, and non-scope; no design decision remains open. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Historical cause of the nine failures | safe to defer | Cannot be inferred locally; the new snapshot provides future evidence. |
| Exact hosted outcome | safe to defer | Supervisor owns two consecutive same-head runs. |
| Product contract and timeout budgets | resolved | Locked by the brief, #1952 addendum, and existing 2,000 ms socket policy. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Diagnostic capture masks the original timeout | Preserve the primary classification; append log capture errors as evidence only. |
| A timeout races a just-allocated endpoint | The helper reports one evaluation Unhealthy; Aspire reevaluates and can become Healthy without any forced state. |
| Unresolved promises create unhandled rejections after the race | Resolve/reject operands through a settled `Promise.race` and do not throw from the losing diagnostic path. |
| Generated helper compiles in repo but not emitted workspace | Extend the existing emitted-workspace compile gate. |
| Generated carrier drifts from template | Regenerate canonically and verify the parity task. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 | avoid | No new file or monolith; keep pure formatting helpers cohesive. |
| AP-2 | avoid | Helpers encode deadline/classification policy rather than rename `Promise.race` or JSON parsing. |
| AP-12/AP-25 | accepted edge use | Timers and `Deno.Command` stay in the existing runtime diagnostic edge and generated AppHost helper. |
| AP-18 | avoid | Assert semantic fragments and structured snapshots, not whole generated files. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1/F-10/F-16 | yes | No new files; scoped doctrine check and focused review. |
| F-2/F-3/F-11/F-12/F-15/F-17/F-18 | yes | `deno task arch:check` plus manual structural review. |
| F-5/F-6/F-7/F-9 | N/A for changed private surface | No published exports, permissions contract, or package metadata changes. |
| F-8 | yes | Existing scoped type checks. |
| F-19 | yes | Required structured check/test/fmt wrappers. |
| F-CLI-1…31 | pending script/manual | No command/composition/export/folder-shape change; `arch:check` backs review. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `scaffold-runtime-a8-f16-1333` | none | No new runtime-gate file or directory child. |
| new debt | none | The slice introduces no doctrine exception. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | S1 RED/GREEN | Structured E2E gate tests | RED before implementation; then all pass. |
| 2 | S2 RED/GREEN | Structured Aspire helper tests | RED before implementation; then all pass including emitted compile. |
| 3 | E2E source check | `run-deno-check` on `packages/cli/e2e/src` | PASS |
| 4 | helper source check | `run-deno-check` on Aspire templates | PASS |
| 5 | focused suites | Both required `run-deno-test` commands | PASS |
| 6 | format | `run-deno-fmt` on `packages/cli` | PASS |
| 7 | parity | `deno task check:aspire-version-parity` | PASS |
| 8 | quality/doctrine | `deno task quality:scan`; `deno task arch:check` | PASS or attributable documented baseline only |
| 9 | hosted | Postgres tier twice at one head | Supervisor-collected; not run locally |

## Dependencies

- Aspire CLI/TS SDK 13.5.3 behavior already pinned by the repository.
- #1952 owns the Postgres readiness semantics and `listener-unreachable-fixture.ts`; this slice composes with it without editing that file.

## Drift Watch

- Any generated carrier outside the apparent helper ceiling.
- Any merge/conflict with #1952 in handwritten files.
- Any failure showing the endpoint methods are synchronously non-Promise or use a different SDK contract.

