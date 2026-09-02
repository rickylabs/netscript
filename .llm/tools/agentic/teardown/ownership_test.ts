import { assertEquals } from '@std/assert';
import {
  actionable,
  classify,
  classifyVolume,
  type ResourceCandidate,
  validOwnedRoot,
} from './ownership.ts';

const root = '/home/codex/repos/fix-1046';

Deno.test('empty registry and foreign host has zero actionable resources', () => {
  const resources: ResourceCandidate[] = [
    { kind: 'apphost', appHostPath: '/home/codex/repos/fix-1011/apphost.mts', appHostPid: 10 },
    {
      kind: 'container',
      id: 'foreign',
      creatorPid: 11,
      creatorProcessStartTime: '2026-08-01T00:00:00Z',
      mountSource: '/home/codex/repos/fix-1025/.data/postgres',
    },
  ];
  assertEquals(actionable(resources, { appHosts: [], containers: [] }, root), []);
});

Deno.test('path containment compares segments rather than string prefixes', () => {
  assertEquals(
    classify(
      { kind: 'apphost', appHostPath: '/home/codex/repos/fix-1046/apphost.mts', appHostPid: 1 },
      { appHosts: [], containers: [] },
      '/home/codex/repos/fix-104',
    ),
    'foreign',
  );
});

Deno.test('registry identity requires pid and process start time', () => {
  assertEquals(
    classify(
      {
        kind: 'container',
        id: 'same-pid',
        creatorPid: 42,
        creatorProcessStartTime: 'new',
      },
      {
        appHosts: [],
        containers: [{ creatorPid: 42, creatorProcessStartTime: 'old' }],
      },
      root,
    ),
    'unproven',
  );
});

Deno.test('missing or unparseable mount evidence fails closed', () => {
  for (const mountSource of [undefined, 'relative/path', '']) {
    assertEquals(
      classify(
        { kind: 'container', id: 'unknown', mountSource },
        { appHosts: [], containers: [] },
        root,
      ),
      'unproven',
    );
  }
});

Deno.test('aspire agent mcp command line is rejected despite otherwise owned path', () => {
  assertEquals(
    classify(
      {
        kind: 'apphost',
        appHostPath: `${root}/apphost.mts`,
        appHostPid: 7,
        commandLine: 'aspire agent mcp',
      },
      { appHosts: [], containers: [] },
      root,
    ),
    'unproven',
  );
});

Deno.test('aspire agent mcp command line is rejected despite otherwise owned path', () => {
  assertEquals(
    classify(
      {
        kind: 'process',
        pid: 71,
        ppid: 1,
        commandLine: `aspire agent mcp --apphost ${root}/apphost.mts`,
        evidence: [{ kind: 'apphost-argv', path: `${root}/apphost.mts` }],
      },
      { appHosts: [], containers: [] },
      root,
    ),
    'unproven',
  );
});

Deno.test('process evidence authorizes only contained paths and reports foreign worktrees', () => {
  const process = (path: string): ResourceCandidate => ({
    kind: 'process',
    pid: 72,
    ppid: 1,
    commandLine: 'aspire-managed nuget search',
    evidence: [{ kind: 'dcp-label', path }],
  });
  assertEquals(
    classify(process(`${root}/apphost.mts`), { appHosts: [], containers: [] }, root),
    'owned',
  );
  assertEquals(
    classify(
      process('/home/codex/repos/fix-1011/apphost.mts'),
      { appHosts: [], containers: [] },
      root,
    ),
    'foreign',
  );
  assertEquals(
    classify(process('/tmp/dcp.sock'), { appHosts: [], containers: [] }, root),
    'unproven',
  );
});

Deno.test('a clean-clone container outside the worktree is owned once its root is registered', () => {
  const cleanClone = '/tmp/opencode/cleanroom/statusline';
  const candidate: ResourceCandidate = {
    kind: 'container',
    id: 'clean-clone',
    mountSource: `${cleanClone}/.data/postgres`,
  };
  assertEquals(classify(candidate, { appHosts: [], containers: [] }, root), 'unproven');
  assertEquals(
    classify(candidate, { appHosts: [], containers: [], ownedRoots: [cleanClone] }, root),
    'owned',
  );
});

Deno.test('an over-broad owned root cannot claim another run', () => {
  assertEquals(validOwnedRoot('/'), false);
  assertEquals(validOwnedRoot('/tmp'), false);
  assertEquals(validOwnedRoot('relative/path'), false);
  assertEquals(validOwnedRoot('/tmp/opencode'), true);
  assertEquals(
    classify(
      { kind: 'container', id: 'other', mountSource: '/tmp/someone-else/.data' },
      { appHosts: [], containers: [], ownedRoots: ['/tmp'] },
      root,
    ),
    'unproven',
  );
});

// Issue #1855: a foreign network must never be claimed from its name, however Aspire-shaped it is.
Deno.test('an Aspire-shaped network name is never ownership evidence', () => {
  assertEquals(
    classify(
      {
        kind: 'network',
        id: 'net581c13b7',
        name: 'aspire-persistent-network-581c13b7-aspire-managed',
        attachedContainers: [],
      },
      { appHosts: [], containers: [] },
      root,
    ),
    'unproven',
  );
});

Deno.test('a network with a registered creator identity is owned like a container', () => {
  assertEquals(
    classify(
      {
        kind: 'network',
        id: 'net-owned',
        name: 'aspire-session-network-owned',
        creatorPid: 42,
        creatorProcessStartTime: 'ticks',
        attachedContainers: [],
      },
      { appHosts: [], containers: [{ creatorPid: 42, creatorProcessStartTime: 'ticks' }] },
      root,
    ),
    'owned',
  );
});

Deno.test('a volume mounted exclusively by owned containers is owned by attribution', () => {
  const owned = { kind: 'container' as const, id: 'owned-id', mountSource: `${root}/.data` };
  assertEquals(
    classifyVolume(
      { kind: 'volume', id: 'anonhash', mountedBy: ['owned-id'] },
      [owned],
      { appHosts: [], containers: [] },
      root,
    ),
    'owned',
  );
});

Deno.test('a volume shared with an unattributable container is never claimed', () => {
  const owned = { kind: 'container' as const, id: 'owned-id', mountSource: `${root}/.data` };
  // `stranger-id` has no candidate at all, which is exactly the non-owned case.
  assertEquals(
    classifyVolume(
      { kind: 'volume', id: 'anonhash', mountedBy: ['owned-id', 'stranger-id'] },
      [owned],
      { appHosts: [], containers: [] },
      root,
    ),
    'unproven',
  );
  const foreign = { kind: 'container' as const, id: 'foreign-id', creatorPid: 9 };
  assertEquals(
    classifyVolume(
      { kind: 'volume', id: 'anonhash', mountedBy: ['owned-id', 'foreign-id'] },
      [owned, foreign],
      { appHosts: [], containers: [] },
      root,
    ),
    'unproven',
  );
});

Deno.test('a dangling volume carries no creation evidence and stays unproven', () => {
  assertEquals(
    classifyVolume(
      { kind: 'volume', id: 'anonhash', mountedBy: [] },
      [],
      { appHosts: [], containers: [] },
      root,
    ),
    'unproven',
  );
});
