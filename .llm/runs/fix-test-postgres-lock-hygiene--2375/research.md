# Research

Current root catalog pins pg at ^8.23.1; root lock has npm:pg@^8.23.1, not ^8.21.0. The generated-health test rewrites its helper's dynamic bare pg import to npm:pg@^8.21.0. Runtime imports resolve through the root test process graph even though the scratch config says lock:false. This stale test-only override is the focused source of the reported lock mutation. Production generated helpers intentionally resolve bare pg from AppHost node_modules; that behavior is outside this repair.

MCP guidance/search were consulted first, but no lock-test seam was documented. Existing native Deno/catalog law supports deriving the test specifier from the root catalog, checking it exists in the lock, and proving a frozen-lock run. No registry requests, dependency updates or added imports are needed.
