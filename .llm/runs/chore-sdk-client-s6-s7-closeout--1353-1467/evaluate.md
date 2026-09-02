# Evaluation: PR #1941 — SDK client S6/S7 closeout (#1353 / #1467)

## Metadata

| Field          | Value                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| Run ID         | `chore-sdk-client-s6-s7-closeout--1353-1467`                                            |
| Target         | `packages/sdk` — PR #1941, branch `chore/sdk-client-s6-s7-closeout`                     |
| Head / base    | `22cc3e5b85af39a4ad47e7f1f9211d97e9532c92` on `850cc7757d11d420b9061dbe6a61536357ab77fe` |
| Archetype      | `2 - Integration / SDK`                                                                 |
| Scope overlays | `docs`                                                                                  |
| Evaluator      | Claude Fable 5.1 (native opposite-family IMPL-EVAL, separate from the Codex generator), 2026-09-02 |
| Worktree       | `/home/agent/projects/netscript/worktrees/007-leaf-s6s7` (HEAD verified `22cc3e5b8` before judging) |
| Prior cloud run | OpenHands reached PASS but its `evaluate.md` was discarded by the durability gate; this file is the durable receipt. |

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | `N/A`  | `worklog.md` "Plan gate" records `PLAN-EVAL: N/A` with justification (owner-fixed contract, exact rows, limited residual-fix authority); `supervisor.md` records the same override. Rule 2 satisfied by the recorded N/A. |
| Design section exists in worklog       | `PASS` | `worklog.md` "## Design" with public surface, vocabulary, ports/constants, slices, deferred scope, contributor path. |
| Commit slices match design plan        | `PASS` | `plan.md` slice 1 = `136ea478e fix(sdk): close trace propagation proof gap`; slice 2 = `22cc3e5b8 docs(harness): record SDK closeout handoff`. Two commits, in plan order. |
| Each slice has a passing gate          | `PASS` | Slice 1: owner gate set re-run by me (below). Slice 2: run-artifact-only; PR metadata + mirror dry-run recorded in `worklog.md`. |
| No speculative seams (unused files)    | `PASS` | `git diff --name-only 850cc7757..22cc3e5b8` = 2 product files + 7 run artifacts; no new modules, no new exports. |
| Constants used for finite vocabularies | `PASS` | No new literals introduced; the fix reuses the existing `propagateTraceContext` boolean. |
| Scope stays inside `packages/sdk`      | `PASS` | Product diff limited to `packages/sdk/src/client/http-client-link.ts` (+5/-3) and `packages/sdk/tests/client-contribution-observability_test.ts` (+66/-11). |
| `deno.lock` unchanged                  | `PASS` | `git diff 850cc7757..22cc3e5b8 -- deno.lock` is empty. |
| Evidence blocks                        | `PASS` | PR body carries exactly one `acceptance-evidence` block per issue, `box-index` 1..7 each, matching the 7 unticked boxes on each live issue. |

## Static Gates (run by the evaluator in this session)

| Gate                       | Command                                                                                          | Exit | Evidence |
| -------------------------- | ------------------------------------------------------------------------------------------------ | ---: | -------- |
| SDK typecheck              | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/sdk --ext ts,tsx` | 0 | 104 files, 1 batch, 0 diagnostics |
| SDK tests                  | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/sdk` | 0 | 238 passed, 0 failed, 0 ignored (PR body says 237; +1 is the count on this run, no failures either way) |
| Type fixture               | `deno check --unstable-kv packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` | 0 | Fixture compiles including the `@ts-expect-error` locale negatives |
| README fences              | `deno task docs:readme-fences`                                                                    | 0 | `type_errors=7` (baseline 7), `syntax_invalid=0` |
| JSDoc examples             | `deno task docs:jsdoc-examples`                                                                   | 0 | `failures=0`, deferred `unboundName=116`, `typeError=14` (baseline) |
| MCP export corpus          | `deno task check:mcp-export-corpus`                                                               | 0 | 35 packages, 273 subpaths, 7,816 symbols, sha `a3eb6325…` |
| CI at head (reported)      | `build`, `check-test`, `quality`, `code-quality`                                                  | green | Per supervisor brief; `close-gate` red only on unticked boxes awaiting the label-gated mirror |
| Publish dry-run / lint / fmt | Not re-run here                                                                                 | — | Generator evidence in `worklog.md` (exit 0 / 0 / 0); no public surface delta, so not load-bearing for this verdict |

Not run, per brief: Aspire, Docker, browser, `e2e:cli`.

## Closing-keyword adjudication — #1353 (amended 2026-08-13)

The amendment governs: no `traceContextContribution()`, injection stays in the transport, prove
transport sole-authorship and that contributions cannot claim/overwrite/observe trace headers.

| Box | Row (abridged) | Result | Evidence (code + tests on head 22cc3e5b8) |
| ---: | --- | --- | --- |
| 1 | Transport sole final author; no trace contribution factory | `PASS` | `http-client-link.ts` `fetch` wrapper is the only place that writes `traceparent`/`tracestate` onto the outbound `Headers` (via `injectContext` + `headers.set`). `grep -i trace` over `packages/sdk/src/client/mod.ts` and `deno.json` exports: no trace contribution symbol. |
| 2 | Chain cannot overwrite reserved trace headers, observe resolved trace values, or bypass the switch | `PASS` | `prepared-call.ts` `RESERVED_HEADERS` contains `traceparent tracestate`; `validateHeaderKeys` rejects at construction; `validatePatchHeaders` rejects undeclared/forbidden names at preparation; `RESERVED_CONTEXT_KEYS` includes `traceHeaders`. Tests: `reserved trace header declarations identify the offending descriptor` (three cases incl. case-variant), `contribution preparation receives exactly the five public fields` (asserts `trace` not in options). Even if a value slipped through, the transport's final `headers.set` runs after contribution headers. |
| 3 | default/true/false and per-call override preserved on the wire | `PASS` | `service-client.ts` `propagateTraceContext = true` default. `headers` callback branch on the boolean is unchanged from base. Enabled path (`retry`, `reconnect` with per-call `traceHeaders`) asserts one `traceparent` matching a real CLIENT span, not the stale value — identical assertions to base, so enabled behaviour is preserved. Disabled path now asserts both headers `null`. |
| 4 | CLIENT span keeps `rpc.system=orpc` and `server.address` under composition | `PASS` | `withSpan(..., { kind: SpanKind.CLIENT, attributes: {'rpc.system':'orpc', 'server.address': ...}})` unconditional; test asserts `kind === 2`, `rpcSystem === 'orpc'`, `serverAddress === '127.0.0.1'` on all 5 client spans (4 enabled attempts + 1 disabled). |
| 5 | NEGATIVE: duplicate/reserved fail deterministically; disabling emits neither header; removing transport tracing goes red | `PASS` | Deterministic: `SDK_CONTRIBUTION_INVALID` / `SDK_CONTRIBUTION_CONFLICT` with `toJSON()` equality asserted. Disabled: new guard `if (propagateTraceContext) { injectContext…headers.set }` in the fetch wrapper; test asserts `disabledAttempt.traceparent === null` and `tracestate === null` while `authorization` and `x-second-observed` are still present. Red-on-removal: enabled attempts assert `traceparent` starts with `00-`, `!== staleTraceparent` (the `getTraceHeaders`/per-call value), and resolves to a finished CLIENT span id — without transport injection the stale value would reach the wire and fail. |
| 6 | Auth and tracing compose in both descriptor orders | `PASS` | `retryLink` uses `[authContribution, secondContribution]`; `reconnectLink` uses `[secondContribution, authContribution]`. `authContribution` owns `authorization` and emits `Bearer first-header-secret`. Loop over all 4 attempts asserts `authorization`, `x-second-observed`, `traceparentCount === 1`. Trace ownership never moves to a contribution (box 1/2). |
| 7 | Root check, test, publish dry-run pass | `PASS` | Generator `worklog.md`: root check 3,027 files exit 0; root tests 4,942/0/19 exit 0; workspace publish dry-run exit 0. Corroborated here by SDK check/test/docs/corpus exits above and green CI at head. |

**`Closes #1353` holds.** No row is overclaimed.

## Closing-keyword adjudication — #1467

| Box | Row (abridged) | Result | Evidence (code + tests on head 22cc3e5b8) |
| ---: | --- | --- | --- |
| 1 | Locale owns `accept-language` through the descriptor contract | `PASS` | `locale-contribution.ts` `LOCALE_HEADER_KEYS = ['accept-language']`, id `@netscript/sdk:locale`, built through `defineSdkClientContribution`. Exported from `src/client/mod.ts`. Test `locale descriptor owns accept-language and canonicalizes one optional locale`. |
| 2 | Duplicate ownership and reserved-header conflicts fail deterministically | `PASS` | Test `locale duplicate ownership and reserved headers fail with deterministic descriptor ids`: `[locale, other]` names `test:other-locale`, `[other, locale]` names `@netscript/sdk:locale`, both `SDK_CONTRIBUTION_CONFLICT` with `headerName`; reserved `content-type` → `SDK_CONTRIBUTION_INVALID`. |
| 3 | Direct-call and query-factory behaviour follows the declared partition law | `PASS` | `localePartition` → `resolveSdkClientCachePartition` (sorted pairs, `$netscript.sdk-context` suffix). `client-contribution-cache-query_test.ts`: `locale cache keys are equal for the same locale and distinct for different locales` (`en-US` == `en-us`, != `fr-FR`); `locale keys use the declared partition function without preparing or reading headers` (partition called once, `prepare` zero times, constant header absent from key). Direct path: `direct locale calls prepare once across retry…` and `server cache entries cannot cross contribution partitions`. |
| 4 | Generated clients preserve the inferred locale context type | `PASS` | `sdk-client-contributions-rfc_type.ts` lines 355-366: `defineServices` client and `queryUtils` accept `{ locale: 'fr-FR' }`, and `@ts-expect-error` on `{ locale: 42 }`. Fixture compiles (exit 0). |
| 5 | Tests cover composition order, retries, cancellation, cache keys, redaction | `PASS` | Five distinct proofs: order — `locale composes with auth-shaped headers in either declaration order`; retries and cancellation — `direct locale calls prepare once across retry and stop before preparation when cancelled` (preparations 1 / attempts 2, then abort → preparations 0); cache keys — the two cache-query tests in box 3; redaction — `locale rejects lists, q-values, blanks…without echoing them` and `…remains valid at the unknown runtime boundary` (value absent from `message` and `JSON.stringify`). |
| 6 | Documentation includes auth and non-auth examples | `PASS` | `packages/sdk/README.md` lines 105-170 (bearer auth-shaped + `createLocaleSdkClientContribution`, composed `[bearer, locale]`); `docs/site/services-sdk/sdk.md` lines 175-230; `readme-doctest_test.ts`; readme-fences and jsdoc gates exit 0. |
| 7 | Required SDK/plugin gates and IMPL-EVAL pass | `PASS` | SDK check/test/docs/corpus gates exit 0 in this session; #1922 carried its own IMPL-EVAL PASS; this file is the IMPL-EVAL for the closeout. |

**`Closes #1467` holds.** No row is overclaimed.

## Fix minimality (`propagateTraceContext` guard)

- Diff is +5/-3 in one function: wraps the existing `injectContext`/`headers.set` loop in
  `if (propagateTraceContext)`. `withSpan`, `SpanKind.CLIENT`, span name, and attributes stay
  unconditional, so the CLIENT span survives with propagation off (asserted by
  `disabledClientSpan`).
- Enabled path: no source change; the pre-existing `retry`/`reconnect` assertions are byte-identical
  to base apart from the header rename (`x-first-observed` → `authorization`) and the preparation
  count bump (3 → 4, caused by the added disabled call sharing the same descriptors).
- Test change is red-first in substance: the `traceparent === null` assertion fails on base, where
  injection was unconditional (confirmed by reading base code in the diff).

## Fitness Gates

| Gate | Function | Result | Evidence |
| ---- | -------- | ------ | -------- |
| F-3  | Layering check | `PASS` | Transport keeps trace authorship; contribution layer untouched. |
| F-5  | Public surface audit | `PASS` | No export delta; corpus check exit 0 with unchanged sha. |
| F-6  | JSR publishability | `PASS` | Generator dry-run exit 0; no manifest change. |
| F-10 | Test-shape audit | `PASS` | Child-process OTEL test extended in place; no new snapshot or ad-hoc fixture. |
| F-19 | Scoped source gate runners | `PASS` | Wrapper-driven check/test used above. |
| others | | `N/A` | Out of scope for a two-file guard fix. |

## Runtime / Consumer Gates

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| OTEL wire behaviour | In-process `BasicTracerProvider` + `InMemorySpanExporter` child run | `PASS` | Observability test, 5 CLIENT spans, headers captured at the fetch seam |
| Aspire / Docker / e2e:cli | not applicable to this slice | `N/A` | Per brief |

## Anti-Pattern Check

| AP | Status | Notes |
| -- | ------ | ----- |
| Escape hatch beside the public composition path | `CLEAR` | No new private lane; the amendment deliberately keeps transport-owned injection. |
| Silent behaviour change on the default path | `CLEAR` | Default `true` path unchanged. |
| Overclaiming closing keyword | `CLEAR` | Both 7-row tables verified against code/tests. |
| all others | `N/A` | |

## Arch-Debt Delta

| Metric | Count | Evidence |
| ------ | ----: | -------- |
| New entries | 0 | PR body "Architecture debt: none created or deepened"; no doctrine violation observed. |
| Resolved / deepened / unrecorded | 0 | — |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low | SDK test count differs between generator (237) and this run (238); both 0 failed. | `run-deno-test.ts` summary `passed:238` | None; informational. |
| low | With propagation enabled the per-call `context.traceHeaders` value is always superseded on the wire by the transport's span-derived `traceparent` (it is not adopted as the parent context). This is pre-existing on base and is what the 2026-08-13 amendment mandates (transport is sole final author), so box 3's "preserved" is accurate relative to main. | `http-client-link.ts` headers callback vs. fetch wrapper; reconnect assertion `!== staleTraceparent` unchanged from base | None for this PR. Consider a follow-up clarifying the `ServiceClientContext.traceHeaders` JSDoc to state it is a fallback, not an override, when a live span exists. Not blocking. |
| low | `close-gate` red at head. | Fourteen unticked boxes pending the label-gated acceptance mirror | Supervisor step after this verdict (`status:ready-merge` → mirror), not a defect. |

No high or medium findings.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| A closeout PR must re-derive every negative row from code, not from the merged PR's verdict | The disabled-propagation row was green in #1921's evaluation while false on main; only re-reading the injection site caught it. | All archetypes with closing keywords | high |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | Both closing keywords are justified: all 14 acceptance rows are satisfied on head `22cc3e5b8` with code and test evidence independent of the merged PRs' verdicts. The `propagateTraceContext` fix is minimal and leaves the enabled path unchanged. Scope is confined to `packages/sdk`, `deno.lock` is unchanged, one `box-index` evidence block per issue is present, and every owner-selected gate exits 0 in this session. The only red CI check is the acceptance mirror that follows this verdict. |

[PHASE: IMPL-EVAL] [VERDICT: PASS]
