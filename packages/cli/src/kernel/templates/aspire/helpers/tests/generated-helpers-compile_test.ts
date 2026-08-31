/**
 * @module templates/aspire/helpers/generated-helpers-compile_test
 *
 * Compiles emitted helpers against the relevant restored Aspire 13.5.3 SDK contract.
 */

import { assertEquals } from 'jsr:@std/assert@^1';
import { resolve } from 'jsr:@std/path@^1';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';
import { generateRegisterInfrastructure } from '../register/generate-register-infrastructure.ts';
import { MINIMAL_DATABASE } from './generators-test-support.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

// Verbatim relevant contract from restored Aspire SDK 13.5.3:
// base.mts ReferenceExpression.getValue() and aspire.mts PostgresDatabaseResource.
const RESTORED_ASPIRE_SDK_CONTRACT = `
export interface ReferenceExpression {
  getValue(): Promise<string | null>;
}

export interface EndpointReference {
  host(): Promise<string>;
  port(): Promise<number>;
}

export interface AspireResource {
  waitFor(resource: AspireResource): AspireResource;
  withEnvironment(key: string, value: unknown): AspireResource;
  getEndpoint(name: string): Promise<EndpointReference>;
  withHealthCheck(name: string): Promise<AspireResource>;
  connectionStringExpression(): Promise<ReferenceExpression>;
}

export interface DistributedApplicationBuilder {
  addExecutable(name: string): AspireResource;
  addContainer(name: string): Promise<AspireResource>;
  addParameter(name: string, options: { value: string; secret: boolean }): Promise<AspireResource>;
  addPostgres(name: string, options: { password: AspireResource }): Promise<AspireResource>;
  addHealthCheck(name: string, check: () => unknown): void;
}
`;

const ASPIRE_COMPAT_CONTRACT = `
export interface NetScriptConfig {}
export interface CacheWiring {}

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
    await Deno.writeTextFile(
      `${helpersDir}/register-infrastructure.mts`,
      generateRegisterInfrastructure({
        databases: { main: MINIMAL_DATABASE },
        caches: {},
      }),
    );
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
