import { assertEquals, assertNotEquals, assertStringIncludes } from '@std/assert';
import { renderTemplateAssetSync } from '../../../../kernel/adapters/templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../../../kernel/assets/manifest.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../kernel/application/registries/template-registry.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

Deno.test('rendered service client type-checks with the SDK 0.0.6-compatible import surface', async () => {
  const result = await checkRenderedClient('list');
  assertEquals(result.code, 0, result.stderr);
});

Deno.test('rendered service client fails type-check when the list procedure is renamed', async () => {
  const result = await checkRenderedClient('catalog');
  assertNotEquals(result.code, 0);
  assertStringIncludes(result.stderr, "Property 'list' does not exist");
});

async function checkRenderedClient(procedure: 'list' | 'catalog'): Promise<{
  readonly code: number;
  readonly stderr: string;
}> {
  const root = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(
      `${root}/deno.json`,
      JSON.stringify({
        imports: {
          '@netscript/sdk/client': './sdk-client.ts',
          '@netscript/sdk/query': './sdk-query.ts',
          '@shop/contracts': './contract.ts',
        },
      }),
    );
    await Deno.writeTextFile(
      `${root}/sdk-client.ts`,
      `export function createServiceClient<TContract>(_options: {
  readonly contract: TContract;
  readonly serviceName: string;
  readonly routerName: string;
}): { readonly contract: TContract } {
  throw new Error('type-only SDK 0.0.6-compatible stub');
}\n`,
    );
    await Deno.writeTextFile(
      `${root}/sdk-query.ts`,
      `type Factory<TContract> = {
  readonly [TProcedure in keyof TContract]: {
    clientKey(): readonly unknown[];
  };
};

export function createQueryFactories<
  const TServices extends Readonly<Record<string, {
    readonly contract: Readonly<Record<string, unknown>>;
    readonly client: unknown;
  }>>,
>(_services: TServices): {
  readonly [TService in keyof TServices]: Factory<TServices[TService]['contract']>;
} {
  throw new Error('type-only SDK 0.0.6-compatible stub');
}\n`,
    );
    await Deno.writeTextFile(
      `${root}/contract.ts`,
      `export const OrdersContractV1 = { ${procedure}: {} } as const;\n`,
    );
    await Deno.writeTextFile(
      `${root}/generated.ts`,
      renderTemplateAssetSync(TEMPLATE_KEYS.appRoutesExamplesServiceLibServiceQuery, {
        name: 'shop',
        serviceName: 'orders',
      }),
    );

    const output = await new Deno.Command(Deno.execPath(), {
      cwd: root,
      args: ['check', '--unstable-kv', 'generated.ts'],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    return {
      code: output.code,
      stderr: new TextDecoder().decode(output.stderr),
    };
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}
