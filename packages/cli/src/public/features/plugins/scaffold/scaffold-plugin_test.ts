import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assert, assertEquals, assertStringIncludes, assertThrows } from 'jsr:@std/assert@^1';
import {
  PLUGIN_SKELETON_TEMPLATES,
  type PluginSkeletonTemplatePath,
} from '@netscript/plugin/templates';

import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import {
  resolvePluginScaffoldTarget,
  resolveTemplateVariables,
  scaffoldPluginPackage,
} from './scaffold-plugin-use-case.ts';
import { expandTemplate } from './template-substitution.ts';

describe('plugin scaffold use case', () => {
  it('writes registered plugin skeleton templates with semantic substitutions', async () => {
    const fs = new MemoryFileSystemAdapter();

    const result = await scaffoldPluginPackage({
      pluginName: '@acme/plugin-billing',
      targetPath: '/workspace/alpha/plugins/plugin-billing',
      templateContent: buildTemplateContentMap(),
      overwrite: false,
    }, { fs });

    const denoJson = JSON.parse(
      await fs.readFile('/workspace/alpha/plugins/plugin-billing/deno.json'),
    );
    const cli = await fs.readFile(
      '/workspace/alpha/plugins/plugin-billing/src/cli/plugin-billing-cli.ts',
    );
    const paths = [...fs.getFiles().keys()].filter((path) =>
      path.startsWith('/workspace/alpha/plugins/plugin-billing/')
    );

    assertEquals(denoJson.name, '@acme/plugin-billing');
    assertEquals(denoJson.exports['./cli'], './src/cli/composition/main.ts');
    assertStringIncludes(cli, 'class BillingCli');
    assertEquals(result.variables.pluginBaseName, 'billing');
    assertEquals(result.filesCreated.length, PLUGIN_SKELETON_TEMPLATES.length);
    assert(paths.every((path) => !path.includes('.template')));
    assert(paths.every((path) => !path.includes('{{')));
  });

  it('skips existing files unless overwrite is enabled', async () => {
    const fs = new MemoryFileSystemAdapter();
    await fs.writeFile('/workspace/alpha/plugins/plugin-billing/README.md', 'kept');

    const result = await scaffoldPluginPackage({
      pluginName: '@acme/plugin-billing',
      targetPath: '/workspace/alpha/plugins/plugin-billing',
      templateContent: buildTemplateContentMap(),
      overwrite: false,
    }, { fs });

    assertEquals(await fs.readFile('/workspace/alpha/plugins/plugin-billing/README.md'), 'kept');
    assertEquals(
      result.filesSkipped.map((path) => path.replace(/\\/g, '/')).includes(
        '/workspace/alpha/plugins/plugin-billing/README.md',
      ),
      true,
    );
  });

  it('resolves default target and variables from scoped package names', () => {
    const target = resolvePluginScaffoldTarget('/workspace/alpha', '@acme/plugin-billing');
    const variables = resolveTemplateVariables('@acme/plugin-billing');

    assertEquals(target.replace(/\\/g, '/'), '/workspace/alpha/plugins/plugin-billing');
    assertEquals(variables.pluginScope, '@acme');
    assertEquals(variables['plugin-name'], 'plugin-billing');
    assertEquals(variables.ClassName, 'Billing');
  });

  it('rejects templates with missing variables', () => {
    const variables = resolveTemplateVariables('@acme/plugin-billing');

    assertThrows(
      () => {
        expandTemplate('{{missing}}', variables);
      },
      Error,
      'missing',
    );
  });
});

function buildTemplateContentMap(): Record<PluginSkeletonTemplatePath, string> {
  return Object.fromEntries(
    PLUGIN_SKELETON_TEMPLATES.map((templatePath) => [
      templatePath,
      buildTemplateContent(templatePath),
    ]),
  ) as Record<PluginSkeletonTemplatePath, string>;
}

function buildTemplateContent(templatePath: string): string {
  if (templatePath === 'deno.json.template') {
    return JSON.stringify(
      {
        name: '{{pluginName}}',
        exports: {
          '.': './mod.ts',
          './cli': './src/cli/composition/main.ts',
        },
      },
      null,
      2,
    );
  }

  if (templatePath === 'src/cli/{{plugin-name}}-cli.ts.template') {
    return 'export class {{ClassName}}Cli {}\n';
  }

  return '{{pluginName}} {{pluginBaseName}}\n';
}
