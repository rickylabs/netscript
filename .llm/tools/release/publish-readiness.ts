import { discoverVersionFiles } from '../deps/bump-version.ts';
import {
  scanNetscriptJsrSpecifiers,
  type SpecifierScanResult,
} from '../validation/check-netscript-jsr-specifiers.ts';
import {
  DESCRIPTION_MAX_BYTES,
  extractTagline,
  taglineBytes,
} from '../validation/check-jsr-tagline-length.ts';
import { validateReadmeStandard } from '../validation/check-readme-standard.ts';
import { exists } from '../deps/workspace.ts';
import { join, normalize, relative } from 'jsr:@std/path@^1.0.0';
import { readRegistryVersions } from './canary.ts';
import {
  auditMarkdownPins,
  auditPublishSet,
  type MarkdownPreflightResult,
  type PublishSetAuditResult,
} from './preflight-release.ts';
import type { PublishableMember } from './publish-workspace.ts';
import { type ReleaseCommandRunner, runCommand } from './prepare-release.ts';

export type ReadinessStatus = 'PASS' | 'FAIL' | 'SKIP';

export interface ReadinessCheckEvidence {
  readonly id: string;
  readonly status: ReadinessStatus;
  readonly summary: string;
  readonly details: readonly string[];
  readonly durationMs: number;
}

export interface PublishReadinessReport {
  readonly gate: 'publish-readiness';
  readonly ok: boolean;
  readonly version: string;
  readonly checks: readonly ReadinessCheckEvidence[];
}

export interface VersionFinding {
  readonly path: string;
  readonly message: string;
}

export interface FirstPublishViolation {
  readonly packageName: string;
  readonly path: string;
  readonly rule: string;
  readonly message: string;
}

export interface PublishReadinessDependencies {
  readonly auditPublishSet: (root: string) => Promise<PublishSetAuditResult>;
  readonly auditMarkdownPins: (root: string, version: string) => Promise<MarkdownPreflightResult>;
  readonly auditVersions: (root: string, version: string) => Promise<readonly VersionFinding[]>;
  readonly scanSpecifiers: (roots: readonly string[], root: string) => Promise<SpecifierScanResult>;
  readonly readRegistryVersions: (packageName: string) => Promise<readonly string[] | null>;
  readonly auditFirstPublish: (
    root: string,
    members: readonly PublishableMember[],
  ) => Promise<readonly FirstPublishViolation[]>;
  readonly runProvisioningDryCheck: (root: string) => Promise<void>;
  readonly runCanonicalPreflight: (root: string) => Promise<void>;
}

const defaultDependencies: PublishReadinessDependencies = {
  auditPublishSet,
  auditMarkdownPins,
  auditVersions: auditLockstepAndResidue,
  scanSpecifiers: scanNetscriptJsrSpecifiers,
  readRegistryVersions,
  auditFirstPublish: auditFirstPublishPackages,
  runProvisioningDryCheck,
  runCanonicalPreflight,
};

const INTERNAL_SPECIFIER =
  /jsr:@netscript\/[a-z0-9][a-z0-9-]*@\^?((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?)/g;

const IMPORT_ATTRIBUTE_SUNSET =
  'Import-attribute publication remains prohibited until denoland/deno#35546 is fixed, merged, released, and an authenticated canary text-import probe is green.';

/** Collect every pre-publish check without hiding later independent evidence. */
export async function collectPublishReadiness(
  root: string,
  version: string,
  dependencies: PublishReadinessDependencies = defaultDependencies,
): Promise<PublishReadinessReport> {
  const checks: ReadinessCheckEvidence[] = [];
  let publishSet: PublishSetAuditResult | undefined;
  let newPackages: PublishableMember[] | undefined;

  await capture(checks, 'publish-set', async () => {
    publishSet = await dependencies.auditPublishSet(root);
    const deltas = [...publishSet.missing, ...publishSet.extra];
    if (deltas.length > 0) {
      throw new Error(
        [
          ...publishSet.missing.map((member) => `MISSING ${member.name} (${member.path})`),
          ...publishSet.extra.map((member) => `EXTRA ${member.name} (${member.path})`),
        ].join('; '),
      );
    }
    return {
      summary: `${publishSet.effective.length} effective members match workspace declarations`,
      details: publishSet.excluded.map((entry) => `EXCLUDED ${entry.path}: ${entry.reason}`),
    };
  });

  await capture(checks, 'markdown-pins', async () => {
    const result = await dependencies.auditMarkdownPins(root, version);
    if (result.violations.length > 0) {
      throw new Error(
        result.violations.map((finding) =>
          `${finding.path}:${finding.line} ${finding.packageName}@${finding.pinnedVersion}`
        ).join('; '),
      );
    }
    return {
      summary:
        `no blocking stale NetScript version pins; ${result.deferred.length} docs-site finding(s) deferred`,
      details: result.deferred.map((finding) =>
        `DEFERRED ${finding.path}:${finding.line} ${finding.packageName}@${finding.pinnedVersion}`
      ),
    };
  });

  await capture(checks, 'lockstep-residue', async () => {
    const findings = await dependencies.auditVersions(root, version);
    if (findings.length > 0) {
      throw new Error(findings.map((finding) => `${finding.path}: ${finding.message}`).join('; '));
    }
    return { summary: `all release version surfaces are ${version}`, details: [] };
  });

  await capture(checks, 'versionless-specifiers', async () => {
    const roots = publishSet ? publishRoots(publishSet) : ['packages', 'plugins'];
    const result = await dependencies.scanSpecifiers(roots, root);
    if (result.findings.length > 0) {
      throw new Error(
        result.findings.map((finding) => `${finding.path}:${finding.line} ${finding.message}`).join(
          '; ',
        ),
      );
    }
    return {
      summary:
        `${result.scannedFiles} framework source files contain no unsafe versionless NetScript JSR specifier`,
      details: result.allowances.map((entry) =>
        `${entry.path}:${entry.line} ALLOW ${entry.reason}`
      ),
    };
  });

  if (!publishSet) {
    checks.push(skip('new-packages', 'publish-set evidence unavailable'));
  } else {
    await capture(checks, 'new-packages', async () => {
      const discovered: PublishableMember[] = [];
      for (const member of publishSet!.effective) {
        if ((await dependencies.readRegistryVersions(member.name)) === null) {
          discovered.push(member);
        }
      }
      newPackages = discovered;
      return {
        summary: `${newPackages.length} first-publish package(s) detected from JSR metadata`,
        details: newPackages.map((member) => `${member.name} (${member.path})`),
      };
    });
  }

  if (!newPackages) {
    checks.push(skip('first-publish', 'new-package evidence unavailable'));
    checks.push(skip('provisioning-dry-check', 'new-package evidence unavailable'));
  } else {
    await capture(checks, 'first-publish', async () => {
      const violations = await dependencies.auditFirstPublish(root, newPackages!);
      if (violations.length > 0) {
        throw new Error(
          violations.map((violation) =>
            `${violation.packageName} ${violation.path} [${violation.rule}] ${violation.message}`
          ).join('; '),
        );
      }
      return {
        summary: `${newPackages!.length} first-publish package(s) satisfy the production checklist`,
        details: newPackages!.map((member) => member.name),
      };
    });

    await capture(checks, 'provisioning-dry-check', async () => {
      if (newPackages!.length === 0) {
        return { summary: 'no new packages require provisioning', details: [] };
      }
      await dependencies.runProvisioningDryCheck(root);
      return {
        summary: 'JSR provisioning dry-check completed for the workspace',
        details: newPackages!.map((member) => member.name),
      };
    });
  }

  await capture(checks, 'import-attribute-preflight', async () => {
    try {
      await dependencies.runCanonicalPreflight(root);
    } catch (error) {
      throw new Error(`${message(error)} ${IMPORT_ATTRIBUTE_SUNSET}`);
    }
    return {
      summary: 'canonical release:preflight passed',
      details: [IMPORT_ATTRIBUTE_SUNSET],
    };
  });

  return {
    gate: 'publish-readiness',
    ok: checks.every((check) => check.status !== 'FAIL'),
    version,
    checks,
  };
}

/** Validate lockstep manifests and versioned internal JSR references. */
export async function auditLockstepAndResidue(
  root: string,
  version: string,
): Promise<readonly VersionFinding[]> {
  const findings: VersionFinding[] = [];
  for (const absolutePath of await discoverVersionFiles(root)) {
    const path = normalize(relative(root, absolutePath));
    if (isFixturePath(path)) continue;
    const source = await Deno.readTextFile(absolutePath);
    if (path.endsWith('deno.json') || path.endsWith('scaffold.plugin.json')) {
      const manifest: unknown = JSON.parse(source);
      if (
        isJsonObject(manifest) && typeof manifest.version === 'string' &&
        manifest.version !== version
      ) {
        findings.push({ path, message: `manifest version ${manifest.version} is not ${version}` });
      }
    }
    INTERNAL_SPECIFIER.lastIndex = 0;
    for (const match of source.matchAll(INTERNAL_SPECIFIER)) {
      if (match[1] !== version) {
        findings.push({ path, message: `${match[0]} retains ${match[1]} instead of ${version}` });
      }
    }
  }
  return findings.sort((left, right) => left.path.localeCompare(right.path));
}

/** Apply first-publish-only README, tagline, manifest, export, and docs checks. */
export async function auditFirstPublishPackages(
  root: string,
  members: readonly PublishableMember[],
): Promise<readonly FirstPublishViolation[]> {
  const violations: FirstPublishViolation[] = [];
  for (const member of members) {
    const readmePath = join(root, member.path, 'README.md');
    let readme: string | undefined;
    try {
      readme = await Deno.readTextFile(readmePath);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
      violations.push(violation(member, 'README.md', 'readme-missing', 'README.md is required'));
    }
    if (readme !== undefined) {
      for (const finding of validateReadmeStandard(readme)) {
        violations.push(violation(member, 'README.md', `readme-${finding.rule}`, finding.message));
      }
      const tagline = extractTagline(readme);
      const bytes = taglineBytes(readme);
      if (!tagline) {
        violations.push(
          violation(member, 'README.md', 'tagline-missing', 'JSR tagline is required'),
        );
      } else if (bytes > DESCRIPTION_MAX_BYTES) {
        violations.push(
          violation(
            member,
            'README.md',
            'tagline-bytes',
            `JSR tagline is ${bytes} bytes; maximum is ${DESCRIPTION_MAX_BYTES}`,
          ),
        );
      }
    }

    const manifestPath = join(root, member.path, 'deno.json');
    const manifest: unknown = JSON.parse(await Deno.readTextFile(manifestPath));
    if (
      !isJsonObject(manifest) || typeof manifest.license !== 'string' || !manifest.license.trim()
    ) {
      violations.push(violation(member, 'deno.json', 'license', 'non-empty license is required'));
    }
    if (!isJsonObject(manifest) || !hasExports(manifest.exports)) {
      violations.push(violation(member, 'deno.json', 'exports', 'non-empty exports are required'));
    }

    const docsPath = `docs/site/reference/${packageSegment(member.name)}/index.md`;
    if (!(await exists(join(root, docsPath)))) {
      violations.push(
        violation(member, docsPath, 'docs-reference', 'docs-site reference page is required'),
      );
    }
  }
  return violations;
}

async function runProvisioningDryCheck(root: string): Promise<void> {
  await requireSuccessfulCommand(
    'provisioning dry-check',
    'deno',
    [
      'run',
      '--allow-net=api.jsr.io',
      '--allow-read',
      '.llm/tools/release/jsr-provision-packages.ts',
      '--dry-run',
      '--root',
      root,
    ],
    root,
  );
}

async function runCanonicalPreflight(root: string): Promise<void> {
  await requireSuccessfulCommand(
    'canonical release:preflight',
    'deno',
    ['task', 'release:preflight'],
    root,
  );
}

async function requireSuccessfulCommand(
  label: string,
  command: string,
  args: readonly string[],
  root: string,
  runner: ReleaseCommandRunner = runCommand,
): Promise<void> {
  const result = await runner(command, args, root);
  if (result.stdout.trim()) console.log(result.stdout.trim());
  if (result.stderr.trim()) console.error(result.stderr.trim());
  if (result.code !== 0) {
    throw new Error(
      `${label} failed with exit ${result.code}: ${result.stderr.trim() || result.stdout.trim()}`,
    );
  }
}

async function capture(
  checks: ReadinessCheckEvidence[],
  id: string,
  action: () => Promise<{ readonly summary: string; readonly details: readonly string[] }>,
): Promise<void> {
  const started = performance.now();
  try {
    const result = await action();
    checks.push({
      id,
      status: 'PASS',
      summary: result.summary,
      details: result.details,
      durationMs: Math.round(performance.now() - started),
    });
  } catch (error) {
    checks.push({
      id,
      status: 'FAIL',
      summary: `${id} failed`,
      details: [message(error)],
      durationMs: Math.round(performance.now() - started),
    });
  }
}

function skip(id: string, reason: string): ReadinessCheckEvidence {
  return { id, status: 'SKIP', summary: reason, details: [], durationMs: 0 };
}

function violation(
  member: PublishableMember,
  path: string,
  rule: string,
  text: string,
): FirstPublishViolation {
  return {
    packageName: member.name,
    path: normalize(join(member.path, path)),
    rule,
    message: text,
  };
}

function hasExports(value: unknown): boolean {
  return typeof value === 'string'
    ? value.trim().length > 0
    : isJsonObject(value) && Object.keys(value).length > 0;
}

function isFixturePath(path: string): boolean {
  const normalized = `/${path.replaceAll('\\', '/')}`;
  return normalized.includes('/tests/') || normalized.includes('/test/') ||
    normalized.includes('/fixtures/') || normalized.includes('/__fixtures__/');
}

function packageSegment(packageName: string): string {
  const segment = packageName.split('/').at(-1);
  if (!segment) throw new Error(`Invalid scoped package name: ${packageName}`);
  return segment;
}

function publishRoots(result: PublishSetAuditResult): readonly string[] {
  return [
    ...new Set(
      [...result.intended, ...result.effective].map((member) => member.path.split('/')[0]),
    ),
  ].filter(Boolean).sort();
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function readRootVersion(root: string): Promise<string> {
  const value: unknown = JSON.parse(await Deno.readTextFile(join(root, 'deno.json')));
  if (!isJsonObject(value) || typeof value.version !== 'string') {
    throw new Error('Root deno.json requires a string version.');
  }
  return value.version;
}

function parseArgs(argv: readonly string[]): { root: string; version?: string } {
  let root = Deno.cwd();
  let version: string | undefined;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--') continue;
    if (arg === '--root') root = argv[++index] ?? '';
    else if (arg === '--version') version = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!root) throw new Error('--root requires a value.');
  return { root, version };
}

async function main(): Promise<void> {
  const args = parseArgs(Deno.args);
  const report = await collectPublishReadiness(
    args.root,
    args.version ?? await readRootVersion(args.root),
  );
  for (const check of report.checks) console.log(JSON.stringify({ gate: report.gate, ...check }));
  console.log(JSON.stringify({ gate: report.gate, ok: report.ok, version: report.version }));
  if (!report.ok) Deno.exit(1);
}

if (import.meta.main) await main();
