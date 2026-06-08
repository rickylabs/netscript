import { assertEquals } from '@std/assert';

import {
  CONTRIBUTION_AXES,
  LIFECYCLE_HOOK_NAMES,
  PLUGIN_MANIFEST_FILES,
  PLUGIN_TYPES,
  RESERVED_PLUGIN_NAMES,
} from '../../src/domain/mod.ts';
import type { PluginContext, PluginLogger, PluginMetadataValue } from '../../src/domain/mod.ts';

Deno.test('plugin domain constants expose finite vocabularies', () => {
  assertEquals(PLUGIN_TYPES, ['background-processor', 'api', 'frontend', 'utility']);
  assertEquals(CONTRIBUTION_AXES, [
    'service',
    'background-processor',
    'stream-topic',
    'database-schema',
    'runtime-config-topic',
    'contract-version',
    'e2e',
    'telemetry',
    'migration',
    'aspire',
  ]);
  assertEquals(LIFECYCLE_HOOK_NAMES, ['setup', 'beforeGenerate', 'afterGenerate', 'teardown']);
  assertEquals(PLUGIN_MANIFEST_FILES, ['plugin.ts', 'plugin.config.ts', 'mod.ts']);
  assertEquals(RESERVED_PLUGIN_NAMES, ['netscript', '@netscript/core']);
});

Deno.test('plugin metadata and context types accept runtime-safe shapes', () => {
  const metadata: PluginMetadataValue = {
    enabled: true,
    retries: 3,
    labels: ['alpha', null],
  };
  const messages: string[] = [];
  const logger: PluginLogger = {
    debug: (message) => messages.push(`debug:${message}`),
    info: (message) => messages.push(`info:${message}`),
    warn: (message) => messages.push(`warn:${message}`),
    error: (message) => messages.push(`error:${message}`),
  };
  const context: PluginContext = {
    projectRoot: '/workspace/project',
    isDev: true,
    logger,
    manifest: { metadata },
  };

  context.logger.info('ready');

  assertEquals(context.projectRoot, '/workspace/project');
  assertEquals(context.isDev, true);
  assertEquals(messages, ['info:ready']);
});
