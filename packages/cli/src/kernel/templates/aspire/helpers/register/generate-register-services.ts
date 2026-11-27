/**
 * @module
 *
 * Generator for `.helpers/register-services.mts` — registers service resources
 * with the Aspire SDK builder via first-party `addDenoApp()`.
 */

import type { RegisterServicesOptions } from '../types.ts';
import { fileHeader } from '../_utils.ts';
import { SCAFFOLD_ASPIRE_MODULES } from '../../../../constants/scaffold/scaffold-aspire.ts';
import { SCAFFOLD_DIRS } from '../../../../constants/scaffold/scaffold-dirs.ts';
import { RESOURCE_DEFAULTS } from '@netscript/aspire/constants';
import { TEMPLATE_KEYS } from '../../../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../../../../adapters/templates/template-asset.ts';
import { withDatabasePermissions } from './database-permissions.ts';
import { renderHttpEndpointCall } from './render-http-endpoint.ts';
import { renderDeclaredEnvironmentLines } from './resolve-resource-environment.ts';

/**
 * Generates the `register-services.mts` file content for a scaffolded Aspire
 * project. Produces a two-pass registration function that creates all service
 * resources first, then wires cross-references in a second pass.
 */
export function generateRegisterServices(options: RegisterServicesOptions): string {
  const { services, version: _version, denoDefaults, databaseEngine } = options;
  const entries = Object.entries(services);

  // --- Pass 1 blocks: create all service resources ---
  const pass1Blocks: string[] = [];

  for (const [name, entry] of entries) {
    const entrypoint = entry.Entrypoint ?? RESOURCE_DEFAULTS.ServiceEntrypoint;
    const workdir = entry.Workdir ?? `${SCAFFOLD_DIRS.SERVICES}/${name}`;
    const watchMode = denoDefaults.WatchMode;
    const entryPermissions = entry.Permissions
      ? withDatabasePermissions(entry.Permissions, databaseEngine)
      : undefined;
    const defaultPermissions = entryPermissions
      ? denoDefaults.Permissions
      : withDatabasePermissions(denoDefaults.Permissions, databaseEngine);

    const lines: string[] = [];
    lines.push(`  // --- ${name} ---`);
    lines.push(`  {`);

    // Resolve permissions — services use HMR watch
    lines.push(`    const perms = resolvePermissions(`);
    if (entryPermissions) {
      lines.push(`      ${JSON.stringify(entryPermissions)},`);
    } else {
      lines.push(`      undefined,`);
    }
    lines.push(`      ${JSON.stringify(defaultPermissions)},`);
    lines.push(`      ${watchMode},`);
    lines.push(`      '${RESOURCE_DEFAULTS.WatchHmrFlag}',`);
    lines.push(`    );`);

    // Resolve working directory
    lines.push(`    const workdir = resolveWorkspacePath(appHostDir, '${workdir}');`);

    // Register via first-party addDenoApp with Deno runtime flags and HTTP endpoint
    lines.push(`    const resource = builder.addDenoApp('${name}', workdir, '${entrypoint}');`);
    lines.push(
      `    await applyDenoPermissions(resource, installationSecretPermissions(perms, installationSecretFile));`,
    );
    lines.push(
      `    await resource.withDenoNodeModulesDir({ mode: DenoNodeModulesDirMode.None });`,
    );
    lines.push(`    await resource.withDenoRuntimeArgs(['--minimum-dependency-age=0']);`);
    lines.push(`    await resource.${renderHttpEndpointCall(entry)};`);

    if (entry.HealthCheckPath !== false) {
      const healthCheckPath = entry.HealthCheckPath ?? RESOURCE_DEFAULTS.AppHealthCheckPath;
      lines.push(``);
      lines.push(`    // HTTP health probe — a listening socket alone is not "healthy".`);
      lines.push(
        `    await resource.withHttpHealthCheck({ path: '${healthCheckPath}', endpointName: '${RESOURCE_DEFAULTS.HttpEndpointName}' });`,
      );
    }

    // Declared environment — applied before the generated values below, which
    // therefore win a key collision (see resolve-resource-environment.ts).
    const declaredEnvironmentLines = renderDeclaredEnvironmentLines(entry);
    if (declaredEnvironmentLines.length > 0) {
      lines.push(``);
      lines.push(`    // Declared environment (config \`Services.${name}\`)`);
      lines.push(...declaredEnvironmentLines);
    }

    lines.push(`    if (installationSecretFile) {`);
    lines.push(
      `      await resource.withEnvironment('NETSCRIPT_INSTALLATION_SECRET_FILE', installationSecretFile);`,
    );
    lines.push(`    }`);

    // OTEL telemetry — Aspire 17 AddDenoApp registers an optional HTTP OTLP exporter
    // and preserves service.instance.id alongside service.version.
    lines.push(``);
    lines.push(`    // OTEL telemetry (endpoint-conditional via Aspire AddDenoApp defaults)`);
    lines.push(`    await resource.withEnvironment('OTEL_SERVICE_NAME', '${name}');`);
    lines.push(
      "    await resource.withEnvironment('OTEL_RESOURCE_ATTRIBUTES', `service.version=${config.Version}`);",
    );

    // Database dependency — all services wait for the primary database.
    lines.push(``);
    lines.push(`    // Database dependency — all services wait for the primary database.`);
    lines.push(`    for (const [key, value] of Object.entries(databaseProviderEnv)) {`);
    lines.push(`      await resource.withEnvironment(key, value);`);
    lines.push(`    }`);
    lines.push(
      `    const sqliteDatabase = config.PrimaryDatabase ? config.Databases[config.PrimaryDatabase] : undefined;`,
    );
    lines.push(`    if (sqliteDatabase?.Engine === 'Sqlite' && config.PrimaryDatabase) {`);
    lines.push(
      `      const sqliteUrl = buildSqliteDatabaseUrl(appHostDir, config.PrimaryDatabase, sqliteDatabase.DatabaseName ?? \`\${config.PrimaryDatabase}.db\`);`,
    );
    lines.push(`      await resource.withEnvironment('DATABASE_URL', sqliteUrl);`);
    lines.push(`      if (databaseEnvKey) {`);
    lines.push(`        await resource.withEnvironment(databaseEnvKey, sqliteUrl);`);
    lines.push(`      }`);
    lines.push(`    } else if (infrastructure.primaryDatabase) {`);
    lines.push(
      `      let databaseBinding = resource.withEnvironment('DATABASE_URL', infrastructure.primaryDatabase);`,
    );
    lines.push(`      if (databaseEnvKey) {`);
    lines.push(
      `        databaseBinding = databaseBinding.withEnvironment(databaseEnvKey, infrastructure.primaryDatabase);`,
    );
    lines.push(`      }`);
    lines.push(`      await databaseBinding`);
    lines.push(`        .withReference(infrastructure.primaryDatabase)`);
    lines.push(`        .waitFor(infrastructure.primaryDatabase);`);
    lines.push(`    }`);

    lines.push(``);
    lines.push(`    services.set('${name}', resource);`);
    lines.push(`  }`);

    pass1Blocks.push(lines.join('\n'));
  }

  const hasServices = entries.length > 0;
  const pass1Content = hasServices ? pass1Blocks.join('\n\n') : '  // No services configured';
  const wireBody = hasServices
    ? `  for (const [name, entry] of Object.entries(config.Services)) {
    const resource = services.get(name);
    if (!resource) continue;

    for (const ref of extractServiceReferences(entry)) {
      const endpoint = await services.get(ref)?.getEndpoint('http');
      if (endpoint) {
        await resource.withEnvironment(\`services__\${ref}__http__0\`, endpoint);
      }
    }

    for (const ref of extractPluginReferences(entry)) {
      const endpoint = await plugins.get(ref)?.getEndpoint('http');
      if (endpoint) {
        await resource.withEnvironment(\`services__\${ref}__http__0\`, endpoint);
      }
    }
  }`
    : '  return Promise.resolve();';

  const compatImportBlock = hasServices
    ? `import {
  applyDenoPermissions,
  buildDatabaseUriEnvKey,
  buildDatabaseProviderEnvVars,
  buildSqliteDatabaseUrl,
  extractPluginReferences,
  extractServiceReferences,
  resolvePermissions,
  resolveWorkspacePath,
} from '${SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT}';\n`
    : '';

  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedAspireHelpersGenerateRegisterServices1, {
    executionImports: hasServices
      ? "import { installationSecretPermissions } from './installation-secret.mts';\n"
      : '',
    denoSdkImport: hasServices
      ? `import { DenoNodeModulesDirMode } from '${SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_HELPERS}';\n`
      : '',
    compatImportBlock,
    asyncModifier: hasServices ? 'async ' : '',
    builderParameter: hasServices ? 'builder' : '_builder',
    configParameter: hasServices ? 'config' : '_config',
    infrastructureParameter: hasServices ? 'infrastructure' : '_infrastructure',
    appHostDirParameter: hasServices ? 'appHostDir' : '_appHostDir',
    secretParameter: hasServices ? 'installationSecretFile' : '_installationSecretFile',
    databaseBindings: hasServices
      ? '  const databaseEnvKey = buildDatabaseUriEnvKey(config);\n  const databaseProviderEnv = buildDatabaseProviderEnvVars(config);\n'
      : '',
    registrationResult: hasServices ? 'services' : 'Promise.resolve(services)',
    wireAsyncModifier: hasServices ? 'async ' : '',
    wireConfigParameter: hasServices ? 'config' : '_config',
    wireServicesParameter: hasServices ? 'services' : '_services',
    wirePluginsParameter: hasServices ? 'plugins' : '_plugins',
    wireBody,
    __slot0__: String(fileHeader('register-services.mts')),
    __slot1__: String(SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_HELPERS),
    __slot2__: String(SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT),
    __slot4__: String(pass1Content),
  });
}
