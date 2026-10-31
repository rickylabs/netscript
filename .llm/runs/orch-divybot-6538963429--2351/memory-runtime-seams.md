# Redis concurrency seam

Current Redis leases claim through Lua, not predecessor BRPOPLPUSH planning text. Worker heartbeats already live in plugins/workers/worker/delivery-lease.ts and call each MessageContext.extendVisibility. Preserve this division. Existing auto-ack passed the aborted intake signal into settle, so concurrency drain needs separate cancellation lifetimes. createQueue already enables TracedQueue automatically when telemetry is enabled; queue.enqueue injects its span as parent and queue.dequeue extracts it. Do not invent duplicate queue tracing.
