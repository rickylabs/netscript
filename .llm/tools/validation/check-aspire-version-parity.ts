/**
 * Checks manifest-owned Aspire literals against the scaffold SDK pin.
 *
 * Phase 1 fails only scaffold constants, CI, and root config. Phase 2 is the
 * complete non-archival enforcement contract and is intentionally not enabled
 * in CI until the S13 slice.
 */
import { SCAFFOLD_VERSIONS } from '../../../packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts';

export const ASPIRE_SURFACE_MANIFEST_PATH =
  '.llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv';

export type ParityPhase = 1 | 2;
export type FindingStatus = 'fail' | 'deferred' | 'info';

export interface ManifestRow {
  path: string;
  class: string;
  owner: string;
  disposition: string;
}

export interface ParityFinding {
  path: string;
  class: string;
  owner: string;
  status: FindingStatus;
  matches: string[];
  reason: string;
}

export interface ParityReport {
  gate: 'check:aspire-version-parity';
  phase: ParityPhase;
  expectedVersion: string;
  manifest: string;
  ok: boolean;
  counts: {
    checked: number;
    fail: number;
    deferred: number;
    info: number;
    skipped: number;
    missing: number;
  };
  findings: ParityFinding[];
  skipped: string[];
  missing: string[];
}

interface EvaluateOptions {
  rows: readonly ManifestRow[];
  phase: ParityPhase;
  expectedVersion: string;
  readText: (path: string) => Promise<string | null>;
  manifestPath?: string;
}

const STALE_PATTERNS = [/13\.[0-4]\.[0-9]+/g, /Aspire 13\.[0-4]/g] as const;

function staleMatches(source: string): string[] {
  return [
    ...new Set(STALE_PATTERNS.flatMap((pattern) => [...source.matchAll(pattern)].map((m) => m[0]))),
  ];
}

function isPhaseOneFailClass(className: string): boolean {
  return className === 'scaffold-constants' || className === 'root-config' ||
    className.startsWith('ci:');
}

function parityFinding(
  row: ManifestRow,
  status: FindingStatus,
  matches: string[],
  reason: string,
): ParityFinding {
  return {
    path: row.path,
    class: row.class,
    owner: row.owner,
    status,
    matches,
    reason,
  };
}

export function parseManifest(source: string): ManifestRow[] {
  const lines = source.split(/\r?\n/).filter(Boolean);
  const header = lines.shift();
  if (header !== 'path\tclass\towner\tdisposition') {
    throw new Error(`Invalid Aspire surface manifest header: ${header ?? '<missing>'}`);
  }
  return lines.map((line, index) => {
    const [path, className, owner, disposition, ...extra] = line.split('\t');
    if (!path || !className || !owner || !disposition || extra.length > 0) {
      throw new Error(`Invalid Aspire surface manifest row ${index + 2}`);
    }
    return { path, class: className, owner, disposition };
  });
}

/** Evaluates already-parsed manifest rows using an injected repository reader. */
export async function evaluateAspireVersionParity(
  options: EvaluateOptions,
): Promise<ParityReport> {
  const findings: ParityFinding[] = [];
  const skipped: string[] = [];
  const missing: string[] = [];
  let checked = 0;

  for (const row of options.rows) {
    if (row.class === 'lockfile') {
      skipped.push(row.path);
      continue;
    }
    checked++;
    const source = await options.readText(row.path);
    if (source === null) {
      missing.push(row.path);
      continue;
    }
    const matches = staleMatches(source);

    if (row.owner === 'archival') {
      if (matches.length > 0) {
        findings.push(
          parityFinding(row, 'info', matches, 'archival owner is informational only'),
        );
      }
      continue;
    }

    if (options.phase === 2 && row.class === 'compat-fixture') {
      const hasExpectedVersion = source.includes(options.expectedVersion);
      findings.push(parityFinding(
        row,
        hasExpectedVersion ? 'info' : 'fail',
        matches,
        hasExpectedVersion
          ? `compat fixture contains the required ${options.expectedVersion} literal`
          : `compat fixture is missing the required ${options.expectedVersion} literal`,
      ));
      continue;
    }

    if (matches.length === 0) continue;
    const fail = options.phase === 2 || isPhaseOneFailClass(row.class);
    findings.push(parityFinding(
      row,
      fail ? 'fail' : 'deferred',
      matches,
      fail
        ? `stale Aspire literal conflicts with ${options.expectedVersion}`
        : `stale Aspire literal is deferred to manifest owner ${row.owner}`,
    ));
  }

  const count = (status: FindingStatus): number =>
    findings.filter((finding) => finding.status === status).length;
  const fail = count('fail');
  return {
    gate: 'check:aspire-version-parity',
    phase: options.phase,
    expectedVersion: options.expectedVersion,
    manifest: options.manifestPath ?? ASPIRE_SURFACE_MANIFEST_PATH,
    ok: fail === 0,
    counts: {
      checked,
      fail,
      deferred: count('deferred'),
      info: count('info'),
      skipped: skipped.length,
      missing: missing.length,
    },
    findings,
    skipped,
    missing,
  };
}

function parsePhase(args: string[]): ParityPhase {
  const index = args.indexOf('--phase');
  if (index === -1) return 1;
  const value = args[index + 1];
  if (value === '1' || value === '2') return Number(value) as ParityPhase;
  throw new Error(`--phase must be 1 or 2, received ${value ?? '<missing>'}`);
}

async function readRepositoryFile(path: string): Promise<string | null> {
  try {
    return await Deno.readTextFile(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return null;
    throw error;
  }
}

export async function runParityGate(args: string[] = Deno.args): Promise<ParityReport> {
  const manifestSource = await Deno.readTextFile(ASPIRE_SURFACE_MANIFEST_PATH);
  return await evaluateAspireVersionParity({
    rows: parseManifest(manifestSource),
    phase: parsePhase(args),
    expectedVersion: SCAFFOLD_VERSIONS.ASPIRE_SDK,
    readText: readRepositoryFile,
  });
}

if (import.meta.main) {
  const report = await runParityGate();
  console.log(JSON.stringify(report));
  Deno.exit(report.ok ? 0 : 1);
}
