# Worklog: SDK reference contribution example

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-sdk-reference-contribution-example--1349` |
| Branch | `docs/sdk-reference-contribution-example` |
| Archetype | N/A — consumer documentation only |
| Scope overlays | `docs` |

## Design

### Public Surface

- `CreateServiceClientOptions.contributions` — documented option accepting the literal tuple.
- `SdkClientContribution` — documented six-field descriptor contract.
- `defineSdkClientContribution` / `createServiceClient` — public factories used by the example.

### Domain Vocabulary

- `tenantId` — required per-call context field and non-secret cache partition for the example.
- `x-tenant-id` — lower-case header exclusively owned by the example contribution.

### Ports

- None introduced; documentation describes the existing public contribution seam.

### Constants

- None introduced; finite protocol values are shown directly as part of the public descriptor shape.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Reference surface, compiling example, run evidence, and generated carriers | docs gates plus carrier cascade/checks | `docs/site/reference/sdk/index.md`, run dir, generated carriers |

### Deferred Scope

- Guide narrative and auth/locale examples remain in `docs/site/services-sdk/sdk.md`.
- Package implementation and exports are already landed and are not reopened here.

### Contributor Path

A reader starts at the service-client reference, scans the six descriptor fields, then copies the
tenant-header example and replaces its context/header/cache declaration with the application's own.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-02 | 1 | design | `PLAN-EVAL: N/A` recorded before implementation: #1349 supplies the exact one-page contract, boundaries, and gates. |
| 2026-09-02 | 1 | author | Antigravity `gemini-3.6-flash-low` authored the section; the same session corrected its first server-handler example to the required `@orpc/contract` surface. |
| 2026-09-02 | 1 | gate | Docs snippets and JSDoc examples passed; deferred `unboundName` remained 116. |
| 2026-09-02 | 1 | generate | Required four-step carrier cascade completed with exit 0 for every generator. |
| 2026-09-02 | 1 | slice review | Supervisor compared every public claim with `deno doc`, confirmed the example's cache policy matches its varying tenant header, and inspected the generated-carrier diff. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Partition the cache by tenant | The request header varies by tenant, so invariant caching would be dishonest. | Public `SdkClientResponseCache` contract and guide policy. |
| Use direct client composition | It is the exact option surface the reference must demonstrate. | Issue #1349 docs/consumer proof. |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| README count is 18 rather than carried-in 14 | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Docs snippets | `deno task docs:snippets` | PASS | Exit 0; 600 scanned, 305 TS-like, 25 checked, 0 malformed. |
| JSDoc examples | `deno task docs:jsdoc-examples` | PASS | Exit 0; 358 checked, 0 failures, `unboundName=116`. |
| `gen:agent-docs-prose` | `deno task gen:agent-docs-prose` | PASS | Exit 0; site build and rendered-output checks passed. |
| `gen:assets-barrel` | `deno task gen:assets-barrel` | PASS | Exit 0. |
| `gen:publish-assets` | `deno task gen:publish-assets` | PASS | Exit 0. |
| `gen:mcp-export-corpus` | `deno task gen:mcp-export-corpus` | PASS | Exit 0; 35 packages, 273 subpaths, 7815 symbols. |
| Post-commit carrier checks | matching `check:*` tasks | NOT_RUN | Must run after the slice commit on a clean tree. |
| Evidence mirror | prescribed dry-run | NOT_RUN | Pending PR creation. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Source alignment | PASS | `deno doc` for options, descriptor, id, context declaration, cache policy, and request patch | Every stated field and union matches the published client entrypoint. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Runtime behavior | N/A | Docs-only slice | Aspire, Docker, browser, and E2E are prohibited. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Copyable docs snippet | PASS | `docs:snippets`, exit 0 | All imports and values are bound; no `any` or `declare`. |

## Handoff Notes

- Post-commit checks, evidence mirror, and separate-session IMPL-EVAL remain.
