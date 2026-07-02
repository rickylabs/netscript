import { assertEquals } from 'jsr:@std/assert@^1';
import { ServiceConfigSchema } from '../../src/domain/schemas/service-schema.ts';

Deno.test('ServiceConfigSchema accepts plugin API references', () => {
  const service = ServiceConfigSchema.parse({
    runtime: 'deno',
    port: 3000,
    dependsOn: ['users'],
    pluginReferences: ['workers-api'],
  });

  assertEquals(service.pluginReferences, ['workers-api']);
});
