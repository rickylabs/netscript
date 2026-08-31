# Research — test-jsdoc-example-compile-gate--1533

## Re-baseline

- Carried-in sources: issue #1533, the leaf brief, and the supervisor ledger claim about four
  `packages/contracts` examples.
- Re-derived against `main` at `13878a80a50c55b9662099fed64555f2310ae4a3` on 2026-08-30.
- The ledger claim is false: it queried the contracts root for examples that explicitly import
  published subpaths. `packages/contracts/deno.json` declares `.`, `./crud`, `./query`, and
  `./transform`; the queried and transformed symbols resolve from the named subpaths.
- The carried examples are defective, but the carried explanation is false: their `/query` and
  `/transform` imports are published and resolve. Direct compilation finds both unbound application
  names and real usage/type errors across all four cited source examples and both entrypoint module
  examples.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | Deno 2.9.5 exposes `deno doc --json`, `--private`, `--filter`, and `--lint`; JSON contains module docs plus per-symbol declaration locations and structured `example` tags. | `deno --version`; `deno doc --help`; `deno doc --json packages/contracts/query.ts` |
| 2 | `deno doc --lint` is a documentation-surface lint, not an example compiler. It exits 0 while the pagination example is invalid. | `deno doc --lint packages/contracts/query.ts` → `Checked 1 file`, exit 0 |
| 3 | The contracts query and transform subpaths are real published entrypoints. | `packages/contracts/deno.json`; `deno doc --filter <symbol> packages/contracts/query.ts`; `deno doc --filter createTransformer packages/contracts/transform.ts` |
| 4 | All symbols named by the four cited source examples resolve on their claimed subpath: `PaginationInputSchema`, `createPaginatedOutput`, `FilterConditionSchema`, `buildPrismaWhere`, `paginatedQuery`, and `createTransformer`. | Repeat the `deno doc --filter` commands above against `query.ts` and `transform.ts`; each prints its declaration. |
| 5 | The pagination example itself fails compilation for two genuine missing bindings, not for its subpath import. | A temporary source containing the exact block and importing `./query.ts`, checked with `deno check --unstable-kv`, reports TS2304 for `baseContract` and `UserSchema`, exit 1. The probe was removed after measurement. |
| 6 | #1374 already supplies the reusable machinery this issue was sequenced behind: TS-fence extraction, `no-check:<reason>`, census formatting, temporary-module compilation, exact workspace export resolution, support fixtures, copied-lock isolation, and diagnostic remapping. | `.llm/tools/docs/snippet-{extractor,policy,compiler,workspace,supports}.ts`; commit `d558f9ab` (#1537) |
| 7 | The live denominator is 35 publishable workspace members under `packages/**` and `plugins/**`; `packages/bench` and `packages/cli/e2e` are the two explicit `publish:false` exclusions. | `.llm/tools/quality/check-root-coverage_test.ts`; `.llm/tools/release/publish-workspace.ts::discoverWorkspaceMembers` |
| 8 | Existing publish-surface discovery already applies each member's `publish.include` / `publish.exclude` rules to source files. | `.llm/tools/release/preflight-text-imports.ts::scanPublishSurface` |
| 9 | Exact public `@netscript/*` specifiers are already derived from workspace `exports`; undeclared subpaths are absent. The current resolver also includes non-publishable members, so the JSDoc gate needs an explicit published-only mode rather than trusting the broad default. | `.llm/tools/docs/snippet-workspace.ts::resolveWorkspaceSurface` |
| 10 | Scaffolded app configs generate `@app/` and `@<project>/contracts`; the existing snippet supports already model `@app/lib/orders.ts` and `@my-app/contracts`. | `packages/cli/src/kernel/adapters/templates/app/generate-app-deno-json.ts`; `.llm/tools/docs/snippet-supports.ts` |
| 11 | Durable CI gate receipts require a catalog entry and `run-gate.ts`; the quality job already runs for `packages/**`, `plugins/**`, and `.llm/tools/**/*.ts` changes. | `.llm/tools/gates/catalog.ts`; `.github/workflows/ci.yml`; `.github/scripts/ci-classify-changes.ts` |
| 12 | Disproving the ledger's mechanism did not disprove its conclusion: all four cited source examples and both contracts entrypoint module examples fail direct `deno check`. | PLAN-EVAL recompiled each block: `pagination.ts` TS2304 (`baseContract`, `UserSchema`); `filters.ts` TS2345 literal widening; `paginated-query.ts` TS2304 (`db`); `transform-helpers.ts` TS2552 ×2 plus TS18046 ×3; `query.ts` TS2304 (`db`); `transform.ts` TS2304 (`UserRecord`). The rough pre-gate census is ~443 tags, ~415 TypeScript fences, and at least 29 fences in 20 files with likely unbound application names. |

## `deno doc` boundary established

`deno doc --json` is the authoritative extractor input because it identifies actual JSDoc
`example` tags and the symbol declaration they document. It does not supply an exact source line
for each tag, and it does not compile tag contents. The gate therefore may use the existing fence
extractor on each JSON tag's `doc` string and report stable provenance as package/file + module or
symbol owner + example ordinal + fence-relative line. It must not invent a second general-purpose
JSDoc parser.

Passing every published TypeScript source file to `deno doc --json` (without `--private`) includes
module docs and locally exported documented symbols from files that actually ship, including the
pagination module example. A second index over declared package entrypoints maps a documented
symbol back to an exact public specifier for injection.

## jsr-audit surface scan

- Planned surface: JSDoc `@example` tags in TypeScript/TSX files selected by the publish rules of
  the 35 publishable `@netscript/*` members under `packages/**` and `plugins/**`.
- JSR risk: examples materially influence the rendered reference but are outside both `deno doc
  --lint` and source type-checking. A valid package export can therefore carry an invalid example.
- Export-map risk: a synthetic compiler must expose only declared exports from publishable members;
  otherwise an example could pass against a workspace-only or undeclared path.
- Slow-type risk: N/A to the tool's internal API. The leaf does not change published signatures,
  versions, or dependency declarations. Any JSDoc repairs remain subject to the existing doc-lint
  and publish dry-run gates.
- JSR score consequence: the plan extends F-5/F-7 evidence by compiling the examples; it does not
  replace `deno doc --lint` or `deno publish --dry-run`.

## Relevant doctrine and debt

- A1/A2: the documented consumer contract must be checked before implementation claims are trusted.
- A6/A7: reuse Deno and the checked-in docs compiler rather than create a parser/compiler stack.
- A8: keep publish discovery, example policy, compilation, and CLI wiring as separate concerns.
- A14: the missing compile check becomes a fitness function.
- F-5/F-7 are directly extended; F-6 remains independently required.
- Current package verdicts remain the measured Keep/Refactor rows in doctrine file 10. This leaf
  neither reclassifies packages nor deepens an existing architecture debt entry.
- No #1533-specific entry exists in `.llm/harness/debt/arch-debt.md`; the defect is fixed in-scope,
  not accepted as debt.

## Open questions to close in `plan.md`

- Exact published-file and JSDoc-tag selection contract.
- Symbol injection semantics and collision behavior.
- Reasoned exemption syntax and initial-corpus policy.
- First-run fix versus baseline policy before the failure count is known.
- Task, durable gate catalog, and CI placement.
