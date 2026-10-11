import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { DbEngineRegistry } from '../../application/registries/db-engine-registry.ts';
import { generateDatabaseDenoJson } from './generate-db-deno-json.ts';
import { SCAFFOLD_APP_CATALOG } from '../../constants/scaffold/scaffold-app-catalog.ts';

Deno.test('database scaffolds keep every Prisma executable and adapter on the qualified family', () => {
  const registry = new DbEngineRegistry();
  for (const engine of ['postgres', 'mysql', 'mssql', 'sqlite'] as const) {
    const config = JSON.parse(generateDatabaseDenoJson(registry.get(engine), {
      projectName: 'currency-test',
      importMode: 'jsr',
    })) as { imports: Record<string, string>; tasks: Record<string, string> };
    for (const name of ['prisma', '@prisma/client', '@prisma/instrumentation-contract']) {
      assertEquals(config.imports[name], `npm:${name}@^7.10.0`, `${engine}: ${name}`);
    }
    for (const [name, value] of Object.entries(config.imports)) {
      if (name.startsWith('@prisma/adapter-')) {
        assertEquals(value, `npm:${name}@^7.10.0`, `${engine}: ${name}`);
      }
    }
    const prismaTasks = Object.values(config.tasks).filter((task) => task.includes('npm:prisma@'));
    assert(prismaTasks.length > 0);
    for (const task of prismaTasks) assertStringIncludes(task, 'npm:prisma@^7.10.0 ');
    if (engine === 'postgres') assertEquals(config.imports.pg, 'npm:pg@^8.23.1');
  }
});

Deno.test('Fresh scaffolds carry the qualified Tailwind and signals pins', () => {
  assertEquals(SCAFFOLD_APP_CATALOG.TAILWINDCSS, '^4.3.3');
  assertEquals(SCAFFOLD_APP_CATALOG.TAILWINDCSS_VITE, '^4.3.3');
  assertEquals(SCAFFOLD_APP_CATALOG.PREACT_SIGNALS, '2.11.3');
});
