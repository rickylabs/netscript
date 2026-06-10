# File Watching

File-watch triggers react to filesystem lifecycle events.

The definition belongs to core.

The production watcher adapter belongs to this plugin.

## Manifest Version

```ts
import { assertEquals } from 'jsr:@std/assert@^1';
import { TRIGGERS_PLUGIN_VERSION } from '../../mod.ts';

assertEquals(TRIGGERS_PLUGIN_VERSION, '0.1.0');
```

## Scaffold

Use the CLI to create a file-watch trigger file.

```sh
ns-triggers add file-watch import-dropbox --path=./imports --pattern="**/*.json"
```

The generated definition uses `defineFileWatch`.

The watcher adapter wraps `@netscript/watchers`.

The adapter preserves ignored patterns.

The adapter preserves debounce windows.

The adapter preserves stability thresholds.

## Testing

Use `MemoryFileWatcherAdapter` from core testing for unit tests.

Use plugin-level E2E tests only when exercising real service integration.
