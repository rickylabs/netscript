import { assertEquals, assertStringIncludes } from '@std/assert';
import {
  formatPluginHelp,
  isDoctorReportPassing,
  mountPluginCli,
  PluginCli,
  PluginItemScaffolder,
  PluginRuntimeConfigCli,
  routeVerb,
  runMountedCommand,
} from '../../src/cli/mod.ts';
import type { PluginCliCommand, PluginCliResult, PluginScaffoldResult } from '../../src/cli/mod.ts';

class ExampleCli extends PluginCli {
  readonly name = 'example';
  readonly description = 'Example plugin CLI';

  commands(): readonly PluginCliCommand[] {
    return [{
      name: 'doctor',
      description: 'Run checks',
      run: () => ({ code: 0, message: 'ok' }),
    }];
  }
}

class ExampleScaffolder extends PluginItemScaffolder<{ readonly name: string }> {
  readonly itemName = 'service';

  scaffold(input: { readonly name: string }): PluginScaffoldResult {
    return { files: [`services/${input.name}/main.ts`] };
  }
}

class ExampleRuntimeConfigCli extends PluginRuntimeConfigCli {
  readonly topic = 'example';

  read(_args: { readonly command: string }): PluginCliResult {
    return { code: 0, data: { enabled: true } };
  }

  write(_args: { readonly command: string }): PluginCliResult {
    return { code: 0, message: 'written' };
  }
}

Deno.test('PluginCli runs named commands and reports unknown commands', async () => {
  const cli = new ExampleCli();

  assertEquals(await cli.run({ command: 'doctor' }), { code: 0, message: 'ok' });
  assertEquals((await cli.run({ command: 'missing' })).code, 1);
});

Deno.test('mounted plugin CLI commands run through composition helpers', async () => {
  const commands = mountPluginCli([new ExampleCli()]);

  assertEquals(await runMountedCommand(commands, { command: 'example:doctor' }), {
    code: 0,
    message: 'ok',
  });
  assertEquals(await routeVerb(commands, { command: 'example:doctor' }), {
    code: 0,
    message: 'ok',
  });
  assertStringIncludes(formatPluginHelp(commands), 'example:doctor');
});

Deno.test('PluginItemScaffolder and PluginRuntimeConfigCli bases define stable contracts', () => {
  const scaffolder = new ExampleScaffolder();
  const config = new ExampleRuntimeConfigCli();

  assertEquals(scaffolder.scaffold({ name: 'users' }), {
    files: ['services/users/main.ts'],
  });
  assertEquals(config.read({ command: 'read' }).code, 0);
  assertEquals(config.write({ command: 'write' }).message, 'written');
});

Deno.test('doctor reports are passing only when every check passes', () => {
  assertEquals(
    isDoctorReportPassing({
      plugin: '@example/plugin',
      checks: [{ name: 'config', ok: true }],
    }),
    true,
  );
  assertEquals(
    isDoctorReportPassing({
      plugin: '@example/plugin',
      checks: [{ name: 'config', ok: false }],
    }),
    false,
  );
});
