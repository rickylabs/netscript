# Watch listing test seams

Redis prefix watch discovery now uses scanEntries, a PRIVATE unordered single-pass path, to avoid
repeating ordered key selection for every poll. Tests that paused or counted kv.list must observe
actual SCAN cycles (cursor zero) and MGET replies through Redis.sendCommand instead. Existing
redis-watch_test.ts and redis-watch-discovery_test.ts contain startup/debounce/starvation tests;
preserve those assertions and move their IO pause/count seam rather than deleting the tests.
Real reproduction runs in a fresh subprocess with REDIS_SCAN_BATCH_SIZE=16 before imports.
