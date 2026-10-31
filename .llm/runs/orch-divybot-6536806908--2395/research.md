# Research

- RedisAdapter currently BRPOPLPUSHes into a processing list, without a lease or recovery.
- handleEncodedMessage derives deliveryCount + 1 but nack requeues unchanged bytes, losing
  that count. Ack and nack are separate destructive commands without receipt fencing.
- ListenOptions already exposes visibilityTimeout. MessageContext has no heartbeat.
- KV polling increments attempts on claim, requeues on expiry, terminally dead-letters at
  maxAttempts; reason max_attempts_exceeded and standard dead-letter records are reusable.
- RedisDeadLetterStore uses netscript:dlq:<queue> LIST records with RPUSH ordering.
- Existing delayed promotion uses dedicated WATCH/MULTI fallback and connection epochs for
  Garnet without Lua; reuse the design, not its delayed-specific implementation.
- CI supplies NETSCRIPT_TEST_REDIS_URL for queue tests. Local Docker daemon is unavailable;
  an existing native Redis executable can start a separate run-owned backend.
- NetScript MCP find_guidance then search_docs consulted; local ports/source are the detailed
  contract authority. Prior memory confirms structured wrappers and Claude print launcher.
- No Acceptance checkboxes exist in the issue body; owner's behavior/proof bullets are the bar.

Second-cycle research: real Garnet 2.2.1 rejects XAUTOCLAIM; Redis 7 recognizes it.
Garnet transactional Lua TIME/TYPE succeeds with both Lua flags enabled. Official
configuration documents key locking. Retain LIST compatibility through native scripts.
