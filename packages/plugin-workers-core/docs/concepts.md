# Concepts

## Job

A job is a named unit of background work. It can point to an entrypoint or carry an in-memory
handler.

## Task

A task describes executable work such as a Deno script, Python script, shell command, or .NET
entrypoint.

## Workflow

A workflow is an ordered state machine over job and task steps.

## Runtime

A runtime is an explicit object returned by `createWorkersRuntime(options)`. It owns job storage,
task storage, worker dispatch, workflow execution, and shutdown coordination.

## Preset

`startWorkers(options)` is a small convenience wrapper around the runtime composition root.

## Testing

The testing subpath provides memory-backed ports and fixtures for local tests.
