import { assertEquals, assertStringIncludes } from '@std/assert';
import { fileURLToPath } from 'node:url';
import exclusions from '../../tokens/contrast-exclusions.json' with { type: 'json' };
import pairs from '../../tokens/contrast-pairs.json' with { type: 'json' };

Deno.test('maintainer contrast report names every still-failing exclusion without changing policy', async () => {
  const directory = await Deno.makeTempDir({ prefix: 'netscript-token-report-' });
  const policy = new URL('../../tokens/contrast-exclusions.json', import.meta.url);
  const before = await Deno.readTextFile(policy);
  try {
    const process = await new Deno.Command(Deno.execPath(), {
      cwd: fileURLToPath(new URL('../../', import.meta.url)),
      args: [
        'run',
        '--lock=deno.lock',
        '--frozen',
        '--allow-read',
        '--allow-write',
        '--allow-env',
        'scripts/report-token-contrast.ts',
        '--report-dir',
        directory,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(process.code, 0, new TextDecoder().decode(process.stderr));
    const report: {
      checks: number;
      exempt: {
        preset: string;
        scheme: string;
        pair: string;
        foregroundRole: string;
        backgroundRoles: string[];
        ratio: number;
        requiredRatio: number;
        exemption: string;
        criterion: string;
        reason: string;
      }[];
      failures: {
        preset: string;
        scheme: string;
        pair: string;
        foregroundRole: string;
        backgroundRoles: string[];
        ratio: number;
        requiredRatio: number;
      }[];
    } = JSON.parse(await Deno.readTextFile(`${directory}/failing-pairs.json`));
    assertEquals(report.checks > report.failures.length, true);
    assertEquals(report.failures.length, exclusions.exclusions.length);
    assertEquals(report.exempt.length, 58);
    assertEquals(new Set(report.exempt.map((row) => row.pair)).size, 6);
    assertEquals(
      [...new Set(report.exempt.map((row) => row.foregroundRole))].sort(),
      [
        'fluent-text-disabled',
        'fluent-text-on-accent-disabled',
        'state-disabled-fg',
        'tactile-text-disabled',
      ],
    );
    const failures = new Set(
      report.failures.map((row) => JSON.stringify([row.preset, row.scheme, row.pair])),
    );
    for (const row of report.exempt) {
      assertEquals(row.exemption, 'inactive-component');
      assertEquals(row.criterion, 'WCAG 2.2 SC 1.4.3');
      assertStringIncludes(row.reason, 'inactive user interface component');
      assertEquals(row.requiredRatio, 4.5);
      assertEquals(Number.isFinite(row.ratio) && row.ratio >= 1 && row.ratio <= 21, true);
      assertEquals(failures.has(JSON.stringify([row.preset, row.scheme, row.pair])), false);
      const pair = pairs.pairs.find((pair) => pair.id === row.pair)!;
      assertEquals(row.foregroundRole, pair.foreground);
      assertEquals(row.backgroundRoles, pair.background);
    }
    assertEquals(
      new Set(report.failures.map((row) => JSON.stringify([row.preset, row.scheme, row.pair])))
        .size,
      report.failures.length,
    );
    for (const row of report.failures) {
      const exclusion = exclusions.exclusions.find((entry) =>
        entry.preset === row.preset && entry.scheme === row.scheme && entry.pair === row.pair
      )!;
      const pair = pairs.pairs.find((entry) => entry.id === row.pair)!;
      assertEquals(row.ratio, exclusion.ratio);
      assertEquals(row.requiredRatio, exclusion.minimum);
      assertEquals(row.foregroundRole, pair.foreground);
      assertEquals(row.backgroundRoles, pair.background);
      assertEquals(row.ratio < row.requiredRatio, true);
    }
    const table = await Deno.readTextFile(`${directory}/failing-pairs.md`);
    assertStringIncludes(table, 'burn-down — OPEN');
    assertStringIncludes(table, 'failing-pairs.json');
    assertStringIncludes(table, '58 explicitly exempt inactive text uses');
    for (const preset of new Set(report.failures.map((row) => row.preset))) {
      assertStringIncludes(table, `| ${preset} |`);
    }
    assertEquals(await Deno.readTextFile(policy), before);
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});
