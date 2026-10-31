# 2026-10-31 — file-watch idempotency (#2187)

File-watch observations need explicit change keys and zero completed retention by default. Complete stat snapshots hash [triggerId,path,kind,mtime,size]; incomplete snapshots use UUIDs. Active claims still exclude simultaneous true duplicates, and explicit TTLs retain their behavior. Preserve #2165 definition/event/header/fallback precedence.

Plan evaluation caught oversized path-bearing keys and insufficient negative-control isolation. Both changes reverted fail 15 tests; adapter-only fails 8; TTL-only fails 2. Sequential no-info changes alone cannot prove UUID necessity when completed TTL is already zero; concurrent distinct observations isolate it. Persisted same-snapshot restart isolates zero retention. Real filesystem, real adapter and disk KV coverage pass. Existing broad quality/doc-lint failures are documented separately from green scoped gates.
