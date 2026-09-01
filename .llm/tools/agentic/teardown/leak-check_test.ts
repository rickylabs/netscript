import { assertEquals, assertStringIncludes } from '@std/assert';
import { enforceTeardown } from '../codex/run-codex-slice-lib.ts';
import { buildLeakReport, renderLeakReport, runLeakCheck } from './leak-check.ts';
import type { CommandPort, FilePort } from './ports.ts';
import { emptyRunResources } from './run-resources.ts';

const files: FilePort = {
  realPath: (path) => Promise.resolve(path),
  readText: (path) =>
    Promise.resolve(
      path.endsWith('/stat') ? '1 (aspire) S 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 44' : 'aspire start',
    ),
};

Deno.test('report never hides foreign or unproven survivors', () => {
  const registry = emptyRunResources('/home/codex/repos/fix-1046');
  const report = buildLeakReport(
    [
      { kind: 'apphost', appHostPath: '/home/codex/repos/fix-1011/apphost.mts', appHostPid: 1 },
      { kind: 'container', id: 'unknown', name: 'redis-unknown' },
    ],
    registry,
    registry.worktreeRoot,
    Date.parse('2026-08-02T00:00:00Z'),
  );
  assertEquals(report.survivors.map((entry) => entry.ownership), ['foreign', 'unproven']);
  assertEquals(report.survivors[1].owner, 'unknown');
  assertStringIncludes(renderLeakReport(report), "docker rm -f 'unknown'");
  assertStringIncludes(renderLeakReport(report), 'Age: unknown');
});

Deno.test('owned registry survivor reports age, staleness, and exact scoped command', () => {
  const registry = {
    ...emptyRunResources('/home/codex/repos/fix-1046'),
    appHosts: [{
      appHostPath: '/elsewhere/apphost.mts',
      appHostPid: 8,
      appHostStartedAt: 'ticks',
      startedAt: '2026-08-01T20:00:00Z',
    }],
  };
  const report = buildLeakReport(
    [{
      kind: 'apphost',
      appHostPath: '/elsewhere/apphost.mts',
      appHostPid: 8,
      appHostStartedAt: 'ticks',
    }],
    registry,
    registry.worktreeRoot,
    Date.parse('2026-08-02T00:00:00Z'),
  );
  assertEquals(report.survivors[0].ownership, 'owned');
  assertEquals(report.survivors[0].stale, true);
  assertEquals(
    report.survivors[0].command,
    "aspire stop --apphost '/elsewhere/apphost.mts' --non-interactive --nologo",
  );
});

Deno.test('foreign resource can be stale from probed creation time without registry evidence', () => {
  const registry = emptyRunResources('/home/codex/repos/fix-1046');
  const report = buildLeakReport(
    [{
      kind: 'container',
      id: 'foreign-old',
      mountSource: '/home/codex/repos/fix-1025/.data/postgres',
      createdAt: '2026-08-01T20:00:00Z',
    }],
    registry,
    registry.worktreeRoot,
    Date.parse('2026-08-02T00:00:00Z'),
  );
  assertEquals(report.survivors[0].ownership, 'foreign');
  assertEquals(report.survivors[0].stale, true);
});

Deno.test('unavailable probes report no survivors and never block done', async () => {
  const sliceDir = await Deno.makeTempDir();
  const commands: CommandPort = {
    run: () => Promise.reject(new Deno.errors.NotFound('binary absent')),
  };
  try {
    const report = await runLeakCheck(sliceDir, '/worktree', 1, commands, files);
    assertEquals(report.survivors, []);
    assertEquals(report.probes.aspire.state, 'unavailable');
    assertEquals(report.probes.docker.state, 'unavailable');
    assertEquals(report.probes.volumes.state, 'unavailable');
    assertEquals(report.probes.networks.state, 'unavailable');
    assertEquals(enforceTeardown({ state: 'done' }, report), { state: 'done' });
    assertStringIncludes(renderLeakReport(report), 'Aspire probe: unavailable');
    assertStringIncludes(renderLeakReport(report), 'Docker probe: unavailable');
    assertStringIncludes(renderLeakReport(report), 'Volumes probe: unavailable');
    assertStringIncludes(renderLeakReport(report), 'Networks probe: unavailable');
  } finally {
    await Deno.remove(sliceDir, { recursive: true });
  }
});

Deno.test('successful Aspire probe survives unavailable Docker', async () => {
  const sliceDir = await Deno.makeTempDir();
  const commands: CommandPort = {
    run(command) {
      if (command[0] === 'docker') {
        return Promise.reject(new Deno.errors.NotFound('docker absent'));
      }
      return Promise.resolve({
        code: 0,
        stdout: JSON.stringify([{ appHostPath: '/foreign/apphost.ts', appHostPid: 1 }]),
        stderr: '',
      });
    },
  };
  try {
    const report = await runLeakCheck(sliceDir, '/worktree', 1, commands, files);
    assertEquals(report.probes.aspire.state, 'ok');
    assertEquals(report.probes.docker.state, 'unavailable');
    assertEquals(report.survivors.length, 1);
    assertEquals(report.survivors[0].resource.kind, 'apphost');
  } finally {
    await Deno.remove(sliceDir, { recursive: true });
  }
});

Deno.test('apparent owner is derived from the worktree parent, not a fixed path', () => {
  const registry = emptyRunResources('/srv/ci/checkout-a');
  const report = buildLeakReport(
    [{ kind: 'container', id: 'x', mountSource: '/srv/ci/checkout-b/.data/postgres' }],
    registry,
    '/srv/ci/checkout-a',
  );
  assertEquals(report.survivors[0].owner, '/srv/ci/checkout-b');
});

Deno.test('a resource outside the sibling root has no apparent owner', () => {
  const registry = emptyRunResources('/srv/ci/checkout-a');
  const report = buildLeakReport(
    [{ kind: 'container', id: 'y', mountSource: '/var/lib/docker/volumes/z' }],
    registry,
    '/srv/ci/checkout-a',
  );
  assertEquals(report.survivors[0].owner, 'unknown');
});

// Issue #1855 box 2: leak-check was volume-blind and reported `survivors: []` while a run-owned
// anonymous volume leaked. The run's own postgres container creates it; only that container mounts it.
const root = '/home/codex/repos/fix-1046';

Deno.test('an anonymous volume of an owned container is reported as an owned survivor', async () => {
  const sliceDir = await Deno.makeTempDir();
  const commands: CommandPort = {
    run(command) {
      const [bin, verb, arg] = command;
      if (bin === 'aspire') return Promise.resolve({ code: 0, stdout: '[]', stderr: '' });
      if (bin === 'docker' && verb === 'ps') {
        return Promise.resolve({ code: 0, stdout: 'ownedcid\n', stderr: '' });
      }
      if (bin === 'docker' && verb === 'inspect') {
        return Promise.resolve({
          code: 0,
          stdout: JSON.stringify([{
            Id: 'ownedcidfull',
            Name: '/postgres-owned',
            Created: '2026-08-01T21:58:00.000000000Z',
            Config: {
              Labels: {
                'com.microsoft.developer.usvc-dev.creatorProcessId': '45429',
                'com.microsoft.developer.usvc-dev.mountsLabel':
                  `type=bind,src=${root}/.data/postgres`,
              },
            },
            Mounts: [{ Type: 'volume', Name: 'anonvolume' }],
          }]),
          stderr: '',
        });
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
      return Promise.resolve({ code: 0, stdout: '', stderr: '' });
    },
  };
  try {
    const report = await runLeakCheck(sliceDir, root, 1, commands, files);
    const volume = report.survivors.find((entry) => entry.resource.kind === 'volume');
    assertEquals(volume?.ownership, 'owned');
    assertEquals(volume?.command, `docker volume rm 'anonvolume'`);
    assertEquals(volume?.identity, 'anonvolume (anonvolume)');
    assertStringIncludes(renderLeakReport(report), 'docker volume rm');
  } finally {
    await Deno.remove(sliceDir, { recursive: true });
  }
});

// Issue #1855 box 1: the foreign network this run did not create must be seen and reported as
// at-risk before cleanup, never claimed, and never inferred from its name.
Deno.test('a foreign Aspire-managed network is reported unproven and at risk', async () => {
  const sliceDir = await Deno.makeTempDir();
  const commands: CommandPort = {
    run(command) {
      const [bin, verb] = command;
      if (bin === 'aspire') return Promise.resolve({ code: 0, stdout: '[]', stderr: '' });
      if (bin === 'docker' && verb === 'ps') {
        return Promise.resolve({ code: 0, stdout: '', stderr: '' });
      }
      if (bin === 'docker' && verb === 'volume') {
        return Promise.resolve({ code: 0, stdout: '', stderr: '' });
      }
      if (bin === 'docker' && verb === 'network') {
        return Promise.resolve(
          command[2] === 'ls' ? { code: 0, stdout: 'net581c13b7\n', stderr: '' } : {
            code: 0,
            stdout: JSON.stringify([{
              Name: 'aspire-persistent-network-581c13b7-aspire-managed',
              Id: 'net581c13b7full',
              Created: '2026-08-01T20:00:00Z',
              Labels: { 'com.microsoft.developer.usvc-dev.name': 'aspire-managed' },
              Containers: {},
            }]),
            stderr: '',
          },
        );
      }
      return Promise.resolve({ code: 0, stdout: '', stderr: '' });
    },
  };
  try {
    const report = await runLeakCheck(sliceDir, root, 1, commands, files);
    const network = report.survivors.find((entry) => entry.resource.kind === 'network');
    assertEquals(
      network?.identity,
      'aspire-persistent-network-581c13b7-aspire-managed (net581c13b7full)',
    );
    assertEquals(network?.ownership, 'unproven');
    assertEquals(network?.atRiskFromUpstream, true);
    assertStringIncludes(renderLeakReport(report), '- At risk from upstream: yes');
  } finally {
    await Deno.remove(sliceDir, { recursive: true });
  }
});

Deno.test('a network attached only by owned containers is not flagged at risk', () => {
  const registry = emptyRunResources(root);
  const report = buildLeakReport(
    [
      { kind: 'container', id: 'owned-id', mountSource: `${root}/.data` },
      {
        kind: 'network',
        id: 'net-owned',
        name: 'aspire-session-network-owned',
        attachedContainers: ['owned-id'],
      },
    ],
    registry,
    root,
  );
  const network = report.survivors.find((entry) => entry.resource.kind === 'network');
  assertEquals(network?.ownership, 'unproven');
  assertEquals(network?.atRiskFromUpstream, false);
});
