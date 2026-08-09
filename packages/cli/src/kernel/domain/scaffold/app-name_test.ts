import { assertEquals, assertMatch } from 'jsr:@std/assert@^1';
import { SCAFFOLD_VALIDATION } from '../../constants/scaffold/scaffold-validation.ts';
import { deriveDefaultAppName } from './app-name.ts';

Deno.test('deriveDefaultAppName adds one project-specific web suffix', () => {
  assertEquals(deriveDefaultAppName('inventory-console'), 'inventory-console-web');
  assertEquals(deriveDefaultAppName('storefront-web'), 'storefront-web');
  assertEquals(deriveDefaultAppName('web'), 'web');
});

Deno.test('deriveDefaultAppName stays inside the validated app-name contract', () => {
  const derived = deriveDefaultAppName(`a${'b'.repeat(63)}`);

  assertEquals(derived.length, SCAFFOLD_VALIDATION.NAME_MAX_LENGTH);
  assertMatch(derived, SCAFFOLD_VALIDATION.NAME_PATTERN);
  assertEquals(derived.endsWith('-web'), true);
});

Deno.test('deriveDefaultAppName trims a separator at the length boundary', () => {
  const prefix = 'a'.repeat(59);
  const derived = deriveDefaultAppName(`${prefix}-trailing-segment`);

  assertEquals(derived, `${prefix}-web`);
  assertMatch(derived, SCAFFOLD_VALIDATION.NAME_PATTERN);
});
