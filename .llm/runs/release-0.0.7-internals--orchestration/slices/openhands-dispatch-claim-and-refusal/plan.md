# Plan: OpenHands dispatch claim and refusal

> **BLOCKED — contract rescope required.** This file intentionally grants no implementation
> authority. The coordinator must replace the frozen file contract before a valid exact edit list
> and ordered implementation slices can be locked.

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.7-internals--orchestration/slices/openhands-dispatch-claim-and-refusal` |
| Branch | `fix/openhands-dispatch-claim-and-refusal` |
| Phase | `plan` (blocked before plan gate) |
| Target | OpenHands Actions/manual dispatch tooling |
| Archetype | `6-cli-tooling` |
| Scope overlays | none |

## Archetype and doctrine fit

Archetype 6 is binding from the frozen contract and fits user-run automation/CLI dispatch. This is
repo tooling rather than a publishable CLI package, so package-shape, public-export, JSR, and
consumer-import gates are N/A. The applicable principles are A2 (unambiguous boundary), A8 (one
concern per file), A10 (explicit composition), A13 (failures cross an explicit boundary), and A14
(tests preserve the protocol).

## Goal

Make every formal evaluator dispatch bindable to one `(generation, phase, head)` claim before
provider spend, and make every refusal or lookup exhaustion cheap, visible, and attributable to the
command author without recursively dispatching.

## Authoritative edit surface

**None.** Research proves the frozen four-path envelope cannot meet the live acceptance contract.
No implementation slice is authorized until the coordinator supplies a corrected exact surface.

The evidence-backed rescope candidates are recorded in `research.md` § Frozen-contract verdict and
§ Open questions. They are not an approved edit list and must not be treated as implementation
authority.

## Locked decisions that survive rescope

| ID | Decision | Rationale |
| --- | --- | --- |
| L1 | Preserve exactly-once automatic dispatch per generation/phase/head. | The existing atomic ref claim is the spend boundary; the supervisor must not duplicate the automatic transition. |
| L2 | Formal manual dispatch must carry an explicit phase and exact immutable PR head; non-formal work must remain tuple-free and supported. | This is the live #1611 acceptance boundary and prevents both double-spend and collateral refusal. |
| L3 | Refusal and retry exhaustion occur before the paid agent job and produce one author-visible, non-recursive response. | Silent failure is the shared defect across #1611/#1613. |
| L4 | Generation lookup uses the existing phase workflow's bounded 5-attempt/1-second behavior unless the coordinator changes the contract. | Alignment, reproducibility, and the live issue specify the phase path as precedent. |
| L5 | Proving gates remain `check`, `test`, and `quality-job`, recorded through `run-gate.ts` receipts at a reachable commit. | Frozen gate contract and harness evidence rules. |
| L6 | JSR audit is N/A. | No publishable surface is involved. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Correct exact production and test edit surface | must resolve now | The current envelope excludes the real CLI caller and required tests. |
| Formal/non-formal CLI selection semantics | must resolve now | Deferring this would force a caller/API rewrite. |
| Candidate condition for malformed command attempts | must resolve now | It must expose `command-not-first-token` without replying to ordinary prose or recursing on the refusal reply. |
| Refusal reply construction/mapping ownership | must resolve now | It must be testable against the production predicate and cover live reason vocabulary. |
| Whether the phase workflow remains read-only | must resolve now | Current evidence justifies it as precedent, not an edit. |

Any unresolved row above is a Plan-Gate failure; implementation cannot begin.

## Conditional slice skeleton (not authorized)

The following sequencing is a rescope aid only. After the coordinator replaces the file contract,
the exact paths in each row must be rewritten and locked before PLAN-EVAL.

| Order | Slice | Proves | Gates | Files |
| --- | --- | --- | --- | --- |
| 1 | Formal producer contract | The real CLI emits phase/head only for formal PR evaluation and its output round-trips through the production predicate. | `check`, targeted `test` | BLOCKED pending corrected contract |
| 2 | Claim/refusal/retry workflow | Duplicate claims and exhausted lookup refuse before spend; every denial replies once without recursive dispatch; automatic dispatch remains exactly once. | targeted `test`, `quality-job` | BLOCKED pending corrected contract |
| 3 | Durable evidence/handoff | All frozen proving gates have structured receipts at a reachable head and acceptance mapping is ready for later replacement. | `check`, `test`, `quality-job` | Run artifacts plus corrected contract paths |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Broadening the issue-comment candidate condition replies to ordinary discussion. | Lock a narrow candidate rule and test ordinary prose, quoted syntax, unauthorized attempts, and the reply body against the production predicate. |
| The manual helper binds local/stale state instead of the live PR head. | Resolve the target PR through GitHub immediately before posting and carry the exact 40-character head into the command. |
| Manual and automatic paths both dispatch the same tuple. | Preserve the existing atomic ref claim; exercise forced collision and marker cases. |
| Retry exhaustion throws before feedback. | Convert exhaustion into an explicit fail-closed reason handled by the same reply path. |
| Workflow text tests drift from production behavior. | Update affected executed tests in the same slice once their paths are authorized. |
| An evaluator label or manual command fires during study. | This thread applies no evaluator labels, posts no OpenHands trigger, and stops after the plan commit. |

## Explicit Deferrals

- Provider/model routing changes.
- Claim-ref namespace or generation semantics redesign.
- Status-label lifecycle changes beyond observing current live state.
- Acceptance-evidence blocks (added later by replacement, never appended to a stale baseline).
- Aspire, Docker, CLI/scaffold E2E, browser/desktop, release, merge, publish, and issue mutation.
- Any `packages/**`, `plugins/**`, JSR, or `deno.lock` work.

## PLAN-EVAL judgement

**Required after rescope.** This leaf changes CI workflow event selection, write permissions,
author-visible security feedback, a generation retry protocol, and an atomic spend claim. Its
failure modes are silent refusal, recursion, or duplicate provider spend. The harness therefore
requires a separate-session PLAN-EVAL. This Codex thread does not launch it; the coordinator owns
route selection and gate disposal.
