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
    assertEquals(enforceTeardown({ state: 'done' }, report), { state: 'done' });
    assertStringIncludes(renderLeakReport(report), 'Aspire probe: unavailable');
    assertStringIncludes(renderLeakReport(report), 'Docker probe: unavailable');
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
