# S3 evidence — reference-export-drift-gate

## Attestation

- Immutable implementation head: `47ca22abe94b9d2e54d3778edc8944094b227886`
- Frozen base: `baf1cdf67a4e931af17b4772ddf6101f36152184`
- Receipt directory: `receipts/s3/`
- Evidence-set result: `SUFFICIENT`; seven expected gate IDs, seven unique receipts, no missing,
  duplicate, nonterminal, non-PASS, or Git-head mismatch reasons.
- S3 changes run artifacts only. No implementation path was edited after the attested head.

## Durable receipts

| Gate                 | Outcome | Raw exit | Selection / notable result                                                          |
| -------------------- | ------- | -------: | ----------------------------------------------------------------------------------- |
| `check`              | PASS    |        0 | 2,924 files, 25 batches, 0 findings                                                 |
| `test`               | PASS    |        0 | 4,203 passed, 0 failed, 19 ignored; 4,222 total results                             |
| `quality-job`        | PASS    |        0 | Composite completed; existing dependency-catalog warnings retained in receipt       |
| `arch-check`         | PASS    |        0 | Doctrine failures 0; existing WARN/INFO findings retained                           |
| `docs-source-format` | PASS    |        0 | Ran from `docs/site`; `Docs source format: OK`                                      |
| `docs-accuracy`      | PASS    |        0 | Named drift task reached through aggregate; existing TanStack peer warning retained |
| `publish-dry-run`    | PASS    |        0 | Workspace static simulation completed; 318,629 bytes of member/file output reviewed |

The publish dry-run is only static packaging and isolated-declaration evidence. It does not prove a
real publish, remote registry graph, install, or production behavior, and no publish was attempted.

## Focused drift evidence

- `deno task docs:exports-drift`: raw exit 0; all eight packages printed mode, reason, omitted-group
  count, and documented-non-export-group count; terminal PASS.
- Focused checker test: raw exit 0; 6 passed, 0 failed. Empty/malformed reason, unknown mode,
  invented symbol, and omitted symbol all exercised the injectable fail-closed seam.

## JSR audit

| Concern              | Contracts                                                     | Fresh UI reference subject                                                                  |
| -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Audit command        | raw exit 0                                                    | raw exit 0                                                                                  |
| Member/version       | `@netscript/contracts@0.0.6`                                  | `@netscript/fresh-ui@0.0.6`                                                                 |
| Export map           | `.`, `/crud`, `/query`, `/transform`                          | `.`, `/ai/render-ui`, `/desktop`, `/interactive`, `/primitives`, `/registry`                |
| Exact internal pins  | Exactly zero `@netscript/*` imports                           | Exactly two: `sdk/auto-update` and `sdk/desktop`, both `jsr:@netscript/sdk@0.0.6/...`       |
| Publish delta        | Four shipped JSDoc files; no runtime/type/export/schema delta | No package-member delta; reference/checker only                                             |
| Dry-run finding      | One sanctioned oRPC slow-type INFO; member dry-run OK         | Existing `registry/lib`, cardinality, and slow-type WARN findings; member dry-run OK        |
| Full-export doc lint | **RED, raw exit 1:** 9 `private-type-ref`, 0 missing JSDoc    | **RED, raw exit 1:** 123 total on `/interactive`: 96 `private-type-ref`, 27 `missing-jsdoc` |

The Contracts publish-file output includes all four edited JSDoc files:

- `src/application/paginated-query.ts`
- `src/application/transform-helpers.ts`
- `schemas/filters.ts`
- `schemas/pagination.ts`

Contracts `/query` and `/transform` doc-lint are clean; the combined baseline red remains eight
findings in `contract-primitives.ts` and one in `create-crud-contract.ts`. Fresh UI's other five
entrypoints are clean; all 123 baseline diagnostics are attributed to `/interactive`. These are
pre-existing out-of-scope reds, not passes or waivers.

`deno task deps:why @netscript/sdk` returned raw exit 0 with `sourceUsed: true`, 60 source hits,
`likelyDeadImport: false`, and `fullyRemovable: false`.

## Thirteen-path and lock audit

- Frozen authorized implementation contract: 13 paths.
- Changed implementation paths from base through attested head: 10, all authorized.
- Committed non-implementation changes: run artifacts only.
- Unauthorized paths: none.
- Direct forbidden-surface diff: raw exit 0 for `docs/exports`, `deno.lock`, Contracts/Fresh UI
  member configs, Contracts public export barrel, and `packages/prisma-adapter-mysql`.
- `deno.lock` base blob: `a1522e6ecc98dd4232312385b0cea4e52f5fa4b2`.
- `deno.lock` attested-head blob: `a1522e6ecc98dd4232312385b0cea4e52f5fa4b2`.
- `deno.lock` working-tree blob: `a1522e6ecc98dd4232312385b0cea4e52f5fa4b2`.
- Package export maps, versions, dependency pins, and MySQL paths are untouched.

## Honest non-gate diagnostics and prohibited gates

- `run-gate.ts --help`: raw exit 1 (`Unknown argument --help`); no gate fired and no receipt was
  inferred. The checked-in argument contract and catalog were read before valid invocations.
- `fresh-browser`: `NOT_RUN`, N/A / waived; no runtime lease exists or was requested.
- Aspire, Docker, browser, `e2e:cli`, scaffold/runtime/service smokes, resource cleanup, real
  publish, merge, ready transition, relabel, issue closure, milestone mutation, and central-state
  mutation: `NOT FIRED`.

## Handoff

The implementation author does not self-certify. The coordinator owns final substantive review,
separate-session IMPL-EVAL, readiness, and merge decisions.
