import type { TokenContextOutput } from './token-output.ts';
import type {
  TokenContrastCoverage,
  TokenContrastExclusion,
  TokenContrastPair,
  TokenContrastPort,
  TokenContrastReport,
  TokenContrastResult,
} from './contrast-contract.ts';
import { CONTROL_CONTRAST_MINIMUM, TEXT_CONTRAST_MINIMUM } from './contrast-contract.ts';

const PACK_PREFIXES = [
  'studio',
  'bloom',
  'liquid',
  'cupertino',
  'fluent',
  'tactile',
  'pixel',
  'terminal',
];
const REQUIRED_CONTROL_ROLES = ['ring', 'input-border', 'border-control'];

function applies(pair: TokenContrastPair, context: TokenContextOutput): boolean {
  return !pair.presets || pair.presets.includes(context.preset.id);
}

function ownedRole(name: string, context: TokenContextOutput): boolean {
  if (name.startsWith('component-key-') && context.preset.language !== 'terminal') return false;
  const pack = PACK_PREFIXES.find((prefix) => name.startsWith(`${prefix}-`));
  return !pack || pack === context.preset.language;
}

function foregroundRole(name: string, context: TokenContextOutput): boolean {
  const token = context.tokens[name];
  if (token.type !== 'color' || token.path[0] === 'color' || !ownedRole(name, context)) {
    return false;
  }
  return /(^|-)(fg|text|on)(-|$)/.test(name);
}

function backgroundRole(name: string, context: TokenContextOutput): boolean {
  const token = context.tokens[name];
  if (token.type !== 'color' || token.path[0] === 'color' || !ownedRole(name, context)) {
    return false;
  }
  return name === 'bg' || /-bg(?:-hover|-\d+)?$/.test(name) ||
    PACK_PREFIXES.some((pack) =>
      name.startsWith(`${pack}-surface-`) || name.startsWith(`${pack}-material-`)
    );
}

/** A newly exported foreground must have an intentional background, never an implicit skip. */
export function assertContrastCoverage(
  contexts: readonly TokenContextOutput[],
  coverage: TokenContrastCoverage,
): void {
  if (!contexts.length) throw new Error('No contrast contexts');
  const ids = new Set<string>();
  const presets = new Set(contexts.map((context) => context.preset.id));
  for (const pair of coverage.pairs) {
    if (!pair.id || ids.has(pair.id)) {
      throw new Error(`Duplicate or empty contrast pair ID: ${pair.id}`);
    }
    ids.add(pair.id);
    if (
      !pair.background.length ||
      ![TEXT_CONTRAST_MINIMUM, CONTROL_CONTRAST_MINIMUM].includes(pair.minimum)
    ) throw new Error(`Invalid contrast pair: ${pair.id}`);
    if (
      pair.presets && (!pair.presets.length || pair.presets.some((preset) => !presets.has(preset)))
    ) throw new Error(`Unknown contrast preset: ${pair.id}`);
  }
  const decorations = new Set<string>();
  for (const context of contexts) {
    const foregrounds = new Set<string>();
    const backgrounds = new Set<string>();
    for (const pair of coverage.pairs.filter((pair) => applies(pair, context))) {
      for (const name of [pair.foreground, ...pair.background]) {
        if (context.tokens[name]?.type !== 'color') {
          throw new Error(`Unknown contrast color: ${context.preset.id}/${pair.id}/${name}`);
        }
      }
      foregrounds.add(pair.foreground);
      pair.background.forEach((name) => backgrounds.add(name));
      if (
        foregroundRole(pair.foreground, context) && !coverage.decorativeRoles[pair.foreground] &&
        pair.minimum !== TEXT_CONTRAST_MINIMUM
      ) throw new Error(`Text contrast threshold must be 4.5: ${pair.id}`);
    }
    for (const role of REQUIRED_CONTROL_ROLES) {
      if (
        !coverage.pairs.some((pair) =>
          applies(pair, context) && pair.foreground === role &&
          pair.minimum === CONTROL_CONTRAST_MINIMUM
        )
      ) throw new Error(`Missing control/focus contrast coverage: ${context.preset.id}/${role}`);
    }
    for (
      const name of Object.keys(context.tokens).filter((name) => foregroundRole(name, context))
    ) {
      if (coverage.decorativeRoles[name]) decorations.add(name);
      else if (!foregrounds.has(name)) {
        throw new Error(`Unpaired foreground role: ${context.preset.id}/${name}`);
      }
    }
    for (
      const name of Object.keys(context.tokens).filter((name) => backgroundRole(name, context))
    ) {
      if (!backgrounds.has(name)) {
        throw new Error(`Unpaired background role: ${context.preset.id}/${name}`);
      }
    }
  }
  for (const [name, reason] of Object.entries(coverage.decorativeRoles)) {
    if (!reason.trim() || !decorations.has(name)) {
      throw new Error(`Stale decorative role declaration: ${name}`);
    }
  }
}

function key(value: { preset: string; scheme: string; pair: string }): string {
  return JSON.stringify([value.preset, value.scheme, value.pair]);
}

/** Keep exact measured failures, and reject unused, stale or broadened exclusion data. */
export function evaluateTokenContrast(
  contexts: readonly TokenContextOutput[],
  coverage: TokenContrastCoverage,
  exclusions: readonly TokenContrastExclusion[],
  colors: TokenContrastPort,
): TokenContrastReport {
  assertContrastCoverage(contexts, coverage);
  const allowed = new Map<string, TokenContrastExclusion>();
  for (const exclusion of exclusions) {
    const id = key(exclusion);
    if (allowed.has(id)) throw new Error(`Duplicate contrast exclusion: ${id}`);
    if (!exclusion.source.trim() || !exclusion.reason.trim() || !Number.isFinite(exclusion.ratio)) {
      throw new Error(`Invalid contrast exclusion: ${id}`);
    }
    allowed.set(id, exclusion);
  }
  const used = new Set<string>();
  const seen = new Set<string>();
  const excluded: TokenContrastResult[] = [];
  const failures: TokenContrastResult[] = [];
  let checks = 0;
  for (const context of contexts) {
    const identity = `${context.preset.id}/${context.scheme}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    for (const pair of coverage.pairs.filter((pair) => applies(pair, context))) {
      const measurement = colors.measure(
        context.tokens[pair.foreground].resolved,
        pair.background.map((name) => context.tokens[name].resolved),
        context.tokens.bg.resolved,
      );
      if (!Number.isFinite(measurement.ratio) || measurement.ratio < 1 || measurement.ratio > 21) {
        throw new Error(`Invalid contrast measurement: ${identity}/${pair.id}`);
      }
      checks++;
      const result: TokenContrastResult = {
        ...measurement,
        preset: context.preset.id,
        scheme: context.scheme,
        pair: pair.id,
        minimum: pair.minimum,
      };
      if (measurement.ratio >= pair.minimum) continue;
      const exclusion = allowed.get(key(result));
      if (
        exclusion && exclusion.minimum === pair.minimum &&
        exclusion.ratio === Number(measurement.ratio.toFixed(12)) &&
        exclusion.foreground === measurement.foreground &&
        exclusion.background === measurement.background
      ) {
        used.add(key(result));
        excluded.push(result);
      } else failures.push(result);
    }
  }
  for (const id of allowed.keys()) {
    if (!used.has(id)) throw new Error(`Stale or unused contrast exclusion: ${id}`);
  }
  return { checks, excluded, failures };
}

/** CI fails on every unapproved violation; exclusions are still reported explicitly. */
export function assertTokenContrast(report: TokenContrastReport): void {
  if (!report.failures.length) return;
  const examples = report.failures.slice(0, 8).map((result) =>
    `${result.preset}/${result.scheme}/${result.pair}: ${
      result.ratio.toFixed(12)
    } < ${result.minimum}`
  );
  throw new Error(
    `WCAG AA contrast failed for ${report.failures.length} pairs:\n${examples.join('\n')}`,
  );
}
