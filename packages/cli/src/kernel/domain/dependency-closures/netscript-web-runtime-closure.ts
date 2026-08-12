/**
 * The generated Fresh/SDK package identities that must share one release.
 *
 * `@netscript/fresh-ui` is intentionally excluded: its SDK imports are limited to desktop and
 * auto-update, whose implementations do not import cache or query modules, and it imports no Fresh
 * runtime. A second fresh-ui instance therefore cannot own the cache-provider singleton in #1589.
 */
export const NETSCRIPT_WEB_RUNTIME_EXPORTS = {
  '@netscript/fresh': [
    '.',
    './server',
    './desktop',
    './builders',
    './route',
    './defer',
    './defer/island',
    './form',
    './error',
    './streams',
    './ai',
    './ai/sandbox',
    './query',
    './interactive',
    './vite',
    './testing',
  ],
  '@netscript/sdk': [
    '.',
    './auto-update',
    './desktop',
    './cache',
    './client',
    './collections',
    './discovery',
    './ports',
    './query',
    './query-client',
    './streams',
    './telemetry',
  ],
} as const;

/** A direct telemetry mapping joins the closure, but its subpaths do not. */
export const NETSCRIPT_WEB_RUNTIME_TELEMETRY = '@netscript/telemetry';

export type NetScriptClosurePackage = keyof typeof NETSCRIPT_WEB_RUNTIME_EXPORTS |
  typeof NETSCRIPT_WEB_RUNTIME_TELEMETRY;

export type NetScriptClosureSource = 'jsr' | 'local';

/** One normalized import-map identity used by init-time validation. */
export interface NetScriptClosureIdentity {
  readonly specifier: string;
  readonly resolution: string;
  readonly packageName: NetScriptClosurePackage;
  readonly version: string;
  readonly source: NetScriptClosureSource;
  readonly originRoot: string;
}

const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const JSR_IDENTITY = /^jsr:\/?(@netscript\/(?:fresh|sdk|telemetry))@([^/]+)(?:\/.*)?$/;
const LOCAL_IDENTITY = /^(.*\/packages\/(fresh|sdk|telemetry))(?:\/.*)?$/;

/** Convert an export key to the bare package specifier Deno resolves. */
export function closureExportSpecifier(packageName: string, exportName: string): string {
  return exportName === '.' ? packageName : `${packageName}${exportName.slice(1)}`;
}

/** Return every required Fresh/SDK specifier in deterministic diagnostic order. */
export function netScriptWebRuntimeSpecifiers(): readonly string[] {
  return Object.entries(NETSCRIPT_WEB_RUNTIME_EXPORTS).flatMap(([packageName, exports]) =>
    exports.map((exportName) => closureExportSpecifier(packageName, exportName))
  );
}

/** Validate the app-direct NetScript import-map fragment before init writes it. */
export function assertCoherentNetScriptWebRuntimeImports(
  imports: Readonly<Record<string, string>>,
): void {
  const entries = Object.entries(imports).filter(([specifier]) => isClosureSpecifier(specifier));
  const identities: NetScriptClosureIdentity[] = [];
  const reasons: string[] = [];

  for (const [specifier, resolution] of entries) {
    const jsr = JSR_IDENTITY.exec(resolution);
    if (jsr) {
      const packageName = jsr[1] as NetScriptClosurePackage;
      const version = jsr[2];
      if (!EXACT_VERSION.test(version)) {
        reasons.push(`${specifier} uses non-exact version "${version}"; pin this member exactly.`);
      }
      identities.push({
        specifier,
        resolution,
        packageName,
        version,
        source: 'jsr',
        originRoot: `jsr:${packageName}@${version}`,
      });
      continue;
    }

    const local = LOCAL_IDENTITY.exec(resolution.replaceAll('\\', '/'));
    if (local) {
      const packageName = `@netscript/${local[2]}` as NetScriptClosurePackage;
      identities.push({
        specifier,
        resolution,
        packageName,
        version: 'local',
        source: 'local',
        originRoot: local[1],
      });
      continue;
    }

    reasons.push(`${specifier} has unsupported resolution "${resolution}".`);
  }

  reasons.push(...coherenceReasons(identities));
  if (reasons.length > 0) throw new Error(formatNetScriptClosureDiagnostic(identities, reasons));
}

/** Format the stable operator-facing closure error. */
export function formatNetScriptClosureDiagnostic(
  identities: readonly NetScriptClosureIdentity[],
  reasons: readonly string[],
): string {
  const lines = ['NetScript dependency closure is incoherent.'];
  for (const identity of identities) {
    lines.push(`  ${identity.specifier.padEnd(36)} -> ${identity.resolution}`);
  }
  for (const reason of reasons) lines.push(`  reason: ${reason}`);
  lines.push(
    'Pin @netscript/fresh, all @netscript/fresh/* and @netscript/sdk/* imports, and any direct @netscript/telemetry import to one exact release, then rerun.',
  );
  return lines.join('\n');
}

function isClosureSpecifier(specifier: string): boolean {
  return specifier === '@netscript/fresh' || specifier.startsWith('@netscript/fresh/') ||
    specifier === '@netscript/sdk' || specifier.startsWith('@netscript/sdk/') ||
    specifier === NETSCRIPT_WEB_RUNTIME_TELEMETRY;
}

function coherenceReasons(identities: readonly NetScriptClosureIdentity[]): string[] {
  const reasons: string[] = [];
  const sources = new Set(identities.map((identity) => identity.source));
  if (sources.size > 1) reasons.push('closure members mix local and JSR module identities.');

  const exactVersions = new Set(
    identities.filter((identity) => identity.source === 'jsr').map((identity) => identity.version),
  );
  if (exactVersions.size > 1) {
    reasons.push(`closure members resolve to different exact versions: ${[...exactVersions].join(', ')}.`);
  }

  for (const packageName of [
    '@netscript/fresh',
    '@netscript/sdk',
    NETSCRIPT_WEB_RUNTIME_TELEMETRY,
  ] as const) {
    const roots = new Set(
      identities.filter((identity) => identity.packageName === packageName).map((identity) =>
        identity.originRoot
      ),
    );
    if (roots.size > 1) reasons.push(`${packageName} resolves from multiple package roots.`);
  }
  return reasons;
}
