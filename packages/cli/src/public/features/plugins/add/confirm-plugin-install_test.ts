import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';

import type { PromptPort } from '../../../../kernel/ports/prompt-port.ts';
import type { ValidatedPluginDescriptor } from './jsr-plugin-validator-port.ts';
import { confirmPluginInstall } from './confirm-plugin-install.ts';

describe('confirmPluginInstall', () => {
  it('prompts for third-party packages and includes JSR metadata', async () => {
    const prompt = new RecordingPrompt([true]);

    const decision = await confirmPluginInstall({
      descriptor: descriptorFor('acme', 'plugin-billing'),
      prompt,
    });

    assertEquals(decision, {
      confirmed: true,
      prompted: true,
      trustTier: 'third-party',
      packageSpecifier: '@acme/plugin-billing',
    });
    assertEquals(prompt.messages.length, 1);
    assertStringIncludes(prompt.messages[0], '@acme/plugin-billing@1.2.3');
    assertStringIncludes(prompt.messages[0], 'Billing workflows');
    assertStringIncludes(prompt.messages[0], 'acme/plugin-billing');
    assertStringIncludes(prompt.messages[0], 'JSR score: 87');
  });

  it('skips prompts for first-party packages', async () => {
    const prompt = new RecordingPrompt([false]);

    const decision = await confirmPluginInstall({
      descriptor: descriptorFor('netscript', 'plugin-workers'),
      prompt,
    });

    assertEquals(decision, {
      confirmed: true,
      prompted: false,
      skippedBecause: 'first-party',
      trustTier: 'first-party',
      packageSpecifier: '@netscript/plugin-workers',
    });
    assertEquals(prompt.messages, []);
  });

  it('skips third-party prompts with --skip-confirmation', async () => {
    const prompt = new RecordingPrompt([false]);

    const decision = await confirmPluginInstall({
      descriptor: descriptorFor('acme', 'plugin-billing'),
      prompt,
      skipConfirmation: true,
    });

    assertEquals(decision, {
      confirmed: true,
      prompted: false,
      skippedBecause: 'skip-confirmation',
      trustTier: 'third-party',
      packageSpecifier: '@acme/plugin-billing',
    });
    assertEquals(prompt.messages, []);
  });

  it('skips third-party prompts in --ci mode', async () => {
    const prompt = new RecordingPrompt([false]);

    const decision = await confirmPluginInstall({
      descriptor: descriptorFor('acme', 'plugin-billing'),
      prompt,
      ci: true,
    });

    assertEquals(decision, {
      confirmed: true,
      prompted: false,
      skippedBecause: 'ci',
      trustTier: 'third-party',
      packageSpecifier: '@acme/plugin-billing',
    });
    assertEquals(prompt.messages, []);
  });

  it('rejects when a third-party prompt is declined', async () => {
    await assertRejects(
      () =>
        confirmPluginInstall({
          descriptor: descriptorFor('acme', 'plugin-billing'),
          prompt: new RecordingPrompt([false]),
        }),
      Error,
      'was not confirmed',
    );
  });
});

class RecordingPrompt implements PromptPort {
  readonly messages: string[] = [];
  private readonly confirmations: boolean[];

  constructor(confirmations: readonly boolean[]) {
    this.confirmations = [...confirmations];
  }

  input(_message: string, options?: { readonly defaultValue?: string }): Promise<string> {
    return Promise.resolve(options?.defaultValue ?? '');
  }

  confirm(message: string, options?: { readonly defaultValue?: boolean }): Promise<boolean> {
    this.messages.push(message);
    return Promise.resolve(this.confirmations.shift() ?? options?.defaultValue ?? false);
  }

  select<T extends string>(
    _message: string,
    _options: readonly T[],
    config?: { readonly defaultValue?: T },
  ): Promise<T> {
    return Promise.resolve(config?.defaultValue ?? _options[0]);
  }
}

function descriptorFor(scope: string, packageName: string): ValidatedPluginDescriptor {
  const packageSpecifier = `@${scope}/${packageName}`;
  return {
    package: {
      requestedSpec: packageSpecifier,
      source: 'scoped-name',
      scope,
      packageName,
      packageSpecifier,
      jsrSpecifier: `jsr:${packageSpecifier}`,
    },
    version: '1.2.3',
    manifest: {
      schemaVersion: 1,
      name: packageSpecifier,
      version: '1.2.3',
      displayName: packageName,
      description: 'Billing workflows',
      peerDependencies: {},
      capabilities: {
        hasDatabaseMigrations: false,
        hasRoutes: true,
        hasBackgroundWorkers: false,
      },
      scaffolder: {
        export: './scaffold',
        requiredPermissions: { net: [], read: [], write: [] },
      },
    },
    packageMetadata: { latest: '1.2.3', isYanked: false },
    versionMetadata: { exports: { './scaffold': './scaffold.ts' }, files: {} },
    details: {
      description: 'Billing workflows',
      githubRepository: { owner: scope, name: packageName },
      score: 87,
      runtimeCompat: { deno: true },
    },
  };
}
