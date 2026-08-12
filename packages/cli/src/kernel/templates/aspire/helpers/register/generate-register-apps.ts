/**
 * @module
 *
 * Generator for `.helpers/register-apps.mts` — registers application resources
 * (web apps, Tauri apps, Deno Desktop apps, and task-based apps) with the Aspire SDK
 * builder.
 *
 * Four registration modes are supported:
 *
 * | Type    | Method             | VITE Injection |
 * |---------|-------------------|----------------|
 * | `app`   | `addExecutable()`  | ✅ Yes          |
 * | `tauri` | `addExecutable()`  | ❌ No           |
 * | `desktop` | `addExecutable()` | ❌ No          |
 * | `task`  | `addExecutable()`  | ❌ No           |
 *
 * The `app` type uses the Aspire SDK's `addExecutable()` and
 * injects three flavours of service-discovery env vars per reference:
 * - `VITE_services__{name}__http__0` (full isomorphic)
 * - `VITE_{NAME}_URL` (shorthand)
 * - `services__{name}__http__0` (server-side discovery)
 *
 * All types receive executable-mode OTEL telemetry and optional
 * KV cache dependency injection.
 *
 * Every endpoint-bearing executable additionally gets an HTTP health probe.
 * Aspire falls back to "process is Running means ready" for a resource with no
 * registered health check. Set `HealthCheckPath: false` to opt out, or to a path
 * string to probe a different route.
 */

import type { RegisterAppsOptions } from '../types.ts';
import { RESOURCE_DEFAULTS } from '@netscript/aspire/constants';
import { fileHeader, safeIdentifier } from '../_utils.ts';
import { SCAFFOLD_ASPIRE_MODULES } from '../../../../constants/scaffold/scaffold-aspire.ts';
import { SCAFFOLD_DIRS } from '../../../../constants/scaffold/scaffold-dirs.ts';
import { TEMPLATE_KEYS } from '../../../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../../../../adapters/templates/template-asset.ts';
import { renderHttpEndpointCall, resolveHostPort } from './render-http-endpoint.ts';
import type { AppEntry, HostPortEntry } from '@netscript/aspire/types';

/**
 * Whether an app entry should receive a `withHttpEndpoint(...)` registration.
 *
 * `app` entries are web servers and always need one. `tauri` and `task` entries
 * may be neither, so they opt in by configuring a host port. `desktop` entries
 * never expose an endpoint.
 */
function needsHttpEndpoint(type: AppEntry['Type'], entry: HostPortEntry): boolean {
  if (type === 'desktop') return false;
  if (type === 'app') return true;
  return resolveHostPort(entry) !== undefined;
}

/**
 * Generates the register-apps.mts file content.
 *
 * @param options - App entries, version, and Deno defaults from parsed config
 * @returns Generated TypeScript source as a string
 */
export function generateRegisterApps(options: RegisterAppsOptions): string {
  const { apps, version: _version } = options;
  const entries = Object.entries(apps);

  const registrationBlocks: string[] = [];

  for (const [name, entry] of entries) {
    const id = safeIdentifier(name);
    const type = entry.Type ?? 'app';
    const workdir = entry.Workdir ?? `${SCAFFOLD_DIRS.APPS}/${name}`;
    const lines: string[] = [];
    lines.push(`  // --- ${name} (${type}) ---`);

    // Skip disabled entries
    const enabledCondition = type === 'desktop' ? '=== true' : '!== false';
    lines.push(`  if (config.Apps['${name}']?.Enabled ${enabledCondition}) {`);

    if (type === 'app') {
      buildAppBlock(lines, id, name, entry, workdir);
    } else if (type === 'tauri') {
      buildTauriBlock(lines, id, name, entry, workdir);
    } else if (type === 'desktop') {
      buildDesktopBlock(lines, id, name, entry, workdir);
    } else {
      // task
      buildTaskBlock(lines, id, name, entry, workdir);
    }

    // --- Common: OTEL telemetry (all types) ---
    lines.push(``);
    lines.push(`    // OTEL telemetry (full executable env set)`);
    lines.push(
      `    const ${id}_otel = buildOtelEnvVars('${name}', config.Version, 'executable');`,
    );
    lines.push(`    for (const [key, value] of Object.entries(${id}_otel)) {`);
    lines.push(`      await ${id}.withEnvironment(key, value);`);
    lines.push(`    }`);
    lines.push(
      `    await ${id}.withOtlpExporter({ protocol: OtlpProtocol.HttpProtobuf });`,
    );

    // --- Common: HTTP endpoint ---
    // A web `app` always serves HTTP, so it always gets an endpoint — Aspire
    // allocates the ports unless the entry pins a host port. `tauri` and `task`
    // entries are not necessarily HTTP servers, so they keep the historical
    // behaviour of getting an endpoint only when one is configured. `desktop`
    // entries never expose one.
    if (needsHttpEndpoint(type, entry)) {
      lines.push(``);
      lines.push(`    // HTTP endpoint`);
      lines.push(`    await ${id}.${renderHttpEndpointCall(entry)};`);

      // Browser diagnostics are a frontend-app default. Keep the app-type and
      // endpoint predicates together so task/desktop executables cannot gain a
      // browser child without a browseable HTTP/HTTPS parent.
      if (type === 'app') {
        lines.push(`    await ${id}.withBrowserLogs();`);
      }
    }

    // --- Endpoint readiness probe ---
    // Registered after the endpoint it derives its base address from. Without a
    // probe Aspire equates a running executable with a ready server.
    if (needsHttpEndpoint(type, entry)) {
      buildHealthProbeBlock(lines, id, entry);
    }

    // --- desktop type: server-side discovery only ---
    if (type === 'desktop') {
      const serviceRefs = entry.ServiceReferences ?? [];
      const pluginRefs = entry.PluginReferences ?? [];

      if (serviceRefs.length > 0 || pluginRefs.length > 0) {
        lines.push(``);
        lines.push(`    // Server-side service-discovery injection`);
      }

      for (const ref of serviceRefs) {
        lines.push(`    {`);
        lines.push(
          `      const endpoint = await getResourceEndpoint(_services.get('${ref}'), 'http');`,
        );
        lines.push(`      if (endpoint) {`);
        lines.push(`        await ${id}.withEnvironment('services__${ref}__http__0', endpoint);`);
        lines.push(`      }`);
        lines.push(`    }`);
      }

      for (const ref of pluginRefs) {
        lines.push(`    {`);
        lines.push(
          `      const endpoint = await getResourceEndpoint(_plugins.get('${ref}'), 'http');`,
        );
        lines.push(`      if (endpoint) {`);
        lines.push(`        await ${id}.withEnvironment('services__${ref}__http__0', endpoint);`);
        lines.push(`      }`);
        lines.push(`    }`);
      }
    }

    // --- Common: KV cache dependency ---
    if (entry.RequiresKv) {
      lines.push(``);
      lines.push(`    // KV cache dependency`);
      lines.push(`    await _withCacheReference(${id}, _infrastructure.primaryCacheWiring);`);
    }

    // --- app type: VITE injection ---
    if (type === 'app') {
      const serviceRefs = entry.ServiceReferences ?? [];
      const pluginRefs = entry.PluginReferences ?? [];

      if (serviceRefs.length > 0 || pluginRefs.length > 0) {
        lines.push(``);
        lines.push(`    // VITE service-discovery injection`);
      }

      for (const ref of serviceRefs) {
        lines.push(`    {`);
        lines.push(`      const vite = buildViteEnvVarName('${ref}');`);
        lines.push(
          `      const endpoint = await getResourceEndpoint(_services.get('${ref}'), 'http');`,
        );
        lines.push(`      if (endpoint) {`);
        lines.push(`        await ${id}.withEnvironment(vite.full, endpoint);`);
        lines.push(`        await ${id}.withEnvironment(vite.shorthand, endpoint);`);
        lines.push(`        await ${id}.withEnvironment('services__${ref}__http__0', endpoint);`);
        lines.push(`      }`);
        lines.push(`    }`);
      }

      for (const ref of pluginRefs) {
        lines.push(`    {`);
        lines.push(`      const vite = buildViteEnvVarName('${ref}');`);
        lines.push(
          `      const endpoint = await getResourceEndpoint(_plugins.get('${ref}'), 'http');`,
        );
        lines.push(`      if (endpoint) {`);
        lines.push(`        await ${id}.withEnvironment(vite.full, endpoint);`);
        lines.push(`        await ${id}.withEnvironment(vite.shorthand, endpoint);`);
        lines.push(`        await ${id}.withEnvironment('services__${ref}__http__0', endpoint);`);
        lines.push(`      }`);
        lines.push(`    }`);
      }

      // Prebuild TODO comment
      if (entry.Prebuild) {
        lines.push(``);
        lines.push(
          `    // TODO: Prebuild "${entry.Prebuild}" requires bridge NuGet — see ts-apphost-bridge-nuget.md`,
        );
      }
    }

    // --- tauri type: remote app reference ---
    if (type === 'tauri' && entry.Remote) {
      const remoteId = safeIdentifier(entry.Remote);
      lines.push(``);
      lines.push(`    // Remote app reference — wired via endpoint env var`);
      lines.push(`    {`);
      lines.push(
        `      const ${remoteId}Endpoint = await getResourceEndpoint(apps.get('${entry.Remote}'), 'http');`,
      );
      lines.push(`      if (${remoteId}Endpoint) {`);
      lines.push(
        `        await ${id}.withEnvironment('services__${entry.Remote}__http__0', ${remoteId}Endpoint);`,
      );
      lines.push(`      }`);
      lines.push(`    }`);
    }

    lines.push(``);
    lines.push(`    apps.set('${name}', ${id});`);
    lines.push(`  }`);

    registrationBlocks.push(lines.join('\n'));
  }

  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedAspireHelpersGenerateRegisterApps1, {
    __slot0__: String(fileHeader('register-apps.mts')),
    __slot1__: String(SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_HELPERS),
    __slot2__: String(SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT),
    __slot3__: String(SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT),
    __slot4__: String(
      registrationBlocks.length > 0 ? registrationBlocks.join('\n\n') : '  // No apps configured',
    ),
  });
}

// ---------------------------------------------------------------------------
// Block builders — each appends lines for a specific app type
// ---------------------------------------------------------------------------

/**
 * Appends the HTTP health probe registration for an `app` entry.
 *
 * Aspire only treats a resource as healthy once its registered health checks pass; a resource
 * with no health check at all is considered ready as soon as its process reaches `Running`.
 * That fallback is what let a generated Fresh app report `Healthy` while every request failed
 * during SSR (#954). The probe targets the app's own server-rendered health route, so a broken
 * render pipeline surfaces as `Unhealthy` instead of green-and-500.
 */
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
    `    await ${id}.withHttpHealthCheck({ path: '${path}', endpointName: '${RESOURCE_DEFAULTS.HttpEndpointName}' });`,
  );
}

/**
 * Resolves the health probe path for an app entry, or `undefined` when the app opted out
 * with `HealthCheckPath: false`.
 */
function resolveHealthCheckPath(
  entry: { readonly HealthCheckPath?: string | false },
): string | undefined {
  if (entry.HealthCheckPath === false) return undefined;
  return entry.HealthCheckPath ?? RESOURCE_DEFAULTS.AppHealthCheckPath;
}

/**
 * Builds registration lines for an `app` type entry.
 * Uses `addExecutable()` with resolved permissions and working directory.
 */
function buildAppBlock(
  lines: string[],
  id: string,
  name: string,
  entry: { readonly TaskName?: string },
  workdir: string,
): void {
  const taskName = entry.TaskName ?? 'dev';

  // Resolve working directory
  lines.push(`    const ${id}_workdir = resolveWorkspacePath(appHostDir, '${workdir}');`);

  // Register via addExecutable — Vite dev server started via deno task
  lines.push(
    `    const ${id} = builder.addExecutable('${name}', 'deno', ${id}_workdir, ['task', '${taskName}']);`,
  );
}

/**
 * Builds registration lines for a `tauri` type entry.
 * Uses `addExecutable()` with resolved task name.
 */
function buildTauriBlock(
  lines: string[],
  id: string,
  name: string,
  entry: { readonly TaskName?: string },
  workdir: string,
): void {
  const taskName = entry.TaskName ?? `dev:${name}`;

  lines.push(`    const ${id}_workdir = resolveWorkspacePath(appHostDir, '${workdir}');`);
  lines.push(
    `    const ${id} = builder.addExecutable('${name}', 'deno', ${id}_workdir, ['task', '${taskName}']);`,
  );
}

/**
 * Builds registration lines for a `desktop` type entry.
 * The window waits for a successful Fresh build before Aspire launches it.
 */
function buildDesktopBlock(
  lines: string[],
  id: string,
  name: string,
  entry: { readonly Prebuild?: string; readonly TaskName?: string },
  workdir: string,
): void {
  const buildTaskName = entry.Prebuild ?? 'build';
  const taskName = entry.TaskName ?? 'desktop:predev';

  lines.push(`    const ${id}_workdir = resolveWorkspacePath(appHostDir, '${workdir}');`);
  lines.push(
    `    const ${id}_build = builder.addExecutable('${name}-build', 'deno', ${id}_workdir, ['task', '${buildTaskName}']);`,
  );
  lines.push(
    `    const ${id} = builder.addExecutable('${name}', 'deno', ${id}_workdir, ['task', '${taskName}', '--backend', 'cef']);`,
  );
  lines.push(`    await ${id}.waitForCompletion(${id}_build);`);
}

/**
 * Builds registration lines for a `task` type entry.
 * Uses `addExecutable()` with resolved task name — simple registration, no VITE.
 */
function buildTaskBlock(
  lines: string[],
  id: string,
  name: string,
  entry: { readonly TaskName?: string },
  workdir: string,
): void {
  const taskName = entry.TaskName ?? `dev:${name}`;

  lines.push(`    const ${id}_workdir = resolveWorkspacePath(appHostDir, '${workdir}');`);
  lines.push(
    `    const ${id} = builder.addExecutable('${name}', 'deno', ${id}_workdir, ['task', '${taskName}']);`,
  );
}
