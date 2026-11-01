# Real deadlines under FakeTime

`deadline()` uses the global clock, so an unadvanced FakeTime also freezes its
timeout. Use the upstream `FakeTime.restoreFor(() => deadline(pending, ms))`
while waiting; this restores real timers through completion and cleanup.

A native `AbortSignal.timeout` alone is insufficient when fake time leaves no
referenced real timer: Deno can fail with “Promise resolution is still pending
but the event loop has already resolved” before the abort timeout fires.

Abort the watch and tick fake time during cleanup so a prefix generator waiting
on its fake poll wakes before iterator.return. The missing-delivery negative
control suppresses atomic event dispatch and proves TimeoutError within two
real seconds, with no resource leak. The regular 12 cases still pass.
