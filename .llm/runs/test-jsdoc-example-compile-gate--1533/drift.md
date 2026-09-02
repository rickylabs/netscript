# Drift Log: JSDoc `@example` compile gate

Drift is append-only.

## 2026-08-30 — contracts-root blocker disproved

- **What:** The supervisor ledger said four contracts examples imported symbols from a
  non-exporting root.
- **Source:** Carried lane ledger summarized in `implement.md`.
- **Expected:** The cited imports would fail because their symbols were absent from the root.
- **Actual:** The examples name `@netscript/contracts/query` and `/transform`; both are declared
  exports, and every imported symbol resolves from its named subpath via `deno doc --filter`.
- **Severity:** significant
- **Action:** fix
- **Evidence:** `packages/contracts/deno.json`; the commands and symbol list in `research.md`.

The false blocker is not propagated into the plan. The separately reproduced pagination defect
(`baseContract` and `UserSchema` unbound) remains in scope.

## 2026-08-30 — disproved mechanism did not disprove defective examples

- **What:** Research rejected the ledger's non-exporting-root explanation and then carried forward
  the adjacent conclusion that only one genuine defect survived.
- **Source:** PLAN-EVAL cycle 1 at evaluator commit
  `9b34b657093894b1000e977327dec70225c15318` and supervisor correction.
- **Expected:** Pagination was the only cited block that failed direct compilation.
- **Actual:** All four cited source examples and both entrypoint module examples fail:
  `pagination.ts` TS2304 (`baseContract`, `UserSchema`); `filters.ts` TS2345 literal widening;
  `paginated-query.ts` TS2304 (`db`); `transform-helpers.ts` TS2552 ×2 and TS18046 ×3;
  `query.ts` TS2304 (`db`); `transform.ts` TS2304 (`UserRecord`). The rough pre-gate corpus is ~443
  tags, ~415 TypeScript fences, and at least 29 likely-unbound fences in 20 files.
- **Severity:** significant
- **Action:** fix
- **Evidence:** immutable `plan-eval.md`, finding F1; amended `research.md` finding 12.

The correction changes RED expectations and adds owner-set repair ceilings; it does not change the
published-only scope, Deno extraction/compiler architecture, or commit order.

## 2026-08-30 — owner-authorized PLAN-EVAL amendment path

- **What:** PLAN-EVAL returned `FAIL_FIX`, while the harness normally requires PASS before source
  implementation.
- **Source:** User instruction after cycle 1.
- **Expected:** A second PLAN-EVAL cycle or an explicit pass artifact.
- **Actual:** The owner declared there is no cycle 2, supplied the two missing policy judgements and
  seven exact satisfying conditions, and authorized implementation immediately after a standalone
  amendment commit.
- **Severity:** significant
- **Action:** accept
- **Evidence:** evaluator commit `9b34b657093894b1000e977327dec70225c15318`; amendment commit and
  PR comment recorded in the next worklog update.

`plan-eval.md` remains bit-identical; IMPL-EVAL is the next formal gate.

## 2026-08-30 — first RED census crosses the repair ceiling

- **What:** I3 measured the gate's full published corpus before repairs.
- **Source:** `red-census.md` and the expected-failing structured corpus test.
- **Expected:** Proceed to I4 only if mechanical repairs affect at most 90 examples and genuine/type
  repairs affect at most eight examples.
- **Actual:** 165 examples fail: bad specifier/import 27, type error 21, unbound name 116, unfenced
  0, malformed 1. Mechanical classes total at least 144; type errors total 21.
- **Severity:** significant
- **Action:** escalate
- **Evidence:** I3 RED commit and `red-census.md`.

I4 is stopped before any example repair, exemption, or floor is committed. The gate architecture and
semantic controls remain useful, but the documentation campaign exceeds this leaf's owner-set ceiling.

## 2026-08-30 — ANSI-sensitive diagnostic attribution undercounted failures

- **What:** The new compiler passed raw `deno check` diagnostics to path mapping and failure
  classification while inheriting the caller's color environment.
- **Source:** Supervisor reproduction challenge after the I3 RED commit.
- **Expected:** Identical diagnostics produce an identical classified census in every shell and CI
  environment.
- **Actual:** Color-enabled output classified 24 failing examples with zero unbound names;
  `NO_COLOR=1` classified 165 with 116 unbound names. Both runs reported `Found 262 errors`. ANSI
  escapes interrupted the `TS… at file:line:column` matcher, so the color-enabled result silently
  under-attributed about 85% of failing examples. The supervisor challenged the correct 165 census
  twice before isolating and correcting the environmental cause.
- **Severity:** critical
- **Action:** fix
- **Evidence:** back-to-back color-on/off measurements at
  `b8d271e92a9c674e053c655068ed476d5a620abd`; compiler regression test in this slice.

The compiler now forces `NO_COLOR=1` on its Deno subprocess and defensively strips ANSI escapes
before mapping or classification. The lesson is measurement provenance: a verdict parser must own
the subprocess format it consumes, and an unchanged raw diagnostic total alongside a sharply
smaller attributed census is evidence of parser loss, not a smaller defect surface.

## 2026-08-30 — I5 plumbing split from blocking enforcement

- **What:** The planned I5 combined stable task/catalog plumbing with activation in the blocking CI
  quality job.
- **Source:** Coordinator-owned rescope boundary after the authoritative 165-failure census.
- **Expected:** I5 would add the root tasks, catalog entry, workflow assertion, and durable CI step
  together.
- **Actual:** D14 is breached, so enabling the gate would make repository CI fail before the
  coordinator selects a repair/assertion contract. The task surface, catalog entry, and structural
  test are stable under every rescope option and land now; blocking CI enforcement remains off and
  is asserted absent.
- **Severity:** significant
- **Action:** accept
- **Evidence:** I5 focused tests plus the supervisor instruction following Tier-A PASS at
  `0495c9b6b9e4839e8d1f996c8f48af46e785fa90`.

This is an explicit activation deferment, not a passing gate claim. The checker task remains RED at
165 failures and no example, exemption, baseline, or floor changed in this slice.

## 2026-08-30 — coordinator authorizes option 1 narrowed assertion

- **What:** The original repair-all policy crossed D14 at 144 mechanical examples and 21 type-error
  examples, leaving I4 and CI activation blocked.
- **Source:** Coordinator decision after Tier-A accepted the color-invariance fix and I5 plumbing.
- **Expected:** No repair or assertion narrowing without an explicit owner rescope.
- **Actual:** Option 1 is authorized. The blocking contract is narrowed to published consumer-import
  integrity and fence-language integrity. This leaf repairs 27 bad specifiers and one malformed
  fence. The classifier emits 116 unbound-name and 21 published-API type-error examples as deferred
  lists and ratchets both classes against growth; those examples are not repaired, exempted, or
  baselined here. CI activates only after the narrowed contract is green.
- **Severity:** significant
- **Action:** accept
- **Evidence:** coordinator instruction dated 2026-08-30; authoritative census commit
  `b8d271e92a9c674e053c655068ed476d5a620abd`; color-invariance head
  `0495c9b6b9e4839e8d1f996c8f48af46e785fa90`.

Rationale: the narrowed assertion is exactly the #1425 shipped-module-layout defect that #1533 was
filed to prevent. Full example-body repairs are a separate 137-example documentation/API campaign.
The explicit plan and PR contract keep the narrowing auditable rather than implicit in tool output.

## 2026-08-30 — syntax fragments require pre-batch classification

- **What:** The deferred inventory must be emitted by the same classifier and include TS codes for
  every body-class example.
- **Source:** Coordinator option 1, deferred-class artifact requirement.
- **Expected:** All examples could reach the single non-executing `deno check` batch and be
  classified uniformly from its diagnostics.
- **Actual:** Six known standalone-ellipsis/object-member fragments are syntactically invalid. If
  included, Deno aborts the batch on the first `SyntaxError`, leaving no diagnostics for the other
  341 modules and producing a false empty deferred census. They must be classified before the batch.
- **Severity:** significant
- **Action:** accept
- **Evidence:** first post-rescope full run reported enforced 18 and deferred 0, then stopped at the
  first `Expression expected`; the corrected run restored enforced 28 and deferred 116/21.

The authoritative classifier owns this pre-batch branch and records stable TypeScript syntax codes
`TS1109` (expression expected) and `TS1005` (separator expected). The examples remain deferred and
visible; none is removed, repaired, exempted, or treated as satisfying the enforced contract.

## 2026-08-30 — preclassified syntax debt masked an unrelated compiler abort

- **What:** After the first import repairs, two `ts`-labelled examples containing JSX caused Deno to
  abort with an unnumbered `SyntaxError` before ordinary body diagnostics were emitted.
- **Source:** First full-corpus run after the bounded import edits.
- **Expected:** An unclassified nonzero compiler exit always fails closed.
- **Actual:** The compiler's fail-closed check used the combined failure census. Six intentionally
  preclassified syntax fragments made that total nonzero, so the unrelated abort was mistaken for
  an attributed failure and the CLI reported a false PASS with deferred classes collapsed to 0/6.
- **Severity:** critical
- **Action:** fix
- **Evidence:** suspicious first result `PASS`, `unboundName=0`, `typeError=6`; isolated compiler
  stderr `SyntaxError: Expression expected` at the `renderToStream(<App />)` example.

The runner now separately counts diagnostics attributed from the spawned compiler and fails closed
when that count is zero on a nonzero exit, regardless of pre-batch findings. A regression combines a
known preclassified fragment with an unrelated compiler parse abort. The two rendering fences are
correctly labelled `tsx`; the final corpus restores the unchanged deferred 116/21 census.

## 2026-08-30 — CI activation push requires `workflow` token scope

- **What:** Option 1 requires blocking quality-job enforcement after the narrowed corpus is green.
- **Source:** Coordinator option 1 and I5.
- **Expected:** Push the green repair and CI activation slice with the explicit branch refspec.
- **Actual:** GitHub rejected commit `0bf00d70c661f0f34bbdd808b20dccb2df642f3b` because the configured
  HTTPS PAT has `repo` but not `workflow` scope; SSH has no usable key.
- **Severity:** significant
- **Action:** escalate
- **Evidence:** remote rejection: `refusing to allow a Personal Access Token to create or update
  workflow .github/workflows/ci.yml without workflow scope`.

The green corpus repair is split and pushed independently so the bounded work is durable. The CI
edit and its structure test remain local and are not represented as active enforcement until a
credential with `workflow` scope publishes them.

**Resolution:** The coordinator independently reproduced the exact green 0 / 116 / 21 result at
`303be12eab5e54ada654d55f60e8cfbf1921ea73` and authorized the prepared enforcement commit. The
historical credential rejection remains attributable; the later commit is the activation point.

## 2026-08-30 — integration base adds two clean examples

- **What:** I6 re-anchored the branch onto the coordinator-specified live `main` commit
  `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c`.
- **Source:** Coordinator convergence instruction after independent verification of repair head
  `303be12eab5e54ada654d55f60e8cfbf1921ea73`.
- **Expected:** The intervening base was described as changing two generated TypeScript assets and
  zero `@example` lines, so the corpus denominator was expected to remain 35 members / 2020 files /
  349 examples / 348 candidates.
- **Actual:** The exact requested base contains the broader #1731 procedure-metadata integration.
  It adds `packages/contracts/src/domain/procedure-meta.ts` with two valid TypeScript-fenced
  `@example` blocks. The immediate post-rebase run therefore reports 35 members / 2021 files / 351
  examples / 350 candidates. The enforced census remains zero and the deferred census remains
  exactly 116 unbound-name / 21 type-error.
- **Severity:** significant
- **Action:** accept
- **Evidence:** `NO_COLOR=1 deno task docs:jsdoc-examples` at rebased head
  `e1ea9d3a5dafaabc1f29a34253bd37814ce92792`, raw exit 0.

The coordinator's explicit stop condition was movement in either deferred number; neither moved.
The denominator change is recorded rather than smoothed over because the newly selected examples
are real published-surface inputs to this gate.

## 2026-08-30 — corrected integration brief exposes governed MCP corpus delta

- **What:** The coordinator corrected the rebase premise and explicitly required all governed asset
  generators plus `check:mcp-export-corpus` at the convergence point.
- **Source:** Corrected coordinator brief after the initial I6 run.
- **Expected:** Earlier `check:assets-barrel` and `check:publish-assets` passes had left the tree clean.
- **Actual:** Mechanical `gen:agent-docs-prose`, `gen:publish-assets`, and `gen:assets-barrel` runs are
  stable, but `gen:mcp-export-corpus` updates
  `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`. This leaf's
  public JSDoc repairs change the encoded documentation payload while retaining 35 packages, 270
  subpaths, and 7,623 symbols. The corpus hash changes from `1afdf138…` to `be3e79ae…`.
- **Severity:** significant
- **Action:** fix
- **Evidence:** each generator raw exit 0; generator report
  `sha256=be3e79ae7cb2f9b90b7c880ff8c573e3dfef5769a623470789df215236c3d16e`,
  `uncompressedBytes=2138541`, `compressedBytes=310305`.

The generated file is accepted only as mechanical output. The earlier exact-head receipts are
superseded by a full rerun after this integration artifact commit; no hand edit or cardinality
change is involved.

## 2026-08-30 — narrowed bodies hid published-API diagnostics

- **What:** IMPL-EVAL restored the pre-repair substance of `TracedQueue`,
  `createServiceQueryUtils`, and one representative `create*StreamDB` example while retaining the
  corrected published import specifiers.
- **Source:** IMPL-EVAL cycle 1 F4 at `c73fee39c86f08882ba8a1214fd87c07d628672d`.
- **Expected:** D12 narrowing removed scaffolding that exceeded the documented symbol's substance,
  without hiding a real signature rejection.
- **Actual:** The restored bodies raised the deferred type-error census from 21 to 24. The removed
  diagnostics are: `TracedQueue.listen` TS2339 (`span` is absent from public `MessageContext`, while
  runtime supplies an unexported `TracedMessageContext`); the `createServiceQueryUtils` example's
  `useQuery(...)` call rejects its documented query-options shape; and the four sibling
  `create*StreamDB` live-query examples expose TS2322 (`unknown` is not assignable to
  `QueryBuilder`) plus TS2339 (`state`/status fields collapse to `never`).
- **Severity:** significant
- **Action:** defer
- **Evidence:** `.llm/runs/test-jsdoc-example-compile-gate--1533/impl-eval.md` §7.

This is the "reshaped to dodge the check" risk made real. Per coordinator instruction the corpus
is not changed again in this leaf; these diagnostics belong in #1766, with the `TracedQueue.listen`
typing gap eligible for a dedicated `@netscript/telemetry` issue.

## 2026-08-30 — comment-sensitive preclassification and color ownership

- **What:** IMPL-EVAL found three placeholder matches caused only by comment prose and noted that an
  ambient `FORCE_COLOR` overrides `NO_COLOR` in Deno.
- **Source:** IMPL-EVAL cycle 1 F3/F5.
- **Expected:** Preclassification handles only executable placeholder syntax, and compiler output
  is deterministic independently of the parent environment.
- **Actual:** `parseAppSettings` was falsely deferred as TS1109 but compiles clean; `buildOtelEnvVars`
  and `getMssqlConfig` were recorded as TS1109 instead of their real TS2451 diagnostics. The true
  deferred type-error census is 20. ANSI invariance was already protected by `stripAnsi`, but the
  subprocess did not own `FORCE_COLOR`.
- **Severity:** significant
- **Action:** fix
- **Evidence:** regenerated classifier artifact removes `parseAppSettings`, records TS2451 for the
  other two, and reports 116 unbound-name / 20 type-error examples.

Placeholder detection now masks comments and strings before matching, while every selected body
still reaches the enforced specifier policy first. The compiler sets `FORCE_COLOR=0` alongside
`NO_COLOR=1`; `stripAnsi` remains the defensive parser boundary.
