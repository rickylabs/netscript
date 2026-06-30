/**
 * @module
 *
 * Generator for `.helpers/register-background.mts` — registers background
 * processors (workers, sagas, triggers, benchmark) with the Aspire SDK
 * builder via `addExecutable()`.
 *
 * Each processor is registered using the CommunityToolkit beta NuGet's
 * `addExecutable(name, 'deno', workdir, ['run', ...perms, entrypoint])` method.
 * Telemetry-enabled entries receive the full executable OTEL env set via
 * `buildOtelEnvVars`; telemetry-disabled entries (e.g., benchmark) receive
 * explicit opt-out vars instead.
 *
 * Background processors do NOT cross-reference each other, so no two-pass
 * registration is needed.
 */

import type { RegisterBackgroundOptions } from '../types.ts';
import { extractSagaStoreBackend, fileHeader, safeIdentifier } from '../_utils.ts';
import { SCAFFOLD_ASPIRE_MODULES } from '../../../../constants/scaffold/scaffold-aspire.ts';
import { RESOURCE_DEFAULTS } from '@netscript/aspire/constants';
import { TEMPLATE_KEYS } from '../../../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../../../../adapters/templates/template-asset.ts';

/**
 * Generates the register-background.mts file content.
 *
 * @param options - Background processor entries, version, and Deno defaults from parsed config
 * @returns Generated TypeScript source as a string
 */
export function generateRegisterBackground(options: RegisterBackgroundOptions): string {
  const { processors, version: _version, denoDefaults } = options;
  const entries = Object.entries(processors);

  const registrationBlocks: string[] = [];

  for (const [name, entry] of entries) {
    const id = safeIdentifier(name);
    const workdir = entry.Workdir ?? '.';
    const entrypoint = entry.Entrypoint ?? `${name}/runtime.ts`;
    const telemetry = entry.Telemetry !== false;
    const watchMode = entry.WatchMode ?? false;

    const lines: string[] = [];
    lines.push(`  // --- ${name} ---`);

    // Skip disabled entries
    lines.push(`  if (config.BackgroundProcessors['${name}']?.Enabled !== false) {`);

    // Resolve permissions — background uses --watch (NOT --watch-hmr)
    lines.push(`    const ${id}_perms = resolvePermissions(`);
    if (entry.Permissions) {
      lines.push(`      ${JSON.stringify(entry.Permissions)},`);
    } else {
      lines.push(`      undefined,`);
    }
    lines.push(`      ${JSON.stringify(denoDefaults.Permissions)},`);
    lines.push(`      ${watchMode},`);
    lines.push(`      '${RESOURCE_DEFAULTS.WatchFlag}',`);
    lines.push(`    );`);

    // Resolve working directory
    lines.push(`    const ${id}_workdir = resolveWorkspacePath(appHostDir, '${workdir}');`);
    lines.push(
      `    const ${id}_bootstrapModule = new URL('../../services/_shared/plugin-service-context.ts', import.meta.url).href;`,
    );

    // Register via addExecutable
    lines.push(
      `    const ${id} = builder.addExecutable('${name}', 'deno', ${id}_workdir, ['run', '--minimum-dependency-age=0', '${RESOURCE_DEFAULTS.NodeModulesDirNoneFlag}', '${RESOURCE_DEFAULTS.UnstableWorkerOptionsFlag}', ...${id}_perms, '${entrypoint}']);`,
    );
    lines.push(
      `    await ${id}.withEnvironment('NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE', ${id}_bootstrapModule);`,
    );
    if (isTriggersBackgroundResource(name, entrypoint)) {
      lines.push(
        `    const ${id}_triggerRegistryModule = new URL('../../triggers/mod.ts', import.meta.url).href;`,
      );
      lines.push(
        `    await ${id}.withEnvironment('NETSCRIPT_TRIGGER_REGISTRY_MODULE', ${id}_triggerRegistryModule);`,
      );
    }

    const sagaStoreBackend = extractSagaStoreBackend(entry);
    if (sagaStoreBackend) {
      lines.push(
        `    await ${id}.withEnvironment('NETSCRIPT_SAGA_STORE', ${JSON.stringify(sagaStoreBackend)});`,
      );
    }

    // Telemetry env vars
    if (telemetry) {
      lines.push(``);
      lines.push(`    // OTEL telemetry (full executable env set)`);
      lines.push(
        `    const ${id}_otel = buildOtelEnvVars('${name}', config.Version, 'executable', config.Otel.HttpEndpoint);`,
      );
      lines.push(`    for (const [key, value] of Object.entries(${id}_otel)) {`);
      lines.push(`      await ${id}.withEnvironment(key, value);`);
      lines.push(`    }`);
    } else {
      lines.push(``);
      lines.push(`    // Telemetry disabled — opt out explicitly`);
      lines.push(`    await ${id}.withEnvironment('OTEL_DENO', 'false');`);
      lines.push(`    await ${id}.withEnvironment('OTEL_TRACES_SAMPLER', 'always_off');`);
    }

    // Concurrency
    if (entry.ConcurrencyEnvVar && entry.Concurrency) {
      lines.push(``);
      lines.push(`    // Concurrency`);
      lines.push(
        `    await ${id}.withEnvironment('${entry.ConcurrencyEnvVar}', String(${entry.Concurrency}));`,
      );
    }

    // Infrastructure dependencies
    if (entry.RequiresDb) {
      lines.push(``);
      lines.push(`    // Database dependency`);
      lines.push(`    if (infrastructure.primaryDatabase) {`);
      lines.push(
        `      let ${id}_databaseBinding = ${id}.withEnvironment('DATABASE_URL', infrastructure.primaryDatabase);`,
      );
      lines.push(`      if (databaseEnvKey) {`);
      lines.push(
        `        ${id}_databaseBinding = ${id}_databaseBinding.withEnvironment(databaseEnvKey, infrastructure.primaryDatabase);`,
      );
      lines.push(`      }`);
      lines.push(`      await ${id}_databaseBinding`);
      lines.push(`        .withReference(infrastructure.primaryDatabase)`);
      lines.push(`        .waitFor(infrastructure.primaryDatabase);`);
      lines.push(`    }`);
    }

    if (entry.RequiresKv) {
      lines.push(``);
      lines.push(`    // KV cache dependency`);
      lines.push(`    if (infrastructure.primaryCache) {`);
      lines.push(`      if (infrastructure.primaryCacheEndpoint) {`);
      lines.push(`        await ${id}.withReference(infrastructure.primaryCacheEndpoint);`);
      lines.push(
        `        const ${id}_cacheEndpoint = infrastructure.primaryCacheEndpoint.property(EndpointProperty.HostAndPort);`,
      );
      lines.push(`        await ${id}.withEnvironment('GARNET_URI', ${id}_cacheEndpoint);`);
      lines.push(`        await ${id}.withEnvironment('REDIS_URI', ${id}_cacheEndpoint);`);
      lines.push(`      } else {`);
      lines.push(`        await ${id}.withReference(infrastructure.primaryCache);`);
      lines.push(`      }`);
      lines.push(`      await ${id}.waitFor(infrastructure.primaryCache);`);
      lines.push(`    }`);
    }

    // Service references — wired via endpoint env vars (executable→executable)
    const serviceRefs = [
      ...(entry.ServiceReferences ?? []),
    ];
    if (serviceRefs.length > 0) {
      lines.push(``);
      lines.push(`    // Service references — wired via endpoint env vars`);
      for (const ref of serviceRefs) {
        const refId = safeIdentifier(ref);
        lines.push(`    {`);
        lines.push(
          `      const ${refId}Endpoint = await services.get('${ref}')?.getEndpoint('http');`,
        );
        lines.push(`      if (${refId}Endpoint) {`);
        lines.push(
          `        await ${id}.withEnvironment('services__${ref}__http__0', ${refId}Endpoint);`,
        );
        lines.push(`      }`);
        lines.push(`    }`);
      }
    }

    // Plugin references — wired via endpoint env vars (executable→executable)
    const pluginRefs = entry.PluginReferences ?? [];
    if (pluginRefs.length > 0) {
      lines.push(``);
      lines.push(`    // Plugin references — wired via endpoint env vars`);
      for (const ref of pluginRefs) {
        const refId = safeIdentifier(ref);
        lines.push(`    {`);
        lines.push(
          `      const ${refId}Endpoint = await plugins.get('${ref}')?.getEndpoint('http');`,
        );
        lines.push(`      if (${refId}Endpoint) {`);
        lines.push(
          `        await ${id}.withEnvironment('services__${ref}__http__0', ${refId}Endpoint);`,
        );
        lines.push(`      }`);
        lines.push(`    }`);
      }
    }

    lines.push(``);
    lines.push(`    backgroundProcessors.set('${name}', ${id});`);
    lines.push(`  }`);

    registrationBlocks.push(lines.join('\n'));
  }

  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedAspireHelpersGenerateRegisterBackground1, {
    __slot0__: String(fileHeader('register-background.mts')),
    __slot1__: String(SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_HELPERS),
    __slot2__: String(SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT),
    __slot3__: String(SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT),
    __slot4__: String(
      registrationBlocks.length > 0
        ? registrationBlocks.join('\n\n')
        : '  // No background processors configured',
    ),
  });
}

function isTriggersBackgroundResource(name: string, entrypoint: string): boolean {
  return name === 'triggers' || entrypoint === 'triggers/runtime.ts';
}
