import { assert, assertEquals } from '@std/assert';
import { join } from '@std/path';
import { defaultOptions, runSmoke } from './scaffold-e2e-test.ts';

Deno.test('legacy scaffold smoke isolates init host detection without starting resources', async () => {
  const scratch = await Deno.makeTempDir();
  try {
    const report = await runSmoke({
      ...defaultOptions(),
      dryRun: true,
      format: 'json',
      smokeRoot: scratch,
      name: 'hermetic-smoke',
      logFile: join(scratch, 'smoke.log'),
    });
    assertEquals(report.ok, true);
    assertEquals(report.startedAspire, false);
    const init = report.steps.find((step) => step.id === 'init-project');
    const command = init?.details && 'command' in init.details ? init.details.command : undefined;
    assert(Array.isArray(command));
    assert(command.some((arg) =>
      typeof arg === 'string' && arg.endsWith('/tests/support/agent-host-free-deno.ts')
    ));
  } finally {
    await Deno.remove(scratch, { recursive: true });
  }
});
