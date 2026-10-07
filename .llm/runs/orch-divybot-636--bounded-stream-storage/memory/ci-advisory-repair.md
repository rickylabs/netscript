# Critical proxy-addr audit repair

CI quality on 6aa1676 failed only audit:critical: GHSA-jqcg-44mw-7w3h, proxy-addr 2.0.7. deps:why must receive bare proxy-addr; npm: prefix produces an incorrect empty provenance result in this wrapper. The graph is @tanstack/ai-mcp -> @modelcontextprotocol/sdk -> express -> proxy-addr.

Native deno update --recursive --compatible --lockfile-only proxy-addr is a no-op for this transitive package. Removing its record makes the lock unreadable, so the original lock was restored immediately. Resolve ONLY the patched record via deno install --entrypoint --no-config --lockfile-only --lock "$TMPDIR/streams-proxy-patched.lock" npm:proxy-addr@2.0.8. Native Deno supplies its integrity and unchanged dependencies forwarded/ipaddr.js. Replace exactly the version key and integrity in the existing lock; do not add a direct import or change other resolutions. Confirm frozen installation and audit. No cache reload or lockfile deletion.
