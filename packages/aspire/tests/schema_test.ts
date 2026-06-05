import { assertEquals, assertExists } from '@std/assert';
import { generateAppSettingsJsonSchema } from '../schema.ts';

Deno.test('schema', async (t) => {
  await t.step('generates valid JSON Schema draft-7', () => {
    const schema = generateAppSettingsJsonSchema();

    assertEquals(schema.$schema, 'http://json-schema.org/draft-07/schema#');
    assertEquals(schema.$id, 'netscript-appsettings');
    assertExists(schema.title);
    assertExists(schema.description);
    assertExists(schema.allOf);
  });

  await t.step('allOf wraps ASP.NET Core schema ref', () => {
    const schema = generateAppSettingsJsonSchema();
    const allOf = schema.allOf as Record<string, unknown>[];
    const first = allOf[0];

    assertExists(first);
    assertEquals(
      (first as Record<string, unknown>).$ref,
      'https://json.schemastore.org/appsettings.json',
    );
  });

  await t.step('contains NetScript properties in generated schema', () => {
    const schema = generateAppSettingsJsonSchema();
    const allOf = schema.allOf as Record<string, unknown>[];
    const generated = allOf[1] as Record<string, unknown> | undefined;

    assertExists(generated);
    // The generated schema should define properties
    assertExists(generated.type || generated.properties || generated.$defs);
  });

  await t.step('enum schemas produce correct values', () => {
    const schema = generateAppSettingsJsonSchema();
    const json = JSON.stringify(schema);

    // Database engines should appear somewhere in the schema
    assertEquals(json.includes('Postgres'), true);
    assertEquals(json.includes('Mssql'), true);
    assertEquals(json.includes('Mysql'), true);
    assertEquals(json.includes('Sqlite'), true);
  });
});
