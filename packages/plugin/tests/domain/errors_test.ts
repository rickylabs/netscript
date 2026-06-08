import { assertEquals, assertInstanceOf } from '@std/assert';

import { DuplicatePluginError, PluginError, PluginValidationError } from '../../src/domain/mod.ts';

Deno.test('plugin domain errors preserve names and inheritance', () => {
  const error = new PluginError('Plugin failed.');
  const validation = new PluginValidationError('Invalid plugin.', ['name is required']);
  const duplicate = new DuplicatePluginError('@example/plugin');

  assertInstanceOf(error, Error);
  assertInstanceOf(validation, PluginError);
  assertInstanceOf(duplicate, PluginError);
  assertEquals(error.name, 'PluginError');
  assertEquals(validation.name, 'PluginValidationError');
  assertEquals(validation.issues, ['name is required']);
  assertEquals(duplicate.message, 'Plugin "@example/plugin" is already registered.');
});
