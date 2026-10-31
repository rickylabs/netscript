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
    for (const preset of new Set(report.failures.map((row) => row.preset))) {
      assertStringIncludes(table, `| ${preset} |`);
    }
    assertEquals(await Deno.readTextFile(policy), before);
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});
