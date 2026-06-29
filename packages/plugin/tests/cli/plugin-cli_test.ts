import { assertEquals, assertStringIncludes } from '@std/assert';
import {
  formatPluginHelp,
  isDoctorReportPassing,
  mountPluginCli,
  PluginCli,
  PluginRuntimeConfigCli,
  routeVerb,
  runMountedCommand,
} from '../../src/cli/mod.ts';
import { textArtifact } from '../../src/adapter/mod.ts';
import type { ItemScaffolder } from '../../src/adapter/mod.ts';
import type { PluginCliCommand, PluginCliResult } from '../../src/cli/mod.ts';

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

const exampleScaffolder: ItemScaffolder<{ readonly name: string }> = {
  name: 'service',
  emit(input) {
    return [textArtifact(`services/${input.name}/main.ts`, 'export {};')];
  },
};

class ExampleRuntimeConfigCli extends PluginRuntimeConfigCli {
  readonly topic = 'example';

  read(_args: { readonly command: string }): PluginCliResult {
    return { code: 0, data: { enabled: true } };
  }

  write(_args: { readonly command: string }): PluginCliResult {
    return { code: 0, message: 'written' };
  }
}

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

Deno.test('ItemScaffolder and PluginRuntimeConfigCli define stable contracts', () => {
  const config = new ExampleRuntimeConfigCli();

  assertEquals(exampleScaffolder.emit({ name: 'users' })[0]?.path, 'services/users/main.ts');
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
