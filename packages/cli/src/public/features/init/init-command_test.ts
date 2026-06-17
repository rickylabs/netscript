import { assertRejects } from 'jsr:@std/assert@^1';
import { createInitCommand } from './init-command.ts';

Deno.test('init --from reports the empty Wave 6 preset registry', async () => {
  const command = createInitCommand({
    initContext: {} as never,
    defaultProjectName: () => 'preset-smoke',
  });

  await assertRejects(
    () => command.parse(['--from', 'api-only']),
    Error,
    'no presets registered',
  );
});
