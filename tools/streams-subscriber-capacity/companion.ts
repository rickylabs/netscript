/** Child process for the real Streams service, with read-only lifecycle observations. */
import { DurableStreamTestServer, FileBackedStreamStore } from 'npm:@durable-streams/server@0.3.9';
import { startStreamsService } from '@netscript/plugin-streams/service';
import { TextLineStream } from 'jsr:@std/streams@1/text-line-stream';

import { type CompanionMessage, type Lifecycle, MESSAGE_PREFIX } from './process.ts';

const LOOPBACK = '127.0.0.1';

function inspect(server: DurableStreamTestServer): Lifecycle {
  const responses: unknown = Reflect.get(server, 'activeSSEResponses');
  const waiters: unknown = Reflect.get(server.store, 'pendingLongPolls');
  const listener: unknown = Reflect.get(server, 'server');
  if (
    !(server.store instanceof FileBackedStreamStore) || !(responses instanceof Set) ||
    !Array.isArray(waiters) || listener === undefined
  ) {
    throw new Error('Expected the pinned upstream file store and lifecycle counters');
  }
  return {
    openSseResponses: responses.size,
    pendingWaiters: waiters.length,
    upstreamStopped: listener === null,
  };
}

function report(message: CompanionMessage): void {
  console.log(MESSAGE_PREFIX + JSON.stringify(message));
}

async function serve(): Promise<void> {
  // The factory owns the server instance and exposes only the front listener. Capture the
  // instance at startup, then restore the method before any measured work.
  let upstream: DurableStreamTestServer | undefined;
  const start = DurableStreamTestServer.prototype.start;
  DurableStreamTestServer.prototype.start = function (this: DurableStreamTestServer) {
    upstream = this;
    return start.call(this);
  };
  const service = await startStreamsService({
    auth: { public: true, reason: 'Isolated loopback benchmark with synthetic data' },
    serve: { hostname: LOOPBACK, port: 0, handleSignals: false },
  }).finally(() => {
    DurableStreamTestServer.prototype.start = start;
  });
  try {
    if (!upstream) throw new Error('Could not observe the factory-owned upstream instance');
    inspect(upstream);
    report({ kind: 'ready', port: service.addr.port });
    const commands = Deno.stdin.readable
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream());
    for await (const command of commands) {
      if (command !== 'snapshot') throw new Error('Unknown companion command');
      report({ kind: 'snapshot', lifecycle: inspect(upstream) });
    }
  } finally {
    await service.stop();
  }
  report({ kind: 'stopped', lifecycle: inspect(upstream) });
}

if (import.meta.main) await serve();
