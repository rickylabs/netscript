# Redis proof after receipt claims landed

Main's RedisAdapter.listen now claims through Lua rather than BRPOPLPUSH. Denying
BRPOPLPUSH silently stops injecting faults, even though the test still compiles.
Use an ephemeral ACL user and deny both EVAL/EVALSHA. Ack the previously delivered
message before installing the denial, then enqueue pending work so the next claim
actually attempts a write. Restore the two rights during gated backoff and demand
real delivery and an empty processing list. Never count a timeout as a valid
budget-exhaustion negative control; inspect its assertion and test name.

Typed QueueConnectionError uses QueueErrorCode.CONNECTION_FAILED. Classify that
published contract before message matching so PostgreSQL connection-not-found
errors and wrapped variants reach the fixed connection-unavailable health text.
