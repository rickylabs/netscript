# File-watch metadata and policy

The native upstream watcher normally fills `fileInfo.modifiedAt` from Deno stat.mtime and size from stat.size. It can emit null metadata (including remove events); injected RuntimeWatchEvent permits incomplete info. Tests must drive WatchersFileWatcherAdapter, not MemoryFileWatcherAdapter. The core KV store already atomically removes active/completed keys on markCompleted(key, 0). FileWatchSpec omits deduplication, but FileWatchDefinition supports it through composition; avoid expanding the builder for this fix.
