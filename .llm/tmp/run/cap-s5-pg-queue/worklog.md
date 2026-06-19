# S5 PostgreSQL Queue Adapter Worklog

## Design

- **Public surface:** `createQueue<T>(name, { provider: QueueProvider.Postgres, connection })`
  returns a working `MessageQueue<T>` through the existing lazy factory. The new adapter is
  `PostgresAdapter<T>` under `packages/queue/adapters/` and is consumed by the factory; no root
  export changes are planned for this implementation-only slice.
- **Domain vocabulary:** reuse `MessageQueue<T>`, `MessageContext`, `EnqueueOptions`,
  `ListenOptions`, `QueueProvider.Postgres`, `QueueError`, and the existing queue envelope helpers.
- **Ports:** the package-owned `MessageQueue<T>` port remains unchanged. The adapter consumes a
  PostgreSQL client/pool capability shaped around `query()` and optional `end()` for test doubles.
- **Constants:** PostgreSQL queue table columns: queue name, message id, JSON payload envelope,
  headers, delivery count, enqueued timestamp, available timestamp, locked timestamp, and locked-by
  consumer id. Poll interval and visibility timeout defaults live in the adapter.
- **Commit slice:** one slice implements `PostgresAdapter`, wires `QueueProvider.Postgres` in
  `create-queue.ts`, adds a contract-level adapter test with a `pg` client double, updates package
  local check coverage if needed, records lock delta, commits, and pushes the explicit branch
  refspec.
- **Deferred scope:** no migrations package, no Aspire resource wiring, no README/doc updates, no
  catalog/version changes, and no PR opening. The adapter initializes its own table like the other
  self-contained queue adapters.
- **Contributor path:** read `ports/message-queue.ts` for the contract, `adapters/redis.adapter.ts`
  for settlement semantics, then `adapters/postgres.adapter.ts` for the SQL-backed implementation.

## Implementation Notes

- Selected archetype: ARCHETYPE-2 Integration (`@netscript/queue` wraps external queue backends
  behind a package-owned port).
- Existing adapter mirrored: `RedisAdapter`, because it owns envelope encoding, delayed delivery,
  claimed/processing state, automatic ack on handler success, and nack requeue behavior.
- Delivery pattern: PostgreSQL table-backed polling with `FOR UPDATE SKIP LOCKED` claims. This
  mirrors Redis ready/processing semantics while remaining self-contained in the queue adapter.

## Files Changed

- `packages/queue/adapters/postgres.adapter.ts` — new PostgreSQL-backed `MessageQueue<T>` adapter
  with table initialization, delayed availability, row claims, ack deletion, and nack release.
- `packages/queue/factory/create-queue.ts` — wires `QueueProvider.Postgres` to the adapter and uses
  existing `@netscript/sdk/discovery` PostgreSQL URI discovery.
- `packages/queue/tests/postgres-adapter_test.ts` — contract-level fake-client tests for
  publish/consume/ack, nack requeue, and factory regression away from the not-implemented stub.
- `packages/queue/deno.json` — adds `./adapters/postgres` and includes the adapter in package check.
- `deno.lock` — minimal `pg` resolution/scope lines only.

## Gate Results

| Gate | Command | Result |
| --- | --- | --- |
| Focused adapter test | `rtk proxy deno test --allow-env packages/queue/tests/postgres-adapter_test.ts` | PASS — 3 tests passed |
| Queue check | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/queue --ext ts,tsx` | PASS — 32 files selected, 0 occurrences |
| Queue lint | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/queue --ext ts,tsx` | PASS — 0 findings |
| Queue fmt check | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/queue --ext ts,tsx` | PASS — 0 findings |
| Lock delta | `git diff origin/main -- deno.lock` | PASS — only `npm:pg@^8.21.0` specifier and queue dependency lines |

## Lock Delta

`deno.lock` adds only:

- `npm:pg@^8.21.0`: `8.21.0`
- `packages/queue` dependency entry `npm:pg@^8.21.0`

During validation, Deno attempted to rewrite unrelated workspace package metadata into
`packageJson.dependencies` blocks for existing packages. Those hunks were restored and are recorded
in `drift.md`; they are not part of this slice.
- PGMQ considered after user prompt. It has the right conceptual model (visibility timeout, explicit
  delete/archive, delayed availability), but adopting it would require an extension or installed SQL
  objects. This slice keeps the adapter self-contained and uses only the already-catalogued `pg`
  dependency.

## Files Changed

| File | Purpose |
| --- | --- |
| `packages/queue/adapters/postgres.adapter.ts` | Adds `PostgresAdapter<T>` implementing `MessageQueue<T>` over a PostgreSQL table with ack/nack settlement. |
| `packages/queue/factory/create-queue.ts` | Replaces the `QueueProvider.Postgres` reject stub with lazy adapter creation and Aspire PostgreSQL URI discovery. |
| `packages/queue/deno.json` | Adds the `./adapters/postgres` subpath and includes the adapter in package-local check coverage. |
| `packages/queue/tests/postgres-adapter_test.ts` | Adds a `pg` client-double contract test for publish -> claim -> handle -> ack, nack requeue, and factory regression. |
| `deno.lock` | Adds only `npm:pg@^8.21.0` to the lock package map and the `packages/queue` dependency list. |

## Gate Results

| Gate | Command | Result |
| --- | --- | --- |
| Focused Postgres adapter tests | `rtk proxy deno test --allow-all packages/queue/tests/postgres-adapter_test.ts` | PASS, 3 tests |
| Scoped package check | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/queue --ext ts,tsx` | PASS, 32 files, 0 findings |
| Scoped package lint | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/queue --ext ts,tsx` | PASS, 32 files, 0 findings |
| Scoped package fmt check | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/queue --ext ts,tsx` | PASS, 32 files, 0 findings |
| Lock delta | `git diff --stat origin/main -- deno.lock` | PASS, `deno.lock | 4 +++-`; only `npm:pg@^8.21.0` and `packages/queue` pg dependency lines |

## Lock Hygiene

- A Deno run initially rewrote unrelated workspace lock metadata into `packageJson.dependencies`
  buckets. That churn was restored from `origin/main` and recorded in `drift.md`.
- Final `deno.lock` diff contains only:
  - `npm:pg@^8.21.0: 8.21.0`
  - `packages/queue` dependency list now includes `npm:pg@^8.21.0`
