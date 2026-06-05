# Worklog: S1 / Wave 0 Foundation (@netscript/shared)

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `feat-package-quality-wave0-foundation--shared` |
| Branch | `feat/package-quality-wave0-foundation` |
| Archetype | `A1 - small-contract` |
| Scope overlays | `docs` |

## Design

### Public Surface

- `mod.ts` remains the only published root entry point and becomes a barrel-only manifest.
- `baseContract` stays published for plugin service contracts that already compose on it.
- Pagination contracts: offset/cursor input, query, and metadata schemas plus explicit data types.
- Error contracts: common oRPC error schemas and explicit data types for not found, validation, auth, rate limit, and service unavailable errors.
- Response contracts: `SuccessSchema` and `SuccessResponse`.
- Zod helper contract: only the shared validation helpers/codecs needed by current contracts and plugin contract authors remain published from the root surface.
- Diagnostics: `inspectShared(target): InspectionReport` plus `InspectionReport` / `InspectionStatus`.
- `./utils` is removed from the package export map and publish include set. The old `utils/` files remain unpublished for current workspace import-map consumers in later waves.

### Domain Vocabulary

- `InspectionReport` - JSON-stable diagnostic report for small contract surfaces.
- `InspectionStatus` - finite inspection result values: `ok`, `warning`, `error`.
- `SharedInspectionTarget` - inspectable inputs accepted by `inspectShared`.
- `OffsetPaginationInput`, `OffsetPaginationQuery`, `OffsetPaginationMeta` - offset pagination vocabulary.
- `CursorPaginationInput`, `CursorPaginationQuery`, `CursorPaginationMeta` - cursor pagination vocabulary.
- `PaginationInput`, `PaginationQuery`, `PaginationMeta` - alpha canonical aliases represented as explicit object types, not inferred Zod aliases.
- `NotFoundError`, `ValidationError`, `RateLimitError`, `UnauthorizedError`, `ForbiddenError`, `ServiceUnavailableError` - common contract error payloads.
- `SuccessResponse` - common success envelope.
- `BaseContract` - structural oRPC contract primitive used by plugins.
- `NotFoundOptions` - options for throwing a typed `NOT_FOUND` oRPC error.
- `IntegerSchemaOptions`, `DefaultedIntegerSchemaOptions`, `StringSchemaOptions`, `BoundedStringSchemaOptions` - validation helper option bags.

### Ports

- None. `@netscript/shared` remains a small contract package with no external I/O port.

### Constants

- `INSPECTION_STATUS` - `ok`, `warning`, `error`.
- `COMMON_ERROR_CODES` - `NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, `SERVICE_UNAVAILABLE`.
- `DEFAULT_INTEGER_MAX` - `2147483647`.
- `DEFAULT_PAGINATION_LIMIT` - `10`.
- `DEFAULT_PAGINATION_LIMIT_MAX` - `1000`.
- `DEFAULT_PAGINATION_OFFSET` - `0`.

### Commit Slices

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 1 | Establish harness artifacts and package design checkpoint with current baseline and drift. | `git status --short`; baseline commands already run | `.llm/tmp/run/feat-package-quality-wave0-foundation--shared/{worklog,context-pack,drift,commits}.md` |
| 2 | Move the published shared contract to `src/domain`, `src/application`, `src/diagnostics`, and `src/public`; remove inferred public Zod types and clear slow-types/doc lint. | `deno publish --dry-run --allow-dirty`; `deno doc --lint packages/shared/mod.ts`; `deno test --allow-all packages/shared` | `packages/shared/{mod.ts,deno.json}`, `packages/shared/src/**` |
| 3 | Write alpha README and `/docs` structure; satisfy standards gate and record final gates. | `deno run --allow-read tools/fitness/check-netscript-standards.ts --root packages/shared --text`; full requested gate set | `packages/shared/README.md`, `packages/shared/docs/**`, run artifacts |

### Deferred Scope

- Consumer migration from `@shared/utils` import-map aliases is deferred to later waves because it requires `plugins/sagas` and `plugins/workers` edits outside Wave 0.
- Deleting the old `packages/shared/utils/` tree is deferred until those consumers move. The tree is removed from published exports/includes in this wave.
- Full datetime helper deletion is deferred with the same consumer-migration constraint; no new published datetime surface is added.
- Root scaffold imports still mention `jsr:@netscript/shared@^1.0.0` in CLI code outside this surface; that remains a later-wave correction.

### Contributor Path

To add a new shared primitive, add its explicit public data type and schema to `src/domain/`, export it through `src/public/mod.ts`, add a grouped named re-export in root `mod.ts`, document it in `docs/reference/`, and run the shared publish, doc lint, standards, and package tests gates.

## Progress Log

| Time | Slice | Step | Notes |
|------|-------|------|-------|
| 2026-06-05 04:44 UTC | baseline | release readiness | `deno run -A tools/fitness/release-readiness.ts --out ./audit --include-plugins` generated `./audit/_summary.md`; summary reported `Ready: 0/27`. |
| 2026-06-05 04:45 UTC | baseline | publish dry-run | `deno publish --dry-run --allow-dirty` in `packages/shared` failed with 35 slow-type problems. |
| 2026-06-05 04:55 UTC | design | checkpoint | Current tree verified before source edits; design narrows published surface and defers cross-wave consumer migration. |

## Decisions

| Decision | Reason | Source |
|----------|--------|--------|
| Remove `./utils` from the published export map but keep the files unpublished for now. | Deleting the path would require plugin import-map edits outside the Wave 0 surface and would break the final workspace check. | `plugins/{sagas,workers}/deno.json`; supervisor boundary |
| Replace public `z.infer` aliases with explicit object types. | `deno doc --lint` reports private `output` type references for inferred Zod public aliases. | `deno doc --lint packages/shared/mod.ts` |
| Keep `baseContract` as a published root symbol. | Existing plugin contracts compose from it through `@netscript/shared`; removing it would be cross-wave breakage. | plugin contract imports |
| Do not publish datetime helpers. | Doctrine identifies `utils/datetime.ts` as AP-2/AP-1 debt; current consumers do not require it through the package root. | doctrine 04/10; consumer scan |

## Drift

| Drift | Severity | Logged in drift.md |
|-------|----------|--------------------|
| Doctrine skill path pointed at `.llm/research/...`; current repo doctrine lives in `docs/architecture/doctrine/`. | minor | yes |
| `release-readiness.ts --out ./audit` produced only `_summary.md` detail links in this worktree, not the JSON detail files it listed. | minor | yes |
| Stale package facts said version `1.0.0`; current package is already `0.0.1-alpha.0`. | minor | yes |
| Current workspace has `@shared/utils` aliases in plugin import maps, so deleting `packages/shared/utils/` would exceed Wave 0. | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
|------|------------------|--------|-------|
| Baseline re-audit | `deno run -A tools/fitness/release-readiness.ts --out ./audit --include-plugins` | PASS | Generated `./audit/_summary.md`; `Ready: 0/27`. |
| Baseline publish | `cd packages/shared; deno publish --dry-run --allow-dirty` | FAIL | 35 slow-type problems. |
| Baseline doc lint | `deno doc --lint packages/shared/mod.ts` | FAIL | 106 documentation lint errors. |
| Baseline standards | `deno run --allow-read tools/fitness/check-netscript-standards.ts --root packages/shared --text` | FAIL | `strict` missing; README/docs/barrel/test warnings. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
|------|--------|----------|-------|
| F-1 | FAIL | `utils/datetime.ts` is 1,112-line doctrine debt in current baseline. | Published surface will stop including it. |
| F-5 | FAIL | `deno doc --lint packages/shared/mod.ts` | Missing docs, private Zod inferred types. |
| F-6 | FAIL | `deno publish --dry-run --allow-dirty` | 35 slow-types. |
| F-7 | FAIL | `deno doc --lint packages/shared/mod.ts` | Documentation lint not clean. |
| F-8 | PASS | Root compiler options include `deno.unstable`; package has no override yet. | Will keep package override aligned if added. |
| F-10 | WARN | Current `utils/datetime.test.ts` is an inline script-style test. | Package tests must still pass; test relocation deferred unless needed. |
| F-11 | WARN | Current `utils/` folder exists. | Removed from published surface; physical deletion deferred for consumer migration. |
| F-12 | WARN | Standards naming warnings on legacy helpers. | Published surface will avoid datetime helper names. |
| F-14 | WARN | `utils/datetime.test.ts` uses `console.*`. | Unpublished legacy test debt. |
| F-15 | PASS | No upstream package re-export found in the intended public surface. | Re-check after slice 2. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
|------|--------|----------|-------|
| Runtime | N/A | A1 small contract | No runtime behavior. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
|----------|--------|----------|-------|
| Workspace imports | NOT_RUN | Deferred until final `deno task check`. | Must remain green despite unpublished `utils/` retention. |

## Handoff Notes

- Evaluator should inspect the published export map first: `./utils` is intentionally removed from package exports, while the physical legacy folder remains as unpublished workspace compatibility for later-wave consumers.
