import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals } from 'jsr:@std/assert@^1';
import type { Command } from '@cliffy/command';
import { composeLocalContributorCommandTree } from './local-contributor-command-tree.ts';

describe('local contributor CLI composition', () => {
  it('exposes public project commands plus maintainer commands', () => {
    const cli = composeLocalContributorCommandTree({
      cwd: () => '/workspace',
      resolvePath: (path = '.') => `/workspace/${path}`,
    }) as Command;

    assertEquals(cli.getCommands().map((command) => command.getName()), [
      'init',
      'sync',
      'probe',
      'test',
      'release',
      'agent',
      'config',
      'deploy',
      'contract',
      'db',
      'generate',
      'marketplace',
      'plugin',
      'service',
      'tokens',
      'ui:build',
      'ui:add',
      'ui:apply',
      'ui:init',
      'ui:list',
      'ui:update',
      'ui:view',
      'ui:search',
      'ui:docs',
      'ui:info',
      'ui:registry',
      'ui:preset',
      'ui:remove',
    ]);
  });
});
