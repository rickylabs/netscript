import { assert, assertEquals, assertThrows } from 'jsr:@std/assert@^1';
import { join } from '@std/path';
import { readBackfillPolicy } from './contract.ts';

type Receipt = {
  done: boolean;
  scanned: number;
  changed: number;
  retained: number;
  conflicted: boolean;
};
type Output = { saga: Receipt; trigger: Receipt };

Deno.test('operator command resumes a file-backed KV migration across process restarts and then no-ops', async () => {
  const directory = await Deno.makeTempDir();
  try {
    const path = join(directory, 'runtime.sqlite');
    const policyPath = join(directory, 'policy.json');
    await Deno.writeTextFile(
      policyPath,
      JSON.stringify({
        sagas: { defaultDays: 7 },
        triggers: { defaultDays: 7 },
      }),
    );
    using raw = await Deno.openKv(path);
    await raw.set(['sagas', 'state', 'legacy:done'], {
      state: {},
      metadata: {
        instanceId: 'legacy:done',
        status: 'completed',
        version: 1,
        durability: 't3',
        createdAt: new Date('2000-01-01'),
        updatedAt: new Date('2000-01-01'),
      },
    });
    await raw.set(['sagas', 'transition', 'legacy:done', 1], { transition: 'legacy' });
    await raw.set(['triggers', 'events', 'done'], {
      id: 'done',
      triggerId: 'legacy',
      status: 'completed',
      updatedAt: '2000-01-01',
    });
    await raw.set(['triggers', 'by-trigger', 'legacy', 'done'], 'done');
    const run = async (passes: number): Promise<Output[]> => {
      const command = new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          '--unstable-kv',
          '--allow-read',
          '--allow-write',
          '--allow-env',
          'tools/kv-runtime-retention/main.ts',
          '--saga-kv',
          path,
          '--trigger-kv',
          path,
          '--policy',
          policyPath,
          '--passes',
          String(passes),
          '--page-size',
          '1',
        ],
        stdout: 'piped',
        stderr: 'piped',
      });
      const result = await command.output();
      assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
      return new TextDecoder().decode(result.stdout).trim().split('\n').map((line) =>
        JSON.parse(line)
      );
    };
    const first = await run(1);
    assertEquals(first.length, 1);
    assertEquals(first[0]!.saga.done, false);
    const resumed = await run(100);
    assert(resumed.at(-1)!.saga.done);
    assert(resumed.at(-1)!.trigger.done);
    assertEquals((await raw.get(['sagas', 'state', 'legacy:done'])).value, null);
    assertEquals((await raw.get(['sagas', 'transition', 'legacy:done', 1])).value, null);
    assertEquals((await raw.get(['triggers', 'by-trigger', 'legacy', 'done'])).value, null);
    const again = await run(100);
    assertEquals(again.length, 1);
    assertEquals(again[0]!.saga, {
      done: true,
      scanned: 0,
      changed: 0,
      retained: 0,
      conflicted: false,
    });
    assertEquals(again[0]!.trigger, again[0]!.saga);
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});

Deno.test('operator rejects invalid retention policies before opening a store', () => {
  assertThrows(() => readBackfillPolicy({}), TypeError);
  assertThrows(
    () => readBackfillPolicy({ sagas: { defaultDays: 0 }, triggers: { defaultDays: 7 } }),
    RangeError,
  );
  assertThrows(
    () =>
      readBackfillPolicy({
        sagas: { defaultDays: 7 },
        triggers: { defaultDays: 7, byTrigger: { bad: -1 } },
      }),
    RangeError,
  );
});
