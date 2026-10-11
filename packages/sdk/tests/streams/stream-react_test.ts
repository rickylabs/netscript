import { assertEquals } from '@std/assert';

async function assertExpoReactFixture(): Promise<void> {
  const reference = new URL('../../../../resources/examples/expo-streams/', import.meta.url);
  // React's act() exists only in its development build. Keep caller mode and
  // colour settings out of this frozen fixture; retain only an explicit cache location.
  const env: Record<string, string> = { NO_COLOR: '1', NODE_ENV: 'development' };
  const denoDir = Deno.env.get('DENO_DIR');
  if (denoDir !== undefined) env.DENO_DIR = denoDir;
  const result = await new Deno.Command(Deno.execPath(), {
    cwd: reference,
    clearEnv: true,
    env,
    args: [
      'test',
      '--lock=deno.lock',
      '--frozen',
      '--unstable-kv',
      '--allow-all',
      'stream-react.fixture.ts',
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const output = new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr);
  assertEquals(result.code, 0, output);
  assertEquals(output.includes('2 passed | 0 failed'), true, output);
  assertEquals(output.includes('\x1b['), false, output);
}

Deno.test('Expo-pinned React hook regressions run in the reference compiler context', async () => {
  await assertExpoReactFixture();
});

Deno.test('Expo-pinned React fixture ignores parent production mode and forced colour', async () => {
  const previousMode = Deno.env.get('NODE_ENV');
  const previousColor = Deno.env.get('FORCE_COLOR');
  try {
    Deno.env.set('NODE_ENV', 'production');
    Deno.env.set('FORCE_COLOR', '1');
    await assertExpoReactFixture();
  } finally {
    if (previousMode === undefined) Deno.env.delete('NODE_ENV');
    else Deno.env.set('NODE_ENV', previousMode);
    if (previousColor === undefined) Deno.env.delete('FORCE_COLOR');
    else Deno.env.set('FORCE_COLOR', previousColor);
  }
});
