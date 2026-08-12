---
layout: layouts/base.vto
title: "@netscript/plugin-workers"
---

# `@netscript/plugin-workers`

The NetScript background-workers plugin: background jobs, task execution, workflow
orchestration, a Workers API service, CLI commands, scaffolding, durable streams, and Aspire
process wiring. This page is written against the package public surface reported by `deno doc`.
For the full index of packages and plugins return to the
[reference overview](/reference/).

The deployable plugin (`@netscript/plugin-workers`) binds the host plugin system to the
reusable worker primitives that live in
[`@netscript/plugin-workers-core`](/reference/plugin-workers-core/). The plugin root
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

See the [background-jobs capability page](/background-processing/workers/#trigger-a-job-from-a-typed-client)
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

## Core package

The separately published
[`@netscript/plugin-workers-core`](/reference/plugin-workers-core/) page is canonical for worker
definition builders, runtime composition, registries, executors, streams, configuration, and testing
exports. This page stays focused on the deployable plugin's manifest and integration entrypoints. The
workflow example below uses core APIs intentionally; exhaustive core entrypoint and symbol tables
live only on its reference page.

## Resumable Workflows and Idempotent Resume

Durable workflows are defined using `defineWorkflow` and executed step-by-step using `WorkflowExecutor` (both from `@netscript/plugin-workers-core/workflow`). In the event of a step failure, operators can resume the workflow execution from the failed step while skipping already completed steps.

```ts
import { assertEquals } from "@std/assert";
import {
  defineWorkflow,
  WorkflowExecutor,
  MemoryWorkflowStateStore,
} from "@netscript/plugin-workers-core/workflow";
import type { TaskId } from "@netscript/plugin-workers-core/workflow";

Deno.test("WorkflowExecutor infrastructure-free testing and idempotent resume", async () => {
  const workflow = defineWorkflow("data-processing-pipeline")
    .taskStep("download", { taskId: "download-file" as TaskId })
    .taskStep("transform", { taskId: "transform-data" as TaskId })
    .build();

  const stateStore = new MemoryWorkflowStateStore();
  const executedSteps: string[] = [];
  let shouldFailTransform = true;

  // 1. Create a WorkflowExecutor with mock handlers for infrastructure-free testing
  const executor = new WorkflowExecutor({
    stateStore,
    runTaskStep: (step, _state) => {
      const taskId = step.taskId;
      executedSteps.push(taskId!);
      if (taskId === "transform-data" && shouldFailTransform) {
        return Promise.reject(new Error("Transform step failed!"));
      }
      return Promise.resolve({ success: true });
    },
  });

  // 2. Execute the workflow (it will fail on the transform step)
  const firstRunState = await executor.execute(workflow, {
    executionId: "pipeline-run-1",
  });

  assertEquals(firstRunState.status, "failed");
  assertEquals(firstRunState.currentStepIndex, 2); // Failed step is recorded, advancing cursor
  assertEquals(executedSteps, ["download-file", "transform-data"]);

  // 3. Reset the failure flag
  shouldFailTransform = false;
  executedSteps.length = 0; // Clear execution log

  // 4. Simulate operator intervention: reset failed step to replay/resume it
  const savedState = await stateStore.findState(workflow.id, "pipeline-run-1");
  if (savedState) {
    const resultsCopy = { ...savedState.results };
    delete resultsCopy.transform; // Remove the failed step result

    await stateStore.saveState({
      ...savedState,
      status: "pending",
      currentStepIndex: 1, // Set cursor back to the transform step index
      results: resultsCopy,
    });
  }

  // 5. Resume the workflow using the executor
  const resumedState = await executor.execute(workflow, {
    executionId: "pipeline-run-1",
  });

  assertEquals(resumedState.status, "completed");
  assertEquals(resumedState.currentStepIndex, 2); // Completed all 2 steps
  
  // Idempotency check: "download" step is skipped on resume, only "transform" is run
  assertEquals(executedSteps, ["transform-data"]);
});
```

---

Back to the [reference overview](/reference/).
