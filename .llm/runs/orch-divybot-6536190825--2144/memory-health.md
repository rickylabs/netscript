# Worker health transport

`plugins/workers/bin/runtime.ts:startCombinedProcess` passes a synchronous child snapshot reader through onStarted. Generated runtime glue is in `plugins/workers/src/adapter/resources/glue/runtime.stub.ts`. The shared child health response serializes the supplied object, so structural snapshot extensions can carry DLQ details without changing listener-supervisor. Durable depth is asynchronous; initialization and refresh semantics must be explicit and tested.
