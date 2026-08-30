# Research — #1466 `NetScriptProcedureMeta`

## Baseline and citation drift

- Worktree: `/home/codex/repos/netscript-007-features-1466`
- Branch: `feat/sdk-procedure-meta`
- Current base: `21d516224fe35e92957f0998ee848bbf2024eda0` (`main`, PR #1696 merged)
- Original brief base: `5bb112dd35f94fc8435672e2cabff1f9a447aa0b`
- Re-baseline: the supervisor moved the clean worktree before Phase 1 landed. A focused
  `git diff 5bb112dd3..21d516224 -- packages/contracts packages/sdk` is empty, so no source facts
  changed; every citation below was nevertheless re-read at `21d516224`.
- Starting state: clean tree, no implementation commits, no upstream branch by design.

## Finding 1 — the repaired error channel is a four-link type chain

At this base, `baseContract` is not inferred from a widened `ReturnType<typeof oc.errors>`. Its
annotation supplies the concrete error object as the type argument to `oc.errors`, retaining each
literal code, status, message, and data schema
(`packages/contracts/src/application/contract-primitives.ts:27-58,120-167`):

```ts
type CommonErrorMap = Readonly<{
  NOT_FOUND: Readonly<{
    status: 404;
    message: 'Resource not found';
    data: typeof notFoundErrorSchema;
  }>;
  VALIDATION_ERROR: Readonly<{
    status: 422;
    message: 'Validation failed';
    data: typeof validationErrorSchema;
  }>;
  // UNAUTHORIZED | FORBIDDEN | RATE_LIMITED | SERVICE_UNAVAILABLE likewise
}>;

export const baseContract: ReturnType<
  typeof oc.errors<Readonly<{
    NOT_FOUND: Readonly<{
      status: 404;
      message: 'Resource not found';
      data: ContractObjectSchema<NotFoundError, NotFoundError>;
    }>;
    // remaining concrete entries
  }>>
> = oc.errors(commonErrorMap);
```

The route aliases explicitly thread that exact map through oRPC's third builder generic; their
fourth generic is currently empty metadata
(`packages/contracts/src/application/contract-primitives.ts:178-245`):

```ts
export type BaseContractErrors =
  MergedErrorMap<Record<never, never>, typeof commonErrorMap>;

export type BaseContractRoute<TIn extends AnySchema, TOut extends AnySchema> =
  ContractProcedureBuilderWithInputOutput<
    TIn,
    TOut,
    BaseContractErrors,
    Record<never, never>
  >;
```

The SDK then infers `TErrorMap` from the real procedure marker and maps its literal keys into a
defined-error union (`packages/sdk/src/ports/service-client.ts:184-209`):

```ts
TContract extends { readonly '~orpc': {
  readonly errorMap: infer TErrorMap extends Record<
    string,
    { readonly data?: unknown } | undefined
  >;
} }
  ? { [K in keyof TErrorMap]: K extends string
      ? Error & {
          readonly defined: true;
          readonly code: K;
          readonly status: number;
          readonly data: ContractSchemaOutput<TErrorMap[K]['data']>;
        }
      : never }[keyof TErrorMap] | Error
  : Error
```

`ServiceClientMethod` places that union on the promise's structural `__error.type` marker
(`packages/sdk/src/ports/service-client.ts:168-171`). `safe()` infers `TError` from that marker and
`SafeFailure<TError>` uses `Extract`/`Exclude` around the defined-error shape, so narrowing
`isDefined` preserves the exact `code` and matching data payload
(`packages/sdk/src/client/errors.ts:36-130,165-193`):

```ts
export type ServiceClientMethod<TInput, TOutput, TError = Error> = (
  input: TInput,
  options?: ServiceRequestOptions,
) => Promise<TOutput> & { __error?: { type: TError } };

type NarrowDefined<TError> = Extract<TError, DefinedErrorLike> & DefinedError;

export async function safe<TOutput, TError = Error>(
  promise: Promise<TOutput> & { __error?: { type: TError } },
): Promise<SafeResult<TOutput, TError>>;
```

The metadata change must therefore leave `BaseContractErrors` in generic position 3, change only
generic position 4, and keep `ServiceClientShape`'s `errorMap` inference intact.

## Finding 2 — oRPC metadata is an adapter mechanism, not NetScript vocabulary

The locked oRPC family is `@orpc/contract@1.14.6` (`deno.lock:123,1611`). Its public declaration
defines `Meta = Record<string, any>`, `ContractProcedureDef<..., TMeta>.meta: TMeta`,
`ContractBuilder.$meta<U extends Meta>(initialMeta: U)`, and every procedure builder carries
`TMeta` as generic position 4
(`/home/codex/.cache/deno/npm/registry.npmjs.org/@orpc/contract/1.14.6/dist/shared/contract.TuRtB1Ca.d.mts:54,192-208`;
`.../dist/index.d.mts:43-166,203-244`). Runtime `$meta()` stores the initial value and `.meta()`
merges it (`.../dist/index.mjs:127-142,174-190`).

Reviewable independence rule:

> `NetScriptProcedureMeta` and its nested public types may import, extend, alias, re-export, or
> mention no `@orpc/*` symbol and no upstream `Meta`/metadata accessor. Only the existing private
> contract-builder integration may pass the NetScript-owned structural type as oRPC's fourth
> generic and initialize it with `$meta`. A reviewer rejects `extends Meta`, `type X =
> InferContractRouterMeta<...>`, an upstream re-export, or any assertion (`as ...`) that bridges an
> incompatible NetScript shape to oRPC.

This is structural independence, not a ban on the already-public oRPC builder type of
`baseContract`: the semantic type stands alone and the adapter consumes it without inheritance or
assertion.

## Finding 3 — the three consumption paths

1. **Direct clients** — `packages/sdk/src/client/service-client.ts:41-65` returns
   `ServiceClient<TContract>`. `packages/sdk/src/ports/service-client.ts:48-91,168-219` owns the
   structural procedure marker, schema/error inference, and the compile-time source-contract
   marker. Today `ContractProcedureMetadata` models `inputSchema` and `outputSchema`, but not the
   upstream `meta` field. The change is to add a NetScript-owned metadata generic/extractor to this
   structural algebra while preserving `TContract` and the existing error inference; the metadata
   path itself must introduce no assertion or `any`.

2. **Generated clients** — the term means the mapped client declarations returned by
   `defineServices`, not a checked-in SDK-client source generator.
   `packages/sdk/src/presets/define-services.ts:22-99` maps each literal config's `TContract` to
   `ServiceClient<TContract>`, `QueryFactory<TContract>`, and `ServiceQueryUtils<TContract>`.
   Because the exact contract is already the carrier, metadata should flow through these mapped
   declarations once the structural procedure algebra knows it. The implementation must prove the
   root `defineServices` export with a real package import.

3. **Query factories** — `packages/sdk/src/query/query-factory.ts:41-46,197-230` accepts and returns
   the same `TContract`; `packages/sdk/src/ports/query-factory.ts:26-37,42-127` derives each action
   from its procedure node. Today it derives only input/output and exposes no NetScript metadata
   extractor/carrier. The change is declaration-level propagation from the procedure node into the
   public query-factory/action algebra. It must not add an assertion at the metadata boundary; the
   existing implementation assertions are baseline debt, not a pattern this slice may extend.

## Finding 4 — declaration output ownership

No checked-in generated SDK client file or CLI client-declaration generator owns this slice.
Repository search finds `defineServices()` as the SDK's generation surface; CLI templates generate
contracts/services, not an SDK client declaration. The declaration output that must change is the
JSR/TypeScript declaration emitted from real exports in:

- `packages/contracts/src/application/contract-primitives.ts` and `src/public/mod.ts`;
- `packages/sdk/src/ports/service-client.ts`;
- `packages/sdk/src/ports/query-factory.ts`; and
- `packages/sdk/src/presets/define-services.ts` (mapped generated-client declarations).

The owning "generator" is therefore Deno/TypeScript isolated-declaration emission over those
sources, with `defineServices.ts` owning the mapped generated-client shape. No CLI/scaffold
generator or generated artifact should change in Stage 1b.

## Finding 5 — public shape and versioning commitment

RFC 0001 Stage 1b specifies these root `@netscript/contracts` exports
(`rfcs/0001-sdk-client-contributions.md:347-369,1273-1278`):

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

The versioning commitment is **additive-only metadata under package semver**, not a required
version discriminant. All top-level and nested fields are readonly and optional; missing metadata
remains `{}` as the RFC requires. S3-S8 may add new optional, semantically owned fields, but may not
rename/reinterpret existing fields or widen the three authentication literals incompatibly.
Incompatible semantics require a new field/type name and deprecation path (or a package semver-major
change), not a silent reinterpretation. A required `version: 1` would contradict `{}` normalization
and impose ceremony on every contract, so this slice does not add one.

Cost to S3-S8: they inherit stable names and additive-only evolution, must tolerate absent future
fields, and must not use oRPC types in their public protocol. The benefit is that later oRPC-major
adapters can synthesize the same NetScript descriptor without changing consumers.

## Publish-surface and debt observations

- `packages/contracts` is Archetype 1/Keep; `packages/sdk` is Archetype 2/Keep. This run uses
  Archetype 2 as the larger affected profile and preserves contracts as a contract-only dependency
  (`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:24-53`).
- Both packages are publishable. Public additions require JSDoc, full-export doc lint, exact
  `@netscript/*` pin audit, package JSR audit, and isolated-declaration dry-run.
- Relevant existing debt: the accepted root `packages/contracts/crud` subpath layout; no SDK debt
  entry governs this change. No new/deepened debt is planned.

## Proposed determinations

### PLAN-EVAL: selected

This is decision-heavy: it defines a stable public vocabulary inherited by six dependent p1
slices, changes declarations in two publishable packages, and must preserve a repaired conditional
error union while crossing an upstream generic whose own `Meta` constraint contains `any`.
PLAN-EVAL should run in a fresh native opposite-family Fable 5 medium session and is a hard stop
before implementation.

### Expensive gates: not required

Do not request `scaffold.runtime` or `fresh-browser`. Stage 1b changes no CLI/scaffold template,
generated file, browser runtime, transport, service process, Aspire resource, or wire behavior.
Focused check/test/type fixtures, doc lint, quality/architecture checks, per-package JSR audits, and
isolated-declaration publish dry-runs prove the contracted behavior more directly. A later slice
that changes a real CLI generator would require a rescope and explicit lease; current research
finds no such owner.

## Open question for PLAN-EVAL

- Confirm that declaration-level propagation through the exact `TContract` carrier is the Stage 1b
  boundary, while runtime `ProcedureMetadataPort` interpretation remains Stage 2 (#1349). Adding
  runtime metadata access in this slice would cross the RFC stage boundary.
