# Atomic lease implementation and first real-backend proof

The coordinator authorized a fresh plan cycle in PR #2483. It passed only after including
both Garnet Lua flags in all CLI launch modes. Garnet 2.2.1 rejects XAUTOCLAIM; use Lua.
Lease transitions are in adapters/_redis-lease-script.ts; the runtime keeps envelopes opaque
to Lua to preserve large JSON numbers. New keys retain receipt payload across process death.
The old blocking socket now owns bounded Lua transport; producer commands stay independent.

Structured redis-lease_test.ts with NETSCRIPT_TEST_REDIS_URL and NETSCRIPT_TEST_GARNET_URL:
10 passed, 1 CI-only sentinel ignored, exit 0. Includes real process kill/stop/replacement,
expiry delivery-limit DLQ, heartbeat and requeue nack counts. Whole queue source check
(excluding the two existing tests being adapted) also passed.

Independent review reproduced a >3-second outage permanently ending the first draft listener.
Keep bounded attempts for settlement, but loop availability loss for listener startup/pickup
with capped AbortSignal backoff. A half-closed ioredis object may say ready while retaining
an ended writable stream; reconnecting that same object did not recover. Replace the failed
generation with native duplicate() of its configured options, then close it on runtime stop.
Real TCP proxy outage and cancellation tests verify this on Redis and Garnet.
