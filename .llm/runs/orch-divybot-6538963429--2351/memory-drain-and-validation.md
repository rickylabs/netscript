# Redis drain regression recipe

run-deno-check.ts includes --unstable-kv by default; it rejects a standalone --unstable-kv flag. Targeted source check uses --root packages/queue --ext ts.

Promise.race against a never-resolved abort promise per message retains callbacks for an entire long-lived listener. Use one replaceable completion notification and abortable(claim, settlementSignal), which removes listeners after IO, rather than races against each slow active task repeatedly.

Preserve synchronous producer-only shutdown disconnect: an unconditional await of optional listenerCompletion yields even when undefined and breaks delayed-promotion stop regressions. Only await when a listener exists. Consumer stop must still drain before closing its lease transport.

Old stop-inside-handler crash fixture intentionally leaves a recoverable claim. Do not turn it into a successful ack case; bounded self-drain consumes visibilityTimeout. A separate real-backend stop test proves completed handlers acknowledge during drain.
