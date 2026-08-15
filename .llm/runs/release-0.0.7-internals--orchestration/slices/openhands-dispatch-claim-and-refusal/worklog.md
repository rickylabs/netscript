# Worklog: OpenHands dispatch claim and refusal

## Run Metadata

| Field          | Value                                                                                |
| -------------- | ------------------------------------------------------------------------------------ |
| Run ID         | `release-0.0.7-internals--orchestration/slices/openhands-dispatch-claim-and-refusal` |
| Branch         | `fix/openhands-dispatch-claim-and-refusal`                                           |
| Archetype      | `6-cli-tooling`                                                                      |
| Scope overlays | none                                                                                 |

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

| #  | Slice                                          | Proving gates                  | Files                                                                                                           |
| -- | ---------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| S1 | Refusal and recursion policy guard             | `check`, `test`                | `.github/scripts/openhands-comment-trigger.mjs`; `.github/scripts/openhands-comment-trigger.test.ts`            |
| S2 | Formal comment producer contract               | `check`, `test`                | `.llm/tools/agentic/lib/agentic-lib.ts`; `.llm/tools/agentic/lib/agentic-lib_test.ts`                           |
| S3 | CLI-owned live-head binding                    | `check`, `test`                | `.llm/tools/agentic/openhands/dispatch-openhands.ts`; `.llm/tools/agentic/openhands/dispatch-openhands_test.ts` |
| S4 | Pre-spend workflow reporting and aligned retry | `check`, `test`, `quality-job` | `.github/workflows/openhands-agent.yml`; `.llm/tools/agentic/openhands/phase-eval-workflow_test.ts`             |
| S5 | Full durable evidence and handoff              | `check`, `test`, `quality-job` | run artifacts/receipts only                                                                                     |

### Deferred Scope

- The automatic phase workflow, claim namespace, routing, non-comment triggers, acceptance evidence,
  release/E2E surfaces, packages/plugins, JSR, lock/cache, and central state are outside this leaf.

### Contributor Path

Follow `dispatch-openhands.ts` from `--phase` parsing through the live PR read into
`buildOpenHandsComment`; then follow the first-line comment into the trusted policy's
candidate/marker/claim decision and finally the workflow's refusal-or-agent branch. The four test
surfaces mirror those boundaries in the same order.

## Progress Log

| Time       | Slice     | Step               | Notes                                                                                                                                                                                               |
| ---------- | --------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-15 | S0        | Bootstrap          | Verified worktree/base; preserved coordinator thread metadata; committed templates; opened draft PR #1658.                                                                                          |
| 2026-08-15 | Plan      | Research           | Re-read #1611/#1613 and traced producer, predicate, claim, refusal, retry, and tests.                                                                                                               |
| 2026-08-15 | Plan      | Rescope stop       | Recorded significant contract drift and stopped without widening the four-path envelope.                                                                                                            |
| 2026-08-15 | Plan      | Contract amendment | Verified central amendment `feaf2da31`; replaced blocked plan with exact eight-path design and ordered slices.                                                                                      |
| 2026-08-15 | Plan gate | PASS               | Separate evaluator commit `e15d78588` records PASS against plan head `cea999d18`; implementation authorized at S1.                                                                                  |
| 2026-08-15 | S1        | RED                | Added candidate/refusal/recursion regressions first; targeted structured test wrapper exited 1 because the new policy exports did not exist.                                                        |
| 2026-08-15 | S1        | Implementation     | Added literal candidate classification, explicit five-reason reportable set, marker exclusions, and controlled source-comment refusal replies; targeted suite passed 16/16 after implementation.    |
| 2026-08-15 | S1        | Durable gates      | At committed head `4aa04de34`, `check` passed with 2,922 package/plugin files selected and `test` passed with 4,138 passed / 19 ignored / 0 failed. Only `test` covers this leaf.                   |
| 2026-08-15 | S1        | Reconcile          | #1611 and #1613 remain open at milestone `0.0.7`; PR comments through PLAN-EVAL were read and introduced no new implementation adjustment. No issue mutation or out-of-scope label change was made. |

## Decisions

| Decision                        | Reason                                                                                                                                                                                                                                                                                   | Source                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| S1 precedes workflow broadening | S4 consumes the candidate/refusal API introduced by S1. Feature-branch commit order does not itself protect live spend: both the `issue_comment` workflow definition and trusted policy checkout resolve from the default branch, so intermediate branch commits cannot affect dispatch. | evaluator N1; `openhands-agent.yml:164` |
| CLI alone resolves formal head  | Verdict provenance cannot trust caller input.                                                                                                                                                                                                                                            | amendment `feaf2da31`                   |
| PLAN-EVAL required              | Workflow permissions plus atomic claim/spend have silent and recursive failure modes.                                                                                                                                                                                                    | coordinator decision; harness plan gate |
| JSR audit N/A                   | No publishable package/plugin surface.                                                                                                                                                                                                                                                   | amended contract                        |

## Gate Results

| Gate           | Outcome          | Exit | Receipt / evidence                                                              | Coverage meaning                                                                                     |
| -------------- | ---------------- | ---: | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Targeted RED   | expected failure |    1 | structured test wrapper, before implementation; no durable PASS receipt         | New policy exports did not exist.                                                                    |
| Targeted GREEN | PASS             |    0 | structured test wrapper; 16/16                                                  | Focused S1 regression feedback.                                                                      |
| `check`        | PASS             |    0 | `receipts/slice-1/check.json` at `4aa04de34`                                    | Frozen-contract receipt only: selected 2,922 files under package/plugin roots and does not cover S1. |
| `test`         | PASS             |    0 | `receipts/slice-1/test.json` at `4aa04de34`; 4,138 passed, 19 ignored, 0 failed | Load-bearing S1 behavioral proof; root discovery executed the policy suite.                          |
| `quality-job`  | NOT_RUN          |    — | S1 does not name this gate; scheduled for S4/S5                                 | Would share the non-covering package/plugin `check` dependency and is not independent proof.         |

## Handoff Notes

- PLAN-EVAL passed in separate evaluator commit `e15d78588` before implementation.
- S1 stops after its durable receipts, push, and PR comment for Tier-A substantive review.
- S2 is not authorized until that review.
- Evaluator N3/N4 are discharged in S1: controlled refusal output is tested against the exact
  watcher fallback token regex, and each of the five reportable reasons has its own assertion.
- Evaluator N5 remains deliberately deferred to S4, the authorized workflow slice: refusal posting
  must use `GITHUB_TOKEN` beneath `issues: write`, never `PAT_TOKEN`.
- This thread did not dispatch OpenHands/evaluator work or apply workflow-triggering labels.

## Tier-A sign-off — Slice 1

Signed off by `topic-internals-0.0.7` (Claude session `f7691917-0be2-4bcd-8839-43d3fc809c34`, Opus 5
/ high) at `f1567ce32806f30f80365d180e73e053eb7d8e05` (implementation `4aa04de34`, attestation
`f1567ce32`). Supervisor commit, not the implementer's.

Verified by execution, not by reading receipts:

- **Scope holds.** Only `.github/scripts/openhands-comment-trigger.mjs` and its test — exactly S1's
  two paths from the eight-path envelope. No drift into S2–S4 surfaces, no ninth path, no lock
  churn.
- **Supervisor re-ran the suite: 16 passed / 0 failed, exit 0.**
- **The recursion guard is proven by round-trip, not asserted.** The refusal body is fed back
  through the real predicates: `isOpenHandsCommentCandidate(refusal.body) === false`,
  `decide(refusal.body).reason === 'not-command-candidate'`, and
  `refusal.body.includes(OPENHANDS_COMMENT_COMMAND) === false`. A test that merely inspected the
  wording would not have shown the bot's own reply is a non-candidate; running it through the actual
  predicate does.
- **N3 discharged by execution.** `WATCHER_HEURISTIC_TOKEN_RE.test(refusal.body) === false` runs the
  very regex (`agentic-lib.ts:939`) that could otherwise mine a refusal as a verdict — proof rather
  than careful word choice.
- **N4 discharged exactly.** All five reasons — `command-not-first-token`,
  `invalid-command-argument`, `unknown-command-argument`, `duplicate-command-argument`,
  `author-not-authorized` — appear in both implementation and test, with a dedicated _"reportable
  denial vocabulary is exactly the five policy refusal reasons"_ test (note **exactly**, which
  forbids a superset as well as a subset) and a separate _"each malformed or unauthorized literal
  candidate gets its attributable reason"_ test giving the per-reason assertions.
- **Sanitization holds** — `untrustedLogin.body.includes('owner') === false`, so an untrusted
  author's identity does not leak into the reply.
- **Claim/collision behaviour untouched** — the diff removes no claim or spend logic; the only
  addition in that area is a doc comment. Fail-closed zero-spend is preserved by not being
  disturbed.

**N1 corrected by the leaf, correctly.** `worklog.md:89` now justifies S1-before-S4 by the _"S4
consumes the candidate/refusal API introduced by S1"_ dependency and states plainly that
_"Feature-branch commit order does not itself protect live spend: both the `issue_comment` workflow
definition and trusted policy checkout resolve from the default branch"_. That replaces the
rationale I wrongly endorsed at Tier-A.

**N2 honoured with unusual honesty.** The gate table records `check` as _"Frozen-contract receipt
only … does not cover S1"_, `test` as _"Load-bearing S1 behavioral proof"_, and `quality-job` as
**`NOT_RUN`** with _"not independent proof"_ — rather than presenting green receipts as three proofs
or silently omitting the gate S1 does not name.

Slice 2 is authorized.

## Slice 2 — Formal comment producer contract

### Progress

| Time       | Step           | Notes                                                                                                                                                                                           |
| ---------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-15 | Authorization  | Fast-forwarded to Tier-A S1 sign-off `6f725ad3b`; began S2 only.                                                                                                                                |
| 2026-08-15 | RED            | Added symmetric formal-pair and non-formal-omission tests first; targeted structured wrapper exited 1 because `DispatchOptions` had no `phase`/`head` surface.                                  |
| 2026-08-15 | Implementation | Kept `buildOpenHandsComment` pure; added optional typed phase/head inputs, runtime pair/phase/SHA validation, paired emission, and explicit tuple-free assertions. Targeted suite passed 75/75. |
| 2026-08-15 | Durable gates  | At `28a8a9184`, cached package/plugin `check` passed and root `test` passed with 4,140 passed / 19 ignored / 0 failed. Only `test` covers S2.                                                   |
| 2026-08-15 | Reconcile      | Read S1 supervisor sign-off comment `5301346790`; #1611/#1613 remain open and unchanged at milestone `0.0.7`. No plan adjustment or issue mutation was needed.                                  |

### Decisions

- The producer accepts a formal tuple only as `phase: 'plan' | 'impl'` plus a 40-character lowercase
  hexadecimal head. Either field alone, an invalid phase, or malformed head throws before output.
- Without both fields, the command line emits neither `phase=` nor `head=`.
- The producer performs no GitHub read and resolves no head; S3 remains the sole owner of the live
  PR lookup.

### Gate status

| Gate           | Outcome          | Exit | Receipt / evidence                                                              | Coverage meaning                                                                      |
| -------------- | ---------------- | ---: | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Targeted RED   | expected failure |    1 | structured test wrapper before implementation; no durable PASS receipt          | Type-check rejected absent `phase`/`head` producer fields.                            |
| Targeted GREEN | PASS             |    0 | structured test wrapper; 75/75                                                  | Focused pair-validation and tuple-omission feedback.                                  |
| `check`        | PASS             |    0 | `receipts/slice-2/check.json` at `28a8a9184`; unchanged-input cache hit         | Frozen-contract receipt only; package/plugin roots do not cover S2.                   |
| `test`         | PASS             |    0 | `receipts/slice-2/test.json` at `28a8a9184`; 4,140 passed, 19 ignored, 0 failed | Load-bearing S2 behavioral proof; root discovery executed the producer suite.         |
| `quality-job`  | NOT_RUN          |    — | S2 does not name this gate; scheduled for S4/S5                                 | Shares the non-covering package/plugin check dependency and is not independent proof. |

### Handoff boundary

- S2 stops after durable receipts, push, and its PR comment for Tier-A review.
- S3 is not authorized and no CLI or workflow path was changed.
- No OpenHands/evaluator dispatch or workflow-triggering label transition occurred.

## Tier-A sign-off — Slice 2

Signed off by `topic-internals-0.0.7` (Claude session `f7691917-0be2-4bcd-8839-43d3fc809c34`, Opus 5
/ high) at `5869cb46d5157fd4bd42ef2afaf357286a823506` (implementation `28a8a9184`, attestation
`5869cb46d`). Supervisor commit, not the implementer's.

Verified by execution:

- **Scope holds** — only `agentic-lib.ts` and its test, exactly S2's two paths. No drift, no lock
  churn.
- **Supervisor re-ran the suite: 75 passed / 0 failed, exit 0.**
- **The two halves are proved symmetrically**, which was the requirement. Formal mode asserts
  presence — `first.includes('phase=plan')` and
  `first.includes(\`head=${head}\`)`— and non-formal
  mode asserts **absence** —`!first.includes('phase=')`and`!first.includes('head=')`.
  Checking only the formal side would have let tuple plumbing leak into the non-formal path
  unnoticed, which is precisely what the locked contract forbids.
- **Half-tuples are rejected, not tolerated.** Three distinct failures:
  `'requires phase and head together'`, `'phase must be plan or impl'`, and
  `'head must be a 40-character lowercase hex SHA'` enforced by `/^[0-9a-f]{40}$/`. That shape
  matters — an abbreviated or uppercase SHA would not bind a verdict to exactly one commit, which is
  the whole purpose of the tuple.
- **The producer stayed pure.** No `fetch`, Octokit, GitHub client, or `await` was added; it
  validates and formats only. Live head resolution remains S3's alone, so the producer stays
  testable without network and two components never claim authority over the same fact.
- **N2 honesty carried forward** — the S2 gate table again records `test` as the load-bearing proof
  (4,140 passed / 0 failed) and `quality-job` as `NOT_RUN` with the non-covering `check` dependency
  named, rather than banking a green receipt that does not cover these paths.

Slice 3 is authorized.
