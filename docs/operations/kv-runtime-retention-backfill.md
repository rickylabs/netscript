# Backfill legacy KV runtime retention

Run this checkout operator tool with a service identity that can open the saga and trigger Deno KV
stores. It is independent of HTTP reads and phone/web sessions. Configure the actual database paths;
pass the same path twice if both plugins share one store. This migration does not archive to Prisma.

Create a policy file matching the application's configured `completedDays` and `kvDays`, including
all topic overrides. Defaults are explicit so an operator never silently shortens a custom window.
For historical saga metadata without `sagaId`, the definition is the prefix before `:` in its
instance id, as in the native runtime identity.

```json
{
  "sagas": { "defaultDays": 7, "bySaga": { "checkout": 30 } },
  "triggers": { "defaultDays": 7, "byTrigger": { "nightly": 14 } }
}
```

```sh
deno run --unstable-kv --allow-read --allow-write --allow-env \
  tools/kv-runtime-retention/main.ts \
  --saga-kv saga.sqlite --trigger-kv trigger.sqlite --policy retention.json \
  --passes 100 --page-size 10 --migration legacy-terminal-v1
```

Each pass prints one JSON line with `pass`, `saga`, and `trigger`. Each plugin receipt reports
`done`, `scanned`, `changed`, `retained`, and `conflicted`. For example, once both scans have
finished:

```json
{
  "pass": 1,
  "saga": { "done": true, "scanned": 0, "changed": 0, "retained": 0, "conflicted": false },
  "trigger": { "done": true, "scanned": 0, "changed": 0, "retained": 0, "conflicted": false }
}
```

A pass reads at most ten entries per plugin family and uses native owner batch reads. Each atomic
page fits Deno KV's check, mutation, and byte limits even with full-size values. Index and replay
families precede canonical state so terminal ownership remains available during migration. Every
page checks the scanned values, canonical owners, and persisted checkpoint before committing its
mutations together. Concurrent rewrites produce `conflicted: true`, zero changes, and no checkpoint
advance. Re-run the same command to retry or resume after interruption. A successful process exit
means the requested passes ran; inspect both `done` fields to determine whether the scan completed.

The saga pass shares `SagaKvRetention` and `sagaRetentionRemaining` with forward writes. It visits
forward correlations (including legacy entries without a reverse index), reverse correlations,
transitions, applied replay keys, `saga_instances` documents, and canonical state. Trigger passes
use the forward-write deadline policy for event/index and DLQ/index families. Expired terminal
entries are deleted; terminal entries still within their window receive only the remaining absolute
TTL. [Deno KV expiry](https://docs.deno.com/deploy/kv/key_expiration/) is best effort: a key can
remain visible after its deadline. An expired migration pass deletes immediately; this tool does not
claim a strict wall-clock expiry guarantee for recent keys assigned TTL. Pending, running,
compensating, in-flight, and deferred state remains durable. A DLQ entry is retained while its
canonical event is open. Idempotency, defer scheduling, workers, and delayed-message queues are
outside this migration.

The checkpoint lives under each plugin's `retention-backfill/<migration>` key. A completed migration
is a no-op on subsequent invocations. To audit again (for example after importing another legacy
snapshot), supply a new migration identity. Do not remove existing runtime retention cursors.
Migration discovery does not enqueue or reset those cursors, and the existing saga background loop
continues draining any forward-write history backlog.

`retained` includes open entries and keys whose canonical owner is missing. Such orphan correlation,
transition, applied, or trigger-index keys do not prove terminal ownership and remain untouched. A
terminal saga read model can prove its own deadline when canonical state is absent. Inspect unknown
orphans separately; this command never infers terminality from age alone. Concurrent legacy imports
behind an already advanced checkpoint need a fresh migration identity. Online runtime writes already
apply their own retention policy. The broader issue #2109 remains open for unproven key families and
other migration paths.
