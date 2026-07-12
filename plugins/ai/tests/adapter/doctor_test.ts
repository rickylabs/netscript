import { assertEquals, assertStringIncludes } from '@std/assert';
import { runDoctorCommand } from '@netscript/plugin/adapter';
import { aiAdapterPlugin } from '../../src/adapter/plugin.ts';

Deno.test('ai doctor flags dangling model refs, missing provider keys, and unwired tools', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/ai/tools`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/ai/models.ts`,
      '// AI_CLI_STATE: {"providers":["anthropic"],"models":{"chat":"openrouter:test"}}',
    );
    await Deno.writeTextFile(`${root}/ai/tools/echo.ts`, 'export const echo = true;');
    const report = await runDoctorCommand({
      plugin: aiAdapterPlugin,
      context: context(root, {}),
    });
    const check = report.checks.find((entry) => entry.name === 'ai-project');
    assertEquals(check?.ok, false);
    assertStringIncludes(check?.message ?? '', 'Dangling model ref openrouter:test');
    assertStringIncludes(check?.message ?? '', 'Missing provider key ANTHROPIC_API_KEY');
    assertStringIncludes(check?.message ?? '', 'Tool echo is not wired');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('ai doctor accepts configured and wired project state', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/ai/tools`, { recursive: true });
    await Deno.mkdir(`${root}/.netscript/generated/plugin-ai`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/ai/models.ts`,
      '// AI_CLI_STATE: {"providers":["anthropic"],"models":{"chat":"anthropic:test"}}',
    );
    await Deno.writeTextFile(`${root}/ai/tools/echo.ts`, 'export const echo = true;');
    await Deno.writeTextFile(
      `${root}/.netscript/generated/plugin-ai/tools.registry.ts`,
      'import "../../../ai/tools/echo.ts";',
    );
    const report = await runDoctorCommand({
      plugin: aiAdapterPlugin,
      context: context(root, { ANTHROPIC_API_KEY: 'test-key' }),
    });
    assertEquals(report.checks.find((entry) => entry.name === 'ai-project')?.ok, true);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

function context(root: string, config: Readonly<Record<string, string>>) {
  return {
    workspaceRoot: root,
    options: {},
    config,
    dryRun: false,
    fileSystem: {
      readText: (path: string) => Deno.readTextFile(path),
      writeText: (path: string, text: string) => Deno.writeTextFile(path, text),
      exists: async (path: string) => {
        try {
          await Deno.stat(path);
          return true;
        } catch {
          return false;
        }
      },
    },
  };
}
