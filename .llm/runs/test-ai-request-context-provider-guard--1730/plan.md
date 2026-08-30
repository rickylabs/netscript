# Plan: #1730 provider-invisibility regression guard

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-ai-request-context-provider-guard--1730` |
| Branch | `test/ai-request-context-provider-guard` |
| Phase | `plan` |
| Target | `packages/ai` tests |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `none` |

## Archetype

Archetype 4 is authoritative for the package even though the guarded seam is its agent loop. The
doctrine verdict explicitly classifies `packages/ai` as Archetype 4. This leaf exercises runtime
behavior but changes neither the DSL, runtime, ports, adapters, nor composition root.

## Current Doctrine Verdict

**Keep** — preserve the engine/port/composition split. The implementation is a regression net over
the existing split and introduces no architecture or public-surface change.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A8 | Keep the focused cross-cutting test readable and below the F-10 ceiling. |
| A10 | Test through the injected provider port; do not couple the loop to an adapter. |
| A14 | Turn the negative provider-invisibility promise into an executable fitness function and prove it by mutation. |

## Goal

Make any loop-level serialization of `RequestContext` into provider-bound request data fail a
named test on the initial attempt, retry attempt, or continuation turn, while documenting the
Anthropic wire test's true adapter-level coverage.

## Product Ceiling

The only product/test-support path that may be committed is:

- `packages/ai/tests/request_context_test.ts`

The run may also commit files under:

- `.llm/runs/test-ai-request-context-provider-guard--1730/`

`packages/ai/src/agent/loop.ts` may be edited only for the temporary mutation-B demonstration and
must be restored byte-for-byte before staging. The TanStack bridge, adapters, exports, README,
`deno.json`, `deno.lock`, docs, generated carriers, and every other path are read-only. Any needed
committed file outside this ceiling is a rescope: stop and append `drift.md` before proceeding.

## Scope

- Strengthen the loop test with a high-entropy sentinel and a JSON projection of all four
  provider-bound `ChatClientRequest` fields, evaluated for every recorded request.
- Make the recording fixture deterministically cover a pre-output provider retry and a post-tool
  continuation.
- Demonstrate mutation B red, capture the exact named failure/output in `worklog.md`, restore the
  product file, and prove green.
- Rename and document the Anthropic wire test as adapter-serialization coverage, explicitly
  delegating bridge/model-options leakage to the TanStack seam test.
- Produce exact-head durable receipts and validate `argv`, `durationMs`, `gitHead`, and
  `actualGitHead`.

## Non-Scope

- No product behavior fix: the merged loop is correct.
- No change to `RequestContext`, `ChatClientRequest`, tool dispatch, bridge translation, provider
  adapters, public exports, package docs, or dependencies.
- No attempt to make Anthropic serialize arbitrary unknown `modelOptions`; that would test an
  adapter implementation accident and weaken the clean seam separation.
- No root test, CLI E2E, Aspire, Docker, browser, release, merge, ready flip, issue acceptance-box
  edits, or issue closure.

## Hidden Scope

- Retry coverage requires recording calls beneath `withRetryingChatClient`, not merely loop turns;
  otherwise the first retry is invisible to `provider.requests`.
- The mutation must be executed against the named final guard, then reverted before any commit.
- Package doc-lint is base-red. Its evidence is a 128-private-ref/0-missing-JSDoc delta, never PASS.
- `request_context_test.ts` must remain at or below 500 lines to avoid deepening F-10 debt.
- After product edits, `git status` must show no generated carrier, README, docs, or lock movement.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Serialize `{ messages, system, tools, options }` for every loop request and reject the sentinel. | This is the exhaustive `ChatClientRequest` field set minus `context`; `options` includes provider escape hatches. |
| D2 | Use a high-entropy `ns1730` sentinel embedded only in `CONTEXT`. | It cannot collide with ordinary fixture text and makes any serialization path detectable. |
| D3 | Use a local recording provider whose inner client is wrapped by `withRetryingChatClient`. | It records the failed first attempt, successful retry, and continuation without changing shared test support. |
| D4 | Keep the positive `request.context === CONTEXT` assertion inside the same loop over all requests. | The negative check cannot pass vacuously by dropping the context channel entirely. |
| D5 | Rename + document the Anthropic test instead of trying to make it detect mutation A. | The TanStack seam already owns mutation-A coverage; Anthropic legitimately drops unknown model options, so adapter-wire coverage should say exactly that. |
| D6 | `PLAN-EVAL: N/A`. | The issue supplies complete scope, acceptance, mutation, and gates; the implementation is small/mechanical with no open architecture decision. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Provider-bound loop field list | Resolved now | Exhaustive four-field projection locked in D1. |
| Retry fixture shape | Resolved now | Recording occurs below the retry wrapper, D3. |
| Anthropic detect vs rename | Resolved now | Rename + document, D5. |
| Whether to change product behavior | Resolved now | Forbidden by issue and ceiling. |
| Future broader provider tests | Safe to defer | This leaf guards the owned loop and clarifies the existing adapter test only. |

No decision remains that would force implementation rework.

## Commit Slices

| Slice | What it proves | Files | Proving gate / evidence |
| --- | --- | --- | --- |
| S1 | Research is current, decisions and product ceiling are locked, candidate gates are baseline-classified, and the draft review surface exists. | Run directory only | Clean diff review; baseline gate census; draft PR metadata |
| S2 | The loop-level guard detects provider leakage across retry and continuation, and mutation B makes a named test fail before restoration. | `packages/ai/tests/request_context_test.ts`, `worklog.md`, `context-pack.md` | Focused wrapper green; captured named mutation-red output; `git diff --exit-code -- packages/ai/src/agent/loop.ts` |
| S3 | The Anthropic wire test states its actual adapter-serialization boundary without overclaiming mutation-A coverage. | `packages/ai/tests/request_context_test.ts`, `worklog.md`, `context-pack.md` | Focused wrapper green; test name/comment review |
| S4 | Required gates and no-regression deltas are evidenced at one immutable final head. | Run artifacts only before the final evidence run; receipts remain under ignored `.llm/tmp/` | `run-gate.ts` receipts; raw receipt field audit; clean/lock/carrier diff checks |

Each slice commits, pushes by explicit refspec, posts one structured PR comment, records one
reconcile note, and stops for fresh Tier-A review before the next slice.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Assertion checks only the first turn | Iterate over every recorded request and require exactly three: initial attempt, retry, continuation. |
| Retry exists only in fixture prose | Fail once before output under `withRetryingChatClient`; assert three recorded requests. |
| Sentinel collides with normal fixture content | Use a high-entropy value present only inside `CONTEXT`. |
| Mutation demonstration is accidentally committed | Restore `loop.ts`; require product-file diff zero before staging, commit, and push. |
| Test becomes a >500-line god test | Keep helpers local and compact; check line count and `quality:gate`. |
| Base-red doc-lint is mislabeled green | Record raw exit 1 and exact 128/0 delta; never include it in PASS sufficiency. |
| Receipt records a usage error instead of the intended gate | Inspect receipt `argv`, `durationMs`, `exitCode`, and bounded output, not outcome alone. |
| Evidence commit changes the head after receipts | Land the S4 evidence commit first, then execute/overwrite exact-head receipts and make no further commits. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 / F-10 | Risk | Keep the cross-cutting test at or below 500 lines; avoid unrelated test expansion. |
| AP-9 | Risk | Add only the two small local seams the test exercises; no shared speculative abstraction. |
| AP-18 | Avoid | Assert semantic provider-bound JSON rather than snapshotting whole requests. |
| AP-25 | Not introduced | Product source remains unchanged; test-only failure injection is local and deterministic. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1 / F-10 | Yes | `quality:gate`, line-count review, no new file-size finding |
| F-2–F-5, F-7–F-9, F-11–F-12, F-14–F-18 | Yes, no-regression | `quality:gate`; no product/public-surface changes |
| F-6 | Yes | Package publish dry-run PASS; JSR audit warning count does not increase |
| F-19 | Yes | Structured scoped check/test/lint/fmt wrappers |
| Runtime behavior | Yes for touched loop seam | Named retry + continuation guard and mutation-B red/green proof |
| Consumer import | N/A | No exported contract, definition, builder, or subpath changes |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| None for `packages/ai` in `arch-debt.md` | none | Do not create or deepen debt. Base diagnostics remain explicit evidence only. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Focused mutation sensitivity | Structured test wrapper on `packages/ai/tests/request_context_test.ts` | Green normally; named loop guard red under mutation B |
| 2 | Full AI tests | Structured test wrapper on `packages/ai/tests/` | PASS, baseline 147 tests before edits |
| 3 | Scoped type check | `run-deno-check.ts --root packages/ai --ext ts,tsx` | PASS |
| 4 | Scoped lint | `run-deno-lint.ts --root packages/ai --ext ts,tsx` | PASS |
| 5 | Scoped format | `run-deno-fmt.ts --root packages/ai --ext ts,tsx` | PASS |
| 6 | Code/doctrine fitness | `deno task quality:gate` | PASS |
| 7 | JSR audit | `audit-jsr-package.ts --root packages/ai --text` | Exit 0; no warning-count increase from 2 |
| 8 | Publish dry-run | `deno publish --dry-run --allow-dirty` from `packages/ai` | PASS; only existing dynamic-import warnings |
| 9 | Doc-lint delta | `deno task doc:lint --root packages/ai --pretty` | Expected base-red exit 1; exactly 128 private refs and 0 missing JSDoc |
| 10 | Hygiene | raw Git status/diff, `git diff --exit-code -- deno.lock`, carrier path check | Only ceiling paths changed; lock and generated carriers untouched |
| 11 | Exact-head receipts | allowlisted gates through `.llm/tools/gates/run-gate.ts` | Receipt argv is intended command; duration > 0; `gitHead == actualGitHead == HEAD` |

## Dependencies

- Existing `withRetryingChatClient`, `ChatClientPort`, and injected provider port only.
- No dependency or lockfile changes.

## Drift Watch

- Any committed product file outside `packages/ai/tests/request_context_test.ts`.
- Any need to change loop/bridge/adapter behavior.
- Any generated carrier, docs, README, package config, or `deno.lock` movement.
- A focused test file exceeding 500 lines.
- A final gate differing from its baseline classification or receipt argv differing from the plan.

## Deferred Scope

- Broader provider-adapter mutation matrices and remediation of the existing JSR/doc-lint warnings.
- Coordinator-owned acceptance mirroring, Tier-A sign-off commits, IMPL-EVAL, ready transition,
  issue checkbox updates, merge, and issue closure.
