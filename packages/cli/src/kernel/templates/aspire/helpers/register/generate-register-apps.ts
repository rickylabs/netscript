/**
 * @module
 *
 * Generator for `.helpers/register-apps.mts` — registers application resources
 * (web apps, Tauri desktop apps, and task-based apps) with the Aspire SDK
 * builder.
 *
 * Three registration modes are supported:
 *
 * | Type    | Method             | VITE Injection |
 * |---------|-------------------|----------------|
 * | `app`   | `addExecutable()`  | ✅ Yes          |
 * | `tauri` | `addExecutable()`  | ❌ No           |
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
 */

import type { RegisterAppsOptions } from '../types.ts';
import { fileHeader, safeIdentifier } from '../_utils.ts';
import { SCAFFOLD_ASPIRE_MODULES } from '../../../../constants/scaffold/scaffold-aspire.ts';
import { SCAFFOLD_DIRS } from '../../../../constants/scaffold/scaffold-dirs.ts';
import { TEMPLATE_KEYS } from '../../../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../../../../adapters/templates/template-asset.ts';

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
    lines.push(`  if (config.Apps['${name}']?.Enabled !== false) {`);

    if (type === 'app') {
      buildAppBlock(lines, id, name, entry, workdir);
    } else if (type === 'tauri') {
      buildTauriBlock(lines, id, name, entry, workdir);
    } else {
      // task
      buildTaskBlock(lines, id, name, entry, workdir);
    }

    // --- Common: OTEL telemetry (all types) ---
    lines.push(``);
    lines.push(`    // OTEL telemetry (full executable env set)`);
    lines.push(
      `    const ${id}_otel = buildOtelEnvVars('${name}', config.Version, 'executable', config.Otel.HttpEndpoint);`,
    );
    lines.push(`    for (const [key, value] of Object.entries(${id}_otel)) {`);
    lines.push(`      await ${id}.withEnvironment(key, value);`);
    lines.push(`    }`);

    // --- Common: HTTP endpoint ---
    if (entry.Port) {
      lines.push(``);
      lines.push(`    // HTTP endpoint`);
      lines.push(`    await ${id}.withHttpEndpoint({ port: ${entry.Port}, env: 'PORT' });`);
    }

    // --- Common: KV cache dependency ---
    if (entry.RequiresKv) {
      lines.push(``);
      lines.push(`    // KV cache dependency`);
      lines.push(`    if (infrastructure.primaryCache) {`);
      lines.push(`      await ${id}.withReference(infrastructure.primaryCache);`);
      lines.push(`      await ${id}.waitFor(infrastructure.primaryCache);`);
      lines.push(`    }`);
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
          `      const endpoint = await getResourceEndpoint(services.get('${ref}'), 'http');`,
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
          `      const endpoint = await getResourceEndpoint(plugins.get('${ref}'), 'http');`,
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
