import { assertEquals, assertStringIncludes } from '@std/assert';
import { buildLeakReport, renderLeakReport } from './leak-check.ts';
import { emptyRunResources } from './run-resources.ts';

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
