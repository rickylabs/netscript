import { assertRejects } from '@std/assert';
import { runCommand } from '../../src/application/gates/scaffold/verify-clean-clone-readme.ts';

Deno.test('clean-clone README gate reports a missing binary', async () => {
  await assertRejects(
    () => runCommand('netscript-binary-that-does-not-exist', [], Deno.cwd()),
    Error,
    'required clean-clone binary is missing: netscript-binary-that-does-not-exist',
  );
});
