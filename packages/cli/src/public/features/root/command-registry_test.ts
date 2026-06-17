import { Command } from '@cliffy/command';
import { assertEquals, assertThrows } from 'jsr:@std/assert@^1';

import { CliCommandRegistry } from '../../composition/cli-command-registry.ts';
import { DeployTargetRegistry } from '../../../kernel/application/registries/deploy-target-registry.ts';
import { WindowsServiceDeployTarget } from '../../../kernel/domain/deploy/windows-service-deploy-target.ts';

Deno.test('public command registry keeps top-level public command order stable', () => {
    const registry = new CliCommandRegistry<{ readonly prefix: string }>();
    registry.register('first', {
      id: 'first',
      create: ({ prefix }) => new Command().name(`${prefix}-first`),
    });
    registry.register('second', {
      id: 'second',
      create: ({ prefix }) => new Command().name(`${prefix}-second`),
    });

    const cli = registry.program({
      name: 'netscript',
      version: '0.0.1-alpha.0',
      description: 'test cli',
      context: { prefix: 'public' },
    });

    assertEquals(cli.getCommands().map((command) => command.getName()), ['first', 'second']);
});

Deno.test('public command registry passes in-memory context to command factories', () => {
    const registry = new CliCommandRegistry<{ readonly suffix: string }>();
    registry.register('generated', {
      id: 'generated',
      create: ({ suffix }) => new Command().name(`generated-${suffix}`),
    });

    const cli = registry.program({
      name: 'netscript',
      version: '0.0.1-alpha.0',
      description: 'test cli',
      context: { suffix: 'command' },
    });

    assertEquals(cli.getCommands()[0].getName(), 'generated');
});

Deno.test('public command registry rejects duplicate top-level command names', () => {
    const registry = new CliCommandRegistry<Record<string, never>>();
    registry.register('plugin', {
      id: 'plugin',
      create: () => new Command().name('plugin'),
    });

    assertThrows(
      () =>
        registry.register('plugin', {
          id: 'plugin',
          create: () => new Command().name('plugin'),
        }),
      Error,
      'Duplicate CLI command "plugin"',
    );
});

Deno.test('public command registry exposes deploy targets through a string-keyed port registry', () => {
    const registry = new DeployTargetRegistry([
      ['windows-service', new WindowsServiceDeployTarget()],
    ]);

    assertEquals(registry.get('windows-service')?.operations, ['build', 'install', 'uninstall']);
    assertEquals(registry.entries().map(([key]) => key), ['windows-service']);
});
