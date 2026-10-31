# Job DLQ and health seams

Job terminal failures use `Worker.deadLetters`, a `DeadLetterStorePort<JobMessage>` specialization. Its default KV namespace is `workers:job-dlq:<queue>`, separate from transport poison-message storage. deliveryCount records handler attempts; queueContext preserves the stable message id. Retain the claim through terminal persistence and release it in finally before propagating an outage. Shutdown requeues; explicit user cancellation acknowledges without a job dead letter.

Use Worker.readHealthStatus() for current durable depth; healthStatus is the synchronous listener/lifecycle snapshot. The generated onStarted reader awaits durable depth on each HTTP health request. The shared child transport now accepts sync or async readers, and rechecks terminal state after awaiting a reader.
