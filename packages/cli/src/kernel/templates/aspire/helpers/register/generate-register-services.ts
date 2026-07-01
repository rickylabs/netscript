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
 * - **Pass 2:** Wire `ServiceReferences` via `getEndpoint('http')` +
 *   `withEnvironment()` — all services now exist in the Map, so forward
 *   references resolve cleanly. Uses Aspire service-discovery env var
 *   convention: `services__{name}__http__0`.
 *
 * Services use `--watch-hmr` for watch mode (HMR-capable), unlike background
 * processors and apps which use `--watch`.
 */

import type { RegisterServicesOptions } from '../types.ts';
import { fileHeader, safeIdentifier } from '../_utils.ts';
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
  const { services, version: _version, denoDefaults } = options;
  const entries = Object.entries(services);

  // --- Pass 1 blocks: create all service resources ---
  const pass1Blocks: string[] = [];

  for (const [name, entry] of entries) {
    const entrypoint = entry.Entrypoint ?? RESOURCE_DEFAULTS.ServiceEntrypoint;
    const workdir = entry.Workdir ?? `${SCAFFOLD_DIRS.SERVICES}/${name}`;
    const watchMode = denoDefaults.WatchMode;

    const lines: string[] = [];
    lines.push(`  // --- ${name} ---`);
    lines.push(`  {`);

    // Resolve permissions — services use HMR watch
    lines.push(`    const perms = resolvePermissions(`);
    if (entry.Permissions) {
      lines.push(`      ${JSON.stringify(entry.Permissions)},`);
    } else {
      lines.push(`      undefined,`);
    }
    lines.push(`      ${JSON.stringify(denoDefaults.Permissions)},`);
    lines.push(`      ${watchMode},`);
    lines.push(`      '${RESOURCE_DEFAULTS.WatchHmrFlag}',`);
    lines.push(`    );`);

    // Resolve working directory
    lines.push(`    const workdir = resolveWorkspacePath(appHostDir, '${workdir}');`);

    // Register via addExecutable with HTTP endpoint
    lines.push(
      `    const resource = builder.addExecutable('${name}', 'deno', workdir, ['run', '${RESOURCE_DEFAULTS.NodeModulesDirNoneFlag}', ...perms, '${entrypoint}'])`,
    );
    lines.push(
      `      .withHttpEndpoint({ port: ${entry.Port}, env: '${RESOURCE_DEFAULTS.PortEnvVar}' });`,
    );

    // OTEL telemetry (full executable env set)
    lines.push(``);
    lines.push(`    // OTEL telemetry (full executable env set)`);
    lines.push(
      `    const otel = buildOtelEnvVars('${name}', config.Version, 'executable');`,
    );
    lines.push(`    for (const [key, value] of Object.entries(otel)) {`);
    lines.push(`      await resource.withEnvironment(key, value);`);
    lines.push(`    }`);
    lines.push(
      `    await resource.withOtlpExporter({ protocol: OtlpProtocol.HttpProtobuf });`,
    );

    // Database dependency — all services wait for primary DB (C# parity)
    lines.push(``);
    lines.push(`    // Database dependency — all services wait for primary DB (C# parity)`);
    lines.push(`    if (infrastructure.primaryDatabase) {`);
    lines.push(`      let databaseBinding = resource.withEnvironment('DATABASE_URL', infrastructure.primaryDatabase);`);
    lines.push(`      if (databaseEnvKey) {`);
    lines.push(`        databaseBinding = databaseBinding.withEnvironment(databaseEnvKey, infrastructure.primaryDatabase);`);
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

  // --- Pass 2 blocks: wire cross-references ---
  const pass2Blocks: string[] = [];

  for (const [name, entry] of entries) {
    const refs = entry.ServiceReferences;
    if (!refs || refs.length === 0) continue;

    const lines: string[] = [];
    lines.push(`  // --- ${name}: wire ServiceReferences via endpoint env vars ---`);
    lines.push(`  {`);
    lines.push(`    const resource = services.get('${name}');`);
    lines.push(`    if (resource) {`);

    for (const ref of refs) {
      const refId = safeIdentifier(ref);
      lines.push(
        `      const ${refId}Endpoint = await services.get('${ref}')?.getEndpoint('http');`,
      );
      lines.push(`      if (${refId}Endpoint) {`);
      lines.push(
        `        await resource.withEnvironment('services__${ref}__http__0', ${refId}Endpoint);`,
      );
      lines.push(`      }`);
    }

    lines.push(`    }`);
    lines.push(`  }`);

    pass2Blocks.push(lines.join('\n'));
  }

  // --- Compose full output ---
  const pass1Content = pass1Blocks.length > 0
    ? pass1Blocks.join('\n\n')
    : '  // No services configured';

  const pass2Content = pass2Blocks.length > 0
    ? pass2Blocks.join('\n\n')
    : '  // No cross-references to wire';

  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedAspireHelpersGenerateRegisterServices1, {
    __slot0__: String(fileHeader('register-services.mts')),
    __slot1__: String(SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_HELPERS),
    __slot2__: String(SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT),
    __slot3__: String(SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT),
    __slot4__: String(pass1Content),
    __slot5__: String(pass2Content),
  });
}
