import { assertEquals, assertNotEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl } from '@std/path';
import {
  checkDocsContractDerivation,
  type NegativeFixture,
} from './check-docs-contract-derivation.ts';

Deno.test('documented contract derivation compiles through both generated aliases', async () => {
  const result = await checkDocsContractDerivation();
  assertEquals(result.rootAlias, './database/postgres/schema/.generated/zod/crud.ts');
  assertEquals(result.contractsAlias, '../database/postgres/schema/.generated/zod/crud.ts');
  assertEquals(result.rootCheckCode, 0);
  assertEquals(result.contractsCheckCode, 0);
});

for (
  const fixture of [
    'root-alias',
    'contracts-alias',
    'barrel-export',
  ] as const satisfies readonly NegativeFixture[]
) {
  Deno.test(`negative fixture exits non-zero: ${fixture}`, async () => {
    const script = fromFileUrl(new URL('./check-docs-contract-derivation.ts', import.meta.url));
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--no-lock',
        '--allow-read',
        '--allow-write',
        '--allow-run',
        script,
        `--negative=${fixture}`,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertNotEquals(output.code, 0);
    const stderr = new TextDecoder().decode(output.stderr);
    assertStringIncludes(stderr, 'failed with exit');
  });
}
