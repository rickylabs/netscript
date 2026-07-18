import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import type { PackageDesktopInput } from './package-desktop.ts';
import { DesktopPackageError } from './desktop-package-contract.ts';
import { createDesktopPackageCommand } from './package-desktop-command.ts';

Deno.test('desktop package parser forwards repeated formats and explicit selectors', async () => {
  const inputs: PackageDesktopInput[] = [];
  const output: string[] = [];
  const command = createDesktopPackageCommand({
    resolveProjectRoot: (value) => Promise.resolve(value ?? '/workspace'),
    packageDesktop: (input) => {
      inputs.push(input);
      return Promise.resolve({ appName: 'storefront', version: '1.0.0', invocations: [] });
    },
    print: (message) => output.push(message),
  });

  await command.parse([
    '--project-root',
    '/project',
    '--app',
    'storefront',
    '--target',
    'x86_64-unknown-linux-gnu',
    '--format',
    'appimage',
    '--format',
    'deb',
    '--compression',
    'lzma',
    '--output-dir',
    'dist/native',
  ]);

  assertEquals(inputs, [{
    projectRoot: '/project',
    app: 'storefront',
    target: 'x86_64-unknown-linux-gnu',
    allTargets: false,
    formats: ['appimage', 'deb'],
    compression: 'lzma',
    outputDir: 'dist/native',
  }]);
  assertEquals(output, ['Packaged storefront@1.0.0: 0 native artifact(s).']);
});

Deno.test('desktop package parser forwards all-targets and xz defaults', async () => {
  const inputs: PackageDesktopInput[] = [];
  const command = createDesktopPackageCommand({
    resolveProjectRoot: () => Promise.resolve('/project'),
    packageDesktop: (input) => {
      inputs.push(input);
      return Promise.resolve({ appName: 'storefront', version: '1.0.0', invocations: [] });
    },
    print: () => undefined,
  });

  await command.parse(['--all-targets']);

  assertEquals(inputs[0].allTargets, true);
  assertEquals(inputs[0].compression, 'xz');
  assertEquals(inputs[0].outputDir, '.deploy/desktop/packages');
});

Deno.test('desktop package parser rejects conflicting selectors before application call', async () => {
  let called = false;
  const command = createDesktopPackageCommand({
    resolveProjectRoot: () => Promise.resolve('/project'),
    packageDesktop: () => {
      called = true;
      return Promise.resolve({ appName: 'storefront', version: '1.0.0', invocations: [] });
    },
  });

  const error = await assertRejects(
    () => command.parse(['--target', 'x86_64-unknown-linux-gnu', '--all-targets']),
    DesktopPackageError,
  );
  assertEquals(error.code, 'invalid-input');
  assertEquals(called, false);
});

Deno.test('desktop package parser rejects unknown format and compression values', async (t) => {
  for (const [args, code] of [
    [['--format', 'zip'], 'unsupported-format'],
    [['--compression', 'brotli'], 'invalid-input'],
  ] as const) {
    await t.step(code, async () => {
      const command = createDesktopPackageCommand({
        resolveProjectRoot: () => Promise.resolve('/project'),
        packageDesktop: () =>
          Promise.resolve({ appName: 'storefront', version: '1.0.0', invocations: [] }),
      });
      const error = await assertRejects(
        () => command.parse([...args]),
        DesktopPackageError,
      );
      assertEquals(error.code, code);
    });
  }
});
