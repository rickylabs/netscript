import { verifiedFigmaProvenance } from './figma-provenance.ts';
import { LEGACY_ROLE_MAP } from '../src/tokens/domain/preset-role-map.ts';
import { legacy } from '../src/tokens/assets/legacy.generated.ts';
import { buildTokens } from '../tokens.ts';
import { defaultContrastCoverage } from '../src/tokens/adapters/default-token-quality.ts';
import { tokenContrastColor } from '../src/tokens/adapters/contrast-color.ts';
import { evaluateTokenContrast } from '../src/tokens/domain/check-token-contrast.ts';
import type { TokenContrastExclusion } from '../src/tokens/domain/contrast-contract.ts';

// Re-measure without allowances. Never edit Figma values or relax thresholds.
const root = new URL('../tokens/', import.meta.url);
const writeExclusions = Deno.args.includes('--write-exclusions');
const reportIndex = Deno.args.indexOf('--report-dir');
const reportDir = reportIndex < 0 ? undefined : Deno.args[reportIndex + 1];
const allowed = new Set(['--write-exclusions', '--report-dir', ...(reportDir ? [reportDir] : [])]);
if (Deno.args.some((arg) => !allowed.has(arg)) || reportIndex >= 0 && !reportDir) {
  throw new Error(
    'Usage: report-token-contrast.ts [--write-exclusions] [--report-dir <directory>]',
  );
}
const source = await verifiedFigmaProvenance(new URL('figma/', root));
const build = await buildTokens();
const coverage = defaultContrastCoverage();
const report = evaluateTokenContrast(build.contexts, coverage, [], tokenContrastColor);
const pairs = new Map(coverage.pairs.map((pair) => [pair.id, pair]));
const failures = report.failures.map((result) => ({
  preset: result.preset,
  scheme: result.scheme,
  foregroundRole: pairs.get(result.pair)!.foreground,
  backgroundRoles: pairs.get(result.pair)!.background,
  ratio: Number(result.ratio.toFixed(12)),
  requiredRatio: result.minimum,
  pair: result.pair,
  foreground: result.foreground,
  background: result.background,
  valueSource: result.preset === 'ns-one'
    ? `${source} plus NS One S0 compatibility aliases/ground`
    : source,
}));
if (writeExclusions) {
  const previous: { exclusions: TokenContrastExclusion[] } = JSON.parse(
    await Deno.readTextFile(new URL('contrast-exclusions.json', root)),
  );
  const old = new Map(
    previous.exclusions.map((
      entry,
    ) => [JSON.stringify([entry.preset, entry.scheme, entry.pair]), entry]),
  );
  const exclusions: TokenContrastExclusion[] = report.failures.map((result) => {
    const inherited = old.get(JSON.stringify([result.preset, result.scheme, result.pair]));
    const pair = pairs.get(result.pair)!;
    const compatibility = result.preset === 'ns-one' &&
      [pair.foreground, ...pair.background].every((name) =>
        Object.hasOwn(legacy.tokens, name) || Object.hasOwn(LEGACY_ROLE_MAP, name) ||
        name.startsWith('component-')
      );
    return {
      ...result,
      ratio: Number(result.ratio.toFixed(12)),
      source: result.preset === 'ns-one' && inherited?.source.startsWith('S0')
        ? inherited.source
        : compatibility
        ? `S0 #2432 compatibility aliases; ${pair.foreground} on ${pair.background.join(' → ')}`
        : `${source}; ${pair.foreground} on ${pair.background.join(' → ')}`,
      reason: compatibility || inherited?.source.startsWith('S0')
        ? 'Inherited S0 compatibility values retained; no Figma value correction is implied. See the S1b failing-pairs.json report.'
        : 'Retain the owned source value; Figma contrast burn-down remains open. ' +
          'The owner must correct and re-export it; see the S1b failing-pairs.json report.',
    };
  });
  await Deno.writeTextFile(
    new URL('contrast-exclusions.json', root),
    JSON.stringify({ version: 1, exclusions }, null, 2) + '\n',
  );
}
if (reportDir) {
  await Deno.mkdir(reportDir, { recursive: true });
  const path = reportDir.replace(/\/$/, '');
  await Deno.writeTextFile(
    `${path}/failing-pairs.json`,
    JSON.stringify(
      { source, inputs: build.contexts.length, checks: report.checks, failures },
      null,
      2,
    ) + '\n',
  );
  const summary = new Map<string, typeof failures>();
  for (const failure of failures) {
    const key = `${failure.preset}/${failure.scheme}`;
    const group = summary.get(key) ?? [];
    group.push(failure);
    summary.set(key, group);
  }
  // JSON contains every pair; show the worst relative failure per context in the short table.
  const rows = [...summary.values()].map((group) => {
    const worst = [...group].sort((a, b) =>
      a.ratio / a.requiredRatio - b.ratio / b.requiredRatio
    )[0];
    return `| ${worst.preset} | ${worst.scheme} | ${worst.foregroundRole} | ${
      worst.backgroundRoles.join(' → ')
    } | ${worst.ratio.toFixed(3)} | ${worst.requiredRatio} | ${group.length} |`;
  });
  await Deno.writeTextFile(
    `${path}/failing-pairs.md`,
    '# Figma contrast burn-down — OPEN\n\n' +
      `${source}. ${report.checks} measured uses; ${failures.length} failing pairs.\n\n` +
      'Every failing pair, exact ratio and paint stack is in [failing-pairs.json](failing-pairs.json). ' +
      'This table shows the worst relative failure per preset/scheme and the total count. ' +
      'Decisions use unrounded ratios. Figma values remain unchanged.\n\n' +
      '| Preset | Scheme | Foreground role | Background role | Ratio | Required | Failing pairs |\n' +
      '| --- | --- | --- | --- | ---: | ---: | ---: |\n' + rows.join('\n') + '\n',
  );
}
console.log(`Measured ${report.checks} uses; ${failures.length} failing source pairs.`);
