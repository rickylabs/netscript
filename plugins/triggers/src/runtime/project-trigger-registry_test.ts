import { assertEquals } from '@std/assert';
import { join, toFileUrl } from '@std/path';
import { loadProjectTriggerDefinitions } from './project-trigger-registry.ts';

Deno.test('loadProjectTriggerDefinitions falls back to project trigger barrel when generated registry is absent', async () => {
  const projectRoot = await Deno.makeTempDir({ prefix: 'netscript-triggers-registry-' });
  try {
    const triggersDir = join(projectRoot, 'triggers');
    await Deno.mkdir(triggersDir, { recursive: true });
    await Deno.writeTextFile(
      join(triggersDir, 'mod.ts'),
      [
        "import { defineWebhook } from '@netscript/plugin-triggers-core/builders';",
        '',
        'export const inboundGenericTrigger = defineWebhook(() => Promise.resolve([]), {',
        "  id: 'inbound/generic',",
        "  path: 'inbound/generic',",
        "  verifier: 'memory',",
        '});',
        '',
      ].join('\n'),
    );

    const generatedRegistry = toFileUrl(
      join(projectRoot, '.netscript', 'generated', 'plugin-triggers', 'triggers.registry.ts'),
    ).href;

    const definitions = await loadProjectTriggerDefinitions(generatedRegistry);

    assertEquals(definitions.map((definition) => definition.id), ['inbound/generic']);
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});
