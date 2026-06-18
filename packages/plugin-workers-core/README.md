# @netscript/plugin-workers-core

Job, task, workflow, runtime, configuration, and testing primitives for NetScript workers plugins.

## Install

```sh
deno add jsr:@netscript/plugin-workers-core
```

Specialized APIs are available through stable subpaths, for example:

```ts
import { workersContractV1 } from '@netscript/plugin-workers-core/contracts/v1';
import { createTestWorkersRuntime } from '@netscript/plugin-workers-core/testing';
```

## Quick example

Define a job and start an in-process workers runtime:

```ts
import { createSuccessResult, defineJob, startWorkers } from '@netscript/plugin-workers-core';

const job = defineJob('send-email')
  .handler(() => createSuccessResult({ sent: true }))
  .topic('workers.mail')
  .build();

const runtime = await startWorkers();
// runtime exposes start(), stop(reason?), and id.
await runtime.stop('done');
```

`startWorkers()` creates a fresh memory-backed runtime and starts it by default. Use
`createWorkersRuntime(options)` when tests or generated code need to supply explicit dependencies,
and `defineTask(id)` / `defineWorkflow(id)` to model command-like work and ordered step sequences.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/workers/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
