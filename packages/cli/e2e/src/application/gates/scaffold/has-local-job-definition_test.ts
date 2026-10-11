import { assertEquals } from '@std/assert';
import { hasLocalJobDefinition } from './has-local-job-definition.ts';

Deno.test('Flow-B registry evidence survives canonical multiline calls and either quote style', () => {
  for (const quote of ["'", '"']) {
    for (const whitespace of [' ', '\n    ']) {
      const source =
        `['flow-b-callback']: createLocalJobDefinition(${whitespace}${quote}flow-b-callback${quote},${whitespace}${quote}./flow-b-callback.ts${quote},${whitespace}resolvedJob0),`;
      assertEquals(hasLocalJobDefinition(source, 'flow-b-callback', './flow-b-callback.ts'), true);
    }
  }
});

Deno.test('Flow-B evidence requires the correct id and entrypoint in the same local definition', () => {
  for (
    const source of [
      "createLocalJobDefinition('other', './flow-b-callback.ts', resolvedJob0)",
      "createLocalJobDefinition('flow-b-callback', './wrong.ts', resolvedJob0)",
      "createLocalJobDefinition('flow-b-callback', './flow-b-callbackXts', resolvedJob0)",
      "createLocalJobDefinition('flow-b-callback', './wrong.ts', resolvedJob0); createLocalJobDefinition('other', './flow-b-callback.ts', resolvedJob1)",
      "createPluginJobDefinition('flow-b-callback', './flow-b-callback.ts', resolvedJob0)",
      "const path = './flow-b-callback.ts';",
    ]
  ) assertEquals(hasLocalJobDefinition(source, 'flow-b-callback', './flow-b-callback.ts'), false);
});
