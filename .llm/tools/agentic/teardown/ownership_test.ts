import { assertEquals } from '@std/assert';
import { actionable, classify, type ResourceCandidate } from './ownership.ts';

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

Deno.test('aspire mcp command line is rejected despite otherwise owned path', () => {
  assertEquals(
    classify(
      {
        kind: 'apphost',
        appHostPath: `${root}/apphost.mts`,
        appHostPid: 7,
        commandLine: 'aspire mcp start --stdio',
      },
      { appHosts: [], containers: [] },
      root,
    ),
    'unproven',
  );
});
