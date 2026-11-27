/**
 * aspire-bump.ts — deterministic Aspire release-train check & allowlisted pin bumper.
 *
 * Read-only / dry-run by default: queries the NuGet v3 flatcontainer index for
 * NetScript's pinned Aspire packages and reports version drift + exact planned
 * edits. Pass `--apply` to mutate ONLY the 7 allowlisted exact-pin files below;
 * fixtures, docs, carriers, and unrelated pins are never touched.
 *
 * Usage:
 *   deno task aspire:bump [--pretty|--json] [--offline]
 *   deno task aspire:bump --version <version> --browsers-version <browsers-preview-version> --apply
 */
import { join } from 'jsr:@std/path@^1';

export const ASPIRE_STABLE_PACKAGES = [
  'Aspire.Cli',
  'Aspire.Hosting.AppHost',
  'Aspire.Hosting.JavaScript',
  'Aspire.Hosting.PostgreSQL',
  'Aspire.Hosting.MySql',
  'Aspire.Hosting.SqlServer',
] as const;

export const ASPIRE_PREVIEW_PACKAGE = 'Aspire.Hosting.Browsers' as const;

export const ASPIRE_BUMP_ALLOWLIST = [
  'packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts',
  'packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts',
  '.github/toolchain.env',
  '.github/workflows/e2e-cli.yml',
  '.github/workflows/e2e-cli-prod.yml',
  '.github/workflows/e2e-cli-prod-local.yml',
  '.github/scripts/aspire-nuget-cache-policy.test.ts',
] as const;

export type AllowlistedPath = (typeof ASPIRE_BUMP_ALLOWLIST)[number];

export interface AspirePinUpdate {
  readonly path: AllowlistedPath;
  readonly changed: boolean;
  readonly before: string;
  readonly after: string;
}

export interface AspireBumpReport {
  readonly mode: 'dry-run' | 'apply';
  readonly currentVersion: string;
  readonly currentBrowsersVersion: string;
  readonly targetVersion: string;
  readonly targetBrowsersVersion: string;
  readonly nugetVersions: Readonly<Record<string, string | null>>;
  readonly allowlist: readonly AllowlistedPath[];
  readonly updates: readonly AspirePinUpdate[];
  readonly changedFiles: readonly AllowlistedPath[];
  readonly manualChecklist: readonly string[];
}

export interface AspireBumpOptions {
  readonly repoRoot?: string;
  readonly apply?: boolean;
  readonly offline?: boolean;
  readonly targetVersion?: string;
  readonly targetBrowsersVersion?: string;
  readonly fetchPackageVersions?: (packageId: string) => Promise<readonly string[]>;
}

const STABLE_SEMVER_RE = /^\d+\.\d+\.\d+$/;
const ANY_SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

const MANUAL_CHECKLIST: readonly string[] = [
  'Re-capture packages/cli/src/kernel/templates/aspire/helpers/tests/fixtures/aspire-sdk-<version>.json.gz from live `aspire restore`',
  'Re-capture live `aspire doctor`, `aspire describe`, `aspire ps`, `aspire agent mcp`, and `/api/telemetry` fixtures',
  'Update docs/site/explanation/aspire.md, docs/site/orchestration-runtime/how-to/deploy-local-aspire.md, and .llm/tools/validation/check-aspire-version-parity.ts allowed/required pins',
  'Regenerate carriers (gen:agent-docs-prose, gen:mcp-export-corpus, gen:assets-barrel, gen:publish-assets, aspire-surface-manifest.ts, maint:dogfood-skills)',
  'Run `deno task check:scaffold-versions`, `deno task check:aspire-version-parity`, `deno task check:aspire-version-parity --phase 2`, `deno test --allow-read .github/scripts/aspire-nuget-cache-policy.test.ts`, and `deno task docs:accuracy`',
];

function assertValidVersion(value: string, label: string, stableOnly: boolean): void {
  const pattern = stableOnly ? STABLE_SEMVER_RE : ANY_SEMVER_RE;
  if (!pattern.test(value)) {
    throw new Error(
      `Invalid ${label} ${JSON.stringify(value)}; expected ${
        stableOnly ? 'stable SemVer (X.Y.Z)' : 'SemVer (X.Y.Z[-prerelease])'
      }`,
    );
  }
}

export function compareSemver(left: string, right: string): number {
  const parse = (v: string) => {
    const [core, pre] = v.split('-', 2);
    const [maj, min, pat] = core.split('.').map(Number);
    return { maj, min, pat, pre: pre ?? null };
  };
  const a = parse(left);
  const b = parse(right);
  if (a.maj !== b.maj) return a.maj - b.maj;
  if (a.min !== b.min) return a.min - b.min;
  if (a.pat !== b.pat) return a.pat - b.pat;
  if (a.pre === b.pre) return 0;
  if (a.pre === null) return 1;
  if (b.pre === null) return -1;
  return a.pre.localeCompare(b.pre, 'en', { numeric: true });
}

export function latestStableVersion(versions: readonly string[]): string | null {
  const stable = versions.filter((v) => STABLE_SEMVER_RE.test(v)).sort(compareSemver);
  return stable.at(-1) ?? null;
}

export function latestBrowsersVersionForTrain(
  versions: readonly string[],
  trainVersion: string,
): string | null {
  const exactStable = versions.find((v) => v === trainVersion);
  if (exactStable) return exactStable;
  const trainPreviews = versions
    .filter((v) => v.startsWith(`${trainVersion}-preview.`))
    .sort(compareSemver);
  if (trainPreviews.length > 0) return trainPreviews.at(-1) ?? null;
  const anyValid = versions.filter((v) => ANY_SEMVER_RE.test(v)).sort(compareSemver);
  return anyValid.at(-1) ?? null;
}

async function fetchNugetVersions(packageId: string): Promise<readonly string[]> {
  const url = `https://api.nuget.org/v3-flatcontainer/${packageId.toLowerCase()}/index.json`;
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`NuGet index request failed for ${packageId}: HTTP ${response.status}`);
  }
  const payload = (await response.json()) as { versions?: unknown };
  if (!Array.isArray(payload.versions)) {
    throw new Error(`Unexpected NuGet index payload for ${packageId}`);
  }
  return payload.versions.filter((v): v is string => typeof v === 'string');
}

function replaceRequired(
  source: string,
  pattern: RegExp,
  replacement: string,
  description: string,
): string {
  if (!pattern.test(source)) {
    throw new Error(`Expected exact pin pattern not found (${description})`);
  }
  pattern.lastIndex = 0;
  return source.replace(pattern, replacement);
}

function transformScaffoldVersions(source: string, targetVersion: string): string {
  return replaceRequired(
    source,
    /(ASPIRE_SDK:\s*')[^']+(')/,
    `$1${targetVersion}$2`,
    'scaffold-versions.ts ASPIRE_SDK',
  );
}

function transformScaffoldAspire(
  source: string,
  targetVersion: string,
  targetBrowsersVersion: string,
): string {
  let out = source;
  for (const key of ['POSTGRES', 'MYSQL', 'MSSQL', 'JAVASCRIPT'] as const) {
    out = replaceRequired(
      out,
      new RegExp(`(${key}:\\s*\\{[\\s\\S]*?VERSION:\\s*')[^']+(')`),
      `$1${targetVersion}$2`,
      `scaffold-aspire.ts ${key}.VERSION`,
    );
  }
  out = replaceRequired(
    out,
    /(BROWSERS:\s*\{[\s\S]*?VERSION:\s*')[^']+(')/,
    `$1${targetBrowsersVersion}$2`,
    'scaffold-aspire.ts BROWSERS.VERSION',
  );
  return out;
}

function transformToolchainEnv(source: string, targetVersion: string): string {
  let out = replaceRequired(
    source,
    /^(NETSCRIPT_ASPIRE_CLI_VERSION=).+$/m,
    `$1${targetVersion}`,
    '.github/toolchain.env NETSCRIPT_ASPIRE_CLI_VERSION',
  );
  out = replaceRequired(
    out,
    /^(NETSCRIPT_ASPIRE_SDK_VERSION=).+$/m,
    `$1${targetVersion}`,
    '.github/toolchain.env NETSCRIPT_ASPIRE_SDK_VERSION',
  );
  return out;
}

function transformWorkflow(source: string, targetVersion: string, path: string): string {
  let out = replaceRequired(
    source,
    /(key:\s*nuget-aspire-\$\{\{\s*runner\.os\s*\}\}-)[^\s-]+(-v1)/g,
    `$1${targetVersion}$2`,
    `${path} nuget-aspire cache key`,
  );
  out = replaceRequired(
    out,
    /(key:\s*aspire-cli-\$\{\{\s*runner\.os\s*\}\}-)[^\s-]+(-v1)/g,
    `$1${targetVersion}$2`,
    `${path} aspire-cli cache key`,
  );
  out = replaceRequired(
    out,
    /(dotnet tool install Aspire\.Cli --tool-path "\$HOME\/\.aspire\/bin" --version )[^\s]+/g,
    `$1${targetVersion}`,
    `${path} dotnet tool install Aspire.Cli`,
  );
  out = replaceRequired(
    out,
    /(case "\$aspire_version" in\r?\n\s*)[^)\r\n]+(\)\s*;;)/g,
    `$1${targetVersion}|${targetVersion}+*$2`,
    `${path} Aspire CLI preflight case`,
  );
  out = replaceRequired(
    out,
    /(Expected Aspire CLI )[^,]+(, got \$aspire_version)/g,
    `$1${targetVersion}$2`,
    `${path} Aspire CLI preflight message`,
  );
  return out;
}

function transformCachePolicyTest(source: string, targetVersion: string): string {
  let out = replaceRequired(
    source,
    /(const ASPIRE_VERSION = ')[^']+(';)/,
    `$1${targetVersion}$2`,
    '.github/scripts/aspire-nuget-cache-policy.test.ts ASPIRE_VERSION',
  );
  out = replaceRequired(
    out,
    /(const ASPIRE_CACHE_SUFFIX = ')[^']+(-v1';)/,
    `$1${targetVersion}$2`,
    '.github/scripts/aspire-nuget-cache-policy.test.ts ASPIRE_CACHE_SUFFIX',
  );
  return out;
}

function extractCurrentPins(
  versionsSource: string,
  aspireSource: string,
): { currentVersion: string; currentBrowsersVersion: string } {
  const sdkMatch = versionsSource.match(/ASPIRE_SDK:\s*'([^']+)'/);
  const browsersMatch = aspireSource.match(/BROWSERS:\s*\{[\s\S]*?VERSION:\s*'([^']+)'/);
  if (!sdkMatch || !browsersMatch) {
    throw new Error('Could not parse current ASPIRE_SDK or BROWSERS.VERSION pins');
  }
  return {
    currentVersion: sdkMatch[1],
    currentBrowsersVersion: browsersMatch[1],
  };
}

export async function planOrApplyAspireBump(
  options: AspireBumpOptions = {},
): Promise<AspireBumpReport> {
  const repoRoot = options.repoRoot ?? Deno.cwd();
  const apply = options.apply ?? false;
  const offline = options.offline ?? false;
  const fetcher = options.fetchPackageVersions ?? fetchNugetVersions;

  const versionsPath = join(repoRoot, ASPIRE_BUMP_ALLOWLIST[0]);
  const aspirePath = join(repoRoot, ASPIRE_BUMP_ALLOWLIST[1]);
  const [versionsSource, aspireSource] = await Promise.all([
    Deno.readTextFile(versionsPath),
    Deno.readTextFile(aspirePath),
  ]);
  const { currentVersion, currentBrowsersVersion } = extractCurrentPins(
    versionsSource,
    aspireSource,
  );

  const nugetVersions: Record<string, string | null> = {};
  let resolvedVersion = options.targetVersion ?? currentVersion;
  let resolvedBrowsersVersion = options.targetBrowsersVersion ?? currentBrowsersVersion;

  if (!offline) {
    const stableResults = await Promise.all(
      ASPIRE_STABLE_PACKAGES.map(async (pkg) => [pkg, await fetcher(pkg)] as const),
    );
    const browsersAll = await fetcher(ASPIRE_PREVIEW_PACKAGE);
    for (const [pkg, list] of stableResults) {
      nugetVersions[pkg] = latestStableVersion(list);
    }
    if (!options.targetVersion) {
      const commonStable = stableResults.map(([, list]) => latestStableVersion(list));
      if (commonStable.some((v) => v === null)) {
        throw new Error('One or more Aspire stable packages returned no stable NuGet version');
      }
      // Choose the highest version present across every required stable package.
      const sorted = [...new Set(commonStable as string[])].sort(compareSemver);
      resolvedVersion = sorted[0];
    }
    const browsersLatest = latestBrowsersVersionForTrain(browsersAll, resolvedVersion);
    nugetVersions[ASPIRE_PREVIEW_PACKAGE] = browsersLatest;
    if (!options.targetBrowsersVersion && browsersLatest) {
      resolvedBrowsersVersion = browsersLatest;
    }
  }

  assertValidVersion(resolvedVersion, 'targetVersion', true);
  assertValidVersion(resolvedBrowsersVersion, 'targetBrowsersVersion', false);

  const updates: AspirePinUpdate[] = [];
  for (const relPath of ASPIRE_BUMP_ALLOWLIST) {
    const absPath = join(repoRoot, relPath);
    const before = await Deno.readTextFile(absPath);
    let after: string;
    switch (relPath) {
      case 'packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts':
        after = transformScaffoldVersions(before, resolvedVersion);
        break;
      case 'packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts':
        after = transformScaffoldAspire(before, resolvedVersion, resolvedBrowsersVersion);
        break;
      case '.github/toolchain.env':
        after = transformToolchainEnv(before, resolvedVersion);
        break;
      case '.github/workflows/e2e-cli.yml':
      case '.github/workflows/e2e-cli-prod.yml':
      case '.github/workflows/e2e-cli-prod-local.yml':
        after = transformWorkflow(before, resolvedVersion, relPath);
        break;
      case '.github/scripts/aspire-nuget-cache-policy.test.ts':
        after = transformCachePolicyTest(before, resolvedVersion);
        break;
    }
    const changed = before !== after;
    if (apply && changed) {
      await Deno.writeTextFile(absPath, after);
    }
    updates.push({ path: relPath, changed, before, after });
  }

  return {
    mode: apply ? 'apply' : 'dry-run',
    currentVersion,
    currentBrowsersVersion,
    targetVersion: resolvedVersion,
    targetBrowsersVersion: resolvedBrowsersVersion,
    nugetVersions,
    allowlist: ASPIRE_BUMP_ALLOWLIST,
    updates,
    changedFiles: updates.filter((u) => u.changed).map((u) => u.path),
    manualChecklist: MANUAL_CHECKLIST,
  };
}

function parseCliArgs(argv: readonly string[]): {
  help: boolean;
  apply: boolean;
  offline: boolean;
  json: boolean;
  targetVersion?: string;
  targetBrowsersVersion?: string;
} {
  let help = false;
  let apply = false;
  let offline = false;
  let json = false;
  let targetVersion: string | undefined;
  let targetBrowsersVersion: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') help = true;
    else if (arg === '--apply') apply = true;
    else if (arg === '--offline') offline = true;
    else if (arg === '--json') json = true;
    else if (arg === '--pretty') json = false;
    else if (arg === '--version') {
      targetVersion = argv[++i];
      if (!targetVersion) throw new Error('--version requires a value');
    } else if (arg === '--browsers-version') {
      targetBrowsersVersion = argv[++i];
      if (!targetBrowsersVersion) throw new Error('--browsers-version requires a value');
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return { help, apply, offline, json, targetVersion, targetBrowsersVersion };
}

function printPretty(report: AspireBumpReport): void {
  console.log(
    `aspire:bump (${report.mode}): ${report.currentVersion} -> ${report.targetVersion} (Browsers: ${report.currentBrowsersVersion} -> ${report.targetBrowsersVersion})`,
  );
  if (Object.keys(report.nugetVersions).length > 0) {
    console.log('\nNuGet latest versions:');
    for (const [pkg, version] of Object.entries(report.nugetVersions)) {
      console.log(`  ${pkg}: ${version ?? '<none>'}`);
    }
  }
  console.log(
    `\nAllowlisted files (${report.changedFiles.length}/${report.allowlist.length} changed):`,
  );
  for (const update of report.updates) {
    console.log(`  [${update.changed ? 'CHANGED' : 'unchanged'}] ${update.path}`);
  }
  console.log('\nManual follow-up checklist (never auto-mutated):');
  for (const item of report.manualChecklist) {
    console.log(`  - ${item}`);
  }
}

if (import.meta.main) {
  const args = parseCliArgs(Deno.args);
  if (args.help) {
    console.log(
      [
        'aspire-bump.ts — check NuGet for Aspire updates and bump ONLY the 7 allowlisted pin files',
        '',
        'Usage:',
        '  deno task aspire:bump [--apply] [--offline] [--version X.Y.Z] [--browsers-version X.Y.Z-preview.N] [--pretty|--json]',
      ].join('\n'),
    );
    Deno.exit(0);
  }
  const report = await planOrApplyAspireBump({
    apply: args.apply,
    offline: args.offline,
    targetVersion: args.targetVersion,
    targetBrowsersVersion: args.targetBrowsersVersion,
  });
  if (args.json) {
    console.log(
      JSON.stringify(
        {
          ...report,
          updates: report.updates.map(({ path, changed }) => ({ path, changed })),
        },
        null,
        2,
      ),
    );
  } else {
    printPretty(report);
  }
}
