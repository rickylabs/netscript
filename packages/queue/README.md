# @netscript/queue

Provider-agnostic message queues for NetScript and Deno applications, wrapping Deno KV, Redis,
RabbitMQ, and KV-polling backends behind a single `MessageQueue` contract.

## Install

```sh
deno add jsr:@netscript/queue
```

Provider adapters stay behind explicit subpath imports (`@netscript/queue/adapters/redis`,
`/adapters/amqp`, `/adapters/deno-kv`, `/adapters/kv-polling`); the root import keeps only the
core factories, types, errors, and validation helpers.

## Quick example

Use the root factory to auto-detect the best available backend, then enqueue and listen:

```ts
import { createQueue } from '@netscript/queue';

const queue = createQueue<{ to: string; body: string }>('emails');

await queue.enqueue({
  to: 'user@example.com',
  body: 'Welcome to NetScript.',
});

await queue.listen(async (message) => {
  await sendEmail(message.to, message.body);
});
```

Add runtime schema validation with `createTypedQueue()`, raise concurrency with
`createParallelQueue()`, or force a backend with `QueueProvider`.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/queue/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
