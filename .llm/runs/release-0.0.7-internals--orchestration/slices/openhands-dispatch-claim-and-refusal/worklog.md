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

- `deno task agentic:dispatch-openhands` gains optional `--phase plan|impl`; no `--head` flag.
- Formal CLI mode is PR-only, verdict-required, and emits the live PR head resolved by the CLI.
- Non-formal PR/issue mode remains tuple-free.
- The trusted literal-command policy owns candidate, denial, marker, and recursion decisions.
- `openhands-agent.yml` owns bounded generation lookup, exactly-one pre-spend refusal publication,
  and the paid-job dispatch gate.

### Domain Vocabulary

- `FormalPhase = 'plan' | 'impl'` — explicit optional evaluator intent.
- `ImmutableHead` — live 40-character PR SHA read by the CLI, never caller-supplied.
- `PhaseClaimKey = { generation, phase, head }` — existing exactly-once spend identity.
- `CommandCandidate` — literal command-token occurrence not excluded by status/refusal marker.
- `ReportableDenial` — exactly `command-not-first-token`, `invalid-command-argument`,
  `unknown-command-argument`, `duplicate-command-argument`, or `author-not-authorized`; each
  requires one author-visible reply.
- `RefusalMarker` — stable source-comment-keyed idempotency/recursion marker.
- `GenerationRetry` — five attempts at one-second intervals, matching read-only precedent.

### Ports

- GitHub PR read — resolves live head for formal CLI mode.
- GitHub events read — resolves phase generation with bounded retry.
- Git ref create/read — existing atomic phase claim.
- GitHub comments list/write — detects an existing refusal marker and posts one controlled reply.

### Constants

- Formal phases: `plan`, `impl`.
- Retry precedent: five attempts, one-second interval.
- Status marker(s) and the new refusal marker are explicit non-candidate vocabulary.
- Refusal reason/recovery strings are controlled constants; raw command text is never rendered.

### Commit Slices

| # | Slice | Proving gates | Files |
| --- | --- | --- | --- |
| S1 | Refusal and recursion policy guard | `check`, `test` | `.github/scripts/openhands-comment-trigger.mjs`; `.github/scripts/openhands-comment-trigger.test.ts` |
| S2 | Formal comment producer contract | `check`, `test` | `.llm/tools/agentic/lib/agentic-lib.ts`; `.llm/tools/agentic/lib/agentic-lib_test.ts` |
| S3 | CLI-owned live-head binding | `check`, `test` | `.llm/tools/agentic/openhands/dispatch-openhands.ts`; `.llm/tools/agentic/openhands/dispatch-openhands_test.ts` |
| S4 | Pre-spend workflow reporting and aligned retry | `check`, `test`, `quality-job` | `.github/workflows/openhands-agent.yml`; `.llm/tools/agentic/openhands/phase-eval-workflow_test.ts` |
| S5 | Full durable evidence and handoff | `check`, `test`, `quality-job` | run artifacts/receipts only |

### Deferred Scope

- The automatic phase workflow, claim namespace, routing, non-comment triggers, acceptance evidence,
  release/E2E surfaces, packages/plugins, JSR, lock/cache, and central state are outside this leaf.

### Contributor Path

Follow `dispatch-openhands.ts` from `--phase` parsing through the live PR read into
`buildOpenHandsComment`; then follow the first-line comment into the trusted policy's
candidate/marker/claim decision and finally the workflow's refusal-or-agent branch. The four test
surfaces mirror those boundaries in the same order.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-15 | S0 | Bootstrap | Verified worktree/base; preserved coordinator thread metadata; committed templates; opened draft PR #1658. |
| 2026-08-15 | Plan | Research | Re-read #1611/#1613 and traced producer, predicate, claim, refusal, retry, and tests. |
| 2026-08-15 | Plan | Rescope stop | Recorded significant contract drift and stopped without widening the four-path envelope. |
| 2026-08-15 | Plan | Contract amendment | Verified central amendment `feaf2da31`; replaced blocked plan with exact eight-path design and ordered slices. |
| 2026-08-15 | Plan gate | PASS | Separate evaluator commit `e15d78588` records PASS against plan head `cea999d18`; implementation authorized at S1. |
| 2026-08-15 | S1 | RED | Added candidate/refusal/recursion regressions first; targeted structured test wrapper exited 1 because the new policy exports did not exist. |
| 2026-08-15 | S1 | Implementation | Added literal candidate classification, explicit five-reason reportable set, marker exclusions, and controlled source-comment refusal replies; targeted suite passed 16/16 after implementation. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| S1 precedes workflow broadening | S4 consumes the candidate/refusal API introduced by S1. Feature-branch commit order does not itself protect live spend: both the `issue_comment` workflow definition and trusted policy checkout resolve from the default branch, so intermediate branch commits cannot affect dispatch. | evaluator N1; `openhands-agent.yml:164` |
| CLI alone resolves formal head | Verdict provenance cannot trust caller input. | amendment `feaf2da31` |
| PLAN-EVAL required | Workflow permissions plus atomic claim/spend have silent and recursive failure modes. | coordinator decision; harness plan gate |
| JSR audit N/A | No publishable package/plugin surface. | amended contract |

## Gate Results

Durable slice receipts are pending the committed S1 head. The targeted RED/GREEN loop used the
structured test wrapper directly: RED exit 1 before implementation, then GREEN exit 0 with 16/16
tests after implementation. Of the frozen proving gates, only `test` exercises this leaf;
`check` and `quality-job` select package/plugin roots and will be recorded as contract receipts,
not as independent behavioral proof.

## Handoff Notes

- PLAN-EVAL passed in separate evaluator commit `e15d78588` before implementation.
- S1 stops after its durable receipts, push, and PR comment for Tier-A substantive review.
- S2 is not authorized until that review.
- This thread did not dispatch OpenHands/evaluator work or apply workflow-triggering labels.
