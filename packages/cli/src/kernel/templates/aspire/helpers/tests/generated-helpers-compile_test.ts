/**
 * @module templates/aspire/helpers/generated-helpers-compile_test
 *
 * Compiles emitted helpers against the relevant restored Aspire 13.5.3 SDK contract.
 */

import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { resolve } from 'jsr:@std/path@^1';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';
import { generateDbCliMode } from '../generate-db-cli-mode.ts';
import { generateRegisterInfrastructure } from '../register/generate-register-infrastructure.ts';
import { MINIMAL_DATABASE } from './generators-test-support.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

// Minimal relevant contract derived from the restored Aspire SDK 13.5.3. Container
// registration deliberately excludes ReferenceExpression.getValue(): that declaration
// compiles but its runtime capability is unavailable to AppHost callbacks.
const RESTORED_ASPIRE_SDK_CONTRACT = `
export const InputType = {
  Number: 'Number',
  Boolean: 'Boolean',
};

export interface EndpointReference {
  host(): Promise<string>;
  port(): Promise<number>;
}

export interface AspireResource {
  waitFor(resource: AspireResource): AspireResource;
  withReference(resource: AspireResource): AspireResource;
  withEnvironment(key: string, value: unknown): AspireResource;
  getEndpoint(name: string): Promise<EndpointReference>;
  withHealthCheck(name: string): Promise<AspireResource>;
  withExplicitStart(): Promise<AspireResource>;
  excludeFromMcp(): Promise<AspireResource>;
  withCommand(
    name: string,
    displayName: string,
    callback: (context: ExecuteCommandContext) => Promise<ExecuteCommandResult>,
    options: unknown,
  ): Promise<AspireResource>;
}

export interface ExecuteCommandResult {
  readonly success: boolean;
  readonly message: string;
}

export interface InteractionArguments {
  requiredValue(name: string): Promise<string>;
  value(name: string): Promise<string | null>;
}

export interface ExecuteCommandContext {
  arguments(): Promise<InteractionArguments>;
}

export interface DistributedApplicationBuilder {
  addExecutable(
    name: string,
    executable?: string,
    workingDirectory?: string,
    args?: readonly string[],
  ): AspireResource;
  addContainer(name: string): Promise<AspireResource>;
  addParameter(name: string, options: { value: string; secret: boolean }): Promise<AspireResource>;
  addPostgres(name: string, options: { password: AspireResource }): Promise<AspireResource>;
  addHealthCheck(name: string, check: () => unknown): void;
}
`;

const ASPIRE_COMPAT_CONTRACT = `
export interface NetScriptConfig {}
export interface CacheWiring {}
export const RESOURCE_DEFAULTS = { DbCliModeExcludeFromMcp: true };

export function ensureDatabasePassword(_root: string, _name: string): string {
  return 'fixture-password';
}

export function createListenerReadinessCheck(
  _options: { kind: string; host: string; port: number },
): () => Promise<{ status: string }> {
  return () => Promise.resolve({ status: 'Healthy' });
}
`;

Deno.test('emitted AppHost helpers compile against the restored Aspire SDK contract', async () => {
  const root = resolve(await Deno.makeTempDir({ prefix: 'netscript-apphost-compile-' }));
  const helpersDir = `${root}/.helpers`;
  const modulesDir = `${root}/.aspire/modules`;
  await Deno.mkdir(helpersDir, { recursive: true });
  await Deno.mkdir(modulesDir, { recursive: true });

  try {
    await Deno.writeTextFile(`${modulesDir}/aspire.mts`, RESTORED_ASPIRE_SDK_CONTRACT);
    await Deno.writeTextFile(`${helpersDir}/_aspire-compat.mts`, ASPIRE_COMPAT_CONTRACT);
    const registerInfrastructure = generateRegisterInfrastructure({
      databases: { main: MINIMAL_DATABASE },
      caches: {},
    });
    assertStringIncludes(registerInfrastructure, 'databases.set("main", db_0)');
    assert(
      !registerInfrastructure.includes('connectionStringExpression()'),
      'compile-clean Container emission must not call an unsupported runtime capability',
    );
    assert(!registerInfrastructure.includes('.getValue()'));
    const dbCliMode = generateDbCliMode({ databases: { main: MINIMAL_DATABASE } });
    assertStringIncludes(dbCliMode, ".withEnvironment('DATABASE_URL', target.resource)");
    assertStringIncludes(dbCliMode, 'return await executeDbCliResource(');
    assert(!dbCliMode.includes('connectionStringExpression()'));
    assert(!dbCliMode.includes('.getValue()'));
    await Deno.writeTextFile(
      `${helpersDir}/register-infrastructure.mts`,
      registerInfrastructure,
    );
    await Deno.writeTextFile(`${helpersDir}/db-cli-mode.mts`, dbCliMode);
    await Deno.copyFile(
      new URL('../../../../assets/aspire/helpers/run-tool.ts.template', import.meta.url),
      `${helpersDir}/run-tool.mts`,
    );

    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'check',
        '--no-lock',
        '--unstable-kv',
        `${helpersDir}/register-infrastructure.mts`,
        `${helpersDir}/db-cli-mode.mts`,
        `${helpersDir}/run-tool.mts`,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const stdout = new TextDecoder().decode(output.stdout);
    const stderr = new TextDecoder().decode(output.stderr);

    assertEquals(
      output.code,
      0,
      `emitted helper compile failed\nstdout:\n${stdout}\nstderr:\n${stderr}`,
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
