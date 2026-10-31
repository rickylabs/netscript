# Redis lease review recovery recipes

- ioredis commandTimeout rejects with `Command timed out`, including a space. Availability
  classification must cover that spelling. A TCP proxy which drops replies while keeping the
  connection open proves the difference; connection-reset-only tests do not.
- ioredis keyPrefix changes script KEYS but not sorted-set member values. Keep deadline index
  members as logical receipt names supplied separately in ARGV so GET/ZREM prefix exactly once.
- Worker active idempotency markers default to 15 minutes. Queue redelivery alone is not proof
  of worker recovery: exercise processWorkerJob and processWorkerTask with the durable store.
  Same-message higher-generation takeover requires atomic KV checks and fenced owner tokens.
- First-party dispatch renews visibility before effects and every 20 seconds to 60 seconds;
  renewal false/error aborts execution. TaskExecutionOptions.signal reaches the real subprocess.
  The task listener must propagate retryable dispatch errors for the adapter to nack.
- Focused worker integration gate: structured run-deno-test.ts -- --allow-all --unstable-kv
  plugins/workers/worker/redis-worker-lease_test.ts. Supply both NETSCRIPT_TEST_REDIS_URL and
  NETSCRIPT_TEST_GARNET_URL. It kills actual consumer processes with persisted active markers,
  then checks a replacement delivery runs effects at count 2. Long-task tests take about
  72 seconds for both backends because each subprocess exceeds the default 30-second lease.

- Distinguish explicit Worker cancellation from queue lease loss: the former intentionally
  ACKs without poisoning the job DLQ (existing job-dead-letters_test.ts); the latter must
  leave recoverable work. Checking signal.aborted alone conflates them.
- Worker fixtures must live in worker/test_utils (already excluded by publish config), not
  an arbitrary worker/_fixtures directory which worker/**/*.ts would publish.
- Worker-core combined doc-lint has two unchanged private-type-ref baseline diagnostics in
  src/contracts/v1/workers.contract-types.ts; restoring original worker code confirms them.

- Redis adapter rethrows handler failures after nack. WorkerListenerSupervisor's restart count
  is lifetime-bounded (default3). Expected queue retry outcomes must explicitly context.nack
  and return normally; otherwise four ordinary messages can permanently stop a listener.
  Direct dispatcher consumers without queue context still reject failed replay attempts.

- Generator changes need generated-helpers-compile_test.ts in the validation set as well as
  emitted-string assertions. Its minimal Aspire SDK fixture must model each exercised real
  capability explicitly: container withArgs(string[]) is part of Aspire.Hosting 13.5.3.
  CI shard4 uploads test.report.json even when condensed logs omit the failure; download the
  specific gate-receipts artifact and read structured failures before guessing at the cause.

- Native DenoKvAdapter requeues only when its handler rejects. nack(requeue:true) is a no-op,
  so Redis's explicit-nack-and-normal-return policy must be guarded by extendVisibility capability.
  worker-kv-recovery_test.ts covers real native KV DLQ-outage and interrupted-task redelivery.
- Manual e2e-cli runs also exercise desktop-native. Its launcher cannot be inferred by removing
  three suffix characters from runtime path; native package dotted-version stems can differ.
  Resolve the unique executable sibling, excluding runtime and non-executable assets, and fail
  closed on zero/multiple candidates. Main manual run40539973506 proves the inherited failure.

- A resource state Finished is not a diagnosis. Existing E2E artifacts retained only describe
  readiness and omitted process console, leaving native Garnet failures unattributed. Capture
  bounded aspire logs for terminal expected resources before AppHost teardown, preserving the
  failed verdict and never retrying startup. The exact native/Garnet2.2.1+Lua launch and a
  minimal isolated Aspire13.5.3 AppHost can be probed separately without local scaffold.runtime.
