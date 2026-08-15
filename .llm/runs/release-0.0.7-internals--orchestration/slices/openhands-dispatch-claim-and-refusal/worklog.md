# Worklog: OpenHands dispatch claim and refusal

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.7-internals--orchestration/slices/openhands-dispatch-claim-and-refusal` |
| Branch | `fix/openhands-dispatch-claim-and-refusal` |
| Archetype | `6-cli-tooling` |
| Scope overlays | none |

## Design

### Public Surface

- `deno task agentic:dispatch-openhands` — manual OpenHands dispatch CLI; its formal mode must emit
  a phase and immutable head while non-formal mode remains supported.
- `@openhands-agent` first-line grammar — trusted workflow boundary between comments and provider
  spend.
- `openhands-agent.yml` authorize output — pre-spend dispatch/refusal decision and attributable
  feedback.

### Domain Vocabulary

- `FormalPhase = 'plan' | 'impl'` — evaluator phase participating in the claim tuple.
- `ImmutableHead` — exact 40-character PR head SHA evaluated by a formal run.
- `PhaseClaimKey = { generation, phase, head }` — existing exactly-once spend identity.
- `RefusalReason` — stable reason returned before spend and rendered to the author.
- `GenerationRetry` — bounded attempts/delay used to tolerate GitHub events API visibility lag.

### Ports

- GitHub PR read — resolves the current immutable head for a formal manual dispatch.
- GitHub events read — resolves the label-event generation with bounded retry.
- Git ref create/read — existing atomic phase claim.
- GitHub issue-comment write — one cheap refusal reply to the triggering author.

### Constants

- Phase values: `plan`, `impl`.
- Existing retry precedent: 5 attempts, 1,000 ms between unsuccessful reads.
- Existing command token and allowed argument vocabulary remain production policy.
- Refusal vocabulary must include the five live grammar/authorization reasons from #1613 plus
  explicit formal-claim/currency/generation reasons already returned by the policy.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 0 | Harness bootstrap and draft PR | Git identity/cleanliness | assigned run directory only (`ca2266ecb`) |
| 1 | Contract rescope | coordinator disposition | BLOCKED — no implementation file list is authorized |

### Deferred Scope

- All implementation, tests, receipts, acceptance evidence, evaluator dispatch, and status
  transitions are deferred until the coordinator corrects the file contract and disposes
  PLAN-EVAL.

### Contributor Path

After rescope, a contributor should be able to follow the real dispatch CLI into
`buildOpenHandsComment`, then the trusted comment predicate, claim resolver, and refusal renderer,
with the cross-module regression test demonstrating the entire grammar boundary.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-15 | S0 | Bootstrap | Verified worktree/base; preserved coordinator thread metadata; committed templates as first commit; opened draft PR #1658. |
| 2026-08-15 | Plan | Research | Re-read #1611/#1613 live and traced producer, predicate, claim, refusal, retry, and tests at baseline. |
| 2026-08-15 | Plan | Design checkpoint | Recorded protocol vocabulary and ports; stopped because the frozen surface excludes required production and test files. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| PLAN-EVAL required | Workflow triggers and an atomic spend claim have silent/recursive/double-spend failure modes. | harness plan gate; live issues; `plan.md` |
| No implementation-authoritative edit list | The frozen contract cannot satisfy live acceptance and this thread may not widen it. | `research.md` F1/F5 |
| JSR audit N/A | No publishable package/plugin surface. | frozen contract |

## Gate Results

No implementation gates were run. A non-fired command is `NOT_RUN`, never PASS. No receipts were
created because this turn is planning-only and the implementation contract is blocked.

## Handoff Notes

- Coordinator must correct the exact file surface and formal/non-formal CLI semantics.
- Then a separate native opposite-family PLAN-EVAL is required before implementation.
- This thread did not launch an evaluator or OpenHands run and did not apply evaluator-triggering
  labels.
