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

## Slice 3 — CLI-owned live-head binding

### Progress

| Time       | Step           | Notes                                                                                                                                                                                                                                 |
| ---------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-15 | Authorization  | Fast-forwarded to Tier-A S2 sign-off `0886c2427`; began S3 only.                                                                                                                                                                      |
| 2026-08-15 | RED            | Added deterministic CLI tests first; the targeted structured wrapper exited 1 because the injected dispatch runner and dependency contract did not exist.                                                                             |
| 2026-08-15 | Implementation | Added optional constrained `--phase`, formal PR/verdict guards, injected file/token/GitHub ports, and a live PR-head read immediately before trigger construction. No `--head` parser surface was added. Targeted suite passed 80/80. |
| 2026-08-15 | Durable gates  | At `d7fdbb1d9`, cached package/plugin `check` passed and root `test` passed with 4,145 passed / 19 ignored / 0 failed. Only `test` covers S3.                                                                                         |
| 2026-08-15 | Reconcile      | Read the S2 supervisor sign-off comment `5301401476`; #1611/#1613 remain open and unchanged at milestone `0.0.7`. No plan adjustment, issue mutation, or label change was needed.                                                     |

### Decisions

- Formal dispatch resolves the authenticated live PR head after all prompt/route/target validation
  and immediately before building the emitted comment; dry-run performs the same binding read.
- The CLI exposes no caller-owned head input. `--head` remains an unknown argument and has an
  explicit regression assertion.
- Non-formal PR and issue dry-runs preserve their existing no-token/no-network behavior and assert
  the absence of both tuple tokens.
- The GitHub and token boundaries are injected only to make the real sequencing deterministic in
  tests; production wiring continues to use the existing helpers.

### Gate status

| Gate           | Outcome          | Exit | Receipt / evidence                                                      | Coverage meaning                                                                |
| -------------- | ---------------- | ---: | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Targeted RED   | expected failure |    1 | structured test wrapper before implementation; no durable PASS receipt  | Missing runner/dependency exports proved the tests preceded implementation.     |
| Targeted GREEN | PASS             |    0 | structured test wrapper; 80/80                                          | Focused CLI sequencing, refusal, and tuple-free behavioral feedback.            |
| `check`        | PASS             |    0 | `receipts/slice-3/check.json` at `d7fdbb1d9`; unchanged-input cache hit | Frozen-contract receipt only; package/plugin roots do not cover S3.             |
| `test`         | PASS             |    0 | `receipts/slice-3/test.json` at `d7fdbb1d9`; 4,145 passed, 19 ignored   | Load-bearing S3 proof; root discovery executed the new CLI suite.               |
| `quality-job`  | NOT_RUN          |    — | S3 does not name this gate; scheduled for S4/S5                         | Shares the non-covering package/plugin check dependency; not independent proof. |

### Handoff boundary

- S3 stops after durable receipts, push, and its PR comment for Tier-A review.
- S4 is not authorized and no workflow path was changed.
- No live GitHub API, OpenHands/evaluator dispatch, or workflow-triggering label transition
  occurred.

## Tier-A sign-off — Slice 3

Signed off by `topic-internals-0.0.7` (Claude session `f7691917-0be2-4bcd-8839-43d3fc809c34`, Opus 5
/ high) at `2e6a065d774dd21cc4f9913eacc291622d27bc76` (implementation `d7fdbb1d9`, attestation
`2e6a065d7`). Supervisor commit, not the implementer's.

Verified by execution:

- **Scope holds** — `dispatch-openhands.ts` modified and `dispatch-openhands_test.ts` added, exactly
  S3's two paths. **No `catalog.ts`, `deno.json`, or lock edit**, confirming PLAN-EVAL N2's finding
  that the new suite is auto-discovered and needs no ninth path.
- **Supervisor re-ran the suite: 5 passed / 0 failed, exit 0.**
- **All five required properties are proved, not merely implemented.** The five tests map one-to-one
  onto them, and two are worth naming:
  - **The absence of `--head` is proved by passing it.** The test supplies `--head <40 hex>` and
    asserts `Unknown argument: --head` on stderr, and the CLI source contains no `--head` at all.
    Proving a flag is rejected is stronger than never implementing it, because a later refactor that
    quietly accepts it would fail this test.
  - **Late resolution is proved by an exact call-sequence assertion**, not by inspection:
    `assertEquals(h.calls, ['token', 'GET …/pulls/42', 'POST …/issues/42/comments'])`. Nothing sits
    between head resolution and the post, and any extra or reordered call breaks the assertion — so
    a stale head cannot creep in, and there is provably **exactly one** post.
- **Non-formal dispatch is proved inert**: `assertEquals(h.calls, [])` — **zero** GitHub calls —
  plus the absence of both tokens, asserted across **both** PR and issue targets rather than PR
  alone.
- **N2 honesty carried forward** — `test` recorded as the load-bearing S3 proof (4,145 passed) and
  `quality-job` as `NOT_RUN` naming the non-covering `check` dependency.

Slice 4 is authorized.

## Slice 4 — Pre-spend workflow reporting and aligned retry

### Progress

| Time       | Step           | Notes                                                                                                                                                                                                                                         |
| ---------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-15 | Authorization  | Fast-forwarded to Tier-A S3 sign-off `d3d31b3d0`; began S4 only.                                                                                                                                                                              |
| 2026-08-15 | RED            | Replaced old workflow-filter assertions and added executable retry/refusal/dedup tests first; targeted wrapper exited 1 with 7 passed / 3 failed because literal routing and the embedded helpers did not exist.                              |
| 2026-08-15 | Implementation | Routed every literal candidate to trusted policy, added 5×1s lookup with controlled exhaustion, emitted source-keyed refusal outputs, and posted them once in an authorize-job step before the paid job. Policy + workflow suites pass 26/26. |
| 2026-08-15 | Durable gates  | At `9b71e1bd2`, cached package/plugin `check`, root `test`, and `quality-job` passed. Root test reported 4,147 passed / 19 ignored / 0 failed; only `test` covers S4.                                                                         |
| 2026-08-15 | Reconcile      | Read S3 supervisor sign-off comment `5301464449`; #1611/#1613 remain open and unchanged at milestone `0.0.7`. No plan adjustment, issue mutation, or label change was needed.                                                                 |

### Decisions

- The PAT remains confined to the trusted policy step because formal authorization must create/read
  the existing claim ref. Refusal publication is a separate step using `GITHUB_TOKEN`; therefore the
  authorize job's `issues: write` grant is the actual comment-write ceiling.
- The authorize job grants only `contents: read` for trusted policy checkout and `issues: write` for
  refusal publication. It has no `pull-requests: write` or provider permission.
- Ordinary five-reason denials use the S1 controlled builder. Generation exhaustion uses the same
  source-comment marker vocabulary but names the missing phase-status generation and five exhausted
  attempts without reflecting command text.
- The embedded reporter lists comments, posts only when the source marker is absent, and returns a
  boolean. Its executed repeat-delivery test pins the exact sequence `list, post, list`, one post,
  and one stored body.
- The paid `agent` job still requires `needs.authorize.outputs.dispatch == 'true'`; every refusal
  path sets dispatch false and the refusal step precedes the agent job in workflow order.

### Gate status

| Gate           | Outcome          | Exit | Receipt / evidence                                                      | Coverage meaning                                                               |
| -------------- | ---------------- | ---: | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Targeted RED   | expected failure |    1 | structured test wrapper before implementation; 7 passed / 3 failed      | Missing workflow routing/helpers proved tests preceded implementation.         |
| Targeted GREEN | PASS             |    0 | structured test wrapper; policy + workflow suites 26/26                 | Focused executable S4 policy, retry, dedup, ordering, and permission feedback. |
| `check`        | PASS             |    0 | `receipts/slice-4/check.json` at `9b71e1bd2`; unchanged-input cache hit | Frozen-contract receipt only; package/plugin roots do not cover S4.            |
| `test`         | PASS             |    0 | `receipts/slice-4/test.json` at `9b71e1bd2`; 4,147 passed, 19 ignored   | Load-bearing S4 proof; root discovery executed policy/workflow suites.         |
| `quality-job`  | PASS             |    0 | `receipts/slice-4/quality-job.json` at `9b71e1bd2`                      | Required contract receipt; package/plugin quality inputs do not cover S4.      |

### Handoff boundary

- S4 stops after all three durable receipts, push, and its PR comment for Tier-A review.
- S5 is not authorized and no read-only phase workflow path was changed.
- No OpenHands/evaluator dispatch, live workflow trigger, or status-label transition occurred.

## Tier-A sign-off — Slice 4

Signed off by `topic-internals-0.0.7` (Claude session `f7691917-0be2-4bcd-8839-43d3fc809c34`, Opus 5
/ high) at `ab4b8185f545b4890f7fcbc0e00a114afecb4087` (implementation `9b71e1bd2`, attestation
`ab4b8185f`). Supervisor commit, not the implementer's.

Verified by execution:

- **Scope holds** — `openhands-agent.yml` + `phase-eval-workflow_test.ts` only, and
  `.github/workflows/openhands-phase-eval.yml` is **untouched across the whole leaf**, so the
  read-only precedent boundary held from the rescope through to the last implementation slice.
- **Supervisor re-ran the workflow suite: 10 passed / 0 failed.** RED-first is recorded honestly —
  the targeted wrapper first exited 1 at 7 passed / 3 failed because literal routing and the
  embedded helpers did not yet exist.
- **N5 discharged, and the ceiling is now real rather than declared.** The authorize job's
  `permissions:` block gains `issues: write` beside `contents: read`, annotated _"one
  source-comment-keyed refusal via GITHUB_TOKEN"_, and the refusal step posts with
  `${{ secrets.GITHUB_TOKEN }}`. The evidence states it outright: _"Refusal publication is a
  separate step using `GITHUB_TOKEN`; therefore the authorize job's `issues: write` grant is the
  actual comment-write ceiling"_, with _"no `pull-requests: write` or provider permission"_. That
  lets IMPL-EVAL **check** the bound instead of inferring it. The surviving `PAT_TOKEN` reference is
  a later checkout step, not the refusal path.
- **Dedup is proved by count across a repeat delivery, not by presence.** The test extracts the
  embedded `reportRefusalOnce` from the workflow YAML and executes it via `new Function` — testing
  the shipped implementation rather than a reimplementation — then asserts
  `calls === ['list', 'post', 'list']`, `calls.filter(c => c === 'post').length === 1`, and
  `bodies.length === 1`, with the second invocation returning `false`. A second delivery provably
  produces no second reply.
- **The 5×1s retry is pinned exactly**: `attempts === [1,2,3,4,5]` and
  `sleeps === [1000,1000,1000,1000,1000]`, with `result === undefined` on exhaustion and the
  embedded exhaustion-refusal asserted present — so exhaustion is attributable rather than the
  precedent's bare `throw`.
- **Gate honesty held even where the gate is contractually required.** `quality-job` ran and PASSed,
  yet is recorded as _"Required contract receipt; package/plugin quality inputs do not cover S4"_ —
  the leaf declines to bank a required-but-non-covering gate as coverage. `test` remains the
  load-bearing proof at 4,147 passed.

Slice 5 is authorized.

## Slice 5 — Full evidence and handoff

### Progress

| Time       | Step          | Notes |
| ---------- | ------------- | ----- |
| 2026-08-15 | Authorization | Fetched and verified clean exact head `ad19d0e20`, the Tier-A S4 sign-off; began evidence-only S5 without rebasing. |
| 2026-08-15 | Reconcile     | Read live PR #1658, its latest S4 sign-off, and issues #1611/#1613. The PR remains draft; both issues remain open; no body checkbox, label, issue, readiness, or evaluator state was changed. |
| 2026-08-15 | Checkpoint    | Prepared this run-only checkpoint so `check`, `test`, and `quality-job` can all attest one immutable branch-reachable head. No implementation path changed. |

### Definition-of-Done truth audit (pre-final-receipt checkpoint)

| PR-body row | Truth status | Evidence / remaining requirement |
| --- | --- | --- |
| Optional formal `--phase plan|impl`, PR-only/verdict-required/live-head/no caller head | Satisfied | S2 producer pair tests and S3 CLI tests; `receipts/slice-2/test.json`, `receipts/slice-3/test.json`; Tier-A S2/S3 sign-offs. |
| Phase-absent PR and issue dispatch remain tuple-free | Satisfied | Explicit absence assertions in S2 plus both-target/zero-call assertions in S3. |
| Formal dispatch acquires the existing tuple claim and refuses duplicates pre-spend | Satisfied | S1 producer round-trip and forced-collision production-policy coverage; `receipts/slice-1/test.json`; claim primitive preserved through S4. |
| Every reportable denial gets exactly one sanitized, marker-bearing, token-free pre-spend reply | Satisfied | S1 exact five-reason assertions; S4 shipped reporter repeat-delivery count/sequence test; `receipts/slice-1/test.json`, `receipts/slice-4/test.json`. |
| Status/refusal markers cannot recurse | Satisfied | S1 generated refusal round-tripped through production predicates and watcher heuristic; S4 exhaustion refusal repeats both guards. |
| Manual generation lookup is 5×1s and exhaustion is attributable/fail-closed | Satisfied | S4 executable workflow extraction asserts five attempts, five 1000 ms waits, controlled refusal, and agent skip. |
| Complete round-trip/collision/refusal/recursion/CLI/retry plus all three final gates recorded | Satisfied; PR checkbox deliberately unchanged | Behavioral parts landed in S1–S4. `receipts/slice-5/{check,test,quality-job}.json` all PASS at checkpoint `1390d3ead`; root `test` reports 4,147 passed / 19 ignored / 0 failed. The coordinator/IMPL-EVAL owns the checkbox transition. |
| Separate-session PLAN-EVAL and IMPL-EVAL satisfied | Not yet satisfied | PLAN-EVAL PASS exists at `e15d78588`; IMPL-EVAL has not run and must remain a separate-session coordinator action after S5/Tier-A. |

### N1–N5 disposition

| Note | Status | Disposition |
| --- | --- | --- |
| N1 | Discharged | S1 corrected the ordering rationale: S4 follows S1 because S4 consumes the S1 API. Feature-branch intermediate commits cannot affect default-branch workflow/policy execution. |
| N2 | Discharged | Every gate table names root `test` as load-bearing. `check` and `quality-job` are required receipts but their package/plugin selections do not cover this leaf. The new CLI suite was root-auto-discovered; no catalog/ninth path was added. |
| N3 | Discharged | Controlled refusal vocabulary avoids bare watcher verdict tokens; S1 and S4 execute `WATCHER_HEURISTIC_TOKEN_RE` against generated refusal bodies. |
| N4 | Discharged | S1 asserts the reportable-denial set is exactly the five required reasons and asserts each reason independently. |
| N5 | Discharged | S4 posts refusal with `GITHUB_TOKEN` under authorize-job `contents: read` + `issues: write`; PAT remains claim-only, so the declared write grant is the actual ceiling. |

### S5 boundaries

- S5 owns only run artifacts and receipts; the eight implementation paths remain untouched.
- The final three receipts will bind to the checkpoint commit created from this record.
- No OpenHands/evaluator dispatch, label transition, ready flip, PR-body checkbox edit, issue mutation,
  forbidden runtime gate, or lock/cache operation is authorized.

### Final durable gates

All three receipts attest the same immutable checkpoint `1390d3ead1d7d4381ace3d9403f559f009895643`,
which is an ancestor of the final evidence commit and therefore reachable from the branch head.

| Gate | Outcome | Exit | Receipt | Coverage meaning |
| --- | --- | ---: | --- | --- |
| `check` | PASS | 0 | `receipts/slice-5/check.json` | Required contract receipt; cached package/plugin selection, so it does not cover this leaf. |
| `test` | PASS | 0 | `receipts/slice-5/test.json`; 4,147 passed, 19 ignored, 0 failed | Load-bearing behavioral proof; root auto-discovery executes the producer, policy, CLI, and workflow suites. |
| `quality-job` | PASS | 0 | `receipts/slice-5/quality-job.json` | Required contract receipt; its package/plugin quality inputs are not independent behavioral coverage of this leaf. |

### Final scope and handoff audit

- S5 changed only `worklog.md`, `context-pack.md`, and `receipts/slice-5/*.json`.
- Across the leaf, the production/test mutation surface is exactly the amended eight paths.
- `.github/workflows/openhands-phase-eval.yml` and `deno.lock` are unchanged from immutable base
  `7737d8903`; no ninth catalog/config path exists.
- DoD rows 1–7 are truthfully evidence-ready. Row 8 is not satisfied because IMPL-EVAL has not run.
  The PR body remains unchanged and draft so the separate evaluator/coordinator can own both
  checkbox completion and lifecycle transition.
- N1–N5 are all discharged; no implementation decision, drift, or debt remains open for IMPL-EVAL.
