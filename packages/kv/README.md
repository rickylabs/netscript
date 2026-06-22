# @netscript/kv

Reactive key-value storage with a unified API across Deno KV, Redis, and in-memory backends.

## Install

```sh
deno add jsr:@netscript/kv
```

The Redis adapter has an optional peer dependency on `ioredis`. Import `@netscript/kv/redis` only
when you need it — the root entrypoint keeps Redis out of your module graph.

## Quick example

Resolve the shared adapter — it auto-detects the best available backend from the environment and
falls back to local Deno KV with zero configuration:

```ts
import { getKv } from '@netscript/kv';

const kv = await getKv();

await kv.set(['users', 'alice'], { name: 'Alice', role: 'admin' });

const entry = await kv.get<{ name: string; role: string }>(['users', 'alice']);
console.log(entry?.value.name); // "Alice"

// React to changes in real time
for await (const events of kv.watch([['users', 'alice']])) {
  for (const event of events) {
    console.log(event.type, event.key, event.value);
  }
}
```

Use `MemoryKvAdapter` for process-local tests and `RedisKvAdapter` (from `@netscript/kv/redis`) for
an explicit Redis connection. `getKv()` selects Redis, Deno KV, or in-memory based on
`CACHE_PROVIDER`, Aspire service bindings, and connection-string environment variables.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/kv/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
- [Deno KV documentation](https://docs.deno.com/deploy/kv/manual/)
