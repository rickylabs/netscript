import { assert, assertEquals } from '@std/assert';
import { childPayloadShape } from '../../../src/application/gates/scaffold/runtime/diagnose-plugin-health.ts';

Deno.test('child health diagnostic reports missing fields without copying secret values', () => {
  const evidence = childPayloadShape({
    state: 'ready',
    registryReady: true,
    dependencyReady: true,
    lastFatalError: { message: 'secret-value', timestamp: 123 },
    arbitrary: 'secret-value',
  });
  assertEquals(evidence.restartCount, { present: false, type: 'undefined' });
  assertEquals(evidence.state, { present: true, type: 'string', value: 'ready' });
  assert(!JSON.stringify(evidence).includes('secret-value'));
});

for (const code of [0, 7]) {
  Deno.test(`plugin health diagnostic preserves doctor exit ${code}`, async () => {
    const script = new URL(
      '../../../src/application/gates/scaffold/runtime/diagnose-plugin-health.ts',
      import.meta.url,
    );
    const result = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-run=' + Deno.execPath(),
        script.pathname,
        '/unavailable/apphost.mts',
        Deno.execPath(),
        'eval',
        `console.log('doctor-result'); Deno.exit(${code});`,
      ],
      stdin: 'null',
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(result.code, code);
    assertEquals(new TextDecoder().decode(result.stdout).trim(), 'doctor-result');
    assertEquals(
      new TextDecoder().decode(result.stderr).includes('diagnostic unavailable'),
      code !== 0,
    );
  });
}
