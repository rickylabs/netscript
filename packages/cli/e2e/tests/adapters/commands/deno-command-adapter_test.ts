import { assertEquals } from '@std/assert';
import { DenoCommandAdapter } from '../../../src/adapters/commands/deno-command-adapter.ts';

for (const outputMode of ['capture', 'discard'] as const) {
  Deno.test(`native ${outputMode} settlement retains the actual deadline state even if output resolves`, async () => {
    let calls = 0;
    const status = (options: Deno.CommandOptions): Promise<Deno.CommandStatus> => {
      calls++;
      return new Promise((resolve) =>
        options.signal!.addEventListener(
          'abort',
          () => resolve({ code: 0, success: true, signal: null }),
          { once: true },
        )
      );
    };
    const adapter = new DenoCommandAdapter({
      capture: async (_command, options) => ({
        ...await status(options),
        stdout: new Uint8Array(),
        stderr: new Uint8Array(),
      }),
      status: (_command, options) => status(options),
    });
    const result = await adapter.run({
      command: ['inert-native'],
      cwd: '.',
      timeoutMs: 1,
      outputMode,
    });
    assertEquals(calls, 1);
    assertEquals(result.code, 0);
    assertEquals(result.signalAtSettlement, { abortRequested: true, deadlineExpired: true });
    assertEquals(result.timedOut, true, 'resolved output does not erase an observed deadline');
  });
}
Deno.test('native nonzero and local exception do not imply a deadline or an observed child exit', async () => {
  const native = {
    capture: () =>
      Promise.resolve({
        code: 16,
        success: false,
        signal: null,
        stdout: new Uint8Array(),
        stderr: new Uint8Array(),
      }),
    status: () => Promise.resolve({ code: 16, success: false, signal: null }),
  };
  const result = await new DenoCommandAdapter(native).run({ command: ['inert-native'], cwd: '.' });
  assertEquals(result.code, 16);
  assertEquals(result.timedOut, false);
  assertEquals(result.signalAtSettlement, { abortRequested: false, deadlineExpired: false });
  const failed = await new DenoCommandAdapter({
    ...native,
    capture: () => Promise.reject(new Error('fixture-local-failure')),
  })
    .run({ command: ['inert-native'], cwd: '.' });
  assertEquals(failed.code, 124);
  assertEquals(failed.timedOut, false);
  assertEquals(failed.signalAtSettlement, { abortRequested: false, deadlineExpired: false });
});
