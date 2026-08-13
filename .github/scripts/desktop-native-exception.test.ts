import { assertEquals, assertThrows } from '@std/assert';
import { enforceDesktopNativePolicy } from './desktop-native-exception.ts';

Deno.test('desktop native policy accepts PASS evidence only for a successful suite', () => {
  assertEquals(enforceDesktopNativePolicy('success', { status: 'PASS' }), 'passed');
  assertThrows(
    () => enforceDesktopNativePolicy('success', { status: 'FAIL' }),
    Error,
    'without PASS evidence',
  );
});

Deno.test('desktop native policy bounds the active #859 exception to staged callback evidence', () => {
  assertEquals(
    enforceDesktopNativePolicy('failure', {
      status: 'FAIL',
      failure:
        'v1 failed to stage v2: Update written to /tmp/runtime.so.update. Will be applied on next launch.',
    }),
    'accepted-issue-859',
  );
  for (
    const evidence of [
      { status: 'FAIL', failure: "Package 'zod' not found in catalog" },
      { status: 'FAIL', failure: 'v1 failed to stage v2: network failed' },
      { status: 'PASS' },
    ]
  ) {
    assertThrows(
      () => enforceDesktopNativePolicy('failure', evidence),
      Error,
    );
  }
});

Deno.test('desktop native workflow provides the headless display required by WebKitGTK', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/e2e-cli.yml');
  assertEquals(workflow.includes('libwebkit2gtk-4.1-0 xvfb'), true);
  assertEquals(
    workflow.includes(
      'xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x24"',
    ),
    true,
  );
});
