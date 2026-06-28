import { assertEquals } from '@std/assert';
import { toCamelCase, toKebabCase, toPascalCase, toSnakeCase } from '@std/text';

import { scaffoldSchemaUrl } from '../../src/scaffold/mod.ts';

Deno.test('scaffoldSchemaUrl builds the published scaffold manifest schema URL', () => {
  assertEquals(
    scaffoldSchemaUrl('0.0.1-alpha.12'),
    'https://jsr.io/@netscript/plugin/0.0.1-alpha.12/schema/scaffold.plugin.schema.json',
  );
});

Deno.test('std text casing matches committed first-party scaffold names', () => {
  const pluginNames = ['workers', 'sagas', 'streams', 'triggers', 'auth'];

  for (const pluginName of pluginNames) {
    assertEquals(toPascalCase(pluginName), legacyPascalCase(pluginName));
    assertEquals(toCamelCase(pluginName), legacyCamelCase(pluginName));
    assertEquals(toKebabCase(pluginName), legacyKebabCase(pluginName));
    assertEquals(toSnakeCase(pluginName), legacySnakeCase(pluginName));
  }
});

function legacyPascalCase(value: string): string {
  return value
    .split(/[^A-Za-z0-9]+/)
    .filter((part) => part.length > 0)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join('') || 'Workers';
}

function legacyCamelCase(value: string): string {
  const pascal = legacyPascalCase(value);
  return `${pascal.charAt(0).toLowerCase()}${pascal.slice(1)}`;
}

function legacyKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function legacySnakeCase(value: string): string {
  return legacyKebabCase(value).replaceAll('-', '_');
}
