# Workers payload type contract — plan

Issue: #1455
Branch: `feat/workers-payload-type-contract`
Baseline: `ec848e6b0334ec8fcd2bc66ba009305d35367b01` (`origin/main`)
Lane: Codex · OpenAI · GPT-5.6 Sol · high (`complex_implementation`)

## Decision

Make the payload schema the single application-owned definition of a job payload. Its output type
flows through `JobDefinition`, generated job registries, the workers `triggerJob` contract, and
trigger-core `enqueueJob`; the same schema validates the payload immediately before the job handler
runs. The queue message and enqueue/dispatch sequence do not change.

This is deliberately source-breaking for schema-less payload declarations and schema-less job
handlers. Keeping `.payload<T>()` or `defineJobHandler(handler)` as a silent fallback would preserve
the defect: the generator could recover a compile-time annotation at best, but there would be no
runtime definition with which to prevent producer/consumer drift.

## Scope and doctrine

- `packages/plugin-workers-core`: Archetype 3 (Runtime/Behavior), current doctrine verdict
  **Refactor**. The builder is a folded DSL concern, not a separate package archetype.
- `packages/plugin-triggers-core`: Archetype 3 (Runtime/Behavior), current doctrine verdict
  **Keep**.
- `plugins/workers`: Archetype 5 (Plugin Package), current doctrine verdict **Refactor**. The plugin
  remains thin: payload/schema/registry vocabulary is owned by workers-core; the plugin generator
  only composes and emits it.
- Scope overlays: none. This does not change an application service implementation, frontend, or
  documentation-only surface.
- In-scope anti-pattern checks: AP-1, AP-3, AP-8, AP-9, AP-10, AP-11, AP-13, AP-14, AP-16, AP-19,
  AP-20, AP-22, AP-23, AP-24, and AP-25. In particular, generated `JobHandler<any>` and its blanket
  lint suppression must disappear rather than move.
- Relevant existing debt: `packages/plugin-workers-core` contract/domain cardinality and
  `plugins/workers` connector split remain open but must not be deepened. The 20-diagnostic
  `plugins/workers` private-type-ref baseline under `workers-private-type-ref-1655` is pre-existing
  and is a strict no-increase allowance, not a pass. No new debt is planned.

## Current published surface (`deno doc` at baseline)

The following facts were read from `deno doc`, not inferred from implementation files.

| Entry point | Published symbol | Baseline signature relevant to #1455 |
| --- | --- | --- |
| `@netscript/plugin-workers-core` | `JobDefinition` | `JobDefinition<TId extends string = string> = Readonly<{ id; entrypoint?; name?; topic? }>` |
| root | `JobBuilder` | `payload<TNextPayload>(): JobBuilder<..., TNextPayload, ...>`; `build(): JobDefinition<TId>` |
| root | `defineJob` | `defineJob<TId>(id): JobBuilder<TId, "initial", unknown, unknown>` |
| root | `defineJobHandler` | `defineJobHandler<TPayload = unknown>(handler): (context: JobHandlerContext<TPayload>) => JobResult<unknown> \| Promise<...>` |
| `./builders` | `JobDefinition` | already `JobDefinition<TId = string, TPayload = unknown, TResult = unknown>` |
| `./builders` | `JobBuilder` | already returns `JobDefinition<TId, TPayload, TResult>`, but `payload<T>()` is type-only |
| `./runtime` | `JobDefinition` | already has `<TId, TPayload, TResult>` and optional `handler`, but no payload schema |
| `./runtime` | `StaticJobRegistry` | `ReadonlyMap<string, JobHandler>` (default payload `unknown`) |
| `./contracts/v1` | `JobTriggerInput` | non-generic `{ id?: string; payload?: Record<string, unknown>; ... }` |
| `./contracts/v1` | `WorkersContract` | non-generic alias of the real `WorkersContractDefinition` |
| `./contracts/v1` | `workersContract` | non-generic client-generation contract value |
| `./contracts/v1` | `workersContractV1` / `WorkersContractV1` | non-generic context-bindable service implementer |
| `@netscript/plugin-triggers-core` | `EnqueueJobOptions` | `EnqueueJobOptions<TPayload = unknown>`, with `payload?: TPayload` |
| root and `./builders` | `EnqueueJobAction` | `job: JobDefinition<TJobId>` while `options` separately carries `TPayload` |
| root and `./builders` | `enqueueJob` | `<TJobId, TPayload>(job: JobDefinition<TJobId>, options: EnqueueJobOptions<TPayload>)` |

The root workers `JobDefinition` is distinct from the richer builders/domain/runtime types with the
same name. The root wrapper is the erasing boundary used by trigger-core today.

## 1. Exact proposed public shapes

### Workers payload schema and handler definition

Workers-core owns a structural Standard Schema surface; it does not re-export Zod or another
upstream schema library.

```ts
export type JobPayloadSchema<TPayload = unknown> = PublicStandardSchema<TPayload>;

export type JobHandler<TPayload = unknown, TResult = unknown> = (
  context: JobHandlerContext<TPayload>,
) => JobResult<TResult> | Promise<JobResult<TResult>>;

export type JobHandlerDefinition<TPayload = unknown, TResult = unknown> =
  & JobHandler<TPayload, TResult>
  & Readonly<{ payloadSchema: JobPayloadSchema<TPayload> }>;

export function defineJobHandler<TPayload, TResult = unknown>(
  payloadSchema: JobPayloadSchema<TPayload>,
  handler: JobHandler<TPayload, TResult>,
): JobHandlerDefinition<TPayload, TResult>;
```

`defineJobHandler` returns a callable wrapper. The callback receives the schema output type. The
wrapper validates `context.payload` with the attached schema, replaces the callback context payload
with the validated output, and then invokes the callback. It throws a workers validation error on
schema issues. This changes validation only; job selection, queueing, retry, priority, correlation,
and handler result semantics are unchanged.

### Job definition and builder

The root surface is aligned with the already-published builders/runtime generic order. Defaults keep
type references such as `JobDefinition<'health-check'>` valid.

```ts
export type JobDefinition<
  TId extends string = string,
  TPayload = unknown,
  TResult = unknown,
> = Readonly<{
  id: JobId<TId>;
  entrypoint?: string;
  name?: string;
  topic?: string;
  payloadSchema?: JobPayloadSchema<TPayload>;
  handler?: JobHandlerDefinition<TPayload, TResult>;
}>;

export interface JobBuilder<
  TId extends string,
  TConfigured extends "initial" | "entrypoint-set" | "handler-set",
  TPayload,
  TResult,
> {
  payload<TNextPayload>(
    schema: JobPayloadSchema<TNextPayload>,
  ): JobBuilder<TId, TConfigured, TNextPayload, TResult>;

  handler<TNextPayload = TPayload, TNextResult = TResult>(
    fn: JobHandler<TNextPayload, TNextResult>,
  ): JobBuilder<TId, "handler-set", TNextPayload, TNextResult>;

  build(): JobDefinition<TId, TPayload, TResult>; // existing typestate `this` guard retained
}
```

The richer `./builders` and `./runtime` `JobDefinition` shapes gain the same optional
`payloadSchema` field. Optionality preserves manually-authored/registry-loaded legacy definitions
that never declared a payload. Once `.payload(schema)` is called, the builder stores that schema and
the built value carries it. The no-argument `.payload<T>()` overload is not retained.

### Payload extraction and literal registry algebra

```ts
export type JobPayloadOf<TDefinition> =
  TDefinition extends JobDefinition<string, infer TPayload, unknown>
    ? TPayload
    : TDefinition extends JobHandlerDefinition<infer TPayload, unknown>
      ? TPayload
      : never;

export type JobPayloadMap<
  TRegistry extends Readonly<Record<string, unknown>>,
> = Readonly<{
  [TId in keyof TRegistry]: JobPayloadOf<TRegistry[TId]>;
}>;
```

The workers generator emits a literal object before it widens values into runtime `Map`s:

```ts
export const jobHandlersById = {
  "embed-document": resolveJobHandler(job0, "workers/jobs/embed-document.ts"),
  "transcribe-image": resolveJobHandler(job1, "workers/jobs/transcribe-image.ts"),
} as const;

export const jobDefinitionsById = {
  "embed-document": createLocalJobDefinition(
    "embed-document",
    "./embed-document.ts",
    jobHandlersById["embed-document"],
  ),
  "transcribe-image": createLocalJobDefinition(
    "transcribe-image",
    "./transcribe-image.ts",
    jobHandlersById["transcribe-image"],
  ),
} as const;

export type GeneratedJobDefinitionRegistry = typeof jobDefinitionsById;
export type GeneratedJobPayloadMap = JobPayloadMap<GeneratedJobDefinitionRegistry>;

// Existing runtime exports remain Maps and retain their names.
export const registry: StaticJobRegistry = new Map(/* literal handler entries */);
export const jobDefinitions: ReadonlyMap<string, RegisterJobInput> =
  new Map(/* serializable operational definitions */);
export const definitions = jobDefinitions;
```

For that generated type:

```ts
type GeneratedJobPayloadMap = Readonly<{
  "embed-document": EmbedDocumentPayload;
  "transcribe-image": TranscribeImagePayload;
}>;
```

`createLocalJobDefinition`/`createConfiguredJobDefinition` remain responsible for the post-#1872
operational fields. They additionally carry the handler's schema in the in-process literal
definition; the existing serializable registration map keeps the existing operational projection.
This does not redesign metadata precedence or absorb #1451.

### Typed workers `triggerJob` contract

```ts
export type JobPayloadRecord = Readonly<Record<string, unknown>>;

type JobTriggerCommon = Readonly<{
  priority?: number;
  delay?: number;
  correlationId?: string;
  traceparent?: string;
  tracestate?: string;
}>;

type PayloadField<TPayload> = undefined extends TPayload
  ? Readonly<{ payload?: TPayload }>
  : Readonly<{ payload: TPayload }>;

export type JobTriggerInput<
  TPayloads extends JobPayloadRecord = JobPayloadRecord,
> = string extends keyof TPayloads
  ? Readonly<JobTriggerCommon & {
      id?: string;
      payload?: Record<string, unknown>;
    }>
  : {
      [TId in keyof TPayloads & string]: Readonly<
        JobTriggerCommon & { id: TId } & PayloadField<TPayloads[TId]>
      >;
    }[keyof TPayloads & string];

export type WorkersContract<
  TPayloads extends JobPayloadRecord = JobPayloadRecord,
> = WorkersContractDefinition<TPayloads>;

export function createWorkersContract<
  TPayloads extends JobPayloadRecord = JobPayloadRecord,
>(): WorkersContract<TPayloads>;
```

`WorkersContractDefinition<TPayloads>` remains the real oRPC contract type; only its `triggerJob`
route input schema type is parameterized. `createWorkersContract()` returns the same runtime
contract definition as `workersContract`, with the generic narrowing proven safe because every map
value is constrained to the route's existing record payload domain. This is the canonical published
surface, not an EIS-Chat compatibility shim.

The existing `workersContract`, `workersContractV1`, and `WorkersContractV1` remain the broad default
service implementation surfaces. Services must implement the whole runtime route, while a client
opts into its application registry:

```ts
const contract = createWorkersContract<GeneratedJobPayloadMap>();
const client = createServiceClient({ contract, serviceName: "workers" });

await client.triggerJob({
  id: "embed-document",
  payload: { documentId: "doc-1", text: "..." },
});

await client.triggerJob({
  id: "transcribe-image",
  // @ts-expect-error EmbedDocumentPayload is not TranscribeImagePayload.
  payload: { documentId: "doc-1", text: "..." },
});
```

### Trigger-core enqueue binding

```ts
export type EnqueueJobAction<
  TJobId extends string = string,
  TPayload = unknown,
> = Readonly<{
  kind: "enqueue-job";
  job: JobDefinition<TJobId, TPayload>;
  jobId: JobId<TJobId>;
  options: EnqueueJobOptions<TPayload>;
}>;

export function enqueueJob<TJobId extends string, TPayload = unknown>(
  job: JobDefinition<TJobId, TPayload>,
  options: EnqueueJobOptions<NoInfer<TPayload>>,
): EnqueueJobAction<TJobId, TPayload>;
```

`NoInfer` is essential. Without it TypeScript may infer or widen `TPayload` from both arguments,
recreating the independent-payload defect as a union/escape. The selected definition is the only
inference source; the options payload is checked against it.

## 2. Published signature changes and source compatibility

| Published symbol | Proposed change | Source-breaking? |
| --- | --- | --- |
| root `JobDefinition` | Add `TPayload = unknown`, `TResult = unknown`, optional schema and handler fields | **No for type references** because defaults preserve `JobDefinition` and `JobDefinition<TId>`; optional fields preserve structural values. Code depending on the old type having exactly one generic parameter only through a higher-order generic alias may need adjustment, but normal uses remain valid. |
| root `JobBuilder.payload` | Replace `.payload<T>()` with `.payload(schema)` and infer `T` from the schema | **Yes.** Every schema-less call must supply its runtime schema. This is required to close drift. |
| root `JobBuilder.build` | Return `JobDefinition<TId, TPayload, TResult>` instead of `JobDefinition<TId>` | **No for correct consumers; intentional tightening downstream.** Payload/result information is additive until a caller passes an incompatible payload. |
| root `defineJobHandler` | Require `(payloadSchema, handler)` and return `JobHandlerDefinition<TPayload, TResult>` | **Yes.** One-argument handler declarations must pass their existing schema (or introduce one). This is how generation recovers both type and validator. |
| new root symbols `JobPayloadSchema`, `JobHandler`, `JobHandlerDefinition`, `JobPayloadOf`, `JobPayloadMap` | Add contract algebra | No; additive. |
| `./builders` `JobDefinition` | Add optional `payloadSchema` to the underlying domain shape | No; additive optional field with existing generic defaults/order. |
| `./builders` `JobBuilder.payload` | Require schema argument | **Yes**, same migration as root. |
| `./runtime` `JobDefinition` | Add optional `payloadSchema` | No; additive optional field. |
| `./runtime` `StaticJobRegistry` | Use a payload-erased existential handler (`JobHandler<never, unknown>`) instead of `JobHandler<unknown, unknown>` so heterogeneous typed handlers can be stored without `any` | **Potentially yes.** Code that reads a static handler and invokes it without first correlating it with a definition will stop compiling. Construction from specifically typed handlers becomes valid. Runtime dispatch already performs the correlation/cast at the registry boundary. |
| `./contracts/v1` `JobTriggerInput` | Add payload-map generic and a literal-id discriminated union; retain broad default branch | No for existing `JobTriggerInput` uses because the default reproduces the old optional `id`/record payload shape. **Opted-in typed uses intentionally reject** missing ids and mismatched payloads. |
| `./contracts/v1` `WorkersContract` | Add payload-map generic with broad default | No for existing uses; default preserves current type. |
| new `./contracts/v1` `createWorkersContract` | Add canonical typed client-contract factory | No; additive. |
| `workersContract`, `workersContractV1`, `WorkersContractV1` | Keep broad default signatures | No change. The service implementer is not application-registry-specific. |
| trigger-core `EnqueueJobAction` | Carry payload generic into its `job` field | No for existing references because generic defaults remain. |
| trigger-core `enqueueJob` | Infer payload from `JobDefinition<TId, TPayload>` and apply `NoInfer` to options | **Yes, intentionally, for incorrect calls.** A payload belonging to another definition stops compiling. Correct calls and untyped legacy `JobDefinition<TId>` calls retain behavior (`TPayload = unknown`). Explicit generic calls whose declared payload disagrees with the definition also stop compiling. |
| generated module exports | Add literal `jobHandlersById`, `jobDefinitionsById`, and generated type aliases; preserve `registry`, `jobDefinitions`, and `definitions` Map exports | No for supported exported names. Consumers parsing the generated source text or relying on the non-public internal `jobHandlers` array must update. |
| generated job source convention | Require every `defineJobHandler` call to supply a Standard Schema | **Yes.** Existing handler modules must pass the schema they commonly already use manually. Schema-less arbitrary function exports cannot provide the promised id→payload contract and are rejected by generation with a path-specific error. |

## 3. Binding rules

### Workers service `triggerJob`

The generated `GeneratedJobPayloadMap` is passed to `createWorkersContract`. The generic contract's
`triggerJob` input is a discriminated union keyed by literal `id`; each union member's `payload` is
the mapped payload for only that id. The broad `workersContractV1` service implementer remains
unchanged and receives the same wire object. No router selection, HTTP path, queue, or persistence
logic changes.

### Trigger-core `enqueueJob`

The function infers `TId` and `TPayload` exclusively from the selected `JobDefinition`. `NoInfer` on
`EnqueueJobOptions<TPayload>` turns the second argument into a checking position. The action retains
both generic arguments, so later trigger processors cannot lose the correlation internally.

## 4. Generated registration boundary

Today the manifest forces `mapValueType: "JobHandler<any>"`, adds a file-wide
`no-explicit-any` suppression, puts handlers into a homogeneous array, and only then builds the
registry. That is the exact erasure point.

The generator will instead:

1. import each job module as it does now;
2. resolve each module with a generic `resolveJobHandler<TModule>(module, path)` whose conditional
   return type preserves the concrete default/named handler type;
3. emit `jobHandlersById` as a literal `as const` object, before any `Map` widening;
4. emit `jobDefinitionsById` from those exact handler values, preserving each attached
   `payloadSchema` type while applying the existing #1451 operational policy projection;
5. derive `GeneratedJobPayloadMap` with workers-core `JobPayloadMap`;
6. project the literal objects into the existing runtime `registry`, `jobDefinitions`, and
   `definitions` maps;
7. remove `mapValueType: "JobHandler<any>"` and the generated lint suppression.

Both workers registry emitters (`runtime-registry-generator.ts` and the package-owned
`registry-compiler.ts`) must emit the same contract. Their golden/semantic tests will assert literal
keys, absence of `any`/lint suppression, preservation of existing operational definition fields,
and compilation of the generated module.

## 5. One definition for runtime validation

The Standard Schema passed to `.payload(schema)` or `defineJobHandler(schema, handler)` owns all
three views:

1. schema output infers the handler callback payload;
2. generated `JobPayloadMap` exposes that same output to producers (`triggerJob` and `enqueueJob`);
3. the returned/built handler definition carries that schema and validates the unknown wire payload
   immediately before the application handler runs.

The generator never parses TypeScript syntax and never asks an application to duplicate a payload
interface. It only transports the typed handler/definition value. A Zod schema, Valibot schema, or
other Standard Schema implementation works through the package-owned structural contract.

Runtime validation happens at the handler boundary rather than rewriting the enqueue route. An
invalid untyped producer can still place the same message on the queue, but the consumer rejects it
before application code. Typed producers cannot construct the mismatched `triggerJob`/`enqueueJob`
call in the first place. This preserves enqueue ordering, delay, priority, correlation, idempotency,
and retry behavior.

## 6. Defaults and what cannot be preserved

Defaults:

- `JobDefinition<TId = string, TPayload = unknown, TResult = unknown>` preserves zero- and one-
  argument references.
- `JobHandlerDefinition<TPayload = unknown, TResult = unknown>` and payload helper types default to
  `unknown` for generic library code.
- `EnqueueJobAction<TId = string, TPayload = unknown>` preserves existing references.
- `JobTriggerInput<JobPayloadRecord>` and `WorkersContract<JobPayloadRecord>` reproduce the current
  broad service/client surface when no application map is supplied.
- Legacy manually-created `JobDefinition<TId>` values remain structurally valid because
  `payloadSchema` and `handler` are optional. They remain untyped (`unknown`) and therefore cannot
  claim the new invariant.

Cannot be preserved:

- Schema-less `.payload<T>()`: a type argument disappears at runtime, so retaining it would violate
  the single-definition requirement.
- One-argument `defineJobHandler(handler)`: without an attached schema the generator cannot produce
  runtime validation from the same definition.
- Arbitrary generated job modules found only by “first function export”: that heuristic erases the
  handler contract. Generated jobs must export a schema-backed handler as `default` or `handler`.
- Mismatched payload calls: rejecting them is the acceptance criterion and an intentional source
  break.
- Invoking a value read directly from heterogeneous `StaticJobRegistry` without a correlated job
  definition: the existential registry type makes that unsafe operation uncallable.
- Typed `triggerJob` calls that omit the literal id because an HTTP path will add it later: the id is
  the discriminant at a TypeScript call site and must be present. The broad service implementer
  still accepts the path-populated shape.
- Consumers that inspect exact generated source text or private intermediate arrays: generated code
  is rewritten to preserve literal types. Stable runtime export names remain.

## RED → GREEN proof

The RED commit adds a consumer-site type test using two real schema-backed definitions:

```ts
type EmbedDocumentPayload = { documentId: string; text: string };
type TranscribeImagePayload = { imageUrl: string; language?: string };

const embedDocument = defineJob("embed-document")
  .payload(EmbedDocumentPayloadSchema)
  .handler(/* correctly typed handler */)
  .build();

const transcribeImage = defineJob("transcribe-image")
  .payload(TranscribeImagePayloadSchema)
  .handler(/* correctly typed handler */)
  .build();

enqueueJob(embedDocument, { payload: embedPayload }); // positive control
enqueueJob(transcribeImage, {
  // @ts-expect-error EmbedDocumentPayload does not belong to transcribe-image.
  payload: embedPayload,
});
```

At RED, the check fails with “Unused `@ts-expect-error` directive”, proving current main accepts the
wrong payload. It must not fail because of a missing import, invalid job definition, or unrelated
schema error. GREEN is the same fixture compiling with the directive consumed. A second fixture
checks `createWorkersContract<GeneratedJobPayloadMap>().triggerJob` with the same pair. Both commit
SHAs are recorded in `worklog.md`.

## Commit slices

1. **Plan contract** — this file only. Gate: human/PLAN-EVAL review. Files: `plan.md`.
2. **RED consumer proof** — add positive and negative compile-time fixtures without changing source.
   Gate: targeted check fails only on unused `@ts-expect-error`. Files: workers/trigger-core type
   test(s), `worklog.md`, `context-pack.md`.
3. **Core type carrier** — schema-backed handler/definition/builder shapes, payload map algebra,
   typed workers contract, and enqueue binding. Gate: targeted package checks/tests turn RED green.
   Files under `packages/plugin-workers-core`, `packages/plugin-triggers-core`, plus run artifacts.
4. **Generated application boundary** — both registry emitters, manifest, scaffold/built-in job
   declarations, golden and semantic generated-code tests. Gate: plugin package tests and generated
   module check. Files under `plugins/workers`, plus run artifacts.
5. **Merge-readiness gates and evidence** — no product changes unless a gate finds an in-scope
   defect. Gate set below; update only run artifacts/PR evidence.

## Gate set

- Scoped `run-deno-check.ts --root <root> --ext ts,tsx` for each touched root, with `--unstable-kv`
  supplied through the wrapper/toolchain where applicable.
- Each touched package/plugin test suite through `run-deno-test.ts` or its package task.
- Root `deno task check` and `deno task test`, because published cross-package types change.
- Scoped `run-deno-lint.ts` and `run-deno-fmt.ts` for each touched root.
- `deno task quality:scan` / `deno task quality:gate` (framework-source requirement).
- Full-export `deno task doc:lint` for touched published units. The workers plugin's recorded 20
  private-type-ref diagnostics must not increase or gain another diagnostic class.
- JSR package audit for every touched published unit.
- `deno task publish:dry-run`.
- `deno task arch:check`.
- Consumer compilation of generated registry plus triggerJob/enqueueJob type fixtures.
- Runtime tests proving schema validation occurs before handler application without changing
  enqueue message construction or action shape.

The full `scaffold.runtime` E2E is not selected initially: this plan changes generated TypeScript but
not scaffold installation, DB wiring, Aspire helper generation, or runtime resource topology. If
the generator tests cannot prove the emitted module in a real scaffold, that is a rescope trigger
and the canonical one-pass suite becomes required.

## Risk register

| Risk | Mitigation |
| --- | --- |
| TypeScript infers payload from both `job` and `options`, allowing a union | Put `NoInfer` on the options position and lock it with the wrong-job compile fixture. |
| Contract typing becomes another hand-authored oRPC shim | Parameterize the existing real `WorkersContractDefinition`; keep runtime schema/value identical and run contract soundness tests. |
| Standard Schema inference exposes upstream types or slow types | Publish a workers-owned structural alias, run full doc-lint and publish dry-run. |
| Generated literal typing is widened before extraction | Emit `as const` objects first; derive aliases before projecting to `Map`. Compile the emitted module. |
| `any` moves from manifest to a cast/helper | Remove the preamble and run `quality:scan`; no `any`, blanket lint ignore, or `as unknown as` is allowed. |
| Runtime validation accidentally changes enqueue/retry behavior | Validate only inside the schema-backed handler wrapper and compare action/message construction tests. |
| #1451 operational registry metadata is regressed | Preserve `RegisterJobInput` projection and policy-precedence golden assertions; do not redesign generated operational fields. |
| Existing worker modules break without a usable migration | Update first-party/stub/sample modules in the same slice and document the mechanical migration: pass the schema already used for parsing to `defineJobHandler`. |
| Pre-existing workers doc-lint debt hides a regression | Record baseline diagnostic count/class separately and require no increase; all other touched units must be zero. |

## Open-decision sweep

- **Resolved now:** schema-less payload APIs are source-breaking and removed. Deferring this would
  force generator and runtime rewrites later.
- **Resolved now:** runtime validation occurs at the handler boundary; enqueue semantics remain
  unchanged.
- **Resolved now:** the broad service implementer stays broad; application clients opt into the
  literal map with `createWorkersContract<...>()`.
- **Resolved now:** generated runtime Map export names remain stable; new literal objects/type aliases
  are additive.
- **Safe to defer:** a future input/output split for Standard Schema defaults/transforms. This issue
  maps schema output as the payload contract; supporting distinct producer input and handler output
  types can add an additional generic later without changing this id correlation.
- **Safe to defer:** task/workflow payload parity. #1455 is job-specific; copying the change to task
  or workflow builders without a named consumer invariant would expand scope.

No must-resolve decision remains open before implementation.

## Explicit non-goals

- #1451 operational metadata design or any alternate job discovery/loading system.
- A temporary EIS-Chat/shared-contract adapter or other consumer-side compatibility shim.
- Rewriting queueing, scheduling, retries, idempotency, correlation, service routing, or worker
  dispatch.
- Task/workflow payload mapping.
- Closing unrelated doctrine debt or the workers private-type-ref issue.

## Contributor path

A contributor adds a job by defining one Standard Schema next to the handler, passing it to
`defineJobHandler(schema, handler)`, and exporting that definition as `default` or `handler`.
Running the existing workers registry generator emits the literal id entry, payload-map alias,
runtime handler Map, and operational definition Map. Producers import/re-export the generated
`GeneratedJobPayloadMap` and instantiate `createWorkersContract<GeneratedJobPayloadMap>()`; trigger
builders pass the built `JobDefinition` directly to `enqueueJob`.
