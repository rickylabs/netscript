# Golden reference — `t2-saga-queue-cron`

This withheld NetScript service implements the task's observable saga, queued-job, scheduled-trigger,
and restart-persistence contract. Conformance boots it with `defineService`, replays the frozen HTTP
suite, and reopens the same `@netscript/kv` file after restart.

It intentionally keeps orchestration deterministic at the HTTP boundary: events and the cron trigger
emit durable queued-job records synchronously, so conformance never waits for wall-clock cron or a
background worker race. The agent-facing rubric requires candidates to use the real saga, worker,
and scheduled-trigger primitives.

```sh
PORT=8080 NETSCRIPT_BENCH_KV_PATH=./t2.kv \
  deno run --allow-all --unstable-kv netscript/main.ts
```
