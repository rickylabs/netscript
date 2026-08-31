# Plan — #1466 `NetScriptProcedureMeta`

## Status and scope

- Base: `21d516224fe35e92957f0998ee848bbf2024eda0`
- Run: `.llm/runs/feat-sdk-procedure-meta--1466/`
- Issue: Closes #1466; Part of #1348
- RFC boundary: RFC 0001 Stage 1b only. Stage 2 metadata ports, contribution preparation, transport
  wiring, auth dogfood, and generic discovery are deferred to S3-S8.
- Archetype: Archetype 2 (Integration), the larger affected profile for `packages/sdk`; the
  `packages/contracts` portion remains Archetype 1 contract-only.
- Scope overlays: docs only to the extent required for the two package READMEs/JSDoc; no frontend,
  service, runtime, or release overlay.
- Doctrine verdict: Keep for both packages.
- PLAN-EVAL: **selected; implementation is blocked until separate-session PASS**.

### PLAN-EVAL cycle-1 transcription map

| Fix | Contract location                                                                                |
| --- | ------------------------------------------------------------------------------------------------ |
| A-1 | L2: exact `BaseContractMeta` spelling, annotation/alias use, public export.                      |
| A-2 | L3 and slice 2: fixed extractor pair, export sites, structural rule, `ActionMethod` marker.      |
| A-3 | Open-decision sweep and slice 1: all three rows resolved; runtime storage test contracted.       |
| A-4 | Public-surface delta: exact per-member additions and changed declarations.                       |
| A-5 | Gate set and risk register: named doc-JSON independence test under `test`.                       |
| A-6 | Gate set and risk register: assertion-budget tests and pinned baselines; review is not evidence. |
| A-7 | Slice 3 and gate set: exact eight-receipt table, `expectedGateIds`, supplemental-evidence rule.  |
| A-8 | `worklog.md` now exists with `## Design` before slice 1.                                         |

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
concrete `commonErrorMap`. Single-source generic position 4 in
`packages/contracts/src/application/contract-primitives.ts` as:

```ts
export type BaseContractMeta = NetScriptProcedureMeta & Record<never, never>;
```

Export `BaseContractMeta` from `packages/contracts/src/public/mod.ts`. Use that exact alias in the
explicit `baseContract` annotation and in generic position 4 of both `BaseContractRoute` and
`BaseContractOutputRoute`. Generic position 3 remains `BaseContractErrors` everywhere. No assertion
and no `any` may bridge the value to the annotation.

The positive contracts fixture asserts exact equality between `typeof baseContract['~orpc']['meta']`
and `BaseContractMeta`, not mere assignability. Position 4's canonical spelling is therefore
`NetScriptProcedureMeta & Record<never, never>` through the one public alias, while the concrete
error vocabulary stays independently fixed in position 3.

### L3 — metadata propagates through the existing exact-contract carrier

Mirror the existing input/output extractor pair exactly. In
`packages/sdk/src/ports/service-client.ts`, directly after `ProcedureOutputFromNode`, add:

```ts
export type ProcedureMetaFromNode<TNode> = TNode extends {
  readonly '~orpc': { readonly meta: infer TMeta };
} ? TMeta
  : Record<never, never>;
```

Export `ProcedureMetaFromNode` from `packages/sdk/src/ports/mod.ts` beside
`ProcedureInputFromNode`/`ProcedureOutputFromNode`; do not add it to the SDK root, which does not
re-export that pair. In `packages/sdk/src/ports/query-factory.ts`, beside `ProcedureInput` and
`ProcedureOutput`, add:

```ts
export type ProcedureMeta<
  TContract extends ContractLike,
  TAction extends ContractProcedureNames<TContract>,
> = ProcedureMetaFromNode<TContract[TAction]>;
```

Export `ProcedureMeta` wherever those two are exported: `packages/sdk/src/ports/mod.ts` and
`packages/sdk/src/query/mod.ts`. Add the type-only marker
`readonly __netscriptProcedureMeta?: ProcedureMeta<TContract, TAction>;` to `ActionMethod`, so a
query consumer can recover the exact metadata from the value's type alone.

The extractors are structural: SDK source imports neither `NetScriptProcedureMeta` nor anything else
from `@netscript/contracts`. `ContractProcedureLike`/`ContractProcedureMetadata` constraints stay
unchanged. Direct `ServiceClient<TContract>` continues to carry the exact source contract;
`defineServices` continues to map it into generated client/query declarations. The positive fixture
extracts exact metadata from `defineServices({...}).clients.x` through the existing contract marker
and from `defineServices({...}).queries.x.list` through the new `ActionMethod` marker. Do not
interpret runtime nodes or implement `ProcedureMetadataPort` in Stage 1b.

The metadata-specific diff introduces zero `as` assertions, zero `any`, and zero upstream public
types. Existing unrelated assertions remain baseline and are not copied.

### L4 — declaration generation has no CLI owner

Change source declarations only. Deno/TypeScript isolated-declaration emission is the declaration
generator; `packages/sdk/src/presets/define-services.ts` owns the mapped generated-client shape. No
CLI template, scaffold asset, embedded generated file, or checked-in generated client changes.

### L5 — fixtures consume shipped entrypoints

Positive and negative compile fixtures import `@netscript/contracts` and `@netscript/sdk` (or its
declared public subpaths), never `src/**`. Positive fixtures prove exact metadata and exact contract
errors across base routes, direct clients, `defineServices`, and query factories. Negative fixtures
use `@ts-expect-error` to reject invalid authentication literals and incompatible metadata shapes;
the fixture gate must fail if an expected error becomes non-erroring. Each expected error is on a
single-expression line, names the intended TypeScript diagnostic and reason, and has an immediately
preceding valid positive twin. Existing fixtures that import `src/**` are precedent only; this
stricter real-export rule applies to every new #1466 fixture. SDK tests resolve
`@netscript/contracts` by its workspace member name and may self-import declared SDK subpaths.

## Public-surface delta

- `@netscript/contracts`: **+3 exports** — `NetScriptAuthenticationRequirement`,
  `NetScriptProcedureMeta`, and `BaseContractMeta`; **3 changed declarations** — the `baseContract`
  annotation plus generic position 4 of `BaseContractRoute` and `BaseContractOutputRoute`.
- `@netscript/sdk`: **+2 types** — `ProcedureMetaFromNode` on `./ports`, and `ProcedureMeta` on both
  `./ports` and `./query`; **1 changed interface** — the `ActionMethod` metadata marker. The root
  `@netscript/sdk` export surface is unchanged.

## Open-decision sweep

| Decision                                            | Status   | Disposition                                                                                                                                         |
| --------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add a required metadata version discriminant        | resolved | No; conflicts with RFC `{}` normalization and additive ergonomics.                                                                                  |
| Re-export or inherit oRPC `Meta`                    | resolved | No; violates ownership and AP-14.                                                                                                                   |
| Runtime metadata reader/port in this slice          | resolved | No (R-1); Stage 2 owns `ProcedureMetadataPort`. Slice 1 adds only the runtime storage test for `baseContract['~orpc'].meta` and route `.meta(...)`. |
| Exact name/location of SDK metadata extractor       | resolved | R-2: `ProcedureMetaFromNode` in `ports/service-client.ts`; `ProcedureMeta` in `ports/query-factory.ts`; export sites and marker are fixed in L3.    |
| SDK imports `NetScriptProcedureMeta` from contracts | resolved | No; extract structurally with no `@netscript/contracts` SDK source dependency.                                                                      |
| CLI/generated artifact updates                      | resolved | None; declaration emission comes from package source.                                                                                               |
| New architecture debt                               | resolved | None planned; rescope on discovery.                                                                                                                 |

## Commit slices and Tier-A stops

1. **Contracts vocabulary + builder soundness**
   - Proves: public NetScript-owned metadata, typed `$meta` initialization, unchanged literal error
     map, positive/negative real-export contracts fixtures, and runtime storage without a metadata
     reader: `baseContract['~orpc'].meta` deep-equals `{}`, while a route derived with
     `.meta({ access: { authentication: 'required' } })` carries that value in `'~orpc'.meta`.
   - Files: `packages/contracts/src/domain/<metadata-file>.ts`,
     `packages/contracts/src/application/contract-primitives.ts`,
     `packages/contracts/src/public/mod.ts`, focused fixtures/tests including the contracts
     assertion-budget test and runtime storage test, `packages/contracts/README.md`, run artifacts.
   - Gate: focused structured check/test/lint/fmt, including the runtime storage test and contracts
     assertion-budget test; contracts doc lint; `quality:gate`; package JSR audit. Commit,
     explicit-refspec push, PR slice comment, then Tier-A stop.

2. **SDK declaration propagation**
   - Proves: direct client, `defineServices` generated client, and query-factory declarations retain
     exact metadata and exact error literals with no metadata-boundary assertion/`any`.
   - Files: `packages/sdk/src/ports/service-client.ts`, `packages/sdk/src/ports/query-factory.ts`,
     `packages/sdk/src/ports/mod.ts`, `packages/sdk/src/query/mod.ts`, the `ActionMethod` marker in
     the query-factory port, only the minimum mapped declaration files if needed, real-export type
     fixtures/tests including the SDK assertion-budget and doc-json independence tests,
     `packages/sdk/README.md`, run artifacts.
   - Gate: focused structured check/test/lint/fmt, including the SDK assertion-budget and doc-json
     independence tests; SDK doc lint; `quality:gate`; package JSR audit. A changed-line cast/`any`
     review is review only and explicitly is **not evidence**. Commit, explicit-refspec push, PR
     slice comment, then Tier-A stop.

3. **Publish and compatibility evidence**
   - Proves: both publishable members emit isolated declarations; their public export maps and exact
     `@netscript/*` pins pass audit; all acceptance fixtures and package suites pass.
   - Files: evidence/run artifacts and acceptance docs only; no feature expansion.
   - Gate: the exact eight-receipt set below at the final committed head; recompute sufficiency over
     those eight files only and name them in the slice report. Commit/push/comment, then Tier-A stop
     for separate-session IMPL-EVAL.

## Gate set

- Structured check wrapper scoped to `packages/contracts` and `packages/sdk` with `--unstable-kv`
  where applicable.
- Structured test wrapper for the contracted packages and real-export positive/negative type
  fixtures; narrower commands will be labeled narrow, not reported as full suites. The `test`
  catalog gate has three named obligations:
  - **Runtime metadata storage test (R-1):** assert `baseContract['~orpc'].meta` deep-equals `{}`
    and a route derived with `.meta({ access: { authentication: 'required' } })` stores that value
    in `'~orpc'.meta`, without adding a reader or port.
  - **Doc-JSON independence test (A-5):** run `deno doc --json` over `packages/contracts/mod.ts` and
    `packages/sdk/src/ports/mod.ts`; select `NetScriptProcedureMeta`,
    `NetScriptAuthenticationRequirement`, `BaseContractMeta`, `ProcedureMetaFromNode`, and
    `ProcedureMeta`; assert their JSON subtrees contain no `@orpc` or `npm:` string. This is the
    declaration-level independence proof.
  - **Assertion-budget tests (A-6):** `packages/contracts/tests/assertion-budget_test.ts` and
    `packages/sdk/tests/assertion-budget_test.ts` strip comments and string literals, count
    `\bas\s+` type-assertion tokens excluding `as const` plus angle-bracket casts, and require exact
    pinned equality. They also require zero imports in the new contracts metadata file and no `any`
    token outside comments in the four metadata-boundary files: contract primitives, the new
    metadata file, service-client port, and query-factory port.
    - Re-measured baselines at `a3452650d` (package sources unchanged from `9e70b30a3`):
      `contracts/src/application/contract-primitives.ts` = **0**; new contracts metadata file =
      **0**; `sdk/src/ports/service-client.ts` = **0**; `sdk/src/ports/query-factory.ts` = **0**;
      `sdk/src/presets/define-services.ts` = **1**; `sdk/src/client/service-client.ts` = **1**;
      `sdk/src/query/query-factory.ts` = **5**. The scan found zero angle-bracket casts. Before each
      test is committed, run its committed scanner at that slice head; any discrepancy from these
      planning baselines is a finding, not an automatic baseline adjustment.
- Structured lint and TypeScript-only format wrappers scoped to both packages.
- `deno task quality:gate` and `deno task arch:check`.
- Full-export public doc lint covering every contracts and SDK export entrypoint.
- Per-package `.llm/tools/fitness/audit-jsr-package.ts` for contracts and SDK, including public
  exports and exact `@netscript/*` pins.
- Isolated-declaration publish dry-run for both packages and the repository's canonical
  `publish:dry-run` if required by its package selection contract.
- Consumer import/type fixtures against real package specifiers.
- Separate-session IMPL-EVAL (mandatory).
- Durable evidence through `.llm/tools/gates/run-gate.ts`, actual committed-head equality, and no
  mismatch waiver. The final named set is exactly:

| # | File                         | `gateId`          | Invocation ID                | Invocation                                                                                                                                                                                                                 |
| - | ---------------------------- | ----------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | `check-final.json`           | `check`           | `1466-check-final`           | Root task (roots `packages` + `plugins`; includes the `_type.ts` fixtures).                                                                                                                                                |
| 2 | `lint-final.json`            | `lint`            | `1466-lint-final`            | Root task.                                                                                                                                                                                                                 |
| 3 | `fmt-check-final.json`       | `fmt-check`       | `1466-fmt-check-final`       | Root task (TS-only, `--ignore-line-endings`).                                                                                                                                                                              |
| 4 | `test-final.json`            | `test`            | `1466-test-final`            | Root task; includes assertion-budget, doc-json independence, and runtime storage tests.                                                                                                                                    |
| 5 | `public-doc-lint-final.json` | `public-doc-lint` | `1466-public-doc-lint-final` | `deno doc --lint` with every export entrypoint of both members as args: `packages/contracts/{mod,crud,query,transform}.ts`, `packages/sdk/mod.ts`, and its 11 subpath entrypoints from `packages/sdk/deno.json` `exports`. |
| 6 | `quality-gate-final.json`    | `quality-gate`    | `1466-quality-gate-final`    | Root task (`quality:scan` + `arch:check`).                                                                                                                                                                                 |
| 7 | `arch-check-final.json`      | `arch-check`      | `1466-arch-check-final`      | Root task; distinct ID because the plan contracts it separately.                                                                                                                                                           |
| 8 | `publish-dry-run-final.json` | `publish-dry-run` | `1466-publish-dry-run-final` | Workspace dry-run, with no `--member`.                                                                                                                                                                                     |

All eight files live under `.llm/runs/feat-sdk-procedure-meta--1466/receipts/`. `expectedGateIds` is
exactly
`["check", "lint", "fmt-check", "test", "public-doc-lint", "quality-gate", "arch-check",
"publish-dry-run"]`.
Supplemental evidence is not a receipt and is excluded from that named set:
`run-deno-doc-lint.ts --root <pkg> --output receipts/supplemental/doc-lint-{contracts,sdk}.json`,
`audit-jsr-package.ts --root <pkg> --out audit/{contracts,sdk}.json`, and any `--member` dry-run.
Slice 3 recomputes sufficiency over the eight named files only.

- Expensive gates: `scaffold.runtime`, `fresh-browser`, Aspire, and Docker are not applicable and
  will not run without explicit release.

## Risk register

| Risk                                                          | Mitigation                                                                                                                          |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `$meta` initialization widens `BaseContractErrors`            | Explicit generic positions; exact error-code/data assertions before and after every path.                                           |
| An assertion hides an upstream incompatibility                | Exact pinned assertion-budget tests under the receipted `test` gate; changed-line review is supplemental review only, not evidence. |
| Fixtures test internals rather than shipped declarations      | Package-specifier imports only; public export and doc-lint audit.                                                                   |
| Stage 1b grows into Stage 2 runtime interpretation            | Keep runtime metadata port and adapters deferred; rescope rather than implement.                                                    |
| Optional additive fields acquire incompatible semantics later | Lock names/literals now; new semantics require new field/type or semver-major.                                                      |
| Publish output leaks oRPC metadata types                      | Named `deno doc --json` independence test under the receipted `test` gate plus JSR audit.                                           |

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
