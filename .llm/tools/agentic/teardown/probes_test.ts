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

Deno.test('process probe ignores worktree paths in Aspire-like env keys without Aspire identity', async () => {
  const commands: CommandPort = {
    run: () =>
      Promise.resolve({
        code: 0,
        stdout: '43 1 90 deno long-lived-worker.ts',
        stderr: '',
      }),
  };
  const files: FilePort = {
    realPath: (path) => Promise.resolve(path),
    readText(path) {
      if (path.endsWith('/cmdline')) return Promise.resolve('deno\0long-lived-worker.ts');
      if (path.endsWith('/environ')) {
        return Promise.resolve(
          'ASPIRE_DCP_APPHOST_PATH=/home/codex/repos/fix-1046/aspire/apphost.mts\0',
        );
      }
      return Promise.resolve('');
    },
  };
  assertEquals(await probeProcesses(commands, files), []);
});

// Volume/network shapes are synthesized from Docker's documented inspect output: issue #1855 was
// repaired without a runtime lease, so no live capture existed. Replace with a captured fixture on
// the next runtime-verification slice.
Deno.test('volume and network probes observe Aspire-managed resources and skip unlabelled ones', async () => {
  const containerInspect = [{
    Id: 'ownedcidfull',
    Name: '/postgres-owned',
    Config: { Labels: { 'com.microsoft.developer.usvc-dev.creatorProcessId': '45429' } },
    Mounts: [{ Type: 'volume', Name: 'anonvolume' }],
  }];
  const commands: CommandPort = {
    run(command) {
      const [bin, verb, arg] = command;
      if (bin === 'aspire') return Promise.resolve({ code: 0, stdout: '[]', stderr: '' });
      if (bin === 'docker' && verb === 'ps') {
        return Promise.resolve({ code: 0, stdout: 'ownedcid\n', stderr: '' });
      }
      if (bin === 'docker' && verb === 'inspect') {
        return Promise.resolve({ code: 0, stdout: JSON.stringify(containerInspect), stderr: '' });
      }
      if (bin === 'docker' && verb === 'volume') {
        return Promise.resolve(
          arg === 'ls' ? { code: 0, stdout: 'anonvolume\n', stderr: '' } : {
            code: 0,
            stdout: JSON.stringify([{
              Name: 'anonvolume',
              Driver: 'local',
              CreatedAt: '2026-08-01T21:58:00Z',
              Mountpoint: '/var/lib/docker/volumes/anonvolume/_data',
              Labels: null,
            }]),
            stderr: '',
          },
        );
      }
      if (bin === 'docker' && verb === 'network') {
        return Promise.resolve(
          arg === 'ls' ? { code: 0, stdout: 'net581c13b7\nnetbridge\n', stderr: '' } : {
            code: 0,
            stdout: JSON.stringify([
              {
                Name: 'aspire-persistent-network-581c13b7-aspire-managed',
                Id: 'net581c13b7full',
                Created: '2026-08-01T20:00:00Z',
                Labels: { 'com.microsoft.developer.usvc-dev.name': 'aspire-managed' },
                Containers: {},
              },
              {
                // A host default network carries no Aspire labels and must not become a candidate.
                Name: 'bridge',
                Id: 'netbridgefull',
                Created: '2025-01-01T00:00:00Z',
                Labels: {},
                Containers: {},
              },
            ]),
            stderr: '',
          },
        );
      }
      return Promise.resolve({ code: 0, stdout: '', stderr: '' });
    },
  };
  const files: FilePort = {
    realPath: (path) => Promise.resolve(path),
    readText: () => Promise.resolve(''),
  };
  const resources = await probeResources(commands, files, 50);
  assertEquals(resources, [
    {
      kind: 'container',
      id: 'ownedcidfull',
      name: 'postgres-owned',
      creatorPid: 45429,
      creatorProcessStartTime: undefined,
      mountSource: undefined,
      createdAt: undefined,
    },
    {
      kind: 'volume',
      id: 'anonvolume',
      createdAt: '2026-08-01T21:58:00Z',
      mountedBy: ['ownedcidfull'],
    },
    {
      kind: 'network',
      id: 'net581c13b7full',
      name: 'aspire-persistent-network-581c13b7-aspire-managed',
      createdAt: '2026-08-01T20:00:00Z',
      attachedContainers: [],
    },
  ]);
});
