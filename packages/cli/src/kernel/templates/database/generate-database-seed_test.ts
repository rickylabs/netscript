/**
 * @module templates/database/generate-database-seed_test
 */

import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { describe, it } from 'jsr:@std/testing@^1/bdd';

import { DEFAULT_TEMPLATE_REGISTRY } from '../../application/registries/template-registry.ts';
import { generateDatabaseSeed } from './generate-database-seed.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

describe('generateDatabaseSeed', () => {
  it('generates a typed idempotent representative row for a known model', () => {
    const output = generateDatabaseSeed({ modelName: 'Product' });

    assertStringIncludes(output, 'const existing = await client.product.findFirst(');
    assertStringIncludes(output, 'await client.product.create({');
    assertStringIncludes(output, "name: 'Seed Product'");
    assertStringIncludes(output, "console.log('✅ Seeded representative Product row.');");
    assertEquals(output.includes('$queryRaw'), false);
  });

  it('states truthfully that a direct no-model seed writes no rows', () => {
    const output = generateDatabaseSeed({});

    assertStringIncludes(output, 'No database model is available; no seed rows were written.');
    assertEquals(output.includes('getClient'), false);
    assertEquals(output.includes('.findFirst('), false);
    assertEquals(output.includes('.create('), false);
    assertEquals(output.includes('Database seed completed'), false);
  });
});
