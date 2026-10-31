# Real concurrent proof recipes

TracedQueue already emits producer/consumer spans and forwards ListenOptions. Use public getSpanId from @netscript/telemetry/context; bare @opentelemetry/api is not a queue-member dependency and no dependency addition is needed.

The telemetry runtime caches queue-domain tracers. A test that creates a fresh BasicTracerProvider per backend reuses a tracer bound to the already-shutdown first provider, so second-backend span counts are zero. Keep both real backends within one recording/provider lifetime; no production cache change is needed.

S2 proof uses three independent heartbeat deliveries in a real child process, holds a competing consumer for more than two original lease windows, kills the exact owned process, then verifies all three replacement IDs/count2 plus six refused stale ack/renew calls. Delayed latency is measured from the actual persisted sorted-set eligibility score. Environment profile goes through public createQueue, matching generated-worker construction. Optional scoped-env denial is a compatibility control, expected to pass original production too.
