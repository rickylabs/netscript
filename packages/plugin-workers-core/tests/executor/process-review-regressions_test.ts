import { assertEquals, assertInstanceOf } from '@std/assert';
import { defineTask } from '../../src/builders/mod.ts';
import { OutputTail } from '../../src/executor/output-tail.ts';

Deno.test('review regression: empty and tiny output allocate only used ring capacity', () => {
  const NativeBytes = Uint8Array;
  const chunk = new TextEncoder().encode('ok');
  const allocations: number[] = [];
  // A typed constructor proxy observes allocation requests without replacing
  // byte semantics or escaping the constructor's type contract.
  globalThis.Uint8Array = new Proxy(NativeBytes, {
    construct(target, args) {
      if (typeof args[0] === 'number') allocations.push(args[0]);
      return Reflect.construct(target, args);
    },
  });
  try {
    const tail = new OutputTail();
    assertEquals(tail.text(), '');
    assertEquals(allocations.every((size) => size === 0), true);
    tail.append(chunk);
    assertEquals(tail.text(), 'ok');
    assertEquals(allocations.every((size) => size <= 1024), true);
  } finally {
    globalThis.Uint8Array = NativeBytes;
  }
});

Deno.test('review regression: mutating one built stdin cannot change later builds', () => {
  const builder = defineTask('isolated-build').entrypoint('unused.ts').stdin({ value: 'snapshot' });
  const first = builder.build();
  assertInstanceOf(first.stdin, Uint8Array);
  first.stdin.fill(0);
  const second = builder.build();
  assertInstanceOf(second.stdin, Uint8Array);
  assertEquals(new TextDecoder().decode(second.stdin), '{"value":"snapshot"}');
  assertEquals(first.stdin === second.stdin, false);
});

Deno.test('review regression: UTF-8 tail cuts skip incomplete leading code points', () => {
  const tail = new OutputTail(5);
  tail.append(new TextEncoder().encode('😀ab'));
  assertEquals(tail.text(), 'ab');
  // Exercise the same boundary after wrapping, not just a single large append.
  tail.append(new TextEncoder().encode('😀xy'));
  assertEquals(tail.text(), 'xy');
});

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
  Deno.test({
    name: `review regression: worker group ${signal} terminates its active polyglot task`,
    ignore: Deno.build.os !== 'linux',
    async fn() {
      const moduleUrl = new URL('../../src/executor/mod.ts', import.meta.url).href;
      const script = `import {createDefaultTaskExecutor} from ${JSON.stringify(moduleUrl)};
await createDefaultTaskExecutor().execute({id:'signal-task',type:'executable',entrypoint:'sh',args:['-c','echo $$; exec sleep 60']}, {
  onStdout(line) { console.log(line); }, timeout:60000
});`;
      const parent = new Deno.Command('setsid', {
        args: [Deno.execPath(), 'eval', script],
        stdin: 'null',
        stdout: 'piped',
        stderr: 'null',
      }).spawn();
      const reader = parent.stdout.getReader();
      let taskPid: number | undefined;
      const watchdog = setTimeout(() => {
        try {
          parent.kill('SIGKILL');
        } catch { /* Exited. */ }
      }, 5000);
      try {
        let output = '';
        const decoder = new TextDecoder();
        while (!output.includes('\n') && output.length < 128) {
          const { done, value } = await reader.read();
          if (done) break;
          output += decoder.decode(value, { stream: true });
        }
        taskPid = Number(output.trim());
        assertEquals(Number.isSafeInteger(taskPid) && taskPid > 0, true);
        // Prove this is our isolated fixture group before sending a group signal.
        const stat = await Deno.readTextFile(`/proc/${parent.pid}/stat`);
        const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
        assertEquals(Number(fields[2]), parent.pid);
        Deno.kill(-parent.pid, signal);
        await parent.status;
        assertEquals(await terminated(taskPid), true);
      } finally {
        clearTimeout(watchdog);
        if (taskPid !== undefined && taskPid > 0) {
          try {
            Deno.kill(taskPid, 'SIGKILL');
          } catch { /* Exited. */ }
        }
        try {
          parent.kill('SIGKILL');
        } catch { /* Exited. */ }
        await parent.status;
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
    },
  });
}

async function terminated(pid: number): Promise<boolean> {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const stat = await Deno.readTextFile(`/proc/${pid}/stat`);
      if (stat.slice(stat.lastIndexOf(')') + 2).split(' ')[0] === 'Z') return true;
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return false;
}
