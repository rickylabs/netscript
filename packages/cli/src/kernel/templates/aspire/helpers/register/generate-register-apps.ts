/**
 * @module
 *
 * Generator for `.helpers/register-apps.mts` — registers application resources
 * (web apps, Tauri apps, Deno Desktop apps, and task-based apps) with the
 * Aspire SDK builder via first-party `addDenoApp()` + `.withDenoTask()`.
 */

import type { RegisterAppsOptions } from '../types.ts';
import { RESOURCE_DEFAULTS } from '@netscript/aspire/constants';
import { fileHeader } from '../_utils.ts';
import { SCAFFOLD_ASPIRE_MODULES } from '../../../../constants/scaffold/scaffold-aspire.ts';
import { SCAFFOLD_DIRS } from '../../../../constants/scaffold/scaffold-dirs.ts';
import { TEMPLATE_KEYS } from '../../../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../../../../adapters/templates/template-asset.ts';
import { renderHttpEndpointCall, resolveHostPort } from './render-http-endpoint.ts';
import type { AppEntry, HostPortEntry } from '@netscript/aspire/types';

/** Non-empty placeholder scriptPath required by Aspire 17 `AddDenoApp` before `.withDenoTask()`. */
const DENO_TASK_SCRIPT_PATH = 'main.ts';

function needsHttpEndpoint(type: AppEntry['Type'], entry: HostPortEntry): boolean {
  if (type === 'desktop') return false;
  if (type === 'app') return true;
  return resolveHostPort(entry) !== undefined;
}

/**
 * Generates the register-apps.mts file content.
 */
export function generateRegisterApps(options: RegisterAppsOptions): string {
  const { apps, version: _version } = options;
  const entries = Object.entries(apps);

  const registrationBlocks: string[] = [];
  let hasWebApps = false;
  let usesEndpointHelper = false;
  let usesCache = false;

  for (const [appIndex, [name, entry]] of entries.entries()) {
    const id = `app_${appIndex}`;
    const type = entry.Type ?? 'app';
    const workdir = entry.Workdir ?? `${SCAFFOLD_DIRS.APPS}/${name}`;
    const lines: string[] = [];
    lines.push(`  // --- app ${appIndex} ---`);

    const enabledCondition = type === 'desktop' ? '=== true' : '!== false';
    lines.push(
      `  if (config.Apps[${JSON.stringify(name)}]?.Enabled ${enabledCondition}) {`,
    );

    if (type === 'app') {
      hasWebApps = true;
      usesEndpointHelper = true;
      buildAppBlock(lines, id, name, entry, workdir);
    } else if (type === 'tauri') {
      if (entry.Remote) usesEndpointHelper = true;
      buildTauriBlock(lines, id, name, entry, workdir);
    } else if (type === 'desktop') {
      usesEndpointHelper = true;
      buildDesktopBlock(lines, id, name, entry, workdir);
    } else {
      buildTaskBlock(lines, id, name, entry, workdir);
    }

    // OTEL telemetry — Aspire 17 AddDenoApp registers an optional HTTP OTLP exporter
    // and preserves service.instance.id alongside service.version.
    lines.push(``);
    lines.push(`    // OTEL telemetry (endpoint-conditional via Aspire AddDenoApp defaults)`);
    lines.push(`    await ${id}.withEnvironment('OTEL_SERVICE_NAME', ${JSON.stringify(name)});`);
    lines.push(
      `    await ${id}.withEnvironment('OTEL_RESOURCE_ATTRIBUTES', \`service.version=\${config.Version}\`);`,
    );

    if (needsHttpEndpoint(type, entry)) {
      lines.push(``);
      lines.push(`    // HTTP endpoint`);
      lines.push(`    await ${id}.${renderHttpEndpointCall(entry)};`);

      if (type === 'app') {
        lines.push(`    await ${id}.withBrowserLogs();`);
        lines.push(``);
        lines.push(`    // Workspace CORS allowlist: this enabled web app's browser origins.`);
        lines.push(
          `    const ${id}_origin = await (await ${id}.getEndpoint('http')).property(EndpointProperty.BrowserOrigins);`,
        );
        lines.push(`    corsOrigins = corsOrigins`);
        lines.push('      ? ReferenceExpression.create`${corsOrigins},${' + id + '_origin}`');
        lines.push('      : ReferenceExpression.create`${' + id + '_origin}`;');
      }

      buildHealthProbeBlock(lines, id, entry);
    }

    if (type === 'desktop' || type === 'app') {
      appendDiscoveryReferences(lines, id, name, type === 'app');
      lines.push(`    for (const [name, resource] of _backgroundProcessors) {`);
      lines.push(`      const entry = config.BackgroundProcessors[name];`);
      lines.push(
        `      if (entry?.Enabled === false || entry?.Runtime !== 'deno' || !entry.RequiresKv) continue;`,
      );
      lines.push(`      const endpoint = await getResourceEndpoint(resource, 'http');`);
      lines.push(
        '      if (endpoint) await ' + id +
          '.withEnvironment(`services__${name}__http__0`, endpoint);',
      );
      lines.push(`    }`);
    }

    if (entry.RequiresKv) {
      usesCache = true;
      lines.push(``);
      lines.push(`    // KV cache dependency`);
      lines.push(`    await _withCacheReference(${id}, _infrastructure.primaryCacheWiring);`);
    }

    if (type === 'app' && entry.Prebuild) {
      lines.push(
        `    // TODO: Configured prebuild requires bridge NuGet — see ts-apphost-bridge-nuget.md`,
      );
    }

    if (type === 'tauri' && entry.Remote) {
      const remoteId = `app_remote_${appIndex}`;
      lines.push(``);
      lines.push(`    // Remote app reference — wired via endpoint env var`);
      lines.push(`    {`);
      lines.push(
        `      const ${remoteId}Endpoint = await getResourceEndpoint(apps.get(${
          JSON.stringify(entry.Remote)
        }), 'http');`,
      );
      lines.push(`      if (${remoteId}Endpoint) {`);
      lines.push(
        `        await ${id}.withEnvironment(${
          JSON.stringify(`services__${entry.Remote}__http__0`)
        }, ${remoteId}Endpoint);`,
      );
      lines.push(`      }`);
      lines.push(`    }`);
    }

    lines.push(``);
    lines.push(`    apps.set(${JSON.stringify(name)}, ${id});`);
    lines.push(`  }`);

    registrationBlocks.push(lines.join('\n'));
  }

  const hasApps = entries.length > 0;
  const sdkValueImports = hasWebApps ? ['EndpointProperty', 'ReferenceExpression'] : [];
  const compatImports = [
    ...(hasWebApps ? ['buildViteEnvVarName'] : []),
    ...(hasApps ? ['resolveWorkspacePath'] : []),
    ...(usesCache ? ['withCacheReference as _withCacheReference'] : []),
  ];
  const endpointHelperBlock = usesEndpointHelper
    ? `interface EndpointProvider {
  getEndpoint(protocol: string): PromiseLike<EndpointReference> | EndpointReference;
}

async function getResourceEndpoint(resource: unknown, protocol: string): Promise<EndpointReference | undefined> {
  if (!resource || typeof resource !== 'object' || !('getEndpoint' in resource)) {
    return undefined;
  }
  return await (resource as EndpointProvider).getEndpoint(protocol);
}

`
    : '';

  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedAspireHelpersGenerateRegisterApps1, {
    sdkTypeImports: usesEndpointHelper ? ', EndpointReference' : '',
    sdkValueImport: sdkValueImports.length > 0
      ? `import { ${
        sdkValueImports.join(', ')
      } } from '${SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_HELPERS}';\n`
      : '',
    compatImportBlock: compatImports.length > 0
      ? `import {\n${
        compatImports.map((name) => `  ${name},`).join('\n')
      }\n} from '${SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT}';\n`
      : '',
    endpointHelperBlock,
    builderParameter: hasApps ? 'builder' : '_builder',
    appHostDirParameter: hasApps ? 'appHostDir' : '_appHostDir',
    corsOriginsDecl: hasWebApps ? '  let corsOrigins: ReferenceExpression | undefined;\n' : '',
    corsMergeExpr: hasWebApps
      ? `      const origins = extra && corsOrigins
        ? ReferenceExpression.create\`\${corsOrigins},\${extra}\`
        : corsOrigins ?? extra ?? '';`
      : `      const origins = extra ?? '';`,
    __slot0__: String(fileHeader('register-apps.mts')),
    __slot1__: String(SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_HELPERS),
    __slot2__: String(SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT),
    __slot4__: String(
      registrationBlocks.length > 0 ? registrationBlocks.join('\n\n') : '  // No apps configured',
    ),
  });
}

function buildHealthProbeBlock(
  lines: string[],
  id: string,
  entry: { readonly HealthCheckPath?: string | false },
): void {
  const path = resolveHealthCheckPath(entry);
  if (!path) return;

  lines.push(``);
  lines.push(`    // HTTP health probe — a listening socket alone is not "healthy".`);
  lines.push(
    `    await ${id}.withHttpHealthCheck({ path: ${
      JSON.stringify(path)
    }, endpointName: '${RESOURCE_DEFAULTS.HttpEndpointName}' });`,
  );
}

function resolveHealthCheckPath(
  entry: { readonly HealthCheckPath?: string | false },
): string | undefined {
  if (entry.HealthCheckPath === false) return undefined;
  return entry.HealthCheckPath ?? RESOURCE_DEFAULTS.AppHealthCheckPath;
}

function buildAppBlock(
  lines: string[],
  id: string,
  name: string,
  entry: { readonly TaskName?: string },
  workdir: string,
): void {
  const taskName = entry.TaskName ?? 'dev';

  lines.push(
    `    const ${id}_workdir = resolveWorkspacePath(appHostDir, ${JSON.stringify(workdir)});`,
  );
  lines.push(
    `    const ${id} = builder.addDenoApp(${
      JSON.stringify(name)
    }, ${id}_workdir, '${DENO_TASK_SCRIPT_PATH}');`,
  );
  lines.push(`    await ${id}.withDenoTask(${JSON.stringify(taskName)});`);
}

function buildTauriBlock(
  lines: string[],
  id: string,
  name: string,
  entry: { readonly TaskName?: string },
  workdir: string,
): void {
  const taskName = entry.TaskName ?? `dev:${name}`;

  lines.push(
    `    const ${id}_workdir = resolveWorkspacePath(appHostDir, ${JSON.stringify(workdir)});`,
  );
  lines.push(
    `    const ${id} = builder.addDenoApp(${
      JSON.stringify(name)
    }, ${id}_workdir, '${DENO_TASK_SCRIPT_PATH}');`,
  );
  lines.push(`    await ${id}.withDenoTask(${JSON.stringify(taskName)});`);
}

function buildDesktopBlock(
  lines: string[],
  id: string,
  name: string,
  entry: { readonly Prebuild?: string; readonly TaskName?: string },
  workdir: string,
): void {
  const buildTaskName = entry.Prebuild ?? 'build';
  const taskName = entry.TaskName ?? 'desktop:predev';

  lines.push(
    `    const ${id}_workdir = resolveWorkspacePath(appHostDir, ${JSON.stringify(workdir)});`,
  );
  lines.push(
    `    const ${id}_build = builder.addDenoApp(${
      JSON.stringify(`${name}-build`)
    }, ${id}_workdir, '${DENO_TASK_SCRIPT_PATH}');`,
  );
  lines.push(`    await ${id}_build.withDenoTask(${JSON.stringify(buildTaskName)});`);
  lines.push(
    `    const ${id} = builder.addDenoApp(${
      JSON.stringify(name)
    }, ${id}_workdir, '${DENO_TASK_SCRIPT_PATH}');`,
  );
  lines.push(`    await ${id}.withDenoTask(${JSON.stringify(taskName)});`);
  lines.push(`    await ${id}.withDenoScriptArgs(['--backend', 'cef']);`);
  lines.push(`    await ${id}.waitForCompletion(${id}_build);`);
}

function buildTaskBlock(
  lines: string[],
  id: string,
  name: string,
  entry: { readonly TaskName?: string },
  workdir: string,
): void {
  const taskName = entry.TaskName ?? `dev:${name}`;

  lines.push(
    `    const ${id}_workdir = resolveWorkspacePath(appHostDir, ${JSON.stringify(workdir)});`,
  );
  lines.push(
    `    const ${id} = builder.addDenoApp(${
      JSON.stringify(name)
    }, ${id}_workdir, '${DENO_TASK_SCRIPT_PATH}');`,
  );
  lines.push(`    await ${id}.withDenoTask(${JSON.stringify(taskName)});`);
}

function appendDiscoveryReferences(lines: string[], id: string, name: string, vite: boolean): void {
  lines.push(`    // ${vite ? 'VITE' : 'Server-side'} service-discovery injection`);
  for (
    const [field, resources] of [
      ['ServiceReferences', '_services'],
      ['PluginReferences', '_plugins'],
    ] as const
  ) {
    lines.push(`    for (const ref of config.Apps[${JSON.stringify(name)}]?.${field} ?? []) {`);
    lines.push(`      const endpoint = await getResourceEndpoint(${resources}.get(ref), 'http');`);
    lines.push(`      if (endpoint) {`);
    if (vite) {
      lines.push(`        const vite = buildViteEnvVarName(ref);`);
      lines.push(`        await ${id}.withEnvironment(vite.full, endpoint);`);
      lines.push(`        await ${id}.withEnvironment(vite.shorthand, endpoint);`);
    }
    lines.push('        await ' + id + '.withEnvironment(`services__${ref}__http__0`, endpoint);');
    lines.push(`      }`);
    lines.push(`    }`);
  }
}
