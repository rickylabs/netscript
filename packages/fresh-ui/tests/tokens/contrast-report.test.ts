import { assertEquals, assertStringIncludes } from '@std/assert';
import { fileURLToPath } from 'node:url';
import type { TokenContrastExclusion } from '../../src/tokens/domain/contrast-contract.ts';
import exclusions from '../../tokens/contrast-exclusions.json' with { type: 'json' };
import { TOKEN_PRESETS } from '../../src/tokens/domain/token-presets.ts';
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
      contexts: {
        preset: string;
        scheme: string;
        checks: number;
        failures: number;
        disabledExempt: number;
        disabledBelowMinimum: number;
      }[];
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
    const policyExclusions: readonly TokenContrastExclusion[] = exclusions.exclusions;
    for (const row of report.failures) {
      const exclusion = policyExclusions.find((entry) =>
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
    assertStringIncludes(table, 'burn-down — ZERO FAILURES');
    assertStringIncludes(table, 'failing-pairs.json');
    assertStringIncludes(table, '58 explicitly exempt inactive text uses');
    assertEquals(report.failures, []);
    assertEquals(report.contexts.length, TOKEN_PRESETS.length * 2);
    assertEquals(report.contexts.reduce((sum, row) => sum + row.checks, 0), report.checks);
    assertEquals(report.contexts.reduce((sum, row) => sum + row.disabledExempt, 0), 58);
    assertEquals(report.contexts.reduce((sum, row) => sum + row.disabledBelowMinimum, 0), 56);
    for (const preset of TOKEN_PRESETS) {
      for (const scheme of ['light', 'dark']) {
        const rows = report.contexts.filter((row) =>
          row.preset === preset.id && row.scheme === scheme
        );
        assertEquals(rows.length, 1);
        assertEquals(rows[0].failures, 0);
        assertStringIncludes(table, `| ${preset.id} | ${scheme} | ${rows[0].checks} | 0 |`);
      }
    }
    assertEquals(await Deno.readTextFile(policy), before);
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});
