/**
 * @module
 *
 * Generator for `.helpers/register-plugins.ts` — registers plugin resources
 * with the Aspire SDK builder using a two-pass approach to resolve
 * plugin→plugin forward references.
 *
 * **Pass 1:** Create ALL plugin resources via `addExecutable()` with resolved
 * permissions, working directory, HTTP endpoint, executable-mode OTEL
 * telemetry, infrastructure dependencies, and service references
 * via endpoint env vars (services already exist from a previous phase).
 *
 * **Pass 2:** Wire `PluginReferences` (plugin→plugin) via endpoint env vars
 * (`getEndpoint('http')` + `withEnvironment()`) — all plugins now exist in
 * the map, so forward references are safe.
 *
 * Plugins support HMR via `--watch-hmr` (unlike apps and background
 * processors which use `--watch`).
 */

import type { RegisterPluginsOptions } from '../types.ts';
import { fileHeader, safeIdentifier } from '../_utils.ts';
import { SCAFFOLD_ASPIRE_MODULES } from '../../../../constants/scaffold/scaffold-aspire.ts';
import { SCAFFOLD_DIRS } from '../../../../constants/scaffold/scaffold-dirs.ts';
import { RESOURCE_DEFAULTS } from '@netscript/aspire/constants';
import { TEMPLATE_KEYS } from '../../../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../../../../adapters/templates/template-asset.ts';

/**
 * Generates the `register-plugins.ts` file content.
 *
 * Produces a two-pass registration function that first creates every plugin
 * resource (with infrastructure deps and service references), then wires
 * plugin→plugin cross-references in a second pass.
 *
 * @param options - Plugin entries, version, and Deno defaults from parsed config
 * @returns Generated TypeScript source as a string
 */
export function generateRegisterPlugins(options: RegisterPluginsOptions): string {
  const { plugins, version: _version, denoDefaults } = options;
  const entries = Object.entries(plugins);

  // --- Pass 1 blocks: create all plugin resources ---
  const pass1Blocks: string[] = [];

  for (const [name, entry] of entries) {
    const workdir = entry.Workdir ?? `${SCAFFOLD_DIRS.PLUGINS}/${name}`;
    const entrypoint = entry.Entrypoint ?? RESOURCE_DEFAULTS.ServiceEntrypoint;

    const lines: string[] = [];
    lines.push(`  // --- ${name} ---`);
    lines.push(`  {`);

    // Resolve permissions — plugins use --watch-hmr
    lines.push(`    const perms = resolvePermissions(`);
    if (entry.Permissions) {
      lines.push(`      ${JSON.stringify(entry.Permissions)},`);
    } else {
      lines.push(`      undefined,`);
    }
    lines.push(`      ${JSON.stringify(denoDefaults.Permissions)},`);
    lines.push(`      config.Defaults.Deno.WatchMode,`);
    lines.push(`      '${RESOURCE_DEFAULTS.WatchHmrFlag}',`);
    lines.push(`    );`);

    // Resolve working directory
    lines.push(`    const workdir = resolveWorkspacePath(appHostDir, '${workdir}');`);
    lines.push(
      `    const bootstrapModule = new URL('../../services/_shared/plugin-service-context.ts', import.meta.url).href;`,
    );

    // Register via addExecutable with HTTP endpoint
    lines.push(
      `    const resource = builder.addExecutable('${name}', 'deno', workdir, ['run', '${RESOURCE_DEFAULTS.NodeModulesDirNoneFlag}', ...perms, '${entrypoint}'])`,
    );
    lines.push(
      `      .withHttpEndpoint({ port: ${entry.Port}, env: '${RESOURCE_DEFAULTS.PortEnvVar}' });`,
    );
    lines.push(
      `    resource.withEnvironment('NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE', bootstrapModule);`,
    );

    // OTEL telemetry (full executable env set)
    lines.push(``);
    lines.push(`    // OTEL telemetry (full executable env set)`);
    lines.push(
      `    const otel = buildOtelEnvVars('${name}', config.Version, 'executable', config.Otel.HttpEndpoint);`,
    );
    lines.push(`    for (const [key, value] of Object.entries(otel)) {`);
    lines.push(`      resource.withEnvironment(key, value);`);
    lines.push(`    }`);

    // Database dependency
    if (entry.RequiresDb) {
      lines.push(``);
      lines.push(`    // Database dependency`);
      lines.push(`    if (infrastructure.primaryDatabase) {`);
      lines.push(
        `      let databaseBinding = resource.withEnvironmentConnectionString('DATABASE_URL', infrastructure.primaryDatabase);`,
      );
      lines.push(`      if (databaseEnvKey) {`);
      lines.push(
        `        databaseBinding = databaseBinding.withEnvironmentConnectionString(databaseEnvKey, infrastructure.primaryDatabase);`,
      );
      lines.push(`      }`);
      lines.push(`      await databaseBinding`);
      lines.push(`        .withReference(infrastructure.primaryDatabase)`);
      lines.push(`        .waitFor(infrastructure.primaryDatabase);`);
      lines.push(`    }`);
    }

    // KV cache dependency
    if (entry.RequiresKv) {
      lines.push(``);
      lines.push(`    // KV cache dependency`);
      lines.push(`    if (infrastructure.primaryCache) {`);
      lines.push(`      if (infrastructure.primaryCacheEndpoint) {`);
      lines.push(`        resource.withReferenceEndpoint(infrastructure.primaryCacheEndpoint);`);
      lines.push(`      } else {`);
      lines.push(`        resource.withReference(infrastructure.primaryCache);`);
      lines.push(`      }`);
      lines.push(`      resource.waitFor(infrastructure.primaryCache);`);
      lines.push(`    }`);
    }

    // Service references — wired via endpoint env vars in Pass 1 (services already exist)
    const serviceRefs = entry.ServiceReferences ?? [];
    if (serviceRefs.length > 0) {
      lines.push(``);
      lines.push(
        `    // Service references (wired via endpoint env vars — services already exist)`,
      );
      for (const ref of serviceRefs) {
        const refId = safeIdentifier(ref);
        lines.push(`    {`);
        lines.push(
          `      const ${refId}Endpoint = await services.get('${ref}')?.getEndpoint('http');`,
        );
        lines.push(`      if (${refId}Endpoint) {`);
        lines.push(
          `        resource.withEnvironment('services__${ref}__http__0', ${refId}Endpoint);`,
        );
        lines.push(`      }`);
        lines.push(`    }`);
      }
    }

    lines.push(``);
    lines.push(`    plugins.set('${name}', resource);`);
    lines.push(`  }`);

    pass1Blocks.push(lines.join('\n'));
  }

  // --- Pass 2 blocks: wire plugin→plugin cross-references ---
  const pass2Blocks: string[] = [];

  for (const [name, entry] of entries) {
    const pluginRefs = entry.PluginReferences ?? [];
    if (pluginRefs.length === 0) continue;

    const lines: string[] = [];
    lines.push(`  // --- ${name}: wire PluginReferences via endpoint env vars ---`);
    lines.push(`  {`);
    lines.push(`    const resource = plugins.get('${name}');`);
    lines.push(`    if (resource) {`);

    for (const ref of pluginRefs) {
      const refId = safeIdentifier(ref);
      lines.push(`      {`);
      lines.push(
        `        const ${refId}Endpoint = await plugins.get('${ref}')?.getEndpoint('http');`,
      );
      lines.push(`        if (${refId}Endpoint) {`);
      lines.push(
        `          resource.withEnvironment('services__${ref}__http__0', ${refId}Endpoint);`,
      );
      lines.push(`        }`);
      lines.push(`      }`);
    }

    lines.push(`    }`);
    lines.push(`  }`);

    pass2Blocks.push(lines.join('\n'));
  }

  // --- Build the complete file content ---
  const aspireImport = SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_HELPERS;
  const aspirePackage = SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT;

  const pass1Body = pass1Blocks.length > 0
    ? pass1Blocks.join('\n\n')
    : '  // No plugins configured — nothing to register in Pass 1.';

  const pass2Body = pass2Blocks.length > 0
    ? pass2Blocks.join('\n\n')
    : '  // No plugin→plugin cross-references to wire.';

  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedAspireHelpersGenerateRegisterPlugins1, {
    __slot0__: String(fileHeader('register-plugins.ts')),
    __slot1__: String(aspireImport),
    __slot2__: String(aspirePackage),
    __slot3__: String(aspirePackage),
    __slot4__: String(pass1Body),
    __slot5__: String(pass2Body),
  });
}
