import { DenoGeneratedSourceFormatter } from '../runtime/process/deno-generated-source-formatter.ts';
import { DenoProcess } from '../runtime/process/deno-process.ts';
import { assertRejects } from '@std/assert';
import { canonicalizeAspireOutputs } from './aspire-surface-inventory.ts';

Deno.test('Aspire rendering rejects producer overlap and authored appsettings output before writing', async () => {
  for (
    const paths of [
      ['apphost.mts', 'apphost.mts'],
      ['.helpers/a.mts', '.helpers/A.mts'],
      ['../appsettings.json'],
      ['appsettings.json'],
      ['.helpers/appsettings.json'],
      ['.helpers/../../appsettings.json'],
      ['.helpers\\escape.mts'],
    ]
  ) {
    await assertRejects(() =>
      canonicalizeAspireOutputs(
        '.',
        paths.map((path) => ({ path, content: '' })),
        new DenoGeneratedSourceFormatter(new DenoProcess()),
      )
    );
  }
});
