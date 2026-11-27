/**
 * Checks manifest-owned Aspire literals against the scaffold SDK pin.
 *
 * Phase 1 enforces scaffold constants, CI, and root config (requiring every
 * locked pin to be present and rejecting unauthorized 13.x / 17.x tokens).
 * Phase 2 enforces the complete non-archival Aspire 17.0.0 contract across the
 * tracked repository surface.
 */
import { SCAFFOLD_VERSIONS } from '../../../packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts';
import { buildAspireSurfaceManifest } from './aspire-surface-manifest.ts';
import { isTransientAspireScanPath } from './aspire-scan-scope.ts';

export const ASPIRE_SURFACE_MANIFEST_PATH =
  '.llm/tools/validation/fixtures/aspire-surface-manifest.tsv';

export type ParityPhase = 1 | 2;
export type FindingStatus = 'fail' | 'deferred' | 'info';
export const PHASE_TWO_COMPAT_VERSION = '17.0.0';

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
  manifestFresh: boolean;
}

interface EvaluateOptions {
  rows: readonly ManifestRow[];
  phase: ParityPhase;
  expectedVersion: string;
  readText: (path: string) => Promise<string | null>;
  manifestPath?: string;
  manifestSource?: string;
  generatedManifestSource?: string;
  generatedManifestUnmatched?: readonly string[];
}

interface PhaseOnePinPolicy {
  readonly allowed: readonly string[];
  readonly required: readonly string[];
}

const STALE_PATTERNS = [/13\.[0-9]+\.[0-9]+/g, /Aspire 13\.[0-9]+/g] as const;
const VERSION_LITERAL_PATTERN =
  /(?<![0-9A-Za-z.])(?:13|17)\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?(?![0-9A-Za-z-]|\.[0-9A-Za-z])/g;
const SEVENTEEN_LITERAL_PATTERN =
  /(?<![0-9A-Za-z.])17\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?(?![0-9A-Za-z-]|\.[0-9A-Za-z])/g;
const ALLOWED_ASPIRE_17_VERSIONS: readonly string[] = [
  '17.0.0',
  '17.0.0-preview.1.26567.5',
  '17.0.0-v1',
];
const ASPIRE_CONTEXT_LINE = /\baspire\b|Aspire\.Hosting|ASPIRE_SDK|ASPIRE_CLI|17\.0\.0-preview/i;

export const EXACT_ASPIRE_VERSION_TOKEN_MATCH = (
  candidate: string,
  expectedVersion: string,
): boolean => candidate.trim() === expectedVersion.trim();

export const PHASE_ONE_EXACT_VERSIONS: Readonly<Record<string, PhaseOnePinPolicy>> = {
  'packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts': {
    allowed: ['17.0.0'],
    required: ['17.0.0'],
  },
  'packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts': {
    allowed: ['17.0.0', '17.0.0-preview.1.26567.5'],
    required: ['17.0.0', '17.0.0-preview.1.26567.5'],
  },
  '.github/toolchain.env': {
    allowed: ['17.0.0'],
    required: ['17.0.0'],
  },
  '.github/scripts/aspire-nuget-cache-policy.test.ts': {
    allowed: ['17.0.0', '17.0.0-v1'],
    required: ['17.0.0', '17.0.0-v1'],
  },
  '.github/workflows/e2e-cli.yml': {
    allowed: ['17.0.0', '17.0.0-v1'],
    required: ['17.0.0', '17.0.0-v1'],
  },
  '.github/workflows/e2e-cli-prod.yml': {
    allowed: ['17.0.0', '17.0.0-v1'],
    required: ['17.0.0', '17.0.0-v1'],
  },
  '.github/workflows/e2e-cli-prod-local.yml': {
    allowed: ['17.0.0', '17.0.0-v1'],
    required: ['17.0.0', '17.0.0-v1'],
  },
};

/** Remove only syntax explicitly permitted by the manifest-owned context. */
function pinSource(source: string, className: string): string {
  if (className === 'negative-version-guard') {
    // Deliberately not a TS parser: recognize only a standalone, direct three-argument
    // guard statement with an identifier input and literal/identifier location.
    // Unfamiliar syntax remains fail-closed.
    return source.replace(
      /^(\s*forbidText\(\s*[A-Za-z_$][\w$]*\s*,\s*)(['"])(13\.[0-9]+\.[0-9]+)\2(?=\s*,\s*(?:[A-Za-z_$][\w$]*|'[^'\r\n]*'|"[^"\r\n]*")\s*,?\s*\)\s*;\s*$)/gm,
      '$1$2<forbidden version>$2',
    );
  }
  return source;
}

function staleMatches(source: string, className: string): string[] {
  const pins = pinSource(source, className);
  return [
    ...new Set(STALE_PATTERNS.flatMap((pattern) => [...pins.matchAll(pattern)].map((m) => m[0]))),
  ];
}

function unexpectedPhaseOneVersions(path: string, source: string): string[] {
  const policy = PHASE_ONE_EXACT_VERSIONS[path];
  if (!policy) return [];
  return [
    ...new Set(
      [...source.matchAll(VERSION_LITERAL_PATTERN)]
        .map((match) => match[0])
        .filter((version) => !policy.allowed.includes(version)),
    ),
  ];
}

function missingPhaseOneVersions(path: string, source: string): string[] {
  const policy = PHASE_ONE_EXACT_VERSIONS[path];
  if (!policy) return [];
  return policy.required.filter((requiredVersion) =>
    !containsExactAspireVersionToken(source, requiredVersion)
  );
}

const FIXTURE_FILENAME_SUFFIX = /^17\.0\.0-[A-Za-z0-9._-]+\.(?:json|ndjson|ts|mts|js|mjs|gz|md)$/i;

function normalizeContextualSeventeenToken(token: string): string {
  return FIXTURE_FILENAME_SUFFIX.test(token) ? '17.0.0' : token;
}

function unexpectedContextualSeventeenVersions(source: string): string[] {
  const found = new Set<string>();
  for (const line of source.split(/\r?\n/)) {
    if (!ASPIRE_CONTEXT_LINE.test(line)) continue;
    for (const match of line.matchAll(SEVENTEEN_LITERAL_PATTERN)) {
      const normalized = normalizeContextualSeventeenToken(match[0]);
      if (!ALLOWED_ASPIRE_17_VERSIONS.includes(normalized)) {
        found.add(match[0]);
      }
    }
  }
  return [...found];
}

function containsExactAspireVersionToken(source: string, expectedVersion: string): boolean {
  return [...source.matchAll(VERSION_LITERAL_PATTERN)]
    .map((match) => normalizeContextualSeventeenToken(match[0]))
    .some((candidate) => EXACT_ASPIRE_VERSION_TOKEN_MATCH(candidate, expectedVersion));
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
  const sourcesMatch = options.manifestSource === undefined ||
    options.generatedManifestSource === undefined ||
    options.manifestSource === options.generatedManifestSource;
  const unmatched = options.generatedManifestUnmatched ?? [];
  const manifestFresh = sourcesMatch && unmatched.length === 0;

  if (!manifestFresh) {
    findings.push(parityFinding(
      {
        path: options.manifestPath ?? ASPIRE_SURFACE_MANIFEST_PATH,
        class: 'manifest:freshness',
        owner: 'S13',
        disposition: 'regenerate before parity evaluation',
      },
      'fail',
      [...unmatched],
      unmatched.length > 0
        ? 'Aspire surface manifest has paths without an ownership rule'
        : 'Aspire surface manifest is stale; rerun aspire-surface-manifest.ts',
    ));
  }

  for (const row of options.rows) {
    if (row.class === 'lockfile' || isTransientAspireScanPath(row.path)) {
      skipped.push(row.path);
      continue;
    }
    checked++;
    const source = await options.readText(row.path);
    if (source === null) {
      missing.push(row.path);
      if (row.owner !== 'archival') {
        findings.push(parityFinding(
          row,
          'fail',
          [],
          'required manifest path is missing',
        ));
      }
      continue;
    }

    if (row.owner === 'archival' || row.class.startsWith('archival:')) {
      const archivalMatches = staleMatches(source, row.class);
      if (archivalMatches.length > 0) {
        findings.push(
          parityFinding(row, 'info', archivalMatches, 'archival owner is informational only'),
        );
      }
      continue;
    }

    if (row.class === 'validation-test-fixture') {
      if (options.phase === 2) {
        const hasExpectedVersion = containsExactAspireVersionToken(
          source,
          PHASE_TWO_COMPAT_VERSION,
        );
        findings.push(parityFinding(
          row,
          hasExpectedVersion ? 'info' : 'fail',
          hasExpectedVersion ? [] : [PHASE_TWO_COMPAT_VERSION],
          hasExpectedVersion
            ? `validation test fixture covers the required ${PHASE_TWO_COMPAT_VERSION} literal`
            : `validation test fixture is missing the required ${PHASE_TWO_COMPAT_VERSION} literal`,
        ));
      }
      continue;
    }

    const missingExactPins = missingPhaseOneVersions(row.path, source);
    if (missingExactPins.length > 0) {
      findings.push(parityFinding(
        row,
        'fail',
        missingExactPins,
        'required Aspire pin is missing from locked exact-pin surface',
      ));
    }

    const exactMismatches = unexpectedPhaseOneVersions(row.path, source);
    const contextualSeventeenMismatches = row.path in PHASE_ONE_EXACT_VERSIONS
      ? []
      : unexpectedContextualSeventeenVersions(source);
    const matches = [
      ...new Set([
        ...staleMatches(source, row.class),
        ...exactMismatches,
        ...contextualSeventeenMismatches,
      ]),
    ];

    if (options.phase === 2 && row.class === 'compat-fixture') {
      const hasExpectedVersion = containsExactAspireVersionToken(
        source,
        PHASE_TWO_COMPAT_VERSION,
      );
      if (!hasExpectedVersion) {
        findings.push(parityFinding(
          row,
          'fail',
          matches.length > 0 ? matches : [PHASE_TWO_COMPAT_VERSION],
          `compat fixture is missing the required ${PHASE_TWO_COMPAT_VERSION} literal`,
        ));
      } else if (matches.length > 0) {
        findings.push(parityFinding(
          row,
          'fail',
          matches,
          `compat fixture contains stale or unauthorized Aspire literal alongside ${PHASE_TWO_COMPAT_VERSION}`,
        ));
      } else {
        findings.push(parityFinding(
          row,
          'info',
          [],
          `compat fixture contains the required ${PHASE_TWO_COMPAT_VERSION} literal`,
        ));
      }
      continue;
    }

    if (matches.length === 0) continue;
    const fail = options.phase === 2 || isPhaseOneFailClass(row.class);
    findings.push(parityFinding(
      row,
      fail ? 'fail' : 'deferred',
      matches,
      exactMismatches.length > 0
        ? 'Aspire literal is outside the locked phase-1 pin policy'
        : contextualSeventeenMismatches.length > 0
        ? `unauthorized Aspire 17 literal conflicts with ${options.expectedVersion}`
        : fail
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
    manifestFresh,
  };
}

/** Parse the optional phase selector while preserving phase 1 as the default. */
export function parsePhase(args: string[]): ParityPhase {
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
  const generatedManifest = await buildAspireSurfaceManifest();
  const phase = parsePhase(args);
  return await evaluateAspireVersionParity({
    rows: parseManifest(manifestSource),
    phase,
    expectedVersion: phase === 2 ? PHASE_TWO_COMPAT_VERSION : SCAFFOLD_VERSIONS.ASPIRE_SDK,
    readText: readRepositoryFile,
    manifestSource,
    generatedManifestSource: generatedManifest.body,
    generatedManifestUnmatched: generatedManifest.unmatched,
  });
}

if (import.meta.main) {
  const report = await runParityGate();
  console.log(JSON.stringify(report));
  Deno.exit(report.ok || Deno.args.includes('--report') ? 0 : 1);
}
