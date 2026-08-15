# Plan: preserve contract errors through `safe()` and `isDefinedError`

## Run Metadata

| Field          | Value                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| Run ID         | `fix-sdk-typed-error-channel--0.0.7-wave1`                                                                  |
| Branch         | `fix/sdk-typed-error-channel`                                                                               |
| Phase          | `plan` — blocked pending scope/ownership ruling, then PLAN-EVAL                                             |
| Target         | `packages/contracts`, `packages/sdk`, and two published docs pages                                          |
| Archetype      | `1 — Small Contract` for this bounded contract slice (the SDK package remains doctrine Archetype 2 overall) |
| Scope overlays | `docs`                                                                                                      |

## Archetype and doctrine verdict

This slice changes a small published type/result contract with no new runtime subsystem, so the
owner-selected Archetype 1 profile is the effective slice profile. Doctrine currently classifies
`@netscript/contracts` as Archetype 1 / Keep and `@netscript/sdk` as Archetype 2 / Keep
(`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:25-35,53`). The plan preserves the
SDK's existing discovery/client boundary and changes only the type identity/result normalization
needed for error flow.

## Goal

A contract-defined oRPC error keeps its literal code and schema-derived data type from
`baseContract`, through the contract procedure and `ServiceClient` method's promise, into `safe()`.
`SafeResult` discriminates defined vs non-defined failures, and `isDefinedError` narrows the same
error union without widening to `string`/`unknown` or collapsing to `never`.

## Locked error contract

The following is the planned public TypeScript shape. Helper aliases used to describe the shape stay
internal to `errors.ts`; existing published names remain the only SDK error exports.

```ts
interface DefinedError<TCode extends string = string, TData = unknown> extends Error {
  readonly defined: true;
  readonly code: TCode;
  readonly status: number;
  readonly data: TData;
}

type DefinedErrorLike = Error & {
  readonly defined: boolean;
  readonly code: string;
  readonly status: number;
  readonly data: unknown;
};

type NarrowDefined<TError> = Extract<TError, DefinedErrorLike> & DefinedError;

type SafeFailure<TError> =
  | ([Exclude<TError, DefinedErrorLike>, undefined, false, false] & {
    error: Exclude<TError, DefinedErrorLike>;
    data: undefined;
    isDefined: false;
    isSuccess: false;
  })
  | ([NarrowDefined<TError>, undefined, true, false] & {
    error: NarrowDefined<TError>;
    data: undefined;
    isDefined: true;
    isSuccess: false;
  });

type SafeResult<TOutput, TError = ThrowableError> =
  | SafeSuccess<TOutput>
  | SafeFailure<TError>;

function isDefinedError<T>(error: T): error is NarrowDefined<T>;

function safe<TOutput, TError = ThrowableError>(
  promise: ClientPromiseResult<TOutput, TError>,
): Promise<SafeResult<TOutput, TError>>;
```

Rationale:

- It matches upstream stable-v1 `safe<TOutput,TError>` behavior: two failure arms distinguished by
  literal `isDefined`, with failure `data`/tuple slot 2 as `undefined`, while retaining NetScript's
  package-owned `DefinedError` name and runtime `defined: true` guarantee.
- `NarrowDefined<TError>` retains each upstream member's literal `code` and schema-derived `data`
  through intersection; it does not replace them with `string` and `unknown`.
- A plain `unknown` still does not become a contract error merely because a runtime predicate was
  called. The type must originate in the client promise's real error channel.

The contract builder shape is:

```ts
type BaseContractErrors = MergedErrorMap<Record<never, never>, typeof commonErrorMap>;

const baseContract: ContractBuilder<
  Schema<unknown, unknown>,
  Schema<unknown, unknown>,
  BaseContractErrors,
  TApprovedMeta
> = /* explicit builder chain */;
```

`TApprovedMeta` is the only unlocked part because the live ownership sources conflict:

- if #1466 remains owner, it is `Record<never, never>` and #1350 only ensures the four-generic
  spelling does not block #1466;
- if the slice brief supersedes #1466, it is `NetScriptProcedureMeta & Record<never, never>` and the
  builder initializes that metadata as RFC 0001 requires.

The error-map choice itself is locked: `typeof commonErrorMap`, never open `ErrorMap`.

## Breaking-change verdict

**Breaking published contract; not patch-level.** `SafeFailure<TError>` currently has one arm with
`isDefined: boolean` and failure `data: null`; the accepted/upstream-compatible contract changes it
to two literal-discriminated arms and `data: undefined`. Code that asserts `result.data === null`,
constructs a `SafeFailure`, or expects one undifferentiated failure arm must change. Tightening
`baseContract` from an open error-map key space to the six declared literals also intentionally
rejects consumers that treated undeclared codes as valid. Repository search found no package source
constructing `SafeFailure`, but external JSR consumers remain affected. This belongs in the 0.0.7
minor line with explicit migration notes; it must not be described as a patch-compatible change.

## What becomes public

- Error-only ruling: **no new SDK or contracts export names**. Existing `baseContract`,
  `BaseContract`, `BaseContractRoute`, `BaseContractOutputRoute`, `DefinedError`, `SafeSuccess`,
  `SafeFailure`, `SafeResult`, `safe`, `isDefinedError`, and client types acquire corrected
  signatures.
- Metadata-in-#1350 ruling: RFC 0001 requires three new root contracts exports:
  `NetScriptAuthenticationRequirement`, `NetScriptProcedureMeta`, and the metadata-aware
  `baseContract` type. The types originate in `contract-primitives.ts`, but the curated root barrel
  must explicitly export them. No internal helper or upstream adapter type becomes public.
- No new SDK barrel, subpath, helper export, or error code is added.

## Source authority by decision

| Decision                                               | Normative text                                                                                                                                                                                 |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Six literal common errors, no new code                 | Current declaration at `packages/contracts/src/application/contract-primitives.ts:21-52`; issue boundary; RFC exact error inference gate at `rfcs/0001-sdk-client-contributions.md:1317-1333`. |
| Contract vs preparation failures stay separate         | RFC error model at `rfcs/0001-sdk-client-contributions.md:1032-1088`.                                                                                                                          |
| Four-generic explicit builder; no `ReturnType` erasure | RFC metadata section at `rfcs/0001-sdk-client-contributions.md:347-370`.                                                                                                                       |
| Safe result discriminates defined/non-defined          | Accepted issue target plus upstream v1.14.6 `deno doc`; the issue's older prose is used only where it agrees with merged RFC.                                                                  |
| Metadata ownership                                     | **Unresolved conflict:** lane brief says #1350; RFC says Stage 0 chooses; live #1466 and #1350 comment say #1466. Topic orchestrator must rule.                                                |

## Declared scope and required expansion

### Authorized five files

1. `packages/contracts/src/application/contract-primitives.ts`
2. `packages/sdk/src/client/errors.ts`
3. `packages/sdk/tests/readme-doctest_test.ts`
4. `docs/site/services-sdk/sdk.md`
5. `docs/site/services-sdk/how-to/discover-services.md`

### Must resolve now — required sixth/seventh files

| File                                       | Why required                                                                                                                                      | Status                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `packages/sdk/src/ports/service-client.ts` | It is where `TError` is erased to `Promise<TOutput>`; without changing its procedure/client algebra, `safe()` cannot infer a real contract error. | Scope expansion requested; no implementation until approved. |
| `packages/contracts/src/public/mod.ts`     | Required only if this leaf owns RFC metadata: the curated root barrel cannot expose the three mandated types otherwise.                           | Scope/ownership ruling requested.                            |

Potential published prose that becomes factually stale (`packages/contracts/README.md` and benchmark
reference text) is also reported for a ruling; it will not be edited without authorization.

## Planned docs dispositions

Every current error-story location has an explicit disposition in `research.md` §4. Implementation
must update all of these as a coherent narrative, not just the line containing `error.code`:

- SDK page: lines 12-20, 31-38, 58-70, 113-114 retained only with accurate scope; lines 196-198
  fully replaced with a discriminated error example and explanatory wording.
- Discovery how-to: lines 9-14, 96-101, and 114-115 qualified/retained after proof; lines 135-154
  and 205-229 fully rewritten so non-defined errors cannot fall through as success and `data` is
  described as schema-derived.

## Behavioral proof and expected RED

The implementation-phase test must first be committed/run as RED against the real public exports. It
will build a real route from `baseContract`, derive a real `ServiceClient`, and check:

```ts
const result = await safe(usersClient.getById({ id: 'usr_1' }));
if (!result.isSuccess && result.isDefined) {
  const code:
    | 'NOT_FOUND'
    | 'VALIDATION_ERROR'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'RATE_LIMITED'
    | 'SERVICE_UNAVAILABLE' = result.error.code;
}
```

Expected base RED:

```text
TS2339: Property 'code' does not exist on type 'never'.
```

Negative assertions must prove:

- `NOT_DECLARED` is rejected by `keyof baseContract['~orpc']['errorMap']`;
- a non-oRPC `Error` remains in the `isDefined: false` arm and does not narrow;
- the exact `data` type changes with `code` (for example NOT_FOUND vs VALIDATION_ERROR);
- if metadata is approved here, `meta.access.authentication` survives builder → procedure → client
  type inspection, and removing any link makes the fixture fail.

The test is meaningful because it is red at this base for the issue's named `never` erasure. A new
test written only after the implementation or one using ambient re-declarations is insufficient.

## Commit slices (blocked until rulings and PLAN-EVAL PASS)

| # | What the slice proves                                                                                                                                 | Files                                                                                         | Proving gate                                              |
| - | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1 | RED fixture uses real exports and fails with the named TS2339; then the four-generic builder retains exact error keys (and approved metadata owner).  | `contract-primitives.ts`, `readme-doctest_test.ts`; plus `src/public/mod.ts` only if approved | Focused structured test/check; negative type assertions   |
| 2 | A real service method carries its contract error into `safe()`, whose result and `isDefinedError` preserve literal code/data and reject plain errors. | `errors.ts`, `readme-doctest_test.ts`; plus required `ports/service-client.ts` if approved    | Focused structured test/check; exact base RED turns green |
| 3 | Both published pages tell one consistent, compile-accurate error story, including non-defined failure handling.                                       | the two authorized docs pages                                                                 | `docs-source-format`, `docs-accuracy`, doctest            |
| 4 | Published surfaces remain curated and all package gates are recorded without laundering known reds.                                                   | run artifacts only                                                                            | full selected validation set below                        |

## Validation plan

Structured wrappers are the verdict source. Exact arguments may be refined after the scope ruling,
but the gate set is locked:

| Order | Gate           | Planned command/evidence                                                                                                                 | Expected result                                                                               |
| ----- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1     | RED            | Structured focused test/check on the real-surface fixture before implementation                                                          | FAIL with TS2339 `code` on `never`; record once                                               |
| 2     | Check          | `.llm/tools/run-deno-check.ts` scoped to affected TS, with `--unstable-kv`                                                               | PASS after implementation                                                                     |
| 3     | Test           | `.llm/tools/run-deno-test.ts -- --allow-all packages/sdk/tests/readme-doctest_test.ts` plus affected package tests selected after ruling | PASS; if `typed-queue_test.ts` hits #1667 `expected 1, got 2`, report once and do not rerun   |
| 4     | Lint           | `.llm/tools/run-deno-lint.ts` scoped to affected package TS                                                                              | PASS                                                                                          |
| 5     | Format         | `.llm/tools/run-deno-fmt.ts --ext ts,tsx` scoped to affected package TS                                                                  | PASS                                                                                          |
| 6     | Quality        | `deno task quality:scan`                                                                                                                 | PASS for the leaf diff                                                                        |
| 7     | Doctrine       | `deno task arch:check`                                                                                                                   | PASS for the leaf; known base findings separated                                              |
| 8     | Public surface | base-vs-head `surface:diff` sets/signatures                                                                                              | Raw gate remains known-red at base; no unintended new export, only approved signature changes |
| 9     | Docs           | repository `docs-source-format` and `docs-accuracy` tasks                                                                                | PASS for both authorized pages                                                                |
| 10    | Doc lint       | `deno task doc:lint --root packages/contracts --pretty` and SDK equivalent                                                               | Compare with pinned raw baselines; do not relabel baseline reds green                         |
| 11    | Publish        | `deno task publish:dry-run` plus affected per-package raw dry-run where attribution is needed                                            | PASS; contracts sanctioned oRPC slow-type information reported honestly                       |
| 12    | JSR            | repository JSR audits for `packages/contracts` and `packages/sdk`                                                                        | Report known SDK `F-DOCT-5` red; no new finding                                               |

No Aspire, Docker, runtime lease, or `e2e:cli` gate is applicable or permitted.

## Risk register

| Risk                                                                      | Mitigation                                                                                                                                                  |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Broad default error type makes docs compile without preserving identity   | RED uses a real client and exact code/data assertions; broad `string`/`unknown` fails.                                                                      |
| `DefinedError.defined: true` is incompatible with upstream boolean marker | Normalize by intersection only after extracting the original upstream-shaped union; retain original literal code/data.                                      |
| Public failure `null` → `undefined` breaks consumers                      | Declare breaking change explicitly, search construction/assertions repo-wide, document migration, release in 0.0.7 rather than calling it patch-compatible. |
| Tight builder annotation breaks CRUD/plugin/handler inference             | Run named internal/external consumer checks from research §3 and preserve default generics.                                                                 |
| Metadata work duplicates #1466                                            | Hard stop pending topic-orchestrator ownership ruling.                                                                                                      |
| One corrected sentence leaves false surrounding prose                     | Apply every disposition in research §4 and run docs accuracy over whole pages.                                                                              |
| JSR helper false-positive banner is reported as new slow type             | Use raw publish output as authority and record helper vs raw distinction.                                                                                   |

## Anti-patterns and fitness gates

- Avoid AP-1/AP-9: do not grow `errors.ts` into a generic error framework or invent a second client
  algebra.
- Avoid AP-14: do not re-export upstream helpers/types; only use an upstream type internally where
  the hidden promise error marker requires identity.
- Avoid AP-22: no new barrel; amend only the existing curated contracts barrel if metadata is
  approved.
- Avoid AP-25: all contract/error helpers remain side-effect-free.
- Required Archetype-1 gates: F-1, F-5, F-6, F-7, F-8, F-10, F-11, F-12, F-14, F-15, F-16, F-17,
  F-18, F-19, plus package `quality:scan`, `arch:check`, docs overlay gates, publish dry-run, and
  JSR audit.

## Debt and deferred scope

- No new architecture debt is accepted by this plan.
- Existing `packages/contracts/crud` root-layout debt remains unrelated.
- SDK JSR `F-DOCT-5`, raw doc-lint baselines, base-red `surface:diff`, and #1667 remain pre-existing
  and must not be reported as green or as leaf regressions.
- No new error codes, client construction seam (#1349), server raising behavior (#1263), oRPC v2,
  type-soundness sweep (#1278), plugin-local base-contract repair, or generated reference rewrite.

## Plan-Gate state

`PLAN-EVAL` is selected and is a hard stop. Before the topic orchestrator launches it, the two “must
resolve now” questions must be answered: required `service-client.ts` scope and metadata/#1466
ownership (including barrel scope). Until then this plan is complete as a rescope report but is not
implementable.
