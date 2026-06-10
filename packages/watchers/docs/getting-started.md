# Getting Started

Create a watcher with paths, file patterns, and event kinds.

```ts
import { createWatcher } from '@netscript/watchers';

const watcher = createWatcher({
  paths: ['./incoming'],
  patterns: ['*.csv'],
  events: ['create'],
});

watcher.stop();
```

Use polling for network shares:

```ts
import { createWatcher } from '@netscript/watchers';

const watcher = createWatcher({
  paths: ['//fileserver/share/incoming'],
  forcePolling: true,
  pollIntervalMs: 3000,
});

watcher.stop();
```

Use direct filters when an adapter already owns the event source:

```ts
import { GlobFilter } from '@netscript/watchers';

const filter = new GlobFilter(['*.csv']);
console.log(filter.matches('/data/sales.csv'));
```

Required runtime permission:

```text
--allow-read
```
