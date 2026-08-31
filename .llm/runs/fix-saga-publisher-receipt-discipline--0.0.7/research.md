# Research: saga publisher receipt discipline (#1365)

## Rebaseline

- Original research base: `5197e70b716eafb82fbb12ddb9a910c248ddb86a`.
- Current main: `8a925764276b25ef7cef484db273604f44557cef`.
- Converged artifact-only leaf: `7c2a12fa1617666a0e17acd81165c25f2325126f`.
- Main is the leaf merge's second parent and an ancestor of the leaf.
- Explicit intersection against the original authoritative 25-path ceiling: **6/25**, all root-task
  or generated derivative paths; no handwritten publisher/docs/sample source collision.

## Current Facts

| #  | Finding                                                                                                                                                                                     | Evidence                                                                          |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1  | `SagaPublisherPort.publish` and `publishMany` return a non-throwing discriminated result, but TypeScript permits a bare unused await.                                                       | `deno doc` and `saga-publisher-port.ts`                                           |
| 2  | No required port method can solve ignored Promise results without breaking structural implementers; a companion function preserves the port and makes throwing explicit.                    | port shape; doctrine A1/A2/A5/A13                                                 |
| 3  | `SagasError` already carries stable code, retryability, and cause; no new diagnostic error export is needed.                                                                                | `packages/plugin-sagas-core/src/domain/errors.ts`; `deno doc --filter SagasError` |
| 4  | Core publisher subpath currently exports types only; plugin runtime already re-exports those types and is the natural thin value re-export.                                                 | both `mod.ts` files                                                               |
| 5  | The quality scanner covers packages, plugins, its own tooling, and docs; it already scans checked TypeScript fences, ignores ordinary tests, and skips generated output.                    | `scan-code-quality.ts`; `quality:scan:repo`                                       |
| 6  | A global method-name rule would be wrong: repository source contains unrelated Redis, runtime, subscription, trigger, and event publishers. The rule must identify saga-publisher bindings. | repository bare-publish census                                                    |
| 7  | Four unsafe saga-publisher calls remain: one durable-workflows embedded sample, one durability-model fence, and two storefront tutorial calls.                                              | focused `rg` census                                                               |
| 8  | The official worker template already assigns the result and checks `published`; it contains zero unsafe bare saga-publisher calls.                                                          | `official-sample-configuration.ts:397-407`                                        |
| 9  | The durable-workflows sample claims to be scaffold-verbatim but differs from the safe template and discards the result.                                                                     | source/docs comparison                                                            |
| 10 | `docs:snippets:test` currently runs 11 tests and has no official-sample sync test.                                                                                                          | root `deno.json`; measured task                                                   |
| 11 | Runtime endpoint resolution has no 127.0.0.1 fallback. Missing resolution returns `no-endpoint`; enriching that reason is improvement scope, not a remaining fallback defect.               | current publisher source/tests                                                    |
| 12 | The docs reference still calls deprecated 8092 metadata a default fallback, contradicting runtime behavior.                                                                                 | `docs/site/reference/sagas/index.md`                                              |
| 13 | Server Aspire keys retain `sagas-api`; the browser Vite full-key normalization difference is real but shorthand still resolves and is unrelated to the server publisher.                    | SDK/Aspire source review retained from accepted S1                                |
| 14 | Scaffold port allocation remains 49152–65535, so 8092 is not a plausible generated listener.                                                                                                | `default-port-allocation.ts`                                                      |
| 15 | Main changed new-base counts: core has 112 selected files and 84 passing tests; sagas doc-lint now has 27 private refs; MCP corpus is 35 packages/271 subpaths/7677 symbols.                | remeasured Gate Table                                                             |

## Narrowing Consequences

- Implement only `publishSagaOrThrow`, its exports/tests, and the saga-aware unused-result quality
  rule.
- Fix exactly four unsafe calls, stale reference prose, core public reference, and docs source-sync
  task/test.
- Do not edit any workers path. The scanner must prove the existing emitted template remains safe; a
  separate workers guard would duplicate the same invariant.
- Do not edit publisher endpoint logic/tests/README or SDK/Aspire code.
- Regenerate only derivative paths attributed to the helper/docs changes.

## Publishability / Doctrine Scan

- Core remains Archetype 3 / **Keep**; plugin remains Archetype 5 / **Keep**.
- The helper passes A6 because it encodes NetScript-specific rejected-receipt-to-structured-error
  policy and is exercised directly.
- Plugin thinness holds because the implementation remains core-owned and the plugin only
  re-exports.
- Core JSR audit passes with two warnings; sagas audit remains red only for the existing `doctor.ts`
  module tag plus two warnings.
- Core/sagas doc-lint baselines are 9/27 private-type refs, with zero missing JSDoc/other findings.
- No new debt is required; exact non-increase contracts protect all pre-existing findings.

## Open Questions

No product/design question remains open. The only decision is procedural: the primary must accept
the recommendation `PLAN-EVAL: N/A` or dispatch a separate PLAN-EVAL. Gate 30 remains unmeasured
until a serialized runtime lease is explicitly granted.
