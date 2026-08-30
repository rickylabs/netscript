import { assertEquals } from '@std/assert';
import { classify } from './ownership.ts';
import type { CommandPort, FilePort } from './ports.ts';
import { parseMountSource, probeProcesses, probeResources } from './probes.ts';

const fixture = (name: string) =>
  Deno.readTextFile(new URL(`./__fixtures__/${name}`, import.meta.url));

for (const aspireVersion of ['13.4.6', '13.5.3']) {
  Deno.test(`observed Aspire ${aspireVersion} shapes normalize behind ports`, async () => {
    const aspire = await fixture(`aspire-ps-${aspireVersion}.json`);
    const docker = await fixture('docker-inspect-13.4.6.json');
    const commands: CommandPort = {
      run(command) {
        if (command[0] === 'aspire') {
          return Promise.resolve({ code: 0, stdout: aspire, stderr: '' });
        }
        if (command[0] === 'ps') {
          return Promise.resolve({ code: 0, stdout: '', stderr: '' });
        }
        if (command[1] === 'ps') {
          return Promise.resolve({ code: 0, stdout: '6bdea913\n', stderr: '' });
        }
        return Promise.resolve({ code: 0, stdout: docker, stderr: '' });
      },
    };
    const files: FilePort = {
      realPath: (path) => Promise.resolve(path),
      readText: (path) =>
        Promise.resolve(
          path.endsWith('/stat')
            ? '52220 (dotnet) S 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 4242'
            : 'dotnet\0apphost',
        ),
    };
    const resources = await probeResources(commands, files, 50);
    assertEquals(resources[0], {
      kind: 'apphost',
      appHostPath: '/home/codex/repos/fix-1011/.llm/tmp/cli-e2e/plugin-smoke/aspire/apphost.mts',
      appHostPid: 52220,
      appHostStartedAt: '4242',
      commandLine: 'dotnet apphost',
    });
    assertEquals(resources[1], {
      kind: 'container',
      id: '6bdea913000000000000000000000000',
      name: 'postgres-6bdea913',
      creatorPid: 45429,
      creatorProcessStartTime: '0001-01-01T00:19:04.220Z',
      mountSource: '/home/codex/repos/fix-1011/.data/postgres',
      createdAt: '2026-08-01T21:58:00.000000000Z',
    });
    assertEquals(
      classify(resources[0], { appHosts: [], containers: [] }, '/home/codex/repos/fix-1046'),
      'foreign',
    );
  });
}

Deno.test('missing and malformed mount labels expose no path evidence', () => {
  assertEquals(parseMountSource(undefined), undefined);
  assertEquals(parseMountSource('type=bind,dst=/data'), undefined);
  assertEquals(parseMountSource('type=bind,src=/worktree/.data,dst=/data'), '/worktree/.data');
});

Deno.test('process probe ignores command arguments that merely mention Aspire cleanup syntax', async () => {
  const commands: CommandPort = {
    run: () =>
      Promise.resolve({
        code: 0,
        stdout:
          '42 1 5 deno app-server-message-cli.ts --message aspire-managed --apphost /home/codex/repos/fix-1046/apphost.mts',
        stderr: '',
      }),
  };
  const files: FilePort = {
    realPath: (path) => Promise.resolve(path),
    readText(path) {
      if (path.endsWith('/cmdline')) {
        return Promise.resolve(
          'deno\0app-server-message-cli.ts\0--message\0aspire-managed --apphost /home/codex/repos/fix-1046/apphost.mts',
        );
      }
      return Promise.resolve('');
    },
  };
  assertEquals(await probeProcesses(commands, files), []);
});
