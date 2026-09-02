import type { ResourceUpdateFollower } from '../../../src/application/gates/scaffold/runtime/resource-state-stream.ts';

/** An in-memory follower whose NDJSON lines the test emits on its own schedule. */
export interface ControlledFollower {
  readonly follower: ResourceUpdateFollower;
  emit(rawLine: string): Promise<void>;
  wasKilled(): boolean;
}

export function createControlledFollower(): ControlledFollower {
  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();
  const status = Promise.withResolvers<{ success: boolean; code: number }>();
  let killed = false;
  let writerClosed = false;
  const closeWriter = () => {
    if (writerClosed) return;
    writerClosed = true;
    void writer.close().catch(() => undefined);
  };
  const follower: ResourceUpdateFollower = {
    stdout: stream.readable,
    stderr: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close();
      },
    }),
    status: status.promise,
    kill() {
      killed = true;
      closeWriter();
      status.resolve({ success: false, code: 143 });
    },
  };
  return {
    follower,
    async emit(rawLine) {
      await writer.write(new TextEncoder().encode(`${rawLine}\n`));
      await Promise.resolve();
    },
    wasKilled: () => killed,
  };
}
