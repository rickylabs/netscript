# Research — sdk-typed-error-channel (#1350)

## Re-baseline and authority

- Re-derived on 2026-08-15 against `main@0ef48c2ec661a7e6d55ec2faf5def6ae7dd2e6eb`; the issue's
  older evidence was against `fac9e339042c`.
- Normative for error behavior: the merged, Accepted RFC 0001 requires exact server-defined error
  inference after metadata initialization (`rfcs/0001-sdk-client-contributions.md:1317-1333`) and
  keeps contribution/preparation failures outside the contract-defined channel
  (`rfcs/0001-sdk-client-contributions.md:1032-1088`).
- Normative for the builder: RFC 0001 requires an explicit publishable annotation preserving both
  the concrete common error map and `NetScriptProcedureMeta`, and rejects the current
  `ReturnType<typeof oc.errors>` spelling (`rfcs/0001-sdk-client-contributions.md:347-370`).
- Normative for this lane: the slice brief says #1350 owns procedure-metadata preservation and
  limits changes to five declared files. This conflicts with current GitHub state: #1466 is an open
  child titled “define NetScriptProcedureMeta without erasing contract errors,” and #1350's only
  existing comment says metadata initialization is not owned by #1350. RFC 0001 itself records that
  Stage 0 had to choose #1350 or a dependent child
  (`rfcs/0001-sdk-client-contributions.md:1267-1277`). The brief is treated as the latest
  instruction for planning, but the contradictory live ownership cannot be verified and needs the
  topic orchestrator's ruling before implementation.

## 1. Current error path and exact loss points

The executed public-surface inspection reported:

```text
deno doc --filter safe packages/sdk/src/client/mod.ts
  safe<TOutput>(promise: PromiseLike<TOutput>): Promise<SafeResult<TOutput>>

deno doc --filter isDefinedError packages/sdk/src/client/mod.ts
  isDefinedError<T>(error: T): error is Extract<T, DefinedError>

deno doc --filter SafeResult packages/sdk/src/client/mod.ts
  SafeResult<TOutput, TError = unknown>
```

The path is:

1. `commonErrorMap` declares six literal keys and schema-specific payloads
   (`packages/contracts/src/application/contract-primitives.ts:21-52`).
2. `baseContract` immediately widens those literals to `ReturnType<typeof oc.errors>`
   (`packages/contracts/src/application/contract-primitives.ts:81`). `BaseContractErrors` widens a
   second time to the open upstream `ErrorMap`
   (`packages/contracts/src/application/contract-primitives.ts:91-99`), and both published route
   aliases consume that widened type
   (`packages/contracts/src/application/contract-primitives.ts:125-159`). An executed check accepted
   `const undeclared: keyof typeof baseContract['~orpc']['errorMap'] = 'NOT_DECLARED'`, proving the
   literal vocabulary is already gone at the contract boundary.
3. The SDK's structural `ContractProcedureMetadata` retains only input/output schemas
   (`packages/sdk/src/ports/service-client.ts:48-60`). `ContractProcedureLike` therefore has no
   error-map parameter (`packages/sdk/src/ports/service-client.ts:75-91`).
4. `ServiceClientMethod<TInput, TOutput>` returns plain `Promise<TOutput>`
   (`packages/sdk/src/ports/service-client.ts:165-171`), and `ServiceClientShape` derives only input
   and output (`packages/sdk/src/ports/service-client.ts:181-196`). The actual oRPC client is cast
   to that narrowed shape (`packages/sdk/src/client/service-client.ts:41-65`). This is the decisive
   loss of the promise's hidden `TError` channel before the caller passes it to `safe()`.
5. `SafeResult` defaults `TError` to `unknown`, and its single failure arm exposes only a boolean
   `isDefined` (`packages/sdk/src/client/errors.ts:36-49`). `safe()` does not accept or infer a
   `TError` at all (`packages/sdk/src/client/errors.ts:79-91`).
6. `isDefinedError` computes `Extract<T, DefinedError>` (`packages/sdk/src/client/errors.ts:69-77`).
   For the `unknown` error emitted by `safe()`, that is `never`; additionally, the local
   `DefinedError.defined` property is the literal `true` (`packages/sdk/src/client/errors.ts:9-24`),
   whereas the upstream oRPC error class exposes a boolean marker, so a raw upstream error union is
   not structurally assignable to the current interface without normalization.

The exact base RED was executed without creating a product fixture:

```text
cd packages/sdk
deno eval --check --unstable-kv "import { isDefinedError, safe } from './src/client/mod.ts'; ..."
TS2339: Property 'code' does not exist on type 'never'.
```

This RED proves the named defect because it fails only when `safe()` has erased the promise's error
type and `isDefinedError()` therefore narrows that erased value to `never`. The implementation proof
must strengthen it to use a real `baseContract` procedure and assert the exact six-code union plus
schema-specific `data`; a broad `DefinedError<string, unknown>` would not satisfy the proof.

## 2. Current contract guarantees and public surface

- `commonErrorMap` defines `NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`,
  `RATE_LIMITED`, and `SERVICE_UNAVAILABLE`, with statuses and Zod data schemas
  (`packages/contracts/src/application/contract-primitives.ts:21-52`). It is internal.
- `baseContract`, `BaseContract`, `BaseContractRoute`, and `BaseContractOutputRoute` are public via
  the curated root barrel (`packages/contracts/src/public/mod.ts:1-6`) and package root
  (`packages/contracts/mod.ts:1-22`). `BaseContractErrors` is currently exported from its source
  file but is not a package-root export.
- The current builder JSDoc claims the route marker is genuinely typed and that precise schema types
  reach handlers (`packages/contracts/src/application/contract-primitives.ts:54-68`). That statement
  is accurate for input/output schemas, but false for the error map and metadata.
- Current metadata is `Record<never, never>` in both route aliases
  (`packages/contracts/src/application/contract-primitives.ts:125-159`). An executed check of
  `typeof baseContract['~orpc']['meta'].access` fails with TS2339.
- `@netscript/sdk/client` publicly exports `safe`, `isDefinedError`, `DefinedError`, `SafeSuccess`,
  `SafeFailure`, and `SafeResult` (`packages/sdk/src/client/mod.ts:15-17`), and the SDK root
  re-exports the entire client subpath (`packages/sdk/mod.ts:46-48`). These are already stable
  published names; the repair does not need a new SDK error export.

## 3. Executed whole-repo consumer map

Executed searches (not inference from one package):

```text
rg -l --hidden --glob '!.git/**' --glob '!packages/service/assets/**' \
  --glob '!.llm/runs/**' \
  '\b(isDefinedError|SafeResult|SafeSuccess|SafeFailure|DefinedError)\b|\bsafe\(' .

rg -n '\b(BaseContract|BaseContractErrors|BaseContractRoute|BaseContractOutputRoute|baseContract)\b' \
  packages plugins --glob '!**/assets/**' --glob '!**/*.template'

rg -n '\bServiceClient(Method|Shape|<)|Procedure(Output|Input)FromNode' \
  packages/sdk packages/fresh packages/service plugins --glob '!**/assets/**'
```

### Inside `packages/sdk`

| Consumer                          | Evidence                                                                                                                                                                                                                                                   | Consequence                                                                                                                           |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Client and root barrels           | `packages/sdk/src/client/mod.ts:15-35`; `packages/sdk/mod.ts:46-79`                                                                                                                                                                                        | Existing public error and client type names change in place; no new SDK export is required.                                           |
| Direct client construction        | `packages/sdk/src/client/service-client.ts:41-65`                                                                                                                                                                                                          | Cast currently discards upstream error identity; must participate in an end-to-end repair.                                            |
| `defineServices`                  | `packages/sdk/src/presets/define-services.ts:47-69`                                                                                                                                                                                                        | Maps every service to `ServiceClient<TContract>` and will inherit the repaired channel.                                               |
| Query factories                   | `packages/sdk/src/query/query-factory.ts:197-224`                                                                                                                                                                                                          | Assert clients are `ServiceClient<TContract>`; default-compatible type changes must keep assignments green.                           |
| Query utils                       | `packages/sdk/src/ports/service-query-utils.ts:161-170`                                                                                                                                                                                                    | Exposes `call: ServiceClientMethod<TInput,TOutput>`; any appended error generic needs a compatibility default.                        |
| Desktop client                    | `packages/sdk/src/desktop/domain/types.ts:147-155`                                                                                                                                                                                                         | Aliases `ServiceClient<TContract>` and therefore asserts on the same public contract.                                                 |
| Type/mocked consumers             | `packages/sdk/tests/query/query-factory_test.ts:60-257`; `packages/sdk/tests/type-fixtures/sdk-assignability_type.ts:58`; `packages/sdk/tests/type-fixtures/define-services_type.ts:54-57`; `packages/sdk/tests/type-fixtures/desktop-consumer_type.ts:39` | Plain Promise mocks and old positional generics must remain assignable.                                                               |
| Public-surface baseline/reference | `.llm/tools/release/baselines/public-surfaces.json:18811-19194`; `docs/site/reference/sdk/index.md:38-60`                                                                                                                                                  | `surface:diff` must compare base-vs-head sets/signatures; generated reference is a consumer but outside this leaf's editable surface. |

### Outside `packages/sdk`

| Consumer                           | Evidence                                                                                                                                                                                                                                    | Consequence                                                                                                                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@netscript/fresh` diagnostics     | `packages/fresh/src/diagnostics/error/extract.ts:1-39`                                                                                                                                                                                      | Imports `isDefinedError`, then manually casts code/status. It must still compile and preserve runtime detection; it is the only non-SDK package source importing the helper.                           |
| `@netscript/contracts/crud`        | `packages/contracts/crud/create-crud-contract.ts:29-44,109-117,350-379`                                                                                                                                                                     | Directly consumes public `baseContract` and `BaseContractRoute`; exact error/meta generics must remain assignable.                                                                                     |
| Workers health soundness test      | `plugins/workers/services/src/routers/health-soundness_test.ts:3-53`                                                                                                                                                                        | Asserts `BaseContractRoute` handler inference; metadata/error tightening must not regress input/output soundness.                                                                                      |
| CLI scaffold/template assertions   | `packages/cli/e2e/tests/application/gates/generated-router-template_test.ts:35-41`; `packages/cli/src/kernel/adapters/contracts/contract-source.ts:63-77`; `packages/cli/src/public/features/plugins/new/new-plugin-use-case.ts:390-416`    | Some generated contracts import root `baseContract`; the parser recognizes its route chain. No template change is planned.                                                                             |
| Benchmark/reference/docs consumers | `packages/bench/tasks/t1-storefront-api/rubric.md:16`; `packages/bench/tasks/t1-storefront-api/reference/README.md:45-47`; `packages/bench/tasks/t1-storefront-api/reference/netscript/router.ts:7-8`; `packages/contracts/README.md:13-76` | Several statements explicitly describe the current erasure. They become stale after repair but are outside the declared surface, creating another documentation rescope question for the orchestrator. |

First-party plugin-core files found by the base-contract search define their own local
`baseContract: ReturnType<typeof oc.errors>` rather than importing `@netscript/contracts`
(`packages/plugin-ai-core/src/contracts/v1/ai.contract.ts:147-157`,
`packages/plugin-auth-core/src/contracts/v1/auth.contract.ts:182-195`,
`packages/plugin-sagas-core/src/contracts/v1/sagas.contract.ts:99-110`,
`packages/plugin-triggers-core/src/contracts/v1/triggers.contract.ts:134-145`, and
`packages/plugin-workers-core/src/contracts/v1/workers.contract-definition.ts:70-88`). They do not
consume this leaf's public error channel, but the executed search shows the same erasing pattern is
not globally repaired by #1350.

## 4. Authorized docs: current claims and dispositions

### `docs/site/services-sdk/sdk.md`

| Lines   | Current claim                                                                           | Truth at base                                                                          | Planned disposition                                                                                                                                                                                          |
| ------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 12-20   | The contract supplies everything a caller needs and caller/server cannot drift.         | Too broad for errors today; method input/output are typed, error channel is not.       | Retain after the repair, but qualify the nearby error example so “contract-derived” explicitly includes only declared server errors, not arbitrary thrown/transport errors.                                  |
| 31-38   | L1 method signatures are inferred from the contract.                                    | True for input/output, false for the promise error channel.                            | Retain after end-to-end method return typing is repaired; otherwise it must be narrowed.                                                                                                                     |
| 58-70   | End-to-end types and contract changes flow to the client.                               | Already false for error codes/data.                                                    | Retain only if the RED proves error flow; no one-sentence patch while this surrounding story remains unqualified.                                                                                            |
| 113-114 | A direct call is “fully inferred from the contract.”                                    | False for errors at base.                                                              | Retain with an explicit cross-reference to the safe error story after proof.                                                                                                                                 |
| 196-198 | “Safe error narrowing” example says `isDefinedError(error)` yields typed `code/status`. | False; executed check gives TS2339 on `never`; the destructured `isDefined` is unused. | Replace the complete tab text. Explain and demonstrate the discriminated `SafeResult`: `isSuccess`, then `isDefined`, exact code/data; use `isDefinedError` in a second narrow or explain when it is useful. |

### `docs/site/services-sdk/how-to/discover-services.md`

| Lines           | Current claim                                                                       | Truth at base                                                                                                                          | Planned disposition                                                                                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9-14            | The discovered client is “fully typed.”                                             | False for errors.                                                                                                                      | Retain only after the end-to-end error RED turns green; qualify that transport/unknown throws remain non-defined failures.                                                                                |
| 96-101, 114-115 | Client is fully typed from the contract and fields drift at compile time.           | True for input/output, false for error codes/data.                                                                                     | Retain with wording that includes the newly proven error union, avoiding an isolated snippet-only fix.                                                                                                    |
| 135-154         | Step 4 says `safe()` plus `isDefinedError` provides typed contract code/data.       | False at base. It also falls through an arbitrary non-defined error into the success `else`, making `result.items` narratively unsafe. | Rewrite the whole Step 4 explanation and block: branch on `isSuccess`; branch on literal `isDefined`; surface/throw the non-defined error; state `error.data` is selected by the error code's Zod schema. |
| 205-229         | End-to-end copyable example repeats safe narrowing and then returns `result.items`. | False for the same typing reason and unsafe narrative.                                                                                 | Rewrite the full function consistently with Step 4; do not retain the old fallthrough.                                                                                                                    |

## 5. Granted doctest surface

`packages/sdk/tests/readme-doctest_test.ts` does not execute package examples against package
exports. It:

1. reads only `packages/sdk/README.md` (`packages/sdk/tests/readme-doctest_test.ts:3,117-120`);
2. extracts every fenced TypeScript block (`packages/sdk/tests/readme-doctest_test.ts:92-109`);
3. strips all imports and `export` keywords (`packages/sdk/tests/readme-doctest_test.ts:111-115`);
4. prepends a fictional ambient API, including locally declared `safe` and `isDefinedError`
   signatures that are stronger than the real exports
   (`packages/sdk/tests/readme-doctest_test.ts:5-90`, especially `:36-37`);
5. runs `deno check --no-config` for each temporary snippet
   (`packages/sdk/tests/readme-doctest_test.ts:124-141`); and
6. separately parses JSON fences (`packages/sdk/tests/readme-doctest_test.ts:144-152`).

The granted test can be changed to import the real error helpers and add a real compile-only
contract/client fixture, but it cannot make the actual client promise preserve a contract error
unless `packages/sdk/src/ports/service-client.ts` is changed.

## JSR/publish surface scan

- `deno doc` confirmed the currently published signatures before source inspection.
- The repository JSR audit reports `@netscript/contracts` with the sanctioned oRPC slow-type INFO;
  raw `deno publish --dry-run --allow-dirty --allow-slow-types` exits 0. The explicit four-generic
  builder annotation must not deepen that sanctioned warning.
- The audit reports SDK `F-DOCT-5` because `src/` has 13 immediate children, a known pre-existing
  red. Its helper also reports a slow-type warning by counting the “Checking for slow types” banner;
  raw `deno publish --dry-run --allow-dirty` exits 0 with no actual slow-type diagnostic. Record the
  raw result as authority per `netscript-tools`.
- No new entrypoint is needed for the error repair. If metadata is in this leaf, RFC 0001 requires
  new root exports, which cannot be achieved within the declared files because the curated barrel is
  `packages/contracts/src/public/mod.ts:1-6`.

## Open questions requiring a ruling

1. **Scope expansion:** authorize `packages/sdk/src/ports/service-client.ts`. Without it, exact
   procedure error inference is impossible and the accepted error contract cannot be met.
2. **Metadata owner:** does this brief supersede live #1466 and #1350's existing maintainer comment?
   If yes, authorize `packages/contracts/src/public/mod.ts` (and likely the SDK contract metadata
   port/type surface) so the RFC-mandated root metadata exports and propagation can exist. If no,
   #1350 should preserve the fourth `ContractBuilder` generic as `Record<never, never>` and leave
   initialization/export/propagation to #1466.
3. **Stale but out-of-scope published prose:** authorize updates to `packages/contracts/README.md`
   and benchmark reference prose that explicitly says the root base contract is erased, or accept a
   tracked docs follow-up. Leaving those statements unchanged would violate the brief's own
   surrounding-narrative rule.
