import { assertEquals } from '@std/assert';
import { apiKind, apiKindRole } from './api-kinds.ts';

Deno.test('API kinds follow the merged Utility spec, including deno doc aliases', () => {
  for (
    const [label, kind, role] of [
      ['interface', 'interface', 'keyword'],
      ['type alias', 'type', 'keyword'],
      ['typeAlias', 'type', 'keyword'],
      ['class', 'class', 'type'],
      ['function', 'function', 'function'],
      ['method', 'method', 'function'],
      ['variable', 'variable', 'number'],
      ['constant', 'const', 'number'],
      ['enum', 'enum', 'number'],
      ['module', 'module', 'fg'],
      ['namespace', 'namespace', 'fg'],
      ['component', 'component', 'function'],
    ]
  ) {
    assertEquals(apiKind(label), kind, label);
    assertEquals(apiKindRole(label), role, label);
  }
  assertEquals(apiKind('ordinary prose'), undefined);
});
