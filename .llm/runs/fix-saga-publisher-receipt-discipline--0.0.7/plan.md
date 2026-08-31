# Plan: saga publisher receipt discipline and endpoint diagnostics (#1365)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-saga-publisher-receipt-discipline--0.0.7` |
| Branch | `fix/saga-publisher-receipt-discipline` |
| Phase | `plan` |
| Target | `@netscript/plugin-sagas-core`, `@netscript/plugin-sagas`, workers official sample, quality/docs tooling, public docs |
| Archetype | `3 — Runtime/Behavior` for core; `5 — Plugin Package` for plugins |
| Scope overlays | `docs` |

## Hard Stop

S1 ends after this artifact-only commit and explicit-refspec push. No S2 implementation may begin
until a separate opposite-family PLAN-EVAL session records a passing verdict. PLAN-EVAL dispatch is
parked and belongs to the primary.

Host-runtime validation has a second independent stop: no scaffold, Aspire, container, or AppHost
command may run until the primary explicitly grants this leaf a serialized runtime lease.

## Archetype

- `packages/plugin-sagas-core` is **Archetype 3 — Runtime/Behavior**, not a contract-only package. It
  owns saga runtime vocabulary and ports; the publisher port and its result-consumption helper belong
  at the core integration boundary.
- `plugins/sagas` and `plugins/workers` are **Archetype 5 — Plugin Package**. The sagas plugin may
  bind the core port to HTTP/environment edges; it must not redefine the receipt contract. Workers
  may emit a consumer sample using the core/plugin surface; it must not own publisher conventions.
- Public Markdown/reference work uses the **docs scope overlay** and must remain source-derived.

## Current Doctrine Verdict

- `packages/plugin-sagas-core`: **Keep** — preserve saga state-machine/runtime ownership.
- `plugins/sagas`: **Keep** — keep runtime conventions in core and the plugin as thin integration.
- `plugins/workers`: **Refactor** — existing thinness/cardinality debt remains separate; this leaf
  changes only the official consumer sample/test boundary and must not widen that debt.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 — Public types are designed first | The existing result union stays canonical; the helper's generic return is declared before implementation. |
| A2 — Simple over easy at published boundaries | One explicit helper plus one quality rule is clearer than inventing a pseudo-`must_use` type TypeScript cannot enforce. |
| A5 — Composition over inheritance | A function composes over `SagaPublisherPort`; no base class or required concrete method is introduced. |
| A7 — Web Platform and `@std/*` first | Environment enumeration uses `Deno.env` at the plugin edge and existing injected readers; no dependency is added. |
| A9 — Structure follows archetype | Core owns consumption semantics; the plugin owns HTTP/Aspire resolution; workers/docs are consumers. |
| A10 — Explicit composition root | `baseUrl`, environment readers, key enumeration, fetch, and marker remain explicit/injectable seams. |
| A11 — Name extension axes first | Receipt mode, endpoint source, environment context, batch mode, and consumer surface are named below. |
| A13 — Crash boundaries are explicit | `publishSagaOrThrow` is the deliberate exception boundary; non-throwing `publish` remains available when callers discriminate. |
| A14 — Tests are fitness functions | A repo rule, whole-package suites, generator derivation test, and public-doc sync prevent recurrence. |

## Goal

Make it impossible for first-party/source-reviewed code to silently discard a saga publisher
rejection, make missing endpoint diagnostics actionable without restoring any port guess, and align
the generated sample and public documentation with the enforced contract.

## Scope

- Add a core `publishSagaOrThrow(publisher, message, options?)` helper that returns only an accepted
  receipt and throws an existing structured `SagasError` on a rejected result.
- State the single allowed consumption contract once in the `SagaPublisherPort` doc comment:
  discriminate every `publish`/`publishMany` result, or use the throwing helper; unused receipts are
  rejected by repository quality policy.
- Re-export the helper through the core publisher subpath and the sagas plugin runtime entrypoint.
- Add a quality-scanner rule for discarded saga-publisher `publish()` and `publishMany()` calls,
  including TypeScript source, fenced public-doc examples, and raw Lume code-component strings.
- Enrich missing-endpoint rejection reasons with every attempted source, the exact expected raw
  Aspire key, Aspire detection state, and environment-permission diagnostics.
- Detect Aspire after resolution fails by enumerating injected environment keys for any
  `services__*` key and by an explicit `NETSCRIPT_ASPIRE` marker. Enumeration remains an injected,
  permission-aware plugin-edge seam.
- Preserve the current non-throwing D-14 behavior of `publish()`: it returns a rich rejected receipt.
  The throwing helper turns that rejection into a raised diagnostic at failure boundaries.
- Preserve and test the already-correct workers official sample receipt discrimination.
- Add a source-derived docs test so the page labeled “verbatim from the scaffold” cannot diverge
  from emitted source again.
- Correct all four public saga-publisher discard examples and the stale 8092 reference.
- Regenerate only the explicitly listed derivative assets.

## Non-Scope

- No type-level `must_use` emulation. TypeScript cannot force a Promise result to be bound or
  discriminated before expression-statement disposal.
- No replacement of `SagaPublisherResult`, no new error class/code, and no new result union.
- No required `publishOrThrow` method on `SagaPublisherPort`; that would break structural custom
  implementations.
- No changes to saga state transitions, transport, delivery, scheduling, telemetry, correlation,
  retry classification, or #1764 acceptance.
- No SDK/Aspire browser full-key normalization fix. That is a real but non-blocking browser parity
  issue and belongs to a separate leaf.
- No normalization of server-side service names. Raw `services__sagas-api__http__0` is correct.
- No removal of `SAGAS_API_DEFAULT_PORT`; its deprecated compatibility removal remains scheduled for
  0.0.8.
- No CLI-adapter or E2E-probe product edits: both already fail explicitly and contain no 8092
  fallback.
- No dependencies and no `deno.lock` change.
- No PR creation, labeling, taxonomy, milestone work, or PLAN-EVAL dispatch.
- No runtime/scaffold/Aspire/container command without a later primary-granted serialized lease.

## Hidden Scope

- `publishSagaOrThrow` is an additive public export, so the MCP `deno doc` export corpus moves even
  though no result/error type is added.
- Public-doc changes move the compressed agent-docs prose/provenance and CLI embedding.
- Publish-asset generation consumes agent-docs provenance and may move both CLI and MCP publish
  assets; those outputs are conditional on generator proof.
- The docs corpus has three pages and four unsafe calls, not only the one issue-cited page.
- The current scaffold source is already correct; regression proof, not a behavioral rewrite, is
  the remaining owned work.
- #1764 touches the same generated MCP corpus. Final integrated-head regeneration is a merge-
  coordinator obligation even after this leaf's own generated gate passes.

## Locked Product Path Ceiling

No S2 product, test, tool, public-doc, or generated path outside this exact list may change without
an explicit rescope request and updated PLAN-EVAL.

### Core contract and helper

1. `packages/plugin-sagas-core/src/integration/publisher/saga-publisher-port.ts`
2. `packages/plugin-sagas-core/src/integration/publisher/publish-saga-or-throw.ts` (new)
3. `packages/plugin-sagas-core/src/integration/publisher/mod.ts`
4. `packages/plugin-sagas-core/tests/integration/publisher/publish-saga-or-throw_test.ts` (new)

### Thin sagas HTTP integration

5. `plugins/sagas/src/runtime/saga-publisher.ts`
6. `plugins/sagas/src/runtime/mod.ts`
7. `plugins/sagas/tests/runtime/saga-publisher_test.ts`
8. `plugins/sagas/README.md`

### Workers consumer/sample proof

9. `plugins/workers/src/cli/official-sample-configuration.ts`
10. `plugins/workers/tests/cli/official-sample-configuration_test.ts` (new)

The sample source is in ceiling only for an evaluator-approved clarity/synchronization adjustment;
its current receipt-discrimination behavior must be preserved.

### Repository quality and docs derivation

11. `.llm/tools/quality/scan-code-quality.ts`
12. `.llm/tools/quality/scan-code-quality_test.ts`
13. `.llm/tools/docs/official-saga-publisher-sample-sync_test.ts` (new)
14. `deno.json`

### Public documentation

15. `docs/site/durable-workflows/sagas.md`
16. `docs/site/explanation/durability-model.md`
17. `docs/site/tutorials/storefront/04-checkout-saga.md`
18. `docs/site/reference/sagas/index.md`
19. `docs/site/reference/plugin-sagas-core/index.md`

### Generated derivatives

20. `.llm/assets/agent-docs/prose.json.gz`
21. `.llm/assets/agent-docs/provenance.json`
22. `packages/cli/src/kernel/assets/agent-docs.generated.ts`
23. `packages/cli/src/kernel/assets/publish-assets.generated.ts` (only if generator-attributed)
24. `packages/mcp/src/publish-assets.generated.ts` (only if generator-attributed)
25. `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`

`packages/plugin-sagas-core/README.md` is deliberately outside the ceiling because #1764 changes it;
the port doc comment, sagas plugin README, core reference page, and durable-workflows page document
the new contract without creating that source collision. All other generated outputs from
`check:assets-barrel`/publish tooling must remain byte-identical. `deno.lock` must remain at SHA-256
`edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D-1365-1 | Choose issue mechanism (b): companion `publishSagaOrThrow(...)` plus a repo discarded-receipt gate. | It fits the existing port/result shape, preserves custom implementations, and gives failure-boundary callers a non-silent API. |
| D-1365-2 | State consumption discipline once on the `SagaPublisherPort` interface doc. | The contract lives at the port boundary; method comments should describe behavior without duplicating policy prose. |
| D-1365-3 | Helper throws existing `SagasError.retryable/nonRetryable` with the rejected receipt as cause. | Preserves retry metadata and avoids a new diagnostic export/error code. |
| D-1365-4 | `publish()` remains non-throwing and returns rich rejection text. | Preserves the designed union and Aspire S5 D-14 behavior. |
| D-1365-5 | Never restore any implicit endpoint, inside or outside Aspire. | 8092 cannot be a generated project port and guessing contradicts the diagnostic precedent. |
| D-1365-6 | Server key remains raw-hyphen; browser full-key parity is deferred. | Source proves raw server form is actual Aspire/AppHost output; shorthand keeps browser resolution functional. |
| D-1365-7 | CLI/probe sites receive no edit. | They no longer contain the literal and already throw on missing discovery. |
| D-1365-8 | Preserve the current official sample's explicit discrimination and add tests/sync. | The current source is correct; regression discipline is the missing piece. |
| D-1365-9 | This leaf owns all public-doc correction. | The docs exception permits in-harness authoring and the docs are part of the user-facing failure. |
| D-1365-10 | MCP corpus is regenerated in the leaf and again at integrated head. | It is required by the export change and is the only #1764 ceiling collision. |

## Six Design Answers

### 1. Non-ignorable result

Choose **(b)**. Add `publishSagaOrThrow(...)` as a core companion over `SagaPublisherPort`, export it
from the core publisher subpath and plugin runtime, and add a repo quality rule rejecting bare unused
`await <sagaPublisher>.publish(...)` and `.publishMany(...)`. Do not add a required port method or a
fake compile-time wrapper. The port doc states exactly once that callers must discriminate returned
receipts or use the throwing helper.

### 2. No silent endpoint guessing under Aspire

There is already no fallback. Replace `no-endpoint` with a stable diagnostic that names:

- `options.baseUrl`;
- `services__<serviceName>__https__0`;
- `services__<serviceName>__http__0` (explicitly identifying
  `services__sagas-api__http__0` for the default service);
- `SAGAS_API_URL`;
- `NETSCRIPT_SAGAS_URL`;
- whether any `services__*` key or `NETSCRIPT_ASPIRE` marker proved an Aspire environment;
- whether environment enumeration was denied.

`publish()` returns that diagnostic in a non-retryable rejected receipt. At a throwing boundary,
`publishSagaOrThrow()` raises it as `SagasError`. Port 8092 is never generated: the allocator is
strictly 49152–65535.

### 3. Discovery-key asymmetry

Actual **server** Aspire output preserves the resource hyphen, so
`services__sagas-api__http__0` is correct and the saga publisher/SDK server resolver agree. Actual
**Vite browser** injection normalizes to `VITE_services__sagas_api__http__0` and also injects
`VITE_SAGAS_API_URL`. The SDK browser full-key builder is therefore asymmetric, but its shorthand
matches and prevents an all-path miss. The publisher is server-side, so normalization is neither a
cause nor an in-ceiling fix. Browser full-key parity is deferred to a separate issue/leaf.

### 4. Other literal-8092 sites

Neither named site still contains 8092. The CLI adapter and E2E probe are distinct edge/tooling
paths and already throw when discovery is absent. They stay out of scope. The deprecated constant
stays compatibility-only until 0.0.8; the false reference prose is corrected here.

### 5. Scaffold sample job

The current locked-base sample already demonstrates the correct non-throwing pattern: assign the
result, discriminate `published`, and return `createFailureResult` before success. Preserve it, add a
workers package test for emitted source discipline, make the repo quality gate scan it, and add an
exact docs derivation test. No behavioral rewrite is justified merely because the issue cited an
older commit.

### 6. Docs correction

This leaf owns it directly. Update the issue-cited durable-workflows page, the two additional unsafe
publisher examples found by census, the stale sagas 8092 reference, and the core publisher reference
count/surface. Wire a source-derived sample sync test into `docs:snippets:test`. The `CLAUDE.md`
documentation exception permits this scope; it does not require deferral.

## Composition Axes

| Axis | Variants | Owner |
| --- | --- | --- |
| Result consumption | discriminate non-throwing receipt / use throwing helper | core publisher integration contract |
| Publish cardinality | one / many sequential / many parallel | existing core port; no batch redesign |
| Endpoint source | explicit option / Aspire HTTPS / Aspire HTTP / legacy explicit env / missing | sagas HTTP adapter |
| Environment context | Aspire key detected / explicit marker / non-Aspire / enumeration denied | sagas HTTP adapter at Deno environment edge |
| Failure classification | rejected retryable / rejected non-retryable / accepted | existing result + `SagasError` factories |
| Consumer | worker generated sample / application code / public docs | workers plugin and docs overlay |
| Derivative | export corpus / agent docs / CLI embed / publish assets | repo generators only |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Helper method vs companion function | resolved | Companion function avoids structural interface break. |
| Helper error vocabulary | resolved | Existing `SagasError` only. |
| Aspire marker | resolved | `NETSCRIPT_ASPIRE`; any `services__*` key also detects. |
| Environment enumeration seam | resolved | Add an optional key-list reader to `HttpSagaPublisherOptions`; default is permission-aware Deno enumeration after resolution fails. |
| HTTPS vs HTTP expected key | resolved | Diagnostic names both; exact default HTTP key is highlighted. |
| Server normalization | resolved | Preserve raw resource name. |
| Browser normalization | safe to defer | Separate SDK/Aspire parity leaf. |
| `publishManyOrThrow` | safe to defer | Batch callers must inspect every result; repo rule prevents full-array discard. No speculative batch throw policy. |
| CLI/probe edits | resolved out | Already fixed at base. |
| Sample source rewrite | resolved | Preserve; only evaluator-approved clarity adjustment allowed. |
| Runtime gate timing | must resolve after PLAN-EVAL | Primary must grant serialized lease; no S1/S2 author may infer it. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Scanner flags unrelated `.publish()` APIs such as `SagaRuntime.publish` | Taint only identifiers created by `createSagaPublisher` or typed as `SagaPublisherPort`; add false-positive fixtures. |
| Scanner misses generated template or Lume component strings | Add template and raw-Markdown fixtures plus exact source-derivation test. |
| Environment enumeration introduces a hidden permission | Enumerate only after direct sources miss, inject the seam, catch denial, include denial in diagnostic, and document it. |
| Helper loses generic message literal or retryability | Explicit generic return type; core tests for accepted, retryable, and non-retryable results/cause. |
| Docs and scaffold drift again | Exact generator-to-doc test wired into an existing docs task. |
| Existing failing doc/JSR gates get mistaken for regressions | Compare exact measured counts; require non-increase and zero new findings. |
| #1764 generated conflict | Limit source collision to generated corpus and regenerate at final integrated head. |
| Runtime correctness falsely claimed from static proof | Runtime gate stays `NOT_RUN — lease required`; no runtime evidence retained. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-3 God interface | risk | Do not add a required method; keep one small companion helper. |
| AP-9 premature abstraction | risk | No generic “must-use result” framework; scope the quality rule to saga publishers. |
| AP-10 defensive handler catch | existing docs risk | Prefer explicit result discrimination in job examples; use throwing helper only where the caller already owns a failure boundary. |
| AP-11 hidden globals | risk | Environment/fetch stay injected through plugin options. |
| AP-13 console in published code | baseline sample | Do not expand current sample logging; quality baseline must not worsen. |
| AP-19 permissions assumed silently | risk | Permission-denied enumeration is diagnosed and documented. |
| AP-22 useless re-export barrel | risk | Existing publisher subpath is a real public boundary; export one behavior helper there, not a new barrel. |
| AP-25 side effect in non-edge file | risk | Core helper is pure over a port; Deno/fetch remain in plugin adapter. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1 file size | yes | Existing focused files remain under caps; no new monolith. |
| F-3 layering | yes | Core helper depends on core port/domain error; plugin depends inward on core. |
| F-5 public surface | yes | `deno doc` shows explicit generic helper and port policy. |
| F-6 JSR publishability | yes | Dry-run passes for all three packages; existing audit failures do not increase. |
| F-7 docs | yes | No new doc-lint findings; public pages/source sync pass. |
| F-9 permissions | yes | Key enumeration denial has a unit-tested diagnostic. |
| F-10 test shape | yes | Behavior assertions and focused fixtures, not giant generated snapshots. |
| F-13 saga/runtime invariants | yes | No endpoint guess; rejected receipt/throw boundary/caller failure path proven. |
| F-14 console | yes | Quality scan remains green with existing allowances only. |
| F-16 cardinality | yes | No new immediate-child overflow beyond the intentional new test subfolder path. |
| F-19 scoped runners | yes | Structured package check/test/lint/fmt wrappers with coverage counts. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Existing plugin-sagas runtime folder cardinality | none | Do not widen or claim closure. |
| Existing plugin-sagas Prisma idempotency parity | none | Unrelated to publisher consumption. |
| Existing plugins/workers thinness/cardinality debt | none | One focused CLI test only; no architecture refactor. |
| Existing private-type doc-lint debt | none | Exact baselines 9/23/20 must not increase. |
| Existing sagas/workers `doctor.ts` JSR module-tag failures | none | Exact audit baseline must not increase. |
| Browser SDK full-key parity | defer | Separate issue/leaf; do not create an architecture-debt entry for a bounded product bug. |

## Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| S2.1 | Contract-first helper and discarded-receipt rail | core whole-package check/test/lint/fmt; quality scanner tests/scan; `deno doc`; core publish dry-run | core publisher files/tests, plugin runtime re-export, quality scanner/tests |
| S2.2 | Rich no-endpoint diagnostic at thin HTTP edge | sagas whole-package check/test/lint/fmt; JSR/doc-lint non-increase; host-port static gate | saga publisher/tests/README |
| S2.3 | Consumer derivation and public docs truth | workers whole-package check/test/lint/fmt; docs snippets/links/accuracy; sample sync | workers sample/test, docs test/task, five public docs pages |
| S2.4 | Generated derivatives and merge-readiness static gates | four derivative checks, all three whole-package suites, publish dry-runs, quality/doctrine checks, lock/ceiling audit | listed generated outputs only |
| S2.5 | Leased runtime consumer proof | exact `scaffold.runtime` one-pass command | no source path; **must not run without primary-granted lease** |

Every implementation slice is committed and explicitly pushed before evaluation per harness rules.
S2.5 cannot be substituted with separate scaffold gates or ad hoc Aspire commands.

## Gate Table With Measured Baselines at `5197e70b7`

| Order | Gate | Exact command/check | Measured base | S2 acceptance |
| --- | --- | --- | --- | --- |
| 1 | Ceiling + branch | `git status --short`; `git rev-parse HEAD`; changed-path audit | clean; exact base; correct branch/no upstream | Only locked paths; artifact-only S1; lock unchanged. |
| 2 | Core check | structured `run-deno-check.ts --root packages/plugin-sagas-core --ext ts,tsx` | PASS, exit 0, 111/111 files | PASS, full selected coverage. |
| 3 | Sagas check | same wrapper for `plugins/sagas` | PASS, exit 0, 87/87 files | PASS. |
| 4 | Workers check | same wrapper for `plugins/workers` | PASS, exit 0, 102/102 files | PASS. |
| 5 | Core whole test | structured `run-deno-test.ts -- --allow-all packages/plugin-sagas-core` | PASS, exit 0: 69 passed, 0 failed, 3 ignored | PASS; new helper tests included. |
| 6 | Sagas whole test | wrapper for `plugins/sagas` | PASS, exit 0: 55 passed, 0 failed, 1 ignored | PASS; diagnostic matrix included. |
| 7 | Workers whole test | wrapper for `plugins/workers` | PASS, exit 0: 52 passed, 0 failed | PASS; emitted sample discipline included. |
| 8 | Package lint | structured lint wrapper for each of the three roots | PASS, exit 0; 111/87/102 files; 0 findings | PASS with zero findings. |
| 9 | Package format | structured fmt-check wrapper for each root | PASS, exit 0; 111/87/102 files; 0 findings | PASS with zero findings. |
| 10 | Core doc lint | `deno task doc:lint --root packages/plugin-sagas-core --pretty` | FAIL, exit 1: 9 private-type refs, 0 missing JSDoc/other | Non-increase: exactly 9 or fewer, helper has no new finding. |
| 11 | Sagas doc lint | same for `plugins/sagas` | FAIL, exit 1: 23 private-type refs, 0 missing JSDoc/other | Non-increase: exactly 23 or fewer. |
| 12 | Workers doc lint | same for `plugins/workers` | FAIL, exit 1: 20 private-type refs, 0 missing JSDoc/other | Non-increase: exactly 20 or fewer. |
| 13 | Core JSR audit | `audit-jsr-package.ts --root packages/plugin-sagas-core` | PASS, exit 0: 2 warnings | Exit 0; no new slow type/surface failure. |
| 14 | Sagas JSR audit | audit script for `plugins/sagas` | FAIL, exit 1: existing `./doctor` missing `@module`; 2 warnings | Same single failure only; no new finding. |
| 15 | Workers JSR audit | audit script for `plugins/workers` | FAIL, exit 1: existing `./doctor` missing `@module`; 3 warnings | Same single failure only; no new finding. |
| 16 | Publish dry-run | `deno task --cwd <root> publish:dry-run` for all three roots | PASS, exit 0 for all | PASS for all. |
| 17 | Quality scan | `deno task quality:scan:repo` | PASS, exit 0: 0 findings, 7 valid allowances | PASS, same allowance budget; new rule active. |
| 18 | Discarded-receipt rule | source census + scanner rule presence | Gate NOT_PRESENT; docs contain 4 unsafe saga-publisher calls; sample contains 0 | Synthetic RED fixtures and repository GREEN; zero unsafe calls. |
| 19 | Doctrine scanner | `deno task arch:check:repo` | PASS, exit 0; core 2 WARN/2 INFO, sagas 8 WARN/2 INFO, workers 9 WARN/2 INFO | PASS; no new targeted warning. |
| 20 | Host-port static scan | `deno task check:aspire-host-ports` | PASS, exit 0: 958 files, no pinned host ports | PASS; no new literal fallback. |
| 21 | Docs snippets tests | `deno task docs:snippets:test` | PASS, exit 0: 11 passed | PASS with sample-sync test wired. |
| 22 | Sample/docs exact sync | generator/docs source comparison | Gate NOT_PRESENT; manual mismatch at durable-workflows line 418 | New named test PASS and exact emitted sample body matches. |
| 23 | Docs links | `deno task docs:links` | PASS, exit 0: 103 docs, 0 broken links/anchors | PASS. |
| 24 | Docs accuracy | `deno task docs:accuracy` | PASS, exit 0; known TanStack peer warning only | PASS; publisher/fallback claims accurate. |
| 25 | Agent docs prose | `deno task check:agent-docs-prose` | PASS, exit 0; fresh corpus | PASS after intentional regeneration. |
| 26 | Assets barrel | `deno task check:assets-barrel` | PASS, exit 0; write-before-diff left tracked tree clean | PASS; only listed agent-doc derivative may move. Run knowingly. |
| 27 | Publish assets | `deno task check:publish-assets` | PASS, exit 0 | PASS; conditional outputs generator-attributed. |
| 28 | MCP export corpus | `deno task check:mcp-export-corpus` | PASS, exit 0; SHA-256 `a3c4c91e...09ce0`, 35 packages/270 subpaths/7623 symbols | PASS after helper export regeneration; coordinator reruns after #1764 integration. |
| 29 | Lock hash | `sha256sum deno.lock` | `edfa0c24...d1820c` | Exact byte identity. |
| 30 | Runtime consumer | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | `NOT_RUN — serialized runtime lease required`; no evidence retained | Must PASS only during a primary-granted lease; otherwise remain explicitly blocked. |

The static/package exit expectations above are grounded in measured base behavior. Pre-existing
non-green doc-lint and JSR audit gates use exact non-increase contracts rather than false green
promises.

## Validation Plan

1. Run focused RED tests for helper rejection, missing endpoint diagnostic, discarded receipt, and
   docs/sample mismatch.
2. Implement each slice contract-first, then run the full package suite on both sides of the
   composition (`plugin-sagas-core`, `plugins/sagas`, `plugins/workers`).
3. Run static repo quality/doctrine/docs/port checks and exact baseline comparisons.
4. Regenerate only after source gates pass; audit `git diff --name-only` against the ceiling after
   each write-capable generator.
5. Verify `deno.lock` hash and raw git diff.
6. Do not run runtime/consumer infrastructure. Request the exact serialized lease for the one-pass
   command if/when the primary requires it.

## Dependencies

- Existing `SagaPublisherPort`, `SagaPublisherResult`, `SagaPublisherReceipt`, and `SagasError`.
- Existing `createSagaPublisher` HTTP adapter and injected `readEnv`/`fetcher` seams.
- Existing official sample generator and docs tooling.
- #1764 sequencing affects only final generated MCP corpus reconciliation.
- Primary authorization is required for the host-runtime gate.

## Drift Watch

- If #1764 integrates or its carrier changes before S2, do not rebase this owner-locked branch;
  re-diff and record the new mechanical derivative handoff.
- If a new in-repo `SagaPublisherPort` implementation appears, add it to helper/scanner fixtures and
  whole-package coverage before changing the interface.
- If environment detection requires AppHost generator changes, stop and request rescope; those paths
  are outside the ceiling.
- If a generated command changes any unlisted output, stop and request rescope rather than accepting
  broad churn.
- If runtime evidence is requested without an explicit serialized lease, stop and name the exact
  command/why; do not infer authorization.
