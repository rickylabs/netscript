# Remote collection updates and locks

The lock records items, not collection keys. Read collection membership from catalog metadata,
qualify bare references at the client boundary, and intersect remote members with lock keys
before invoking install. Keep complete built-in collection semantics separate because existing
regressions require refusing partial built-in collections. Validate all requested names before
resolving item file bytes. UI-v2 tests use injected transport; protocol-command_test.ts runs the
real native CLI against an authenticated loopback registry and snapshots every app file.
