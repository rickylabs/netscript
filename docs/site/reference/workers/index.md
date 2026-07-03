---
layout: layouts/base.vto
title: "@netscript/plugin-workers"
---

# `@netscript/plugin-workers`

The NetScript background-workers plugin: background jobs, task execution, workflow
orchestration, a Workers API service, CLI commands, scaffolding, durable streams, and Aspire
process wiring. This page is generated from the package public surface with `deno doc`
(US-2). For the full index of packages and plugins return to the
[reference overview](/reference/).

The deployable plugin (`@netscript/plugin-workers`) binds the host plugin system to the
reusable worker primitives that live in
[`@netscript/plugin-workers-core`](#internals-netscriptplugin-workers-core). The plugin root
entrypoint exposes the plugin manifest and a pure inspection helper; framework integrations
are carried by sub-path exports documented below.

## Plugin manifest (`@netscript/plugin-workers`)

The root entrypoint exposes the plugin manifest consumed by the NetScript host. Shared manifest
inspection is provided by `inspectPlugin` from `@netscript/plugin`.

| Symbol | Kind | Description |
| --- | --- | --- |
| `workersPlugin` | variable | Plugin manifest for NetScript background workers. |

## Sub-path exports

The following entrypoints are published alongside the plugin root export. Each is generated
from its own `deno doc` surface.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/plugin-workers` | `./mod.ts` | Plugin manifest and inspection helper (documented above). |
| `@netscript/plugin-workers/aspire` | `./src/aspire/mod.ts` | Aspire AppHost contribution and resource ports. |
| `@netscript/plugin-workers/cli` | `./src/cli/composition/main.ts` | Host-mounted workers CLI command group. |
| `@netscript/plugin-workers/contracts` | `./contracts/v1/mod.ts` | Versioned oRPC worker service contracts and schemas. |
| `@netscript/plugin-workers/scaffolding` | `./src/scaffolding/mod.ts` | Job, task, and workflow item scaffolders. |
| `@netscript/plugin-workers/services` | `./services/src/main.ts` | Workers API service entrypoint. |
| `@netscript/plugin-workers/streams` | `./streams/mod.ts` | Browser-facing StreamDB factory and entity schemas. |
| `@netscript/plugin-workers/streams/server` | `./streams/server.ts` | Server-side durable stream producer wiring. |
| `@netscript/plugin-workers/worker` | `./worker/mod.ts` | Worker and Scheduler runtime processes. |

### `@netscript/plugin-workers/aspire`

| Symbol | Kind | Description |
| --- | --- | --- |
| `WorkersAspireContribution` | class | Aspire contribution for the NetScript workers plugin. |
| `AspireNSPluginContribution` | class | Base class plugins extend to contribute Aspire resources to an AppHost. |
| `AspireBuilder` | interface | Port implemented by adapters that emit Aspire AppHost resources. |
| `AspireResource` | interface | Resource descriptor returned by Aspire builder ports. |
| `AspireResourceKind` | type alias | Aspire resource kinds produced by plugin contributions. |
| `CacheSpec` | interface | Cache resource spec consumed by AspireBuilder. |
| `ContainerSpec` | interface | Container resource spec consumed by AspireBuilder. |
| `ContributionContext` | interface | Context passed to plugin Aspire contributions during AppHost composition. |
| `DatabaseSpec` | interface | Database resource spec consumed by AspireBuilder. |
| `DenoBackgroundSpec` | interface | Deno background process spec consumed by AspireBuilder. |
| `DenoServiceSpec` | interface | Deno service resource spec consumed by AspireBuilder. |
| `EnvSource` | type alias | Source for an environment variable value in an AppHost composition. |
| `HealthCheckSpec` | interface | Health check expectation declared by a plugin contribution. |

### `@netscript/plugin-workers/cli`

| Symbol | Kind | Description |
| --- | --- | --- |
| `WorkersCli` | class | CLI command group for `@netscript/plugin-workers`. |
| `PluginCli` | class | Abstract base class for plugin-owned CLI command groups. |
| `PluginCliArgs` | interface | Command arguments passed to plugin CLI handlers. |
| `PluginCliCommand` | interface | A mounted CLI command handler. |
| `PluginCliResult` | interface | Result returned by plugin CLI handlers. |
| `CliCommand` | class | Stub-only base contract for CLI command implementations. |
| `WorkersCommand` | class | Stub-only contract for workers CLI commands. |
| `WorkersCommandDefinition` | interface | Definition supplied to worker CLI commands. |
| `AddJobCommand` | class | Create a worker job definition file. |
| `AddTaskCommand` | class | Create a worker task definition file. |
| `CompileRegistryCommand` | class | Compile the static worker registry used by compiled runtimes. |
| `ConfigEditCommand` | class | Edit a worker runtime configuration topic. |
| `ConfigPublishCommand` | class | Publish a worker runtime configuration topic. |
| `DisableCommand` | class | Disable a worker job. |
| `EnableCommand` | class | Enable a worker job. |
| `ListJobsCommand` | class | List configured worker jobs. |
| `ListTasksCommand` | class | List configured worker tasks. |
| `LogsCommand` | class | Show logs for a worker execution. |
| `RunJobCommand` | class | Run a configured worker job. |
| `WorkersCliCommand` | class | Base class for concrete workers CLI commands. |
| `WORKERS_CLI_COMMANDS` | variable | Worker CLI commands exposed through the plugin CLI subpath. |
| `WorkersCliBackend` | interface | Backend invoked by concrete command classes. |
| `WorkersCliCategory` | type alias | Worker CLI command category used for grouped help output. |
| `WorkersCliCommandDefinition` | interface | Workers command definition mounted by the plugin CLI. |
| `WorkersCliCommandName` | type alias | Worker CLI command identifier. |
| `WorkersCliFlagDefinition` | interface | Flag metadata shown by host CLI help renderers. |
| `workersCli` | variable | Default CLI instance used by the host CLI walker. |

### `@netscript/plugin-workers/contracts`

Versioned oRPC service contracts plus the request/response schemas and types used to generate worker service clients.

| Symbol | Kind | Description |
| --- | --- | --- |
| `ExecutionRecord` | type alias | Runtime execution record. |
| `JobContext` | type alias | Context supplied to runtime job handlers. |
| `JobDefinition` | type alias | Runtime job definition. |
| `JobHandler` | type alias | Function that executes a runtime job. |
| `JobMessage` | type alias | Message enqueued to trigger a job execution. |
| `JobResult` | type alias | Result returned by runtime job handlers. |
| `RegisterJobInput` | type alias | Input for registering a job definition. |
| `RegisterTaskInput` | type alias | Input for registering a task definition. |
| `RuntimePermissions` | type alias | Runtime permission bag accepted by task and job execution. |
| `RuntimePermissionValue` | type alias | Runtime permission value accepted by task and job execution. |
| `TaskDefinition` | type alias | Runtime task definition. |
| `TaskExecutionOptions` | type alias | Options supplied when executing a task. |
| `TaskMessage` | type alias | Message enqueued to trigger a task execution. |
| `TaskResult` | type alias | Result returned by task execution. |
| `ExecutionFiltersSchema` | variable | Schema for list-executions filters. |
| `ExecutionRecordResponseSchema` | variable | Schema for worker execution record responses. |
| `JobCreateInputSchema` | variable | Schema for creating worker job definitions. |
| `JobDefinitionResponseSchema` | variable | Schema for worker job definition responses. |
| `JobFiltersSchema` | variable | Schema for list-jobs filters. |
| `JobTriggerInputSchema` | variable | Schema for triggering a worker job by id. |
| `JobUpdateInputSchema` | variable | Schema for updating worker job definitions. |
| `JobUpdateWithIdSchema` | variable | Schema for updating a worker job definition by id. |
| `SSEEventSchema` | variable | Schema for server-sent event payloads emitted by the workers service. |
| `TaskDefinitionResponseSchema` | variable | Schema for worker task definition responses. |
| `TaskFiltersSchema` | variable | Schema for list-tasks filters. |
| `workersContract` | variable | Worker service contract definition for client generation. |
| `workersContractV1` | variable | Context-bindable worker service contract definition. |
| `ContractProcedureLike` | type alias | Structural oRPC procedure reference used by worker contracts. |
| `ContractSchema` | interface | Package-owned structural schema surface for worker contracts. |
| `ContractSchemaResult` | type alias | Result returned by contract schema validation. |
| `ExecutionRecordResponse` | type alias | Public response returned for worker execution records. |
| `JobDefinitionResponse` | type alias | Public response returned for worker job definitions. |
| `JobTriggerInput` | type alias | Input accepted by the trigger-job procedure. |
| `JobTriggerOutput` | type alias | Output returned by the trigger-job procedure. |
| `SSEEvent` | type alias | Server-sent event payload emitted by the workers service. |
| `StandardSchemaLike` | type alias | Structural Standard Schema reference used by contract metadata. |
| `TaskDefinitionResponse` | type alias | Public response returned for worker task definitions. |
| `TaskTriggerInput` | type alias | Input accepted by the trigger-task procedure. |
| `TaskTriggerOutput` | type alias | Output returned by the trigger-task procedure. |
| `WorkersContract` | type alias | Explicit public contract shape for worker service clients. |
| `WorkersContractV1` | type alias | Context-binding contract wrapper for the v1 worker contract. |
| `WorkersRouteHandler` | type alias | Structural route handler exposed by the implemented worker router. |
| `WorkersRouter` | type alias | Structural worker router returned after binding a context. |

#### Trigger procedures (RPC routes)

`workersContract` exposes two enqueue procedures. A generated typed client
(`createServiceClient<typeof workersContract>({ contract: workersContract, serviceName:
'workers-api', routerName: 'workers' })`) reaches them over `/api/rpc/*`; the same routes answer
REST callers under `/api/v1/workers/...`. For each, the `{id}` path segment is the single source
of truth for the target — a request-body `id` is optional and ignored when sent, and a missing id
short-circuits to a typed `VALIDATION_ERROR` (HTTP 422) via the centralized `validationFailed`
contract helper before any KV write.

| Procedure | Route | Input (`JobTriggerInput` / `TaskTriggerInput`) | Output |
| --- | --- | --- | --- |
| `triggerJob` | `POST /jobs/{id}/trigger` | `{ id, payload?, priority?, delay?, correlationId?, traceparent?, tracestate? }` | `{ jobId, triggered }` |
| `triggerTask` | `POST /tasks/{id}/trigger` | `{ id, payload?, priority?, delay?, correlationId? }` | `{ taskId, triggered }` |

See the [background-jobs capability page](/capabilities/background-jobs/#trigger-a-job-from-a-typed-client)
for the typed-client walkthrough.

### `@netscript/plugin-workers/scaffolding`

| Symbol | Kind | Description |
| --- | --- | --- |
| `JobBuilderScaffolder` | class | Scaffold a worker job builder module. |
| `JobHandlerScaffolder` | class | Scaffold a standalone worker job handler module. |
| `DenoTaskScaffolder` | class | Scaffold a Deno task definition module. |
| `PsTaskScaffolder` | class | Scaffold a PowerShell task script. |
| `PythonTaskScaffolder` | class | Scaffold a Python task script. |
| `ShellTaskScaffolder` | class | Scaffold a POSIX shell task script. |
| `WorkflowScaffolder` | class | Scaffold a worker workflow definition module. |
| `WorkersItemScaffolder` | class | Stub-only contract for generated workers items. |
| `createWorkersItemScaffolders` | function | Create all first-party workers item scaffolders. |
| `WORKERS_TASK_SCAFFOLD_RUNTIMES` | variable | Task runtimes covered by first-party workers scaffolding templates. |
| `WorkersScaffoldInput` | interface | Input accepted by workers item scaffolders. |
| `WorkersTaskScaffoldRuntime` | type alias | First-party task runtime scaffold kind. |

### `@netscript/plugin-workers/services`

| Symbol | Kind | Description |
| --- | --- | --- |
| `PluginServiceContext` | interface | Context supplied to a plugin service at runtime. |
| `default` | function | Starts the Workers API service using host-provided infrastructure. |

### `@netscript/plugin-workers/streams`

Browser-facing StreamDB factory and the entity schemas mirrored from worker execution state.

| Symbol | Kind | Description |
| --- | --- | --- |
| `createWorkersStreamDB` | function | Create a TanStack DB-backed StreamDB for worker execution and job entities. |
| `WorkerExecution` | type alias | Worker execution entity stored in the durable stream. |
| `WorkerJob` | type alias | Worker job entity stored in the durable stream. |
| `WorkersStreamDB` | type alias | Browser-facing StreamDB surface returned by the workers stream factory. |
| `WorkerExecutionSchema` | variable | Stream entity schema for worker executions. |
| `WorkerJobSchema` | variable | Stream entity schema for worker jobs. |
| `workersStreamSchema` | variable | Stream schema definition for worker executions and jobs. |
| `StreamSchemaDefinition` | type alias | Structural stream schema definition map. |
| `WorkersStreamDefinition` | type alias | Durable stream definition for worker execution and job entities. |
| `WorkersStreamSchema` | type alias | Package-owned structural workers stream schema surface. |
| `WorkerStreamCollectionDefinition` | interface | Package-owned structural stream collection definition. |
| `WorkerStreamEntitySchema` | interface | Package-owned structural schema surface for worker stream entities. |
| `WorkerStreamStandardSchema` | interface | Standard Schema compatible public schema surface for stream entities. |

### `@netscript/plugin-workers/streams/server`

Server-side wiring that mirrors execution-state changes into the durable stream producer.

| Symbol | Kind | Description |
| --- | --- | --- |
| `createStreamMutationHook` | function | Create an ExecutionState mutation hook that publishes to the durable stream. |
| `emitJobToStream` | function | Emit a job entity to the durable stream. |
| `getWorkersStreamProducer` | function | Get (or create) the singleton workers execution stream producer. |
| `ExecutionConcept` | type alias | Execution concept discriminator. |
| `ExecutionMutationHook` | type alias | Hook invoked after execution state mutations. |
| `ExecutionRecord` | type alias | Worker execution record stored in KV. |
| `ExecutionStatus` | type alias | Execution status discriminator. |
| `ExecutionTriggerType` | type alias | Execution trigger discriminator. |
| `WorkersStreamProducer` | type alias | Durable stream producer type for the workers stream schema. |
| `WorkerExecutionSchema` | variable | Stream entity schema for worker executions. |
| `WorkerJobSchema` | variable | Stream entity schema for worker jobs. |
| `workersStreamSchema` | variable | Stream schema definition for worker executions and jobs. |
| `StreamSchemaDefinition` | type alias | Structural stream schema definition map. |
| `WorkerExecution` | type alias | Worker execution entity stored in the durable stream. |
| `WorkerJob` | type alias | Worker job entity stored in the durable stream. |
| `WorkersStreamDefinition` | type alias | Durable stream definition for worker execution and job entities. |
| `WorkersStreamSchema` | type alias | Package-owned structural workers stream schema surface. |
| `WorkerStreamCollectionDefinition` | interface | Package-owned structural stream collection definition. |
| `WorkerStreamEntitySchema` | interface | Package-owned structural schema surface for worker stream entities. |
| `WorkerStreamStandardSchema` | interface | Standard Schema compatible public schema surface for stream entities. |

### `@netscript/plugin-workers/worker`

The long-running runtime processes: the `Worker` job/task consumer and the cron `Scheduler`.

| Symbol | Kind | Description |
| --- | --- | --- |
| `ScheduledJobInfo` | interface | Scheduled job info. |
| `Scheduler` | class | Scheduler process that loads scheduled jobs and dispatches cron ticks. |
| `SchedulerOptions` | interface | Scheduler configuration options. |
| `JobContext` | type alias | Context supplied to runtime job handlers. |
| `JobDefinition` | type alias | Runtime job definition. |
| `JobHandler` | type alias | Function that executes a runtime job. |
| `JobResult` | type alias | Result returned by runtime job handlers. |
| `RuntimePermissions` | type alias | Runtime permission bag accepted by task and job execution. |
| `RuntimePermissionValue` | type alias | Runtime permission value accepted by task and job execution. |
| `StaticJobRegistry` | type alias | Registry of statically imported runtime job handlers. |
| `TaskDefinition` | type alias | Runtime task definition. |
| `TaskExecutionOptions` | type alias | Options supplied when executing a task. |
| `WorkerCronJob` | interface | Cron job handle used by the workers scheduler. |
| `WorkerCronScheduler` | interface | Cron scheduler surface consumed by the workers scheduler. |
| `WorkerSchedulerExecutionState` | interface | Execution-state surface consumed by the workers scheduler. |
| `WorkerSchedulerJobRegistry` | interface | Job registry surface consumed by the workers scheduler. |
| `Worker` | class | Worker process that consumes queued jobs and tasks for one runtime instance. |
| `QueueTriggerConfig` | interface | Configuration for a queue that triggers a job when messages arrive. |
| `WorkerCompleteExecutionOptions` | type alias | Options for completing a worker execution record. |
| `WorkerCreateExecutionOptions` | type alias | Options for creating a worker execution record. |
| `WorkerExecutionRecord` | interface | Execution record returned by the worker execution-state port. |
| `WorkerExecutionState` | interface | Execution-state surface consumed by the worker process. |
| `WorkerHealthStatus` | interface | Health snapshot for a worker runtime. |
| `WorkerJobRegistry` | interface | Job registry surface consumed by the worker process. |
| `WorkerOptions` | interface | Worker configuration options. |
| `WorkerPayloadSchema` | interface | Structural validation schema accepted by worker queue triggers. |
| `WorkerTaskExecutor` | interface | Task executor surface consumed by the worker process. |
| `WorkerTaskRegistry` | interface | Task registry surface consumed by the worker process. |
| `WorkerTaskResult` | type alias | Task execution result surface consumed by the worker process. |
| `WorkerPoolOptions` | type alias | Options for the plugin-layer in-process job runner pool. |

## Internals: `@netscript/plugin-workers-core` {#internals-netscriptplugin-workers-core}

> **Internals.** The `@netscript/plugin-workers-core` package holds the reusable worker
> definition builders, runtime composition, registries, executors, and testing primitives that
> `@netscript/plugin-workers` binds to the host. It is published separately and may be imported
> directly, but most applications consume it through the plugin above (US-8). The surface below
> is generated from its own `deno doc` exports.

### `@netscript/plugin-workers-core`

Root entrypoint: the thin public definition builders, runtime starters, and inspection helpers.

| Symbol | Kind | Description |
| --- | --- | --- |
| `defineJob` | function | Start a worker job definition chain. |
| `defineTask` | function | Start a worker task definition chain. |
| `defineWorkflow` | function | Start a worker workflow definition chain. |
| `cron` | variable | Cron schedule helpers for worker jobs. |
| `permissions` | variable | Permission presets for worker jobs and tasks. |
| `defineJobHandler` | function | Define a worker job handler. |
| `createWorkersRuntime` | function | Create a fresh workers runtime from explicit dependencies. |
| `createFailureResult` | function | Create a failed job result. |
| `createSuccessResult` | function | Create a successful job result. |
| `startWorkers` | function | Create and start a workers runtime using default composition. |
| `inspectJob` | function | Inspect a job definition without starting a runtime. |
| `inspectTask` | function | Inspect a task definition without starting a runtime. |
| `inspectWorkflow` | function | Inspect a workflow definition without starting a runtime. |
| `JobId` | type alias | Branded worker job identifier. |
| `TaskId` | type alias | Branded worker task identifier. |
| `CronHelpers` | type alias | Cron schedule helper surface for worker jobs. |
| `PermissionPresets` | type alias | Worker permission preset surface for common job execution modes. |
| `JobBuilder` | interface | Root-surface job builder typestate API. |
| `JobDefinition` | type alias | Root-surface job definition derived from the thin public schema. |
| `JobHandlerContext` | type alias | Context passed to root-surface job handlers. |
| `JobResult` | type alias | Result returned by worker job handlers. |
| `TaskBuilder` | interface | Root-surface task builder typestate API. |
| `TaskDefinition` | type alias | Root-surface task definition derived from the thin public schema. |
| `WorkflowBuilder` | interface | Root-surface workflow builder typestate API. |
| `WorkflowDefinition` | type alias | Root-surface workflow definition derived from the thin public schema. |

### `@netscript/plugin-workers-core/builders`

Typestate builders for jobs, tasks, and workflows.

| Symbol | Kind | Description |
| --- | --- | --- |
| `defineJob` | function | Start a worker job definition chain. |
| `JobBuilder` | interface | Typestate builder interface for job definitions. |
| `JobBuilderState` | type alias | Job builder state used to gate `build()`. |
| `RetryOptions` | type alias | Retry configuration options for job definitions. |
| `JobRetentionOptions` | type alias | Execution retention settings for job definitions. |
| `defineTask` | function | Start a worker task definition chain. |
| `TaskBuilder` | interface | Typestate builder interface for task definitions. |
| `TaskBuilderState` | type alias | Task builder state used to gate `build()`. |
| `defineWorkflow` | function | Start a worker workflow definition chain. |
| `WorkflowBuilder` | interface | Typestate builder interface for workflow definitions. |
| `WorkflowBuilderState` | type alias | Workflow builder state used to gate `build()`. |
| `WorkflowJobStepOptions` | type alias | Options for adding a job-backed workflow step. |
| `WorkflowTaskStepOptions` | type alias | Options for adding a task-backed workflow step. |
| `BuilderPermissions` | interface | Deno permission set accepted by job and task builders. |
| `BuilderPermissionValue` | type alias | Permission value accepted by job and task builders. |
| `BuilderTaskType` | type alias | Runtime used to execute a task built by the task builder. |
| `JobDefinition` | interface | Public job definition produced by the job builder. |
| `JobHandler` | type alias | Function that executes a job. |
| `JobHandlerContext` | interface | Context passed to job handlers declared with the builder. |
| `JobId` | type alias | Branded worker job identifier used by builder surfaces. |
| `JobResult` | type alias | Worker job handler result. |
| `TaskDefinition` | interface | Public task definition produced by the task builder. |
| `TaskHandler` | type alias | Function that executes a task. |
| `TaskId` | type alias | Branded worker task identifier used by builder surfaces. |
| `WorkflowDefinition` | interface | Public workflow definition produced by the workflow builder. |
| `WorkflowId` | type alias | Branded worker workflow identifier used by builder surfaces. |
| `WorkflowStep` | type alias | Single workflow step produced by the workflow builder. |
| `CronExpression` | type alias | Cron expression type used by worker schedules. |

### `@netscript/plugin-workers-core/contracts/v1`

Versioned worker service contract schemas and types (the source of the plugin contracts export).

| Symbol | Kind | Description |
| --- | --- | --- |
| `ExecutionFiltersSchema` | variable | Schema for list-executions filters. |
| `ExecutionRecordResponseSchema` | variable | Schema for worker execution record responses. |
| `JobCreateInputSchema` | variable | Schema for creating worker job definitions. |
| `JobDefinitionResponseSchema` | variable | Schema for worker job definition responses. |
| `JobFiltersSchema` | variable | Schema for list-jobs filters. |
| `JobTriggerInputSchema` | variable | Schema for triggering a worker job by id. |
| `JobUpdateInputSchema` | variable | Schema for updating worker job definitions. |
| `JobUpdateWithIdSchema` | variable | Schema for updating a worker job definition by id. |
| `SSEEventSchema` | variable | Schema for server-sent event payloads emitted by the workers service. |
| `TaskDefinitionResponseSchema` | variable | Schema for worker task definition responses. |
| `TaskFiltersSchema` | variable | Schema for list-tasks filters. |
| `workersContract` | variable | Worker service contract definition for client generation. |
| `workersContractV1` | variable | Context-bindable worker service contract definition. |
| `ContractProcedureLike` | type alias | Structural oRPC procedure reference used by worker contracts. |
| `ContractSchema` | interface | Package-owned structural schema surface for worker contracts. |
| `ContractSchemaResult` | type alias | Result returned by contract schema validation. |
| `ExecutionRecordResponse` | type alias | Public response returned for worker execution records. |
| `JobDefinitionResponse` | type alias | Public response returned for worker job definitions. |
| `JobTriggerInput` | type alias | Input accepted by the trigger-job procedure. |
| `JobTriggerOutput` | type alias | Output returned by the trigger-job procedure. |
| `SSEEvent` | type alias | Server-sent event payload emitted by the workers service. |
| `StandardSchemaLike` | type alias | Structural Standard Schema reference used by contract metadata. |
| `TaskDefinitionResponse` | type alias | Public response returned for worker task definitions. |
| `TaskTriggerInput` | type alias | Input accepted by the trigger-task procedure. |
| `TaskTriggerOutput` | type alias | Output returned by the trigger-task procedure. |
| `WorkersContract` | type alias | Explicit public contract shape for worker service clients. |
| `WorkersContractV1` | type alias | Context-binding contract wrapper for the v1 worker contract. |
| `WorkersRouteHandler` | type alias | Structural route handler exposed by the implemented worker router. |
| `WorkersRouter` | type alias | Structural worker router returned after binding a context. |

### `@netscript/plugin-workers-core/registry`

KV-backed and in-memory job/task registries.

| Symbol | Kind | Description |
| --- | --- | --- |
| `KvJobRegistry` | class | KV-backed job registry for runtime composition. |
| `KvTaskRegistry` | class | KV-backed task registry for runtime composition. |
| `MemoryJobRegistry` | class | In-memory job registry for tests and local composition. |
| `Registry` | class | Generic registry base for named worker definitions. |
| `JobFilterOptions` | type alias | Filters accepted when listing worker jobs. |
| `TaskFilterOptions` | type alias | Filters accepted when listing worker tasks. |
| `ExecutionRecord` | type alias | Execution record shape stored by job registries. |
| `JobDefinition` | type alias | Job definition shape stored by registries. |
| `JobSource` | type alias | Job source value accepted by registry filters. |
| `RegisterJobInput` | type alias | Input accepted when registering a job. |
| `RegisterTaskInput` | type alias | Input accepted when registering a task. |
| `RegistryJobStoragePort` | type alias | Storage contract implemented by job registries. |
| `RuntimePermissions` | type alias | Runtime permission bag accepted by registry task and job definitions. |
| `RuntimePermissionValue` | type alias | Runtime permission value accepted by registry task and job definitions. |
| `TaskDefinition` | type alias | Task definition shape stored by registries. |
| `TaskSource` | type alias | Task source value accepted by registry filters. |
| `KvEntry` | type alias | Deno KV-compatible entry shape. |
| `KvListSelector` | type alias | Deno KV-compatible list selector. |
| `RegistryKvStore` | interface | Minimal KV shape consumed by registry adapters. |
| `RegistryOptions` | type alias | Registry adapter options. |

### `@netscript/plugin-workers-core/state`

KV-backed worker execution-state store.

| Symbol | Kind | Description |
| --- | --- | --- |
| `KvExecutionState` | class | KV-backed execution state store with explicit construction. |
| `CompleteExecutionOptions` | type alias | Options for completing a worker execution record. |
| `CreateExecutionOptions` | type alias | Options for creating a worker execution record. |
| `ExecutionConcept` | type alias | Execution concept discriminator. |
| `ExecutionMutationHook` | type alias | Hook invoked after execution state mutations. |
| `ExecutionRecord` | type alias | Worker execution record stored in KV. |
| `ExecutionStatus` | type alias | Execution status discriminator. |
| `ExecutionTriggerType` | type alias | Execution trigger discriminator. |
| `ListExecutionOptions` | type alias | Options for listing worker execution records. |

### `@netscript/plugin-workers-core/executor`

Multi-runtime task executor and per-runtime adapters.

| Symbol | Kind | Description |
| --- | --- | --- |
| `TaskExecutor` | class | Stub-only contract for the workers task orchestrator. |
| `TaskRuntimeAdapter` | class | Stub-only contract for a single task runtime adapter. |
| `CmdRuntimeAdapter` | class | Runtime adapter for Windows cmd tasks. |
| `DaxProcessRunner` | class | Run task subprocesses through Dax with streaming output capture. |
| `DenoRuntimeAdapter` | class | Runtime adapter for Deno task scripts. |
| `DotNetRuntimeAdapter` | class | Runtime adapter for .NET task programs. |
| `ExecutableRuntimeAdapter` | class | Runtime adapter for direct executable tasks. |
| `PowerShellRuntimeAdapter` | class | Runtime adapter for PowerShell task scripts. |
| `PythonRuntimeAdapter` | class | Runtime adapter for Python task scripts. |
| `runProcess` | function | Run a subprocess through Dax with result capture and log callbacks. |
| `RuntimeAdapterBase` | class | Shared adapter delegation for built-in subprocess runtimes. |
| `ShellRuntimeAdapter` | class | Runtime adapter for POSIX or Git Bash shell scripts. |
| `EnvironmentReader` | type alias | Function used by command builders to read process environment. |
| `ProcessRunInput` | type alias | Process runner input shared by built-in runtime adapters. |
| `ProcessRunner` | interface | Subprocess primitive used by runtime adapters. |
| `RuntimeCommandBuildContext` | type alias | Context passed to runtime command builders. |
| `RuntimeCommandSpec` | type alias | Command and arguments prepared for a task runtime adapter. |
| `RuntimeTaskMetadata` | type alias | Runtime-specific task metadata recognized by built-in adapters. |
| `createDefaultRuntimeAdapterMap` | function | Create the default built-in runtime adapter map. |
| `createDefaultTaskExecutor` | function | Create the default executor with all built-in runtime adapters. |
| `MultiRuntimeTaskExecutor` | class | Dispatches task execution to runtime-specific adapters. |
| `ResolvedTaskExecutionOptions` | type alias | Execution options resolved by the task orchestrator before adapter dispatch. |
| `TaskDefinition` | type alias | Task definition shape consumed by executor adapters. |
| `TaskExecutionOptions` | type alias | Options supplied to a task execution. |
| `TaskInstrumentationLike` | type alias | Executor instrumentation hook shape. |
| `TaskInstrumentationSpan` | type alias | Span shape accepted by executor instrumentation hooks. |
| `TaskLogEntry` | type alias | Log entry emitted while a task subprocess is running. |
| `TaskResult` | type alias | Result returned by task execution. |
| `TaskRuntimeAdapterLike` | type alias | Task adapter contract consumed by the multi-runtime executor. |
| `TaskType` | type alias | Worker task runtime identifier supported by built-in adapters. |
| `WorkerTaskPermissionField` | type alias | Permission field accepted by Deno task execution. |
| `WorkerTaskPermissions` | type alias | Permission set accepted by Deno task execution. |
| `MultiRuntimeTaskExecutorOptions` | type alias | Options for the default multi-runtime task executor. |

### `@netscript/plugin-workers-core/workflow`

Workflow executor, step runner, and durable state store.

| Symbol | Kind | Description |
| --- | --- | --- |
| `defineWorkflow` | function | Start a worker workflow definition chain. |
| `WorkflowBuilder` | interface | Typestate builder interface for workflow definitions. |
| `WorkflowBuilderState` | type alias | Workflow builder state used to gate `build()`. |
| `WorkflowJobStepOptions` | type alias | Options for adding a job-backed workflow step. |
| `WorkflowTaskStepOptions` | type alias | Options for adding a task-backed workflow step. |
| `WorkflowExecutor` | class | Executes workflow definitions as explicit durable state machines. |
| `WorkflowExecutorOptions` | type alias | Options for creating a workflow executor. |
| `MemoryWorkflowStateStore` | class | In-memory workflow state store for tests and local runtime composition. |
| `WorkflowClock` | type alias | Clock contract used by workflow runtime code. |
| `WorkflowStateStore` | interface | Store contract for durable workflow state and routed events. |
| `WorkflowStepRunner` | class | Executes individual workflow steps through explicit runtime callbacks. |
| `WorkflowJobStepRunner` | type alias | Function that executes a job-backed workflow step. |
| `WorkflowStepRunnerOptions` | type alias | Options for executing workflow steps. |
| `WorkflowTaskStepRunner` | type alias | Function that executes a task-backed workflow step. |
| `JobId` | type alias | Branded worker job identifier used by builder surfaces. |
| `TaskId` | type alias | Branded worker task identifier used by builder surfaces. |
| `WorkflowDefinition` | interface | Public workflow definition produced by the workflow builder. |
| `WorkflowEvent` | type alias | Event routed to a workflow execution. |
| `WorkflowExecutionOptions` | type alias | Options supplied when starting a workflow execution. |
| `WorkflowExecutionStatus` | type alias | Workflow execution lifecycle status. |
| `WorkflowId` | type alias | Branded worker workflow identifier used by builder surfaces. |
| `WorkflowResults` | type alias | Map of workflow step results by step id. |
| `WorkflowState` | type alias | Durable workflow execution state. |
| `WorkflowStep` | type alias | Single workflow step produced by the workflow builder. |
| `WorkflowStepKind` | type alias | Workflow step kind. |
| `WorkflowStepResult` | type alias | Result produced by a workflow step. |
| `WorkflowStepStatus` | type alias | Workflow step lifecycle status. |

### `@netscript/plugin-workers-core/streams`

Server-side durable stream producer and execution-state mirror hooks.

| Symbol | Kind | Description |
| --- | --- | --- |
| `createStreamMutationHook` | function | Create a mutation hook that mirrors execution state into the durable stream. |
| `createWorkersStreamProducer` | function | Create a workers durable stream producer for execution and job entities. |
| `emitJobToStream` | function | Emit a job entity to the workers durable stream. |
| `toExecutionStreamEntity` | function | Convert an execution record into the durable stream execution entity shape. |
| `ExecutionMutation` | type alias | Execution-state mutation published to the workers durable stream. |
| `ExecutionMutationHook` | type alias | Hook called when execution state changes. |
| `WorkerExecutionRecord` | type alias | Execution record shape mirrored into the workers durable stream. |
| `WorkersStreamProducer` | type alias | Durable stream producer type for the workers stream schema. |
| `WorkersStreamProducerOptions` | type alias | Options for creating a workers durable stream producer. |
| `WorkerExecutionSchema` | variable | Stream entity schema for worker executions. |
| `WorkerJobSchema` | variable | Stream entity schema for worker jobs. |
| `workersStreamSchema` | variable | Stream schema definition for worker executions and jobs. |
| `StreamSchemaDefinition` | type alias | Structural stream schema definition map. |
| `WorkerExecution` | type alias | Worker execution entity stored in the durable stream. |
| `WorkerJob` | type alias | Worker job entity stored in the durable stream. |
| `WorkersStreamDefinition` | type alias | Durable stream definition for worker execution and job entities. |
| `WorkersStreamSchema` | type alias | Package-owned structural workers stream schema surface. |
| `WorkerStreamCollectionDefinition` | interface | Package-owned structural stream collection definition. |
| `WorkerStreamEntitySchema` | interface | Package-owned structural schema surface for worker stream entities. |
| `WorkerStreamStandardSchema` | interface | Standard Schema compatible public schema surface for stream entities. |

### `@netscript/plugin-workers-core/presets`

Default composition preset (`startWorkers`) and runtime port contracts.

| Symbol | Kind | Description |
| --- | --- | --- |
| `startWorkers` | function | Create and start a workers runtime using default composition. |
| `StartWorkersOptions` | type alias | Options for the default workers startup preset. |
| `ExecutionRecord` | type alias | Runtime execution record. |
| `JobContext` | type alias | Context supplied to runtime job handlers. |
| `JobDefinition` | type alias | Runtime job definition. |
| `JobHandler` | type alias | Function that executes a runtime job. |
| `JobMessage` | type alias | Message enqueued to trigger a job execution. |
| `JobResult` | type alias | Result returned by runtime job handlers. |
| `RuntimeJobStoragePort` | type alias | Runtime job storage contract. |
| `RuntimeSchedulerPort` | type alias | Runtime scheduler contract. |
| `RuntimeShutdownManager` | type alias | Runtime shutdown manager contract. |
| `RuntimeShutdownOptions` | type alias | Runtime shutdown configuration. |
| `RuntimeShutdownResource` | type alias | Resource managed during runtime shutdown. |
| `RuntimeTaskExecutor` | type alias | Runtime task executor contract. |
| `RuntimeTaskExecutorOptions` | type alias | Runtime task executor configuration. |
| `RuntimeWorkerPort` | type alias | Runtime worker dispatch contract. |
| `RuntimeWorkflowDefinition` | type alias | Runtime workflow definition accepted by composition. |
| `RuntimeWorkflowExecutor` | type alias | Runtime workflow executor contract. |
| `RuntimeWorkflowOptions` | type alias | Runtime workflow executor options. |
| `StaticJobRegistry` | type alias | Registry of statically imported runtime job handlers. |
| `TaskDefinition` | type alias | Runtime task definition. |
| `TaskExecutionOptions` | type alias | Options supplied when executing a task. |
| `TaskRegistryPort` | type alias | Registry contract for task definitions. |
| `TaskResult` | type alias | Result returned by task execution. |
| `WorkersClock` | type alias | Clock contract used by runtime tests and schedulers. |
| `WorkersRuntime` | type alias | Runtime handle returned by the workers composition root. |
| `WorkersRuntimeOptions` | type alias | Explicit dependencies and overrides for a workers runtime instance. |
| `WorkflowId` | type alias | Runtime workflow identifier. |

### `@netscript/plugin-workers-core/shutdown`

Graceful shutdown manager for runtime resources.

| Symbol | Kind | Description |
| --- | --- | --- |
| `ShutdownManager` | class | Coordinates graceful shutdown for runtime resources. |
| `ShutdownManagerOptions` | type alias | Options for creating or invoking a shutdown manager. |
| `ShutdownReport` | type alias | Result returned after a shutdown attempt. |
| `ShutdownResource` | type alias | Resource registered for graceful shutdown. |
| `ShutdownState` | type alias | Resource lifecycle state managed during shutdown. |

### `@netscript/plugin-workers-core/schemas`

Thin public definition schemas for the root quick-start surface.

| Symbol | Kind | Description |
| --- | --- | --- |
| `PublicStandardSchema` | interface | Standard Schema compatible public schema surface. |
| `PublicDefinitionSchemaShape` | type alias | Structural object-shape map used by public definition schemas. |
| `PublicDefinitionSchema` | interface | Package-owned structural schema surface for public definition schemas. |
| `PublicJobDefinitionOutput` | type alias | Thin public job definition output. |
| `PublicTaskDefinitionOutput` | type alias | Thin public task definition output. |
| `PublicWorkflowDefinitionOutput` | type alias | Thin public workflow definition output. |
| `JobDefinitionPublicBaseSchema` | variable | Public base schema for thin job definitions. |
| `TaskDefinitionPublicBaseSchema` | variable | Public base schema for thin task definitions. |
| `WorkflowDefinitionPublicBaseSchema` | variable | Public base schema for thin workflow definitions. |
| `PublicJobDefinitionSchema` | variable | Thin public job definition schema for root-level quick-start APIs. |
| `PublicTaskDefinitionSchema` | variable | Thin public task definition schema for root-level quick-start APIs. |
| `PublicWorkflowDefinitionSchema` | variable | Thin public workflow definition schema for root-level quick-start APIs. |

### `@netscript/plugin-workers-core/telemetry`

Worker telemetry span/attribute names and instrumentation classes.

| Symbol | Kind | Description |
| --- | --- | --- |
| `WorkerSpanNames` | variable | Worker telemetry span names. |
| `WorkerTelemetryAttributes` | variable | Worker telemetry attribute names. |
| `WorkerTelemetryEvents` | variable | Worker telemetry event names. |
| `WorkerTelemetryStatuses` | variable | Worker execution statuses used in telemetry attributes. |
| `WorkerSpanName` | type alias | Worker telemetry span name. |
| `WorkerTelemetryAttribute` | type alias | Worker telemetry attribute name. |
| `WorkerTelemetryEvent` | type alias | Worker telemetry event name. |
| `WorkerTelemetryStatus` | type alias | Worker telemetry status. |
| `applyWorkerInstrumentations` | function | Applies a set of worker instrumentation instances to a span. |
| `JobExecuteInstrumentation` | class | Adds common job execution attributes and lifecycle events. |
| `JobMainInstrumentation` | class | Adds job-main attributes used inside a job handler span. |
| `QueueDequeueInstrumentation` | class | Adds queue dequeue attributes for consumer spans. |
| `QueueEnqueueInstrumentation` | class | Adds queue enqueue attributes for producer spans. |
| `TaskExecuteInstrumentation` | class | Adds task execution attributes and lifecycle events. |
| `WorkerInstrumentation` | class | Base class for workers telemetry instrumentation. |
| `TaskInstrumentation` | class | Stub-only contract for task-scoped worker telemetry instrumentation. |
| `AbstractWorkerInstrumentation` | class | Stub-only contract for worker telemetry instrumentation. |
| `AbstractWorkerInstrumentationContext` | type alias | Context supplied to worker instrumentation hooks. |
| `AbstractWorkerInstrumentationSpan` | type alias | Span shape accepted by worker instrumentation hooks. |
| `InstrumentationContext` | type alias | Context passed to worker instrumentation instances. |
| `TelemetryAttributes` | type alias | Attribute map accepted by worker telemetry instrumentation. |
| `TelemetryAttributeValue` | type alias | Attribute value accepted by worker telemetry instrumentation. |
| `WorkerTelemetrySpan` | interface | Structural span contract used by workers core without binding to one tracer package. |

### `@netscript/plugin-workers-core/abstracts`

Stub-only abstract contracts shared across worker subsystems.

| Symbol | Kind | Description |
| --- | --- | --- |
| `JobDispatcher` | class | Stub-only contract for job dispatchers. |
| `JobLifecycleAdapter` | class | Stub-only contract for job lifecycle adapters. |
| `JobScheduler` | class | Stub-only contract for job schedulers. |
| `Registry` | class | Stub-only contract for keyed workers registries. |
| `TaskInstrumentation` | class | Stub-only contract for task-scoped worker telemetry instrumentation. |
| `TaskExecutor` | class | Stub-only contract for the workers task orchestrator. |
| `TaskRuntimeAdapter` | class | Stub-only contract for a single task runtime adapter. |
| `WorkerInstrumentation` | class | Stub-only contract for worker telemetry instrumentation. |
| `CliCommand` | class | Stub-only base contract for CLI command implementations. |
| `WorkersCommand` | class | Stub-only contract for workers CLI commands. |
| `WorkersItemScaffolder` | class | Stub-only contract for generated workers items. |
| `DisposeContext` | interface | Job disposal context. |
| `InitContext` | interface | Job initialization context. |
| `DispatchContext` | interface | Runtime dispatch context supplied to scheduled jobs. |
| `ExecutionContext` | interface | Execution context shared by worker runtime dispatchers. |
| `ResolvedTaskExecutionOptions` | type alias | Execution options resolved by the task orchestrator before adapter dispatch. |
| `RuntimeTaskMetadata` | type alias | Runtime-specific task metadata recognized by built-in adapters. |
| `TaskDefinition` | type alias | Task definition shape consumed by executor adapters. |
| `TaskExecutionOptions` | type alias | Options supplied to a task execution. |
| `TaskLogEntry` | type alias | Log entry emitted while a task subprocess is running. |
| `TaskResult` | type alias | Result returned by task execution. |
| `TaskType` | type alias | Worker task runtime identifier supported by built-in adapters. |
| `WorkerTaskPermissionField` | type alias | Permission field accepted by Deno task execution. |
| `WorkerTaskPermissions` | type alias | Permission set accepted by Deno task execution. |
| `JobContext` | type alias | Context supplied to runtime job handlers. |
| `JobDefinition` | type alias | Runtime job definition. |
| `JobHandler` | type alias | Function that executes a runtime job. |
| `JobResult` | type alias | Result returned by runtime job handlers. |
| `WorkerInstrumentationContext` | type alias | Context supplied to worker instrumentation hooks. |
| `WorkerInstrumentationSpan` | type alias | Span shape accepted by worker instrumentation hooks. |
| `WorkersCommandDefinition` | interface | Definition supplied to worker CLI commands. |

### `@netscript/plugin-workers-core/testing`

Fixtures and memory-backed runtime for tests.

| Symbol | Kind | Description |
| --- | --- | --- |
| `createExecutionRecordFixture` | function | Create an execution record with realistic defaults. |
| `createJobFixture` | function | Create a runnable job definition for tests. |
| `createJobResultFixture` | function | Create a successful job result for fixture handlers. |
| `createTestWorkersRuntime` | function | Create a test runtime with memory-backed storage and worker ports. |
| `ExecutionRecordFixtureOptions` | type alias | Partial execution record fields used to override fixture defaults. |
| `JobFixtureOptions` | type alias | Options for creating a test job definition. |
| `TestWorkersRuntime` | type alias | Workers runtime fixture with direct access to memory ports. |
| `TestWorkersRuntimeOptions` | type alias | Options for creating a memory-backed workers runtime fixture. |
| `MemoryJobRegistry` | class | In-memory job registry for tests and local composition. |
| `MemoryJobStorage` | class | In-memory job storage for package consumers and tests. |
| `MemoryWorker` | class | In-memory worker port that records dispatches and executes registered handlers. |
| `MemoryWorkerDispatch` | type alias | Recorded memory-worker dispatch with the job, context, and result. |
| `MemoryWorkerOptions` | type alias | Options for constructing an in-memory worker. |
| `ExecutionRecord` | type alias | Execution record shape stored by job registries. |
| `RegistryJobDefinition` | type alias | Job definition shape stored by registries. |
| `RegistryJobSource` | type alias | Job source value accepted by registry filters. |
| `RegistryRegisterJobInput` | type alias | Input accepted when registering a job. |
| `Registry` | class | Generic registry base for named worker definitions. |
| `RegistryJobStoragePort` | type alias | Storage contract implemented by job registries. |
| `RuntimeExecutionRecord` | type alias | Runtime execution record. |
| `JobContext` | type alias | Context supplied to runtime job handlers. |
| `JobDefinition` | type alias | Runtime job definition. |
| `JobHandler` | type alias | Function that executes a runtime job. |
| `JobMessage` | type alias | Message enqueued to trigger a job execution. |
| `JobResult` | type alias | Result returned by runtime job handlers. |
| `RuntimeJobStoragePort` | type alias | Runtime job storage contract. |
| `RuntimeSchedulerPort` | type alias | Runtime scheduler contract. |
| `RuntimeShutdownManager` | type alias | Runtime shutdown manager contract. |
| `RuntimeShutdownOptions` | type alias | Runtime shutdown configuration. |
| `RuntimeShutdownResource` | type alias | Resource managed during runtime shutdown. |
| `RuntimeTaskExecutor` | type alias | Runtime task executor contract. |
| `RuntimeTaskExecutorOptions` | type alias | Runtime task executor configuration. |
| `RuntimeWorkerPort` | type alias | Runtime worker dispatch contract. |
| `RuntimeWorkflowDefinition` | type alias | Runtime workflow definition accepted by composition. |
| `RuntimeWorkflowExecutor` | type alias | Runtime workflow executor contract. |
| `RuntimeWorkflowOptions` | type alias | Runtime workflow executor options. |
| `StaticJobRegistry` | type alias | Registry of statically imported runtime job handlers. |
| `TaskDefinition` | type alias | Runtime task definition. |
| `TaskExecutionOptions` | type alias | Options supplied when executing a task. |
| `TaskRegistryPort` | type alias | Registry contract for task definitions. |
| `TaskResult` | type alias | Result returned by task execution. |
| `WorkersClock` | type alias | Clock contract used by runtime tests and schedulers. |
| `WorkersRuntime` | type alias | Runtime handle returned by the workers composition root. |
| `WorkersRuntimeOptions` | type alias | Explicit dependencies and overrides for a workers runtime instance. |
| `WorkflowId` | type alias | Runtime workflow identifier. |

### `@netscript/plugin-workers-core/config`

Worker config file schemas plus defineWorkers and defineJobs helpers.

| Symbol | Kind | Description |
| --- | --- | --- |
| `ConfigSchema` | interface | Package-owned structural schema type for worker config validation. |
| `ConfigSchemaResult` | type alias | Result returned by a package-owned schema parse attempt. |
| `JobConfigSchema` | variable | Worker job configuration schema. |
| `RetentionConfigSchema` | variable | Retention settings for worker job executions. |
| `JobConfig` | interface | Worker job configuration. |
| `RetentionConfig` | interface | Retention settings for worker job executions. |
| `WorkerConfigPermissions` | interface | Partial Deno permission set accepted by worker config files. |
| `WorkerConfigPermissionValue` | type alias | Permission value accepted by worker config files. |
| `WorkerJobSource` | type alias | Origin of a worker job definition. |
| `TaskConfigSchema` | variable | Runtime task configuration. |
| `TaskConfig` | interface | Runtime task configuration. |
| `WorkerTaskSource` | type alias | Origin of a worker task definition. |
| `WorkerTaskType` | type alias | Runtime used to execute a task. |
| `defineJobs` | function | Define a per-topic job array. |
| `defineWorkers` | function | Define a split worker config module. |
| `QueueProviderSchema` | variable | Queue provider configuration schema. |
| `ScalingConfigSchema` | variable | Per-topic scaling configuration schema. |
| `TopicRetentionConfigSchema` | variable | Per-topic retention policy schema. |
| `WorkerGroupSchema` | variable | Worker group configuration schema. |
| `WorkersConfigSchema` | variable | Workers plugin configuration schema. |
| `JobConfigInput` | type alias | Authoring form for a worker job before schema defaults are applied. |
| `QueueProvider` | type alias | Queue backend provider selector. |
| `QueueProviderData` | type alias | Queue backend provider selector. |
| `ScalingConfig` | type alias | Per-topic worker scaling configuration. |
| `ScalingConfigData` | interface | Per-topic worker scaling configuration. |
| `TopicRetentionConfig` | type alias | Per-topic worker retention configuration. |
| `TopicRetentionConfigData` | interface | Per-topic retention policy configuration. |
| `WorkerGroup` | type alias | Worker group configuration for a topic. |
| `WorkerGroupData` | interface | Worker group configuration for a topic. |
| `WorkersConfig` | type alias | Workers configuration section. |
| `WorkersConfigData` | interface | Workers configuration section. |
| `WorkersConfigInput` | interface | Authoring form for split worker config files before schema defaults are applied. |

### `@netscript/plugin-workers-core/runtime`

Runtime composition root, in-process job runner, and worker messaging types.

| Symbol | Kind | Description |
| --- | --- | --- |
| `DEFAULT_TOPIC` | variable | Default topic for jobs and tasks without explicit topic assignment. |
| `SSEEventTypes` | variable | SSE event names for real-time worker updates. |
| `createWorkersRuntime` | function | Create a fresh workers runtime from explicit dependencies. |
| `TaskRegistryPort` | type alias | Registry contract for task definitions. |
| `WorkersClock` | type alias | Clock contract used by runtime tests and schedulers. |
| `WorkersRuntime` | type alias | Runtime handle returned by the workers composition root. |
| `WorkersRuntimeOptions` | type alias | Explicit dependencies and overrides for a workers runtime instance. |
| `ExecutionRecord` | type alias | Runtime execution record. |
| `JobContext` | type alias | Context supplied to runtime job handlers. |
| `JobDefinition` | type alias | Runtime job definition. |
| `JobDispatcherOptions` | type alias | Options for resolving runtime job handlers. |
| `JobHandler` | type alias | Function that executes a runtime job. |
| `JobId` | type alias | Runtime job identifier. |
| `JobMessage` | type alias | Message enqueued to trigger a job execution. |
| `JobModuleImporter` | type alias | Dynamic runtime module importer. |
| `JobResolution` | type alias | Result of resolving a runtime job handler. |
| `JobResolutionSource` | type alias | Runtime job handler resolution source. |
| `JobResult` | type alias | Result returned by runtime job handlers. |
| `RegisterJobInput` | type alias | Input for registering a job definition. |
| `RegisterTaskInput` | type alias | Input for registering a task definition. |
| `RuntimeJobKvKeyFactories` | type alias | Public shape for runtime KV key factories. |
| `RuntimeJobStoragePort` | type alias | Runtime job storage contract. |
| `RuntimePermissions` | type alias | Runtime permission bag accepted by task and job execution. |
| `RuntimePermissionValue` | type alias | Runtime permission value accepted by task and job execution. |
| `RuntimeSchedulerPort` | type alias | Runtime scheduler contract. |
| `RuntimeShutdownManager` | type alias | Runtime shutdown manager contract. |
| `RuntimeShutdownOptions` | type alias | Runtime shutdown configuration. |
| `RuntimeShutdownResource` | type alias | Resource managed during runtime shutdown. |
| `RuntimeTaskExecutor` | type alias | Runtime task executor contract. |
| `RuntimeTaskExecutorOptions` | type alias | Runtime task executor configuration. |
| `RuntimeWorkerPort` | type alias | Runtime worker dispatch contract. |
| `RuntimeWorkflowDefinition` | type alias | Runtime workflow definition accepted by composition. |
| `RuntimeWorkflowExecutor` | type alias | Runtime workflow executor contract. |
| `RuntimeWorkflowOptions` | type alias | Runtime workflow executor options. |
| `StaticJobRegistry` | type alias | Registry of statically imported runtime job handlers. |
| `TaskDefinition` | type alias | Runtime task definition. |
| `TaskExecutionOptions` | type alias | Options supplied when executing a task. |
| `TaskId` | type alias | Runtime task identifier. |
| `TaskMessage` | type alias | Message enqueued to trigger a task execution. |
| `TaskResult` | type alias | Result returned by task execution. |
| `WorkflowId` | type alias | Runtime workflow identifier. |
| `JobKvKeys` | variable | KV key factories used by the runtime storage adapters. |
| `InProcessJobDispatcher` | class | Resolve job handlers from a static registry, definition, or explicit import fallback. |
| `InProcessJobRunner` | class | Registry-first job runner for tests, compiled binaries, and local composition. |
| `InProcessJobRunnerOptions` | type alias | Options for creating an in-process job runner. |
| `JOB_STATE_CHANNEL` | variable | Broadcast channel name for job execution state updates. |
| `ExecuteJobMessage` | type alias | Message sent to a runner to execute a job. |
| `JobCompleteMessage` | type alias | Message emitted when a job completes successfully. |
| `JobErrorMessage` | type alias | Message emitted when a job fails. |
| `JobLogMessage` | type alias | Message emitted for job logs. |
| `JobProgressMessage` | type alias | Message emitted to report job progress. |
| `StateUpdateMessage` | type alias | State update emitted by runtimes that expose execution progress. |
| `TerminateMessage` | type alias | Message used to stop a long-lived runner. |
| `WorkerInboundMessage` | type alias | Messages accepted by a job runner. |
| `WorkerOutboundMessage` | type alias | Messages emitted by a job runner. |

---

Back to the [reference overview](/reference/).
