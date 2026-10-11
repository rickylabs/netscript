import { assertEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';

interface RendererExportProbe {
  namedAct: string;
  commonJsAct: string;
  reactAct: string;
  error: string | null;
}

async function probeRendererExports(mode: string, denoDir: string): Promise<RendererExportProbe> {
  const reference = new URL('../../../../resources/examples/expo-streams/', import.meta.url);
  // Use the original named import and the actual CommonJS object together. An
  // absent named export alone cannot distinguish detection from build selection.
  const result = await new Deno.Command(Deno.execPath(), {
    cwd: reference,
    clearEnv: true,
    env: { NO_COLOR: '1', NODE_ENV: mode, DENO_DIR: denoDir },
    args: [
      'eval',
      '--lock=deno.lock',
      '--frozen',
      `import { act } from 'react-test-renderer';
       import renderer from 'react-test-renderer';
       import { act as reactAct } from 'react';
       let error = null;
       try { await act(() => {}); }
       catch (cause) { error = String(cause); }
       console.log(JSON.stringify({
         namedAct: typeof act,
         commonJsAct: typeof renderer.act,
         reactAct: typeof reactAct,
         error,
       }));`,
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(result.stdout);
  assertEquals(result.code, 0, stdout + new TextDecoder().decode(result.stderr));
  return JSON.parse(stdout);
}

Deno.test('Historical renderer act export distinguishes build selection from cache warmth', async () => {
  // Issue #2257's artifact records renderer 19.2.3 / react-is 19.3.0, which
  // the reference lock retains. It does not record NODE_ENV or cache bytes.
  // This controlled reproduction proves a cause, not that CI selected it.
  const denoDir = await Deno.makeTempDir();
  try {
    const development: RendererExportProbe = {
      namedAct: 'function',
      commonJsAct: 'function',
      reactAct: 'function',
      error: null,
    };
    const production: RendererExportProbe = {
      namedAct: 'undefined',
      commonJsAct: 'undefined',
      reactAct: 'undefined',
      error: 'TypeError: act is not a function',
    };
    // Start cold; then change only mode, using the same package/cache bytes.
    assertEquals(await probeRendererExports('development', denoDir), development);
    assertEquals(await probeRendererExports('production', denoDir), production);
    assertEquals(await probeRendererExports('development', denoDir), development);
  } finally {
    await Deno.remove(denoDir, { recursive: true });
  }
});

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
  const parentEnv = { mode: Deno.env.get('NODE_ENV'), color: Deno.env.get('FORCE_COLOR') };
  // Exercise the fixture runner itself under production settings without changing
  // the environment shared by parallel test workers.
  const result = await new Deno.Command(Deno.execPath(), {
    env: { NODE_ENV: 'production', FORCE_COLOR: '1' },
    args: [
      'test',
      '--allow-all',
      '--filter',
      'reference compiler context',
      fromFileUrl(import.meta.url),
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const output = new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr);
  assertEquals(result.code, 0, output);
  assertEquals(output.includes('1 passed | 0 failed'), true, output);
  assertEquals({ mode: Deno.env.get('NODE_ENV'), color: Deno.env.get('FORCE_COLOR') }, parentEnv);
});

Deno.test('React fixture tests never write the shared process environment', async () => {
  const source = await Deno.readTextFile(new URL(import.meta.url));
  assertEquals(/\bDeno\.env\.(?:set|delete)\s*\(/.test(source), false);
});
