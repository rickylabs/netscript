# Plan: OpenHands dispatch claim and refusal

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.7-internals--orchestration/slices/openhands-dispatch-claim-and-refusal` |
| Branch | `fix/openhands-dispatch-claim-and-refusal` |
| Phase | `plan` — ready for Tier-A review, then required PLAN-EVAL |
| Target | OpenHands manual dispatch CLI, trusted comment policy, and pre-spend workflow authorization |
| Archetype | `6-cli-tooling` |
| Scope overlays | none |
| Contract amendment | `feaf2da311ccc4b15c210d25fda5ff1699b60576` on `chore/release-0.0.7-orchestration` |

## Goal

Make formal manual evaluator dispatch bind itself to the live PR head and the existing
`(generation, phase, head)` claim before provider spend, while preserving tuple-free non-formal
dispatch. Make every literal command denial—including exhausted generation lookup—produce exactly
one sanitized, marker-bearing, token-free author reply before the paid job can run.

## Archetype and Doctrine Fit

Archetype 6 is authoritative and fits a user-run CLI plus workflow tooling surface. This leaf does
not touch a publishable package, CLI package folder shape, generated consumer, or public JSR export,
so package-only Archetype 6 gates are N/A. The relevant constraints are:

- A2: formal versus non-formal dispatch is explicit at the CLI boundary.
- A8: parsing/candidate/refusal policy remains in the trusted policy module; orchestration remains
  in the workflow; comment construction remains in the agentic library.
- A10: the CLI supplies explicit phase intent and composes it with a live GitHub PR read; no hidden
  caller-supplied head.
- A13: retry exhaustion and claim collision are explicit, attributable pre-spend outcomes.
- A14: pure policy, real producer round-trip, CLI request flow, and workflow wiring each receive an
  executed regression test.

## Exact Narrowed Edit Surface

All eight amended paths require an edit. No additional implementation path is authorized.

| Path | Why it must change |
| --- | --- |
| `.github/scripts/openhands-comment-trigger.mjs` | Make literal-token candidate recognition a trusted policy decision; exclude status/refusal markers; expose controlled, sanitized, token-free refusal metadata/body; distinguish non-candidates from reportable denials while preserving the existing atomic claim. |
| `.github/scripts/openhands-comment-trigger.test.ts` | Prove literal malformed/unauthorized candidates reach policy, status/refusal markers are excluded, refusal output contains no command token, the reply is non-recursive, producer output round-trips, and claim collision remains zero-spend. |
| `.github/workflows/openhands-agent.yml` | Route literal command candidates to the trusted policy regardless of grammar/author association; grant the authorize job only the comment-write permission needed for refusal; deduplicate a source-comment-keyed refusal marker; post exactly one refusal before the agent job; mirror the 5×1s generation lookup and convert exhaustion to an attributable denial. |
| `.llm/tools/agentic/lib/agentic-lib.ts` | Extend the pure producer contract with an optional formal phase/head pair, validate pair completeness and immutable-head shape, and emit both tokens only in formal mode. |
| `.llm/tools/agentic/lib/agentic-lib_test.ts` | Prove formal phase/head emission and validation plus strict tuple omission when formal mode is absent. |
| `.llm/tools/agentic/openhands/dispatch-openhands.ts` | Add only `--phase plan|impl`; enforce PR-only formal mode and required verdict contract; resolve the live PR head immediately before formal emission; pass the resolved head internally; keep issue/PR non-formal dispatch tuple-free; never accept `--head`. |
| `.llm/tools/agentic/openhands/dispatch-openhands_test.ts` | New CLI-level regression suite using controlled GitHub responses to prove phase validation, PR-only enforcement, no `--head`, required verdict contract, live-head binding before formal output/post, and unchanged tuple-free non-formal PR/issue behavior. |
| `.llm/tools/agentic/openhands/phase-eval-workflow_test.ts` | Replace assertions for the old early filter/immediate throw with workflow contract assertions for trusted literal-candidate routing, marker exclusion, minimal write permission, exactly-one refusal deduplication, 5×1s retry, attributable exhaustion, and paid-job skip. |

### Read-only precedent

`.github/workflows/openhands-phase-eval.yml` is not an edit path. Its generation lookup at lines
302-317 is the behavior to match: five bounded attempts at one-second intervals before failure.

Harness run artifacts and future gate receipts remain administrative evidence, not additions to the
eight-path implementation mutation envelope.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| L1 | `--phase plan|impl` is optional and is the only formal-mode selector. | The coordinator amendment resolves the CLI contract explicitly. |
| L2 | Formal mode is PR-only, requires the verdict contract, and performs a live PR read before every emitted formal command, including formal dry-run output. | No caller assertion or stale local SHA may become verdict provenance. |
| L3 | There is no `--head` flag. The resolved head is passed only inside the CLI-to-builder call. | Prevents a caller from claiming an unverified commit. |
| L4 | Without `--phase`, both PR and issue dispatch remain tuple-free; no `phase` or `head` token is emitted or inferred. | Preserves non-formal compatibility and avoids collateral claim refusal. |
| L5 | A comment containing the literal command token is a candidate unless it carries a recognized status or refusal marker; trusted policy—not the workflow's old grammar/association filter—decides authorization. | Makes malformed and unauthorized attempts observable without reintroducing substring dispatch. |
| L6 | Every reportable denial gets one controlled reply keyed by a stable marker for the source comment; the workflow checks for that marker before creating the reply. | Makes workflow reruns idempotent and the refusal attributable. |
| L7 | Refusal replies interpolate no raw command text, use only controlled reason/recovery text, carry the refusal marker, and contain no command token. | Prevents injection, candidate recursion, and accidental provider spend. |
| L8 | Status and refusal markers are classified as non-candidates before grammar/authorization evaluation, and tests call the production predicate on the generated refusal body. | Recursion prevention is an explicit correctness property, not an incidental `startsWith` result. |
| L9 | Manual generation lookup mirrors the read-only phase workflow: five attempts at one-second intervals. Exhaustion becomes a controlled denial naming the expected phase status and exhausted lookup, never an uncaught throw. | Aligns dispatch paths and makes the failure visible before spend. |
| L10 | The existing `(generation, phase, head)` ref claim and marker rules remain the exactly-once provider-spend boundary. | #1611 is a producer gap, not a reason to replace the proven claim primitive. |
| L11 | Proving gates are exactly `check`, `test`, and `quality-job`, recorded through `run-gate.ts` at reachable commits. JSR audit is N/A. | Matches the amended contract and harness evidence rules. |

## Open-Decision Sweep

No implementation-shaping decision remains open. The amendment resolved all four prior questions:

1. The production caller is authorized and formal selection is `--phase plan|impl`.
2. The three discovered regression suites plus a new CLI suite are authorized.
3. `openhands-phase-eval.yml` is read-only precedent.
4. Formal mode is PR-only/live-head/verdict-required; non-formal mode is tuple-free.

Implementation details that do not change these outcomes—local helper names and test fixture
layout—are safe for the implementation slice and do not force later rework.

## Ordered Implementation Slices

| Order | Slice | What it proves | Proving gates | Files |
| --- | --- | --- | --- | --- |
| S1 | Refusal and recursion policy guard | Literal candidates reach trusted policy; status/refusal markers are non-candidates; refusal text is sanitized, marker-bearing, token-free, attributable, and non-recursive; existing claim/currency decisions remain fail-closed. | `check`, `test` | `.github/scripts/openhands-comment-trigger.mjs`; `.github/scripts/openhands-comment-trigger.test.ts` |
| S2 | Formal comment producer contract | Phase/head are a validated pair emitted only for formal dispatch; non-formal output remains byte-compatible apart from intentional tests and contains neither token. | `check`, `test` | `.llm/tools/agentic/lib/agentic-lib.ts`; `.llm/tools/agentic/lib/agentic-lib_test.ts` |
| S3 | CLI-owned live-head binding | `--phase` is optional and constrained to `plan|impl`; formal mode rejects issues and disabled verdict contracts, reads the live PR head before emitting/posting, exposes no `--head`, and non-formal PR/issue paths remain tuple-free. | `check`, `test` | `.llm/tools/agentic/openhands/dispatch-openhands.ts`; `.llm/tools/agentic/openhands/dispatch-openhands_test.ts` |
| S4 | Pre-spend workflow reporting and aligned retry | Workflow candidate gating delegates to the already-landed safe policy; each denial is deduplicated and replied to once before the agent job; generation lookup matches 5×1s precedent and exhaustion is attributable; no denial authorizes provider spend. | `check`, `test`, `quality-job` | `.github/workflows/openhands-agent.yml`; `.llm/tools/agentic/openhands/phase-eval-workflow_test.ts` |
| S5 | Full evidence and handoff | The complete amended surface passes durable `check`, `test`, and `quality-job` receipts at a branch-reachable head; run artifacts and PR evidence are current for IMPL-EVAL. | `check`, `test`, `quality-job` | Harness run artifacts and receipts only; no additional implementation path |

S1 deliberately precedes the workflow change. The workflow is not allowed to broaden from
first-token/trusted-author filtering to literal candidates until the production policy can exclude
status/refusal markers and generate a token-free refusal whose own body is proven non-candidate.
That ordering prevents an intermediate commit from turning malformed prose or a bot reply into a
paid or recursive dispatch.

## Validation Plan

| Order | Gate | Command | Expected result |
| --- | --- | --- | --- |
| 1 | `check` | `deno run --allow-read --allow-write --allow-run --allow-env .llm/tools/gates/run-gate.ts --gate check --id openhands-dispatch-check --output <run-dir>/receipts/check.json` | PASS receipt at immutable branch head |
| 2 | `test` | `deno run --allow-read --allow-write --allow-run --allow-env .llm/tools/gates/run-gate.ts --gate test --id openhands-dispatch-test --output <run-dir>/receipts/test.json` | PASS; executed producer/policy/CLI/workflow regressions included |
| 3 | `quality-job` | `deno run --allow-read --allow-write --allow-run --allow-env .llm/tools/gates/run-gate.ts --gate quality-job --id openhands-dispatch-quality --output <run-dir>/receipts/quality-job.json` | PASS receipt at same reachable head |

The implementation pass must confirm the exact `run-gate.ts` permission/argument shape from its
current help/catalog before firing; this plan records the gate identity and receipt destination, not
permission to run them during planning.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Literal-token candidate broadening reintroduces recursive or quoted-prose spend. | Land S1 first; exclude status/refusal markers; require `dispatch === true` for the paid job; test quoted/malformed text and the generated reply through the production predicate. |
| A denial reply is duplicated on workflow rerun. | Use a stable marker derived from the source comment ID, list existing comments, and create only when absent; assert the dedup contract in the workflow test. |
| Raw attacker-controlled text is reflected by the bot. | Render only controlled reason/recovery vocabulary and marker data; never echo the submitted first line or prompt. |
| Formal output binds a stale or caller-chosen head. | Do not expose `--head`; fetch the live PR immediately before building formal output and assert the exact returned SHA in CLI tests. |
| Formal plumbing leaks into non-formal issue/PR dispatch. | Model phase/head as an optional validated pair in the builder and exercise both non-formal target kinds in CLI and library tests. |
| Retry still throws silently or sleeps unboundedly. | Mirror the read-only five-attempt/one-second loop and turn only exhausted lookup into a controlled attributable denial; assert attempt count and paid-job skip. |
| Authorize permission becomes broader than needed. | Add only issue-comment write capability to the authorize job; keep provider secrets and paid execution in the gated agent job. |
| Automatic and manual dispatch both spend for the same tuple. | Preserve atomic ref acquisition and execute existing forced-collision plus producer round-trip coverage. |
| A workflow-only string assertion gives false confidence. | Pair workflow contract assertions with pure production-policy tests and CLI-level mocked request-flow tests. |

## Explicit Deferrals

- No change to `.github/workflows/openhands-phase-eval.yml`, its automatic phase-selection logic, or
  its claim namespace.
- No caller-supplied head flag or offline formal mode.
- No provider/model/effort routing change.
- No change to non-comment triggers, output modes, prompt contract, status transitions, or verdict
  parsing beyond what formal phase/head emission requires.
- No acceptance-evidence blocks until real gate evidence exists; later blocks replace rather than
  append.
- No Aspire, Docker, browser/desktop, CLI/scaffold E2E, release, merge, publish, issue mutation,
  central-state mutation, `deno.lock`, cache, package/plugin, or JSR work.

## Arch-Debt Implications

None anticipated. The change repairs an existing tooling protocol inside its current modules and
does not introduce a package/plugin architecture deviation. Any implementation discovery requiring
another production path is `FAIL_RESCOPE`, not implicit debt.

## PLAN-EVAL

**Required and not launched.** The plan changes an atomic provider-spend claim boundary, workflow
candidate selection, comment-write permissions, and externally visible refusal semantics. A
separate native opposite-family evaluator must pass this plan after Tier-A review and before S1.
