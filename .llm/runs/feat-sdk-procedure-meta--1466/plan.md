# Plan — #1466 `NetScriptProcedureMeta`

## Status and scope

- Base: `21d516224fe35e92957f0998ee848bbf2024eda0`
- Run: `.llm/runs/feat-sdk-procedure-meta--1466/`
- Issue: Closes #1466; Part of #1348
- RFC boundary: RFC 0001 Stage 1b only. Stage 2 metadata ports, contribution preparation,
  transport wiring, auth dogfood, and generic discovery are deferred to S3-S8.
- Archetype: Archetype 2 (Integration), the larger affected profile for `packages/sdk`; the
  `packages/contracts` portion remains Archetype 1 contract-only.
- Scope overlays: docs only to the extent required for the two package READMEs/JSDoc; no frontend,
  service, runtime, or release overlay.
- Doctrine verdict: Keep for both packages.
- PLAN-EVAL: **selected; implementation is blocked until separate-session PASS**.

## Locked decisions

### L1 — NetScript owns an additive semantic interface

Publish from the real `@netscript/contracts` root:

```ts
export type NetScriptAuthenticationRequirement =
  | 'none'
  | 'optional'
  | 'required';

export interface NetScriptProcedureMeta {
  readonly access?: {
    readonly authentication?: NetScriptAuthenticationRequirement;
  };
}
```

The interface contains no version discriminator. Versioning is additive-only optional readonly
fields under package semver; incompatible changes use new names/deprecation or semver-major.

### L2 — the oRPC adapter consumes the type without becoming its owner

Initialize the existing builder with `$meta<NetScriptProcedureMeta>({})`, then apply the existing
concrete `commonErrorMap`. Write an explicit publishable builder annotation whose third generic is
`BaseContractErrors` and fourth generic is `NetScriptProcedureMeta` (including any upstream-required
empty-record intersection produced by `$meta`). No assertion and no `any` may bridge the value to
the annotation.

Update `BaseContractRoute` and `BaseContractOutputRoute` only in generic position 4. Generic
position 3 remains `BaseContractErrors`.

### L3 — metadata propagates through the existing exact-contract carrier

Extend the NetScript-owned structural procedure declaration in
`packages/sdk/src/ports/service-client.ts` with a defaulted metadata generic and a public
procedure-metadata extractor. Direct `ServiceClient<TContract>` continues to carry the exact source
contract. `defineServices` continues to map the same exact contract into generated client/query
declarations. Query-factory/action declaration algebra derives metadata from the same procedure
node. Do not interpret runtime nodes or implement `ProcedureMetadataPort` in Stage 1b.

The metadata-specific diff introduces zero `as` assertions, zero `any`, and zero upstream public
types. Existing unrelated assertions remain baseline and are not copied.

### L4 — declaration generation has no CLI owner

Change source declarations only. Deno/TypeScript isolated-declaration emission is the declaration
generator; `packages/sdk/src/presets/define-services.ts` owns the mapped generated-client shape.
No CLI template, scaffold asset, embedded generated file, or checked-in generated client changes.

### L5 — fixtures consume shipped entrypoints

Positive and negative compile fixtures import `@netscript/contracts` and `@netscript/sdk` (or its
declared public subpaths), never `src/**`. Positive fixtures prove exact metadata and exact contract
errors across base routes, direct clients, `defineServices`, and query factories. Negative fixtures
use `@ts-expect-error` to reject invalid authentication literals and incompatible metadata shapes;
the fixture gate must fail if an expected error becomes non-erroring.

## Open-decision sweep

| Decision | Status | Disposition |
| --- | --- | --- |
| Add a required metadata version discriminant | resolved | No; conflicts with RFC `{}` normalization and additive ergonomics. |
| Re-export or inherit oRPC `Meta` | resolved | No; violates ownership and AP-14. |
| Runtime metadata reader/port in this slice | must resolve now in PLAN-EVAL | Proposed no; Stage 2 owns `ProcedureMetadataPort`. |
| Exact name/location of SDK metadata extractor | must resolve now in PLAN-EVAL | Use one documented public type adjacent to `ContractProcedureLike`; avoid a speculative runtime helper. |
| CLI/generated artifact updates | resolved | None; declaration emission comes from package source. |
| New architecture debt | resolved | None planned; rescope on discovery. |

## Commit slices and Tier-A stops

1. **Contracts vocabulary + builder soundness**
   - Proves: public NetScript-owned metadata, typed `$meta` initialization, unchanged literal error
     map, positive/negative real-export contracts fixtures.
   - Files: `packages/contracts/src/domain/<metadata-file>.ts`,
     `packages/contracts/src/application/contract-primitives.ts`,
     `packages/contracts/src/public/mod.ts`, focused fixtures/tests, `packages/contracts/README.md`,
     run artifacts.
   - Gate: focused structured check/test/lint/fmt; contracts doc lint; `quality:gate`; package JSR
     audit. Commit, explicit-refspec push, PR slice comment, then Tier-A stop.

2. **SDK declaration propagation**
   - Proves: direct client, `defineServices` generated client, and query-factory declarations retain
     exact metadata and exact error literals with no metadata-boundary assertion/`any`.
   - Files: `packages/sdk/src/ports/service-client.ts`,
     `packages/sdk/src/ports/query-factory.ts`, only the minimum mapped declaration files if needed,
     real-export type fixtures/tests, `packages/sdk/README.md`, run artifacts.
   - Gate: focused structured check/test/lint/fmt; SDK doc lint; `quality:gate`; package JSR audit;
     changed-line cast/`any` review. Commit, explicit-refspec push, PR slice comment, then Tier-A
     stop.

3. **Publish and compatibility evidence**
   - Proves: both publishable members emit isolated declarations; their public export maps and
     exact `@netscript/*` pins pass audit; all acceptance fixtures and package suites pass.
   - Files: evidence/run artifacts and acceptance docs only; no feature expansion.
   - Gate: durable distinct-invocation receipts at the committed head for the contracted full gate
     set; exact receipt filenames listed in the slice report. Commit/push/comment, then Tier-A stop
     for separate-session IMPL-EVAL.

## Gate set

- Structured check wrapper scoped to `packages/contracts` and `packages/sdk` with `--unstable-kv`
  where applicable.
- Structured test wrapper for the contracted packages and real-export positive/negative type
  fixtures; narrower commands will be labeled narrow, not reported as full suites.
- Structured lint and TypeScript-only format wrappers scoped to both packages.
- `deno task quality:gate` and `deno task arch:check`.
- Full-export `deno task doc:lint --root packages/contracts --pretty` and SDK equivalent.
- Per-package `.llm/tools/fitness/audit-jsr-package.ts` for contracts and SDK, including public
  exports and exact `@netscript/*` pins.
- Isolated-declaration publish dry-run for both packages and the repository's canonical
  `publish:dry-run` if required by its package selection contract.
- Consumer import/type fixtures against real package specifiers.
- Separate-session IMPL-EVAL (mandatory).
- Durable evidence through `.llm/tools/gates/run-gate.ts`, unique invocation IDs, actual committed
  head equality, no mismatch waiver, no repeated gate/receipt IDs.
- Expensive gates: `scaffold.runtime`, `fresh-browser`, Aspire, and Docker are not applicable and
  will not run without explicit release.

## Risk register

| Risk | Mitigation |
| --- | --- |
| `$meta` initialization widens `BaseContractErrors` | Explicit generic positions; exact error-code/data assertions before and after every path. |
| An assertion hides an upstream incompatibility | Zero new metadata-boundary `as`/`any`; quality scan plus changed-line review. |
| Fixtures test internals rather than shipped declarations | Package-specifier imports only; public export and doc-lint audit. |
| Stage 1b grows into Stage 2 runtime interpretation | Keep runtime metadata port and adapters deferred; rescope rather than implement. |
| Optional additive fields acquire incompatible semantics later | Lock names/literals now; new semantics require new field/type or semver-major. |
| Publish output leaks oRPC metadata types | NetScript declarations mention only NetScript types; declaration scan and JSR audit. |

## Deferred scope

- `ProcedureMetadataPort`, stable-v1 runtime node interpretation, metadata normalization adapters.
- SDK contribution descriptors, context/header algebra, transport preparation, retries and cache
  partitioning.
- Auth/locale dogfood, plugin discovery, CLI generation, oRPC dependency changes, oRPC v2.
- Any docs outside the two public package surfaces required by acceptance.

## Debt implications

No new or deepened debt is expected. The accepted contracts root `crud/` subpath debt is untouched.
Any need for an assertion, upstream-type re-export, generated artifact, or runtime port is a rescope
trigger, not accepted debt in this leaf.

## Contributor path

Future metadata owners add an optional readonly semantic field to `NetScriptProcedureMeta`, document
its ownership/absence behavior, extend real-export positive and negative fixtures, and consume it
through the SDK's NetScript-owned extractor. They do not touch the oRPC adapter unless storage or
reading mechanics change, and they never expose oRPC metadata types to consumers.
