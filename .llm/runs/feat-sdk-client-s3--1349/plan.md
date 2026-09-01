# Plan — #1349 remaining S3 acceptance tripwires

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-sdk-client-s3--1349` |
| Branch | `feat/sdk-client-s3-remaining` |
| Phase | `plan` |
| Target | `packages/sdk` tests; no public/source implementation delta |
| Archetype | Owner-directed 4 — Public DSL / Builder gate envelope |
| Scope overlays | none |

## Archetype and current doctrine verdict

The owner selected Archetype 4 for this run because the acceptance work audits the published
client-definition/query surface. Doctrine files 06 and 10 currently classify `packages/sdk` as
Archetype 2 with verdict **Keep** and headline action “Preserve discovery/client/cache adapter
boundaries.” The mismatch is recorded in `drift.md`; this test-only slice satisfies the stricter
owner-selected Archetype-4/static gate envelope without changing the doctrine classification.

## Goal

Close the three test-evidence gaps proven by `research.md`, while leaving every shipped public and
runtime behavior unchanged.

## Locked decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| LD-1 | Change tests only. | The adapter/runtime behavior is present on `main`; only tripwires are absent. |
| LD-2 | Add the three exact forbidden link identities to the existing public `deno doc` absence scan. | This directly protects the amendment and #451 ownership without changing exports. |
| LD-3 | Add exact upstream callback-array fields to both compile-negative and unknown-input runtime cases. | Closed shape already rejects them; named assertions prevent accidental opening. |
| LD-4 | Exercise malformed prepared patches and assert `SDK_CONTRIBUTION_RUNTIME` plus redacted diagnostic fields. | This is the sole uncovered public error-code branch. |
| LD-5 | Do not touch `http-client-link.ts`, production source, exports, `port`, `timeout`, or server surfaces. | These belong to shipped behavior or later ordered issues. |

## Open-decision sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Whether production code needs repair | resolved | The reachable branch already emits the correct stable error; only its test is missing. |
| Whether PLAN-EVAL is required | safe to defer / N/A | The owner supplied the contract and gates; the audit leaves one mechanical test slice with no architecture choice. |
| Whether to reconcile the package archetype in doctrine | safe to defer | Out of scope; record only. |

## Commit slice

| # | Slice | Proving gate | Files |
| --- | --- | --- | --- |
| 1 | Pin forbidden public identities, callback arrays, and the tenth local failure code. | Focused validation/private-surface tests + RFC type fixture, then full scoped SDK gates. | `packages/sdk/tests/client-contribution-private-surface_test.ts`; `packages/sdk/tests/client-contribution-validation_test.ts`; `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts`; run artifacts |

## Risk register

| Risk | Mitigation |
| --- | --- |
| A test accidentally depends on internal error message prose. | Assert stable code/phase/safe identifiers and absence of `cause`, not message wording. |
| Type fixture does not execute in the normal SDK test task. | Run the structured SDK check wrapper as well as the test wrapper. |
| Doc lint appears red because of baseline debt. | Compare branch result to the measured base count: 3 combined findings, 0 new. |
| Validation mutates `deno.lock`. | Hash and inspect `deno.lock`; reject any movement. |
| Adjacent queued slices collide. | Do not edit `http-client-link.ts` or production code. |

## Anti-patterns and debt

- AP-1/AP-10 test-shape risk: keep the addition focused inside the existing 327-line cross-cutting
  validation suite; the result remains below F-10's 500-line failure threshold.
- AP-14/AP-15/AP-19/AP-20 and the Archetype-4 catalog are unchanged because no public source moves.
- No matching open SDK client-contribution debt entry exists; no new debt is introduced.

## Validation plan

| Order | Gate | Command/check | Expected result |
| --- | --- | --- | --- |
| 1 | Focused runtime tests | Structured test wrapper over validation and private-surface tests | PASS |
| 2 | Compile fixture / check | Structured check wrapper over `packages/sdk` with `--unstable-kv` behavior supplied by the wrapper | PASS |
| 3 | Full SDK tests | Structured test wrapper over `packages/sdk/tests` | PASS |
| 4 | Lint/fmt | Structured scoped wrappers over `packages/sdk`, `ts,tsx` | PASS |
| 5 | Public docs A/B | `deno task doc:lint --root packages/sdk --pretty` | 3 base / 3 branch, 0 new diagnostics |
| 6 | Doctrine/code quality | `deno task quality:gate` | PASS |
| 7 | JSR/publish | SDK publish dry-run and package JSR audit | PASS; no slow-type regression |
| 8 | Lock hygiene | SHA-256 and git diff of `deno.lock` | byte-identical |

## Deferred and prohibited scope

- #451 custom links; #1351 transport consolidation/no-op option migration; #1352/#1353/#1467
  header authorship; server handler/plugin forwarding; local runtime/Aspire/Docker/browser/E2E.
- No runtime, Aspire, Docker, browser, or `e2e:cli` command will run.
