import { assertEquals, assertStringIncludes } from '@std/assert';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../application/registries/template-registry.ts';
import { DbEngineRegistry } from '../../application/registries/db-engine-registry.ts';
import { generateEngineMod } from './generate-engine-mod.ts';
import { generatePrismaConfig } from './generate-prisma-config.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();
const provider = new DbEngineRegistry().get('postgres');

for (
  const [name, generate] of [
    ['engine module', generateEngineMod],
    ['Prisma config', generatePrismaConfig],
  ] as const
) {
  Deno.test(`Postgres ${name} imports and calls the package normalizer without a local parser`, () => {
    const output = generate(provider, { configKey: 'postgres' });
    assertStringIncludes(
      output,
      "import { normalizePostgresConnectionString as normalizeDatabaseUrl } from '@netscript/database/adapters/postgres';",
    );
    assertStringIncludes(output, 'return normalizeDatabaseUrl(rawValue);');
    for (
      const copied of [
        'function normalizePostgresUrl',
        'function normalizeDatabaseUrl',
        'function parseConnectionParts',
        'function readConnectionPart',
      ]
    ) {
      assertEquals(output.includes(copied), false, `${name} must reuse package policy`);
    }
  });
}
