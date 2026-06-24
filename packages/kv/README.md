# @netscript/kv

[![JSR](https://jsr.io/badges/@netscript/kv)](https://jsr.io/@netscript/kv)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**A reactive key-value primitive for NetScript that exposes one `WatchableKv` contract over Deno KV,
Redis, and in-memory backends, with a shared lifecycle that auto-detects the active provider from
the environment.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/kv

# Node.js / Bun
npx jsr add @netscript/kv
bunx jsr add @netscript/kv
```

### Usage

```typescript
import { getKv } from '@netscript/kv';

// Resolve the shared adapter — auto-detects Redis, Deno KV, or in-memory
// from the environment and initializes once for the process.
const kv = await getKv();

await kv.set(['users', 'alice'], { name: 'Alice', role: 'admin' });

const entry = await kv.get<{ name: string; role: string }>(['users', 'alice']);
console.log(entry?.value.name); // "Alice"

// React to changes as they happen.
for await (const events of kv.watch([['users', 'alice']])) {
  for (const event of events) {
    console.log(event.type, event.key, event.value);
  }
}
```

The Redis adapter ships as a sub-path export. Import `@netscript/kv/redis` only when you need it —
the root entrypoint keeps the Redis driver out of your module graph.

---

## 📦 Key Capabilities

- **Unified store contract**: `KvStore` and `WatchableKv` give every backend the same `get` / `set`
  / `delete` / `list` / `atomic` surface, so adapters are interchangeable behind one type.
- **Shared lifecycle**: `getKv`, `getActiveProvider`, `resetKv`, and `closeKv` resolve a single
  adapter per process and let tests reset it deterministically.
- **Reactive reads**: `WatchableKv.watch` and `watchPrefix` stream `WatchEvent`s when observed keys
  change, on backends that support it.
- **Bundled adapters**: `DenoKvAdapter` and `MemoryKvAdapter` ship at the root; `RedisKvAdapter`
  (`@netscript/kv/redis`) self-registers the `'redis'` provider on import.
- **kvdex bridge**: `@netscript/kv/kvdex` exposes `createNetscriptDb` to run a typed
  [kvdex](https://jsr.io/@olli/kvdex) database over the active provider.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/kv/](https://rickylabs.github.io/netscript/reference/kv/)
- **Data & Persistence**:
  [rickylabs.github.io/netscript/data-persistence/](https://rickylabs.github.io/netscript/data-persistence/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
