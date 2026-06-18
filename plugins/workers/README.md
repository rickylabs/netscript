# @netscript/plugin-workers

NetScript plugin for background job scheduling, task execution, and worker API endpoints.

`@netscript/plugin-workers` is the Tier 2 deployable plugin that binds the reusable worker
primitives in `@netscript/plugin-workers-core` to the host plugin system. It contributes a Workers
API service, background processors, stream topics, database schema, versioned API contracts, CLI
commands, scaffolding assets, and Aspire process wiring.

## Install

```sh
deno add jsr:@netscript/plugin-workers
```

The plugin exposes focused subpaths for each axis of the workers surface:

| Subpath            | Purpose                                |
| ------------------ | -------------------------------------- |
| `.`                | Plugin manifest and inspection surface |
| `./cli`            | Host CLI walker composition entrypoint |
| `./aspire`         | Aspire contribution class              |
| `./contracts`      | Workers API contract v1                |
| `./scaffolding`    | Side-effect-free source scaffolders    |
| `./services`       | Workers API service entrypoint         |
| `./streams`        | Stream integration entrypoint          |
| `./streams/server` | Stream mirror server integration       |
| `./worker`         | Worker and scheduler process classes   |

## Quick example

Register the plugin in `netscript.config.ts`, then inspect the manifest without invoking any
lifecycle hooks:

```ts
import { inspectWorkers, workersPlugin } from '@netscript/plugin-workers';

// Register the manifest with the host loader.
export default {
  plugins: [workersPlugin],
};

// Inspect declared dependencies and contribution axes (no runtime work runs).
const inspection = inspectWorkers(workersPlugin);
console.log(inspection.name, inspection.version);
console.log('axes:', inspection.axes.join(', '));
```

`workersPlugin` is the typed manifest authored with `definePlugin().with*().build()`. Loading the
package does not start a worker process; runtime work begins only when the host invokes a service,
background entrypoint, CLI command, or Aspire contribution. The core job DSL, task runtime
contracts, and workflow state contracts live in `@netscript/plugin-workers-core`.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/workers/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
- [Workers core package](https://rickylabs.github.io/netscript/reference/workers-core/)
