import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { DockerCliResourceCleaner } from '../../../src/adapters/commands/docker-resource-cleaner.ts';

const encoder = new TextEncoder();

Deno.test('docker cleaner treats an absent docker binary as an empty snapshot', async () => {
  const warnings: string[] = [];
  const cleaner = new DockerCliResourceCleaner(
    () => Promise.reject(new Deno.errors.NotFound('docker')),
    (warning) => {
      warnings.push(warning);
      return Promise.resolve();
    },
  );

  assertEquals(await cleaner.captureSnapshot(), { containerIds: [] });
  assertEquals(warnings.length, 1);
  assertStringIncludes(warnings[0], 'docker executable was not found');
});

Deno.test('docker cleaner treats a non-zero docker ps as an empty snapshot', async () => {
  const warnings: string[] = [];
  const cleaner = new DockerCliResourceCleaner(
    () => Promise.resolve(commandOutput(1, '', 'daemon unavailable')),
    (warning) => {
      warnings.push(warning);
      return Promise.resolve();
    },
  );

  assertEquals(await cleaner.captureSnapshot(), { containerIds: [] });
  assertEquals(warnings.length, 1);
  assertStringIncludes(warnings[0], 'docker ps failed: daemon unavailable');
});

Deno.test('docker cleaner returns no resources when the snapshot has no new containers', async () => {
  const commands: string[][] = [];
  const cleaner = new DockerCliResourceCleaner((args) => {
    commands.push([...args]);
    return Promise.resolve(commandOutput(0, 'existing-a\nexisting-b\n'));
  });

  const removed = await cleaner.pruneCreatedResources({
    containerIds: ['existing-a', 'existing-b'],
  });

  assertEquals(removed, []);
  assertEquals(commands, [['ps', '-a', '--format', '{{.ID}}']]);
});

Deno.test('docker cleaner still throws when removing a created container fails', async () => {
  const cleaner = new DockerCliResourceCleaner((args) => {
    if (args[0] === 'ps') return Promise.resolve(commandOutput(0, 'existing-a\ncreated-b\n'));
    return Promise.resolve(commandOutput(1, '', 'permission denied'));
  });

  await assertRejects(
    () => cleaner.pruneCreatedResources({ containerIds: ['existing-a'] }),
    Error,
    'docker rm -f created-b failed: permission denied',
  );
});

function commandOutput(code: number, stdout = '', stderr = '') {
  return {
    code,
    stdout: encoder.encode(stdout),
    stderr: encoder.encode(stderr),
  };
}
