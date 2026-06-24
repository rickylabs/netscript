# @netscript/queue

[![JSR](https://jsr.io/badges/@netscript/queue)](https://jsr.io/@netscript/queue)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**A provider-agnostic message-queue primitive for NetScript that enqueues and drains background jobs
through one `MessageQueue` contract, auto-discovering a Deno KV, Redis, RabbitMQ, or PostgreSQL
backend from the Aspire environment.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/queue

# Node.js / Bun
npx jsr add @netscript/queue
bunx jsr add @netscript/queue
```

### Usage

```typescript
import { createQueue } from '@netscript/queue';

// Auto-discovers a backend (RabbitMQ → Redis → Deno KV) from the Aspire environment.
const queue = createQueue<{ to: string; body: string }>('emails');

await queue.enqueue({ to: 'user@example.com', body: 'Welcome to NetScript.' });

await queue.listen(async (message) => {
  await sendWelcomeEmail(message.to, message.body);
});
```

For runtime schema validation at enqueue and dequeue time, define the contract with a Zod schema and
build a typed queue:

```typescript
import { z } from 'zod';
import { createTypedQueue } from '@netscript/queue';

const NotificationSchema = z.object({
  type: z.enum(['email', 'sms']),
  to: z.string(),
  body: z.string(),
});

const queue = createTypedQueue('notifications', NotificationSchema, {
  onValidationError: 'dlq',
});
```

---

## 📦 Key Capabilities

- **Unified contract**: Every backend implements the same `MessageQueue<T>` interface, so `enqueue`
  and `listen` call sites stay identical from an in-memory test adapter to a production broker.
- **Backend auto-discovery**: `createQueue` resolves RabbitMQ, Redis, Deno KV, or PostgreSQL from
  Aspire service URLs and environment variables, or pin one explicitly with `QueueProvider` plus
  `QueueConnectionOptions`.
- **Typed queues**: `createTypedQueue` adds Zod-backed validation on enqueue and dequeue, routing
  invalid messages to discard, throw, or the dead-letter store.
- **Durable dead letters**: Terminal failures are recorded through the `DeadLetterStorePort`
  contract, with KV, PostgreSQL, and Redis stores published under dedicated sub-path exports.
- **Lazy adapter graph**: The root export carries only factories, ports, errors, and validation
  helpers — Redis and RabbitMQ adapters resolve on first use, so common imports stay light.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/queue/](https://rickylabs.github.io/netscript/reference/queue/)
- **Background Processing**:
  [rickylabs.github.io/netscript/background-processing/](https://rickylabs.github.io/netscript/background-processing/)
- **Choose a queue provider**:
  [rickylabs.github.io/netscript/how-to/choose-a-queue-provider/](https://rickylabs.github.io/netscript/how-to/choose-a-queue-provider/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
