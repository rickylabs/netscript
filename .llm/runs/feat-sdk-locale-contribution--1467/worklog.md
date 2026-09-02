# Worklog — locale SDK client contribution (#1467)

## Design

### Public surface

- `LocaleSdkClientContext`: optional locale request context.
- `createLocaleSdkClientContribution()`: fixed protocol/id/header/partition descriptor exported by
  `@netscript/sdk/client` and the existing root barrel.
- No new subpath, option on `createServiceClient`, or automatic attachment.

### Domain vocabulary

- Contribution id: `@netscript/sdk:locale`.
- Context key: `locale` (`optional`).
- Header owner: `accept-language`.
- Cache mode: `partitioned`; absent partition `default`, present partition canonical locale.

### Ports

Consumes the public `SdkClientContribution` contract and existing private prepared-call adapter
indirectly. Creates no port or adapter.

### Constants

The fixed id, header tuple, and default partition remain local module constants so their literal
types and runtime values cannot drift.

### Commit slices

One slice: public locale factory + focused acceptance tests + documentation + evidence. The slice is
small and shares one public entrypoint, so splitting would create an incomplete intermediate public
surface.

### Deferred scope

Language preference lists/q-values, direct-only locale mode, ambient locale discovery, automatic
attachment, and all transport/trace work.

### Contributor path

Start at `src/client/locale-contribution.ts` for the first-party pattern. New application-specific
headers continue to use `defineSdkClientContribution()`; only genuinely universal SDK-owned
contributions belong beside locale.

## Plan gate

`PLAN-EVAL: N/A` — issue `#1467` and the owner brief provide the implementation contract,
acceptance, boundaries, touch ceiling, and gate list.

## Evidence

- Baseline branch/HEAD verified: `feat/sdk-locale-contribution` at `77ad823dc...`, equal to
  `origin/main`.
- Baseline `deno.lock` SHA-256:
  `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`.
- Baseline SDK full-export doc lint: exit 1; 3 private-type-ref, 0 missing JSDoc, 0 other; `./client`
  clean.
- Focused locale/cache/README tests during implementation: 19 passed, 0 failed.
- Final SDK wrappers: check 0 (103 files, no diagnostics), lint 0 (103/103, no findings), fmt 0
  (103/103, no findings).
- Final SDK test wrapper: exit 0; 230 passed, 0 failed, 0 ignored.
- JSR audit: exit 0; publish dry-run OK; two pre-existing/advisory warnings (`src` cardinality and
  one slow-type warning).
- Full export doc lint A/B: baseline exit 1 with 3 private-type refs; final exit 1 with the same 3,
  0 missing JSDoc, 0 other. New diagnostics: 0. The `./client` entrypoint exits 0.
- `quality:gate`: exit 0. Separate `arch:check`: exit 0.
- Carrier generation, required order: `gen:agent-docs-prose` 0, `gen:assets-barrel` 0,
  `gen:publish-assets` 0, `gen:mcp-export-corpus` 0. After implementation commit
  `28e6ca75d80b6844dfe028a666650c5dff22d038`, all check forms exited 0 in required order:
  `check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets`, and
  `check:mcp-export-corpus`.
- MCP carrier package wrappers: check 0 (117 files), lint 0 (116/116), fmt 0 (116/116).
- CLI carrier package: check 0 (915 files). Lint/fmt wrappers exit 2 with zero findings because the
  workspace deliberately excludes `packages/cli/`; direct changed-file commands return no target.
  See `drift.md`; `check:assets-barrel` is the carrier authority.
- `git diff --check`: exit 0.
- Clean-tree `deno publish --dry-run`: SDK 0 (locale source listed), MCP 0 (export/publish carriers
  listed), CLI 0 (agent-docs carrier listed; seven existing dynamic-analysis warnings). Every run
  ended with `Success Dry run complete`.
- Final pre-commit `deno.lock` SHA-256 is unchanged:
  `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`.

## Acceptance map

- Header ownership/conflicts — `locale descriptor owns accept-language and canonicalizes one
  optional locale` and `locale duplicate ownership and reserved headers fail with deterministic
  descriptor ids`.
- Direct/query partition law — `direct locale calls prepare once across retry and stop before
  preparation when cancelled`, `locale cache keys are equal for the same locale and distinct for
  different locales`, and `locale keys use the declared partition function without preparing or
  reading headers`.
- Generated context inference — compile fixture
  `tests/type-fixtures/sdk-client-contributions-rfc_type.ts`, including two-way context
  assignability and a negative generated-client call.
- Composition/retry/cancellation/redaction — `locale composes with auth-shaped headers in either
  declaration order`, the direct-call test above, invalid-input preparation diagnostics, and
  `locale descriptor remains valid at the unknown runtime boundary`.
- Auth plus non-auth docs — `README.md` and `docs/site/services-sdk/sdk.md`; README doctest exits as
  part of the 230-test SDK suite.

## Exact touch set before commit

- Product/docs: `packages/sdk/src/client/locale-contribution.ts`,
  `packages/sdk/src/client/mod.ts`, `packages/sdk/tests/locale-contribution_test.ts`,
  `packages/sdk/tests/client-contribution-cache-query_test.ts`,
  `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts`,
  `packages/sdk/tests/readme-doctest_test.ts`, `packages/sdk/README.md`, and
  `docs/site/services-sdk/sdk.md`.
- Generated carriers: `.llm/assets/agent-docs/prose.json.gz`,
  `.llm/assets/agent-docs/provenance.json`,
  `packages/cli/src/kernel/assets/agent-docs.generated.ts`,
  `packages/mcp/src/publish-assets.generated.ts`, and
  `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`.
- Harness: this run directory's `supervisor.md`, `research.md`, `plan.md`, `implement.md`,
  `worklog.md`, `context-pack.md`, and `drift.md`.

`packages/sdk/src/internal/client-contributions/prepared-call.ts` was read for audit/test reuse but
was not edited. No trace/observability surface was edited.

## 2026-09-02 CI documentation repair

- Verified the clean local and remote branch at `a628de1a54d7babba35385b604ba99b33ffc9277`
  after `origin/main` `634b83d647c37f60f24a57839333f16c7cc61f12` was integrated; `git pull
  --ff-only origin feat/sdk-locale-contribution` reported `Already up to date`.
- `PLAN-EVAL: N/A` remains appropriate: the coordinator supplied both exact failing examples,
  root causes, boundaries, and proving gates; this is a mechanical repair with no reopened SDK
  design decision.
- Before repair, `deno task docs:jsdoc-examples` exited 1 at 359 examples with
  `deferredCensus={"unboundName":117,"typeError":14}` and zero enforced failures. After binding
  `createServiceClient` from `@netscript/sdk/client` plus a real oRPC/Zod contract, it exits 0 with
  `deferredCensus={"unboundName":116,"typeError":14}`.
- Before repair, `deno task docs:snippets` exited 1 at 597 scanned / 302 TypeScript-like / 24
  checked fences because `./contracts/accounts.ts` had no materialized module. The example is now
  self-contained with an inline oRPC/Zod `accountsContract`, keeping the entire auth + locale
  composition copyable in one fence; the same gate exits 0 with unchanged counts.
- SDK wrapper evidence after repair: check exit 0 (103 files, zero diagnostics); tests exit 0
  (230 passed, 0 failed, 0 ignored).
- Carrier generation in required order: `gen:agent-docs-prose` 0 (docs source format OK, rendered
  output OK, 642 site files), `gen:assets-barrel` 0, `gen:publish-assets` 0,
  `gen:mcp-export-corpus` 0 (35 packages, 272 subpaths, 7,809 symbols).
- Repair touch set before commit: authored files
  `packages/sdk/src/client/locale-contribution.ts` and `docs/site/services-sdk/sdk.md`; generated
  carriers `.llm/assets/agent-docs/prose.json.gz`, `.llm/assets/agent-docs/provenance.json`,
  `packages/cli/src/kernel/assets/agent-docs.generated.ts`,
  `packages/mcp/src/publish-assets.generated.ts`, and
  `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`; harness
  evidence in this run's `worklog.md`, `context-pack.md`, and `drift.md`.
- `deno.lock` SHA-256 before and after the repair gates/generation remains
  `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`.
- Post-commit carrier checks are pending the repair commit, as required by the coordinator.
