# Plan: saga publisher receipt discipline (#1365)

## Status

- Phase: S2 implementation authorized; `PLAN-EVAL: N/A` accepted by the primary.
- Current base: `6bb27e46ab1bd4b9534068b2a9eb58039ae287d1`.
- Converged leaf head supplied by the supervisor: `9f1f9fb8738c92dd047054cfde096c3722b967bb`.
- Implementation proceeds through the four locked RED/GREEN slices only.
- Runtime authority remains absent. Gate 30 is `NOT_RUN — serialized runtime lease required`.

## Rebaseline and Convergence

The supervisor merged current main into the artifact-only S1 commit with zero conflicts. Main
`8a925764` is the second parent of `7c2a12fa1` and is an ancestor of the leaf head.

The authoritative pre-narrowing product ceiling contained 25 explicit paths. An explicit-path
`git diff --name-status 5197e70b7..8a925764 -- <25 paths>` found an intersection of **6/25**:

1. `.llm/assets/agent-docs/prose.json.gz`
2. `.llm/assets/agent-docs/provenance.json`
3. `deno.json`
4. `packages/cli/src/kernel/assets/agent-docs.generated.ts`
5. `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`
6. `packages/mcp/src/publish-assets.generated.ts`

All six are retained by the narrowed ceiling. No handwritten publisher, quality-scanner, sample, or
public-doc source path in the old ceiling was touched by main. The merge introduced no conflict and
the branch still differs from main only by the six harness artifacts.

## Scope and Doctrine

- `packages/plugin-sagas-core`: Archetype 3 — Runtime/Behavior; doctrine verdict **Keep**. The new
  helper is package-owned failure-boundary policy over an existing publisher port.
- `plugins/sagas`: Archetype 5 — Plugin Package; doctrine verdict **Keep**. It only re-exports the
  core-owned helper from its runtime entrypoint; no convention is reimplemented in the plugin.
- Repository quality tooling: existing scanner extension, not a new product abstraction.
- Public docs: `SCOPE-docs`; source claims must match the port, helper, and already-shipped sample.
- Primary axioms/gates: A1, A2, A5, A6, A8, A13, A14; AP-1/AP-14/AP-16/AP-22/AP-25; F-1 through F-19
  as applicable, especially F-3, F-5, F-6, F-7, F-13, and F-19.

Current relevant debt remains baseline-only and must not increase: saga Prisma idempotency parity,
sagas runtime folder cardinality, private-type doc-lint findings, and the plugin `doctor.ts`
`@module` audit failure. This leaf creates no architecture-debt entry.

## Narrowed Contract — LOCKED

This leaf fixes exactly two defects.

### 1. Discardable publisher receipts

Add the core companion:

```ts
publishSagaOrThrow<TMessage extends SagaMessage, TNextMessage extends TMessage>(
  publisher: SagaPublisherPort<TMessage>,
  message: TNextMessage,
  options?: SagaPublisherPublishOptions,
): Promise<SagaPublisherReceipt<TNextMessage['type']>>
```

The helper awaits `publisher.publish(...)`, returns the accepted receipt, and converts a rejected
receipt into the existing `SagasError`, preserving `reason`, `retryable`, publisher `id`, and the
rejected receipt as diagnostic context. It adds no dependency, error class, result type, or required
port method. `SagaPublisherPort.publish()` and `.publishMany()` remain non-throwing and
source-compatible.

Export the helper as a value from:

- `@netscript/plugin-sagas-core/integration/publisher`; and
- `@netscript/plugin-sagas/runtime`.

The `SagaPublisherPort` doc comment states the mechanism once: callers must discriminate returned
receipt(s), or use `publishSagaOrThrow(...)` for the single-message throwing boundary; repository
quality policy rejects a known saga publisher's bare unused `.publish(...)`/`.publishMany(...)`.

Extend the existing quality scanner with rule vocabulary `discarded-saga-publisher-result`. It
reports only a standalone awaited call whose receiver is identified as a saga publisher (factory
binding or explicit `SagaPublisherPort` binding), avoiding unrelated `runtime.publish`, Redis
publish, and subscription-hub APIs. The rule must scan normal TypeScript, checked TypeScript docs
snippets, and the TypeScript template literal that emits the official worker sample. Tests prove
multiline calls, `publishMany`, assignment/return/discrimination safe forms, the emitted sample, and
unrelated-publisher non-findings.

### 2. Unsafe public documentation

Correct the four unsafe saga-publisher calls currently found at:

- `docs/site/durable-workflows/sagas.md` — one embedded canonical sample;
- `docs/site/explanation/durability-model.md` — one fenced sample;
- `docs/site/tutorials/storefront/04-checkout-saga.md` — two calls.

The durable-workflows sample becomes source-derived from the already-correct scaffold template and
models explicit receipt discrimination. The other examples either discriminate the receipt or use
`publishSagaOrThrow(...)`; the storefront rewrite must not reinterpret a publish rejection as a
payment-provider failure.

Also replace the stale `docs/site/reference/sagas/index.md` claim that 8092 is a default HTTP
fallback with the true contract: the constant is deprecated compatibility metadata, not endpoint
resolution behavior. Update the core reference page for the additive helper export. Add the
source-derived sample-sync test to `docs:snippets:test`; it reads, rather than edits or regenerates,
the workers template and proves the canonical public sample stays aligned.

## Locked Product Path Ceiling

No S2 product, test, tool, public-doc, or generated path outside this exact 20-path list may change
without an explicit rescope request and an updated harness decision.

### Core companion and thin re-export

1. `packages/plugin-sagas-core/src/integration/publisher/saga-publisher-port.ts`
2. `packages/plugin-sagas-core/src/integration/publisher/publish-saga-or-throw.ts` (new)
3. `packages/plugin-sagas-core/src/integration/publisher/mod.ts`
4. `packages/plugin-sagas-core/tests/integration/publisher/publish-saga-or-throw_test.ts` (new)
5. `plugins/sagas/src/runtime/mod.ts`

### Repository quality and docs derivation

6. `.llm/tools/quality/scan-code-quality.ts`
7. `.llm/tools/quality/scan-code-quality_test.ts`
8. `.llm/tools/docs/official-saga-publisher-sample-sync_test.ts` (new)
9. `deno.json`

### Public documentation

10. `docs/site/durable-workflows/sagas.md`
11. `docs/site/explanation/durability-model.md`
12. `docs/site/tutorials/storefront/04-checkout-saga.md`
13. `docs/site/reference/sagas/index.md`
14. `docs/site/reference/plugin-sagas-core/index.md`

### Generated derivatives

15. `.llm/assets/agent-docs/prose.json.gz`
16. `.llm/assets/agent-docs/provenance.json`
17. `packages/cli/src/kernel/assets/agent-docs.generated.ts`
18. `packages/cli/src/kernel/assets/publish-assets.generated.ts` (only if generator-attributed)
19. `packages/mcp/src/publish-assets.generated.ts` (only if generator-attributed)
20. `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`

Explicitly outside the ceiling: every `plugins/workers/**` path; saga publisher endpoint
implementation/tests/README; SDK/Aspire discovery; CLI adapter/probe code; core/plugin READMEs; and
all unlisted generated files. `deno.lock` must remain byte-identical at SHA-256
`edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`.

## Design Decisions — LOCKED

| ID        | Decision                                                            | Rationale                                                                                                              |
| --------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| D-1365-N1 | Companion helper, not a port method or type trick.                  | Preserves the useful non-throwing union and structural port implementations while offering an explicit crash boundary. |
| D-1365-N2 | Reuse `SagasError`; no new public error.                            | Existing factories already encode retryability and diagnostic cause.                                                   |
| D-1365-N3 | Quality rule is saga-publisher-aware, not method-name-global.       | Other repository APIs legitimately expose `publish`; a global name rule would be false-positive scope expansion.       |
| D-1365-N4 | The existing workers sample is read-only source truth.              | It already discriminates the receipt; no worker defect or product edit exists.                                         |
| D-1365-N5 | Canonical docs sample is source-derived.                            | Prevents the stale “verbatim” claim from drifting again without a redundant workers guard test.                        |
| D-1365-N6 | Endpoint diagnostics are deferred.                                  | The primary narrowed this leaf to receipt discipline and docs only.                                                    |
| D-1365-N7 | Generated files move only when attributed by checked-in generators. | Keeps the ceiling exact while honoring public-surface/docs derivative contracts.                                       |

## Open-Decision Sweep

No decision remains that would force implementation rework.

| Topic                        | Classification | Disposition                                                                  |
| ---------------------------- | -------------- | ---------------------------------------------------------------------------- |
| PLAN-EVAL dispatch           | resolved       | Primary accepted `PLAN-EVAL: N/A`; no evaluator session was required.        |
| Serialized runtime timing    | safe to defer  | Gate 30 remains explicit `NOT_RUN`; no command may run without a lease.      |
| Rich no-endpoint diagnostic  | safe to defer  | Proposed follow-up recorded in `drift.md`, requiring explicit authorization. |
| Browser Vite full-key parity | safe to defer  | Separate SDK/Aspire issue; not causal for the server publisher.              |

## Commit Slices

| #    | Slice                                       | What it proves                                                                                                                                                               | Proving gates                             | Ceiling paths               |
| ---- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------- |
| S2.1 | Core throwing companion + thin re-export    | Rejected receipts become typed `SagasError`; accepted receipt type is preserved; both public entrypoints expose one core implementation.                                     | Gates 2, 3, 5, 6, 8–16, 19, 28            | 1–5                         |
| S2.2 | Discarded-receipt repository rail           | Bare known saga-publisher `publish`/`publishMany` expressions fail across source, docs, and emitted-template text without flagging unrelated publishers or consumed results. | Gates 17–20                               | 6–7                         |
| S2.3 | Source-derived sample and public docs truth | Four unsafe calls are gone, canonical sample matches the already-safe scaffold source, stale 8092 claim is removed, and the docs task owns the sync test.                    | Gates 18, 21–24                           | 8–14                        |
| S2.4 | Generated derivatives + static handoff      | Only attributed generated paths move; public corpus, package/docs checks, ceiling, and lock discipline hold.                                                                 | Gates 1–29; Gate 30 remains lease-blocked | 15–20 plus artifact updates |

There is no workers implementation slice and no workers guard test. Gate 30 is a validation hold,
not an implementation slice.

## Gate Table — Re-measured at `8a925764`

All permitted commands were rerun after convergence. Pre-existing red gates remain exact
non-increase contracts. Write-capable derivative checks are explicitly not misreported as run under
the S1 read-only constraint.

| Order | Gate                   | Exact command/check                                                | New-base measurement                                                                                                    | S2 acceptance                                                                                      |
| ----- | ---------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1     | Ceiling + branch       | raw git status/ref/ancestry + explicit changed-path audit          | PASS: `8a925764` is parent/ancestor of `7c2a12fa1`; artifact-only six-file delta; old-ceiling intersection 6/25         | Only 20 locked product paths plus run artifacts; no upstream assumption; lock unchanged.           |
| 2     | Core check             | structured check wrapper, `packages/plugin-sagas-core`             | PASS, exit 0, 112/112 files                                                                                             | PASS, full selected coverage.                                                                      |
| 3     | Sagas check            | structured check wrapper, `plugins/sagas`                          | PASS, exit 0, 87/87 files                                                                                               | PASS.                                                                                              |
| 4     | Workers check          | structured check wrapper, `plugins/workers`                        | PASS, exit 0, 102/102 files                                                                                             | Baseline continuity only; no workers path is touched.                                              |
| 5     | Core whole test        | structured whole-package test wrapper                              | PASS, exit 0: 84 passed, 0 failed, 3 ignored                                                                            | PASS; helper tests included.                                                                       |
| 6     | Sagas whole test       | structured whole-package test wrapper                              | PASS, exit 0: 55 passed, 0 failed, 1 ignored                                                                            | PASS; consumer re-export/package composition retained.                                             |
| 7     | Workers whole test     | structured whole-package test wrapper                              | PASS, exit 0: 52 passed, 0 failed                                                                                       | Baseline continuity only; not a substitute for or justification of a workers guard.                |
| 8     | Package lint           | structured lint wrapper for core/sagas/workers                     | PASS, exit 0; 112/87/102 files; 0 findings                                                                              | Core+sagas PASS; workers may remain byte-untouched at its measured baseline.                       |
| 9     | Package format         | structured fmt wrapper for core/sagas/workers                      | PASS, exit 0; 112/87/102 files; 0 findings                                                                              | Core+sagas PASS; all changed TS in ceiling formatted.                                              |
| 10    | Core doc lint          | `deno task doc:lint --root packages/plugin-sagas-core --pretty`    | FAIL, exit 1: 9 private-type refs, 0 missing JSDoc/other                                                                | Exact non-increase: <=9; helper/subpath add zero.                                                  |
| 11    | Sagas doc lint         | same for `plugins/sagas`                                           | FAIL, exit 1: 27 private-type refs, 0 missing JSDoc/other                                                               | Exact non-increase: <=27; re-export adds zero.                                                     |
| 12    | Workers doc lint       | same for `plugins/workers`                                         | FAIL, exit 1: 20 private-type refs, 0 missing JSDoc/other                                                               | Baseline continuity only.                                                                          |
| 13    | Core JSR audit         | `audit-jsr-package.ts --root packages/plugin-sagas-core`           | PASS, exit 0: 2 warnings (cardinality, slow types)                                                                      | Exit 0; no new finding.                                                                            |
| 14    | Sagas JSR audit        | audit script for `plugins/sagas`                                   | FAIL, exit 1: existing `./doctor` missing `@module`; 2 warnings                                                         | Same single failure and <=2 warnings.                                                              |
| 15    | Workers JSR audit      | audit script for `plugins/workers`                                 | FAIL, exit 1: existing `./doctor` missing `@module`; 3 warnings                                                         | Baseline continuity only.                                                                          |
| 16    | Publish dry-run        | package `publish:dry-run` for core/sagas/workers                   | PASS, exit 0 for all three                                                                                              | Core+sagas PASS; workers unchanged.                                                                |
| 17    | Quality scan           | `deno task quality:scan:repo`                                      | PASS, exit 0: 0 findings, 7 valid allowances                                                                            | PASS, <=7 allowances; new rule active.                                                             |
| 18    | Discarded-receipt rule | rule/source census                                                 | `PENDING_SCRIPT`: rule absent; exactly 4 unsafe saga-publisher doc calls; emitted sample has 0                          | Synthetic RED fixtures then repository GREEN; zero unsafe known-saga-publisher calls.              |
| 19    | Doctrine scanner       | `deno task arch:check:repo`                                        | PASS, exit 0; core 3 WARN/2 INFO, sagas 8 WARN/2 INFO, workers 9 WARN/2 INFO                                            | PASS; no new targeted warning.                                                                     |
| 20    | Host-port static scan  | `deno task check:aspire-host-ports`                                | PASS, exit 0: 958 files, no pinned host ports                                                                           | PASS; docs do not restore a fallback claim.                                                        |
| 21    | Docs snippets tests    | `deno task docs:snippets:test`                                     | PASS, exit 0: 11 passed                                                                                                 | PASS with source-sync test included.                                                               |
| 22    | Sample/docs exact sync | source-derived comparison                                          | `PENDING_SCRIPT`: test absent; canonical “verbatim” sample differs and discards receipt; source sample discriminates it | New test PASS; canonical body matches the derived safe source contract.                            |
| 23    | Docs links             | `deno task docs:links`                                             | PASS, exit 0: 103 docs, 0 broken links/anchors                                                                          | PASS.                                                                                              |
| 24    | Docs accuracy          | `deno task docs:accuracy`                                          | PASS, exit 0; 4 saga pages, 199 source pages, 181 corpus files; known TanStack peer warning                             | PASS; publisher/fallback statements accurate.                                                      |
| 25    | Agent docs prose       | `deno task check:agent-docs-prose`                                 | `NOT_RUN — write-capable (docs/site build) and prohibited in read-only S1`                                              | Must PASS in S2 after intentional docs regeneration.                                               |
| 26    | Assets barrel          | `deno task check:assets-barrel`                                    | Exact task `NOT_RUN — writes before diff`; underlying read-only generator `--check` PASS, exit 0                        | Exact task PASS in S2; only ceiling-attributed output may move.                                    |
| 27    | Publish assets         | `deno task check:publish-assets`                                   | PASS, exit 0; `--check` path is read-only                                                                               | PASS; conditional outputs generator-attributed.                                                    |
| 28    | MCP export corpus      | `deno task check:mcp-export-corpus`                                | PASS, exit 0; SHA-256 `3a3ff013...d380a`; 35 packages/271 subpaths/7677 symbols                                         | PASS after helper export regeneration.                                                             |
| 29    | Lock hash              | `sha256sum deno.lock`                                              | `edfa0c24...d1820c`                                                                                                     | Exact byte identity.                                                                               |
| 30    | Runtime consumer       | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | `NOT_RUN — serialized runtime lease required`                                                                           | Remains NOT_RUN until the primary explicitly grants a lease; no partial/static result substitutes. |

## Risk Register

| Risk                                                               | Mitigation / gate                                                                                |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Helper erases generic message type or retry semantics              | Explicit return annotation and accepted/rejected tests; existing `SagasError` factories only.    |
| Rule over-flags unrelated `.publish()` APIs                        | Saga-publisher binding/taint fixtures plus real-repo green Gate 17.                              |
| Rule misses multiline/template/doc forms                           | Fixtures for each representation and scan of the actual workers source template.                 |
| Canonical sample drifts from source again                          | Source-derived test wired into `docs:snippets:test`; no copied expectation detached from source. |
| Storefront example turns notification failure into payment failure | Restructure the example's error boundary; test/census plus docs review.                          |
| Generated churn exceeds attribution                                | Run generators one at a time and audit changed paths after each; stop on any unlisted output.    |
| Known red baselines are mistaken for new failures                  | Enforce exact non-increase values in Gates 10–15.                                                |
| Runtime gate is falsely claimed                                    | Gate 30 remains visibly NOT_RUN until a serialized lease exists.                                 |

## Deferred / Prohibited

- No endpoint-resolution or `no-endpoint` diagnostic changes.
- No SDK/Aspire discovery normalization changes.
- No literal-port runtime/CLI/probe edits.
- No scaffold generation, sample behavior, workers source, or workers test changes.
- No removal of deprecated `SAGAS_API_DEFAULT_PORT`.
- No dependency or `deno.lock` change.
- No PR creation or taxonomy work in this artifact-only turn.
- No scaffold, `e2e:cli`, Aspire, Docker, container, or AppHost command without an explicit lease.

## Contributor Path

To add or consume publisher behavior, start at the core publisher subpath: keep normal rejection as
`SagaPublisherResult`, use `publishSagaOrThrow` where rejection is an exception, and re-export only
from thin plugin entrypoints. If a new saga publisher factory/binding form is introduced, add a
scanner fixture and update the saga-publisher taint recognition before teaching it in docs. The
canonical worker example is derived from the existing official-sample template; do not hand-copy a
second version.

## PLAN-EVAL Recommendation

**Accepted: `PLAN-EVAL: N/A`.** The primary adopted the recommendation because the narrowed leaf is
small and bounded: mechanism, public entrypoints, forbidden alternatives, exact defect count, docs
sites, ceiling, acceptance behavior, and gates are all locked. S2 is authorized. IMPL-EVAL remains
mandatory in a separate GLM 5.3 Flash · max session dispatched by the supervisor after
implementation.
