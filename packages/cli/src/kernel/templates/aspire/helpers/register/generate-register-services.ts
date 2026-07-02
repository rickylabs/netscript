/**
 * @module
 *
 * Generator for `.helpers/register-services.mts` — registers service resources
 * with the Aspire SDK builder via `addExecutable()`.
 *
 * Uses a **two-pass cross-reference pattern** to avoid forward-reference issues
 * when services reference each other:
 *
 * - **Pass 1:** Create ALL service resources — `addExecutable()` + working dir +
 *   HTTP endpoint + executable-mode OTEL telemetry +
 *   infrastructure dependencies (`waitFor` primary database).
 * - **Pass 2:** Wire `ServiceReferences` and `PluginReferences` via
 *   `getEndpoint('http')` + `withEnvironment()` after services and plugins
 *   both exist. Uses Aspire service-discovery env var convention:
 *   `services__{name}__http__0`.
 *
 * Services use `--watch-hmr` for watch mode (HMR-capable), unlike background
 * processors and apps which use `--watch`.
 */

import type { RegisterServicesOptions } from '../types.ts';
import { fileHeader } from '../_utils.ts';
import { SCAFFOLD_ASPIRE_MODULES } from '../../../../constants/scaffold/scaffold-aspire.ts';
import { SCAFFOLD_DIRS } from '../../../../constants/scaffold/scaffold-dirs.ts';
import { RESOURCE_DEFAULTS } from '@netscript/aspire/constants';
import { TEMPLATE_KEYS } from '../../../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../../../../adapters/templates/template-asset.ts';

/**
 * Generates the `register-services.mts` file content for a scaffolded Aspire
 * project. Produces a two-pass registration function that creates all service
 * resources first, then wires cross-references in a second pass.
 *
 * @param options - Service entries, version, and Deno defaults from parsed config
 * @returns Generated TypeScript source as a string
 */
export function generateRegisterServices(options: RegisterServicesOptions): string {
  const { services, version: _version } = options;
  const entries = Object.entries(services);

  // --- Pass 1 blocks: create all service resources ---
  const pass1Blocks: string[] = [];

  for (const [name, entry] of entries) {
    const entrypoint = entry.Entrypoint ?? RESOURCE_DEFAULTS.ServiceEntrypoint;
    const workdir = entry.Workdir ?? `${SCAFFOLD_DIRS.SERVICES}/${name}`;

    const lines: string[] = [];
    lines.push(`  // --- ${name} ---`);
    lines.push(`  {`);

    // Resolve working directory
    lines.push(`    const workdir = resolveWorkspacePath(appHostDir, '${workdir}');`);

    // Register via addDenoApp — the Aspire fork's Deno runtime host. This runs
    // `deno run -A ${entrypoint}` from the resource working directory. Unlike the
    // prior `addExecutable('deno', ...)` form it does not thread granular
    // permissions / --node-modules-dir=none / --minimum-dependency-age=0
    // (addDenoApp uses `-A`), but it wires native Deno OTEL via WithDenoDefaults.
    lines.push(
      `    const resource = builder.addDenoApp('${name}', workdir, '${entrypoint}')`,
    );
    lines.push(
      `      .withHttpEndpoint({ port: ${entry.Port}, env: '${RESOURCE_DEFAULTS.PortEnvVar}' });`,
    );

    // OTEL telemetry — denoApp mode (3 vars). WithDenoDefaults already set
    // OTEL_DENO=true and the OTLP exporter, so no explicit withOtlpExporter.
    lines.push(``);
    lines.push(`    // OTEL telemetry (denoApp mode — native Deno OTEL)`);
    lines.push(
      `    const otel = buildOtelEnvVars('${name}', config.Version, 'denoApp');`,
    );
    lines.push(`    for (const [key, value] of Object.entries(otel)) {`);
    lines.push(`      await resource.withEnvironment(key, value);`);
    lines.push(`    }`);

    // Database dependency — all services wait for primary DB (C# parity)
    lines.push(``);
    lines.push(`    // Database dependency — all services wait for primary DB (C# parity)`);
    lines.push(`    if (infrastructure.primaryDatabase) {`);
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
    lines.push(`    } else {`);
    lines.push(
      `      const sqliteDatabase = config.PrimaryDatabase ? config.Databases[config.PrimaryDatabase] : undefined;`,
    );
    lines.push(`      if (sqliteDatabase?.Engine === 'Sqlite' && config.PrimaryDatabase) {`);
    lines.push(
      `        const sqliteUrl = \`file:./database/\${config.PrimaryDatabase}/\${sqliteDatabase.DatabaseName ?? \`\${config.PrimaryDatabase}.db\`}\`;`,
    );
    lines.push(`        await resource.withEnvironment('DATABASE_URL', sqliteUrl);`);
    lines.push(`        if (databaseEnvKey) {`);
    lines.push(`          await resource.withEnvironment(databaseEnvKey, sqliteUrl);`);
    lines.push(`        }`);
    lines.push(`      }`);
    lines.push(`    }`);

    lines.push(``);
    lines.push(`    services.set('${name}', resource);`);
    lines.push(`  }`);

    pass1Blocks.push(lines.join('\n'));
  }

  // --- Compose full output ---
  const pass1Content = pass1Blocks.length > 0
    ? pass1Blocks.join('\n\n')
    : '  // No services configured';

  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedAspireHelpersGenerateRegisterServices1, {
    __slot0__: String(fileHeader('register-services.mts')),
    __slot1__: String(SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_HELPERS),
    __slot2__: String(SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT),
    __slot3__: String(SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT),
    __slot4__: String(pass1Content),
  });
}
