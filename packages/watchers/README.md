# @netscript/watchers

Composable file-watching runtime for NetScript: strategies, filters, stability checks, and
explicit stop semantics over local and network filesystems.

## Install

```sh
deno add jsr:@netscript/watchers
```

## Quick example

`createWatcher` builds a `FileWatcher` that selects a strategy automatically (native OS events
for local paths, polling for network paths) and streams normalized events through a glob,
stability, and dedup filter pipeline:

```ts
import { createWatcher } from '@netscript/watchers';

const watcher = createWatcher({
  paths: ['./incoming'],
  patterns: ['*.csv'],
  events: ['create', 'modify'],
  stabilityThreshold: { checkIntervalMs: 250, stableChecks: 2 },
});

for await (const event of watcher.watch()) {
  console.log(`${event.kind}: ${event.path}`);
  watcher.stop();
}
```

`watcher.stop()` is idempotent and also fires when a supplied `AbortSignal` is aborted, so plugin
runtimes can bind watcher lifetime to a larger supervisor. Force polling with `forcePolling: true`
for SMB/NFS shares where native events are unreliable.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/watchers/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
