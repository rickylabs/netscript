import { assertEquals } from '@std/assert';

import { textArtifact } from './artifact.ts';
import type { ItemScaffolder } from './item-scaffolder.ts';

Deno.test('ItemScaffolder emits typed scaffold artifacts', () => {
  const scaffolder: ItemScaffolder<{ readonly id: string }> = {
    name: 'job',
    emit(input) {
      return [textArtifact(`src/jobs/${input.id}.ts`, 'export {};')];
    },
  };

  assertEquals(scaffolder.emit({ id: 'send-email' }), [
    { path: 'src/jobs/send-email.ts', body: { kind: 'text', text: 'export {};' } },
  ]);
});
