import { assertEquals, assertThrows } from '@std/assert';
import { InvalidPluginNameError, readScaffoldPluginName } from './options.ts';

Deno.test('readScaffoldPluginName accepts a valid kebab-case name from a context', () => {
  const name = readScaffoldPluginName({ options: { pluginName: 'my-worker' } });
  assertEquals(name, 'my-worker');
});

Deno.test('readScaffoldPluginName accepts options passed directly', () => {
  const name = readScaffoldPluginName({ pluginName: 'orders' });
  assertEquals(name, 'orders');
});

Deno.test('readScaffoldPluginName rejects an invalid (non-kebab) name', () => {
  assertThrows(
    () => readScaffoldPluginName({ options: { pluginName: 'Bad_Name' } }),
    InvalidPluginNameError,
  );
});

Deno.test('readScaffoldPluginName rejects a missing name', () => {
  assertThrows(
    () => readScaffoldPluginName({ options: {} }),
    InvalidPluginNameError,
  );
});

Deno.test('InvalidPluginNameError preserves the rejected value', () => {
  try {
    readScaffoldPluginName({ options: { pluginName: 42 } });
  } catch (error) {
    if (error instanceof InvalidPluginNameError) {
      assertEquals(error.received, 42);
      return;
    }
    throw error;
  }
  throw new Error('expected InvalidPluginNameError');
});
