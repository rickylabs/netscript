import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';

import * as fixtures from '../../../../src/kernel/templates/aspire/helpers/tests/generators-test-support.ts';
import { generateRegisterBackground } from '../../../../src/kernel/templates/aspire/helpers/register/generate-register-background.ts';
import { locateWorkersResourceBlock } from '../../../src/application/gates/scaffold/locate-workers-resource-block.ts';

const currentWorkersBlock =
  `    const resource = builder.addExecutable("workers-api", 'deno', workdir, [
      'run', '--config', 'deno.json', '@netscript/plugin-workers/services',
    ])
      .withHttpEndpoint({ name: 'http' });

    await resource.withEnvironment('NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE', bootstrapModule);

    plugins.set("workers-api", resource);`;

const currentRegisterPlugins = `export async function registerPlugins() {
  // --- plugin 0 ---
  {
    const resource = builder.addExecutable('streams-api', 'deno', workdir, ['run', 'streams']);
    plugins.set('streams-api', resource);
  }

  // --- plugin 1 ---
  {
${currentWorkersBlock}
  }

  // --- plugin 2 ---
  {
    const resource = builder.addExecutable('sagas-api', 'deno', workdir, ['run', 'sagas']);
    plugins.set('sagas-api', resource);
  }

  // --- plugin 2: wire PluginReferences via endpoint env vars ---
  {
    const resource = plugins.get('sagas-api');
    const workers = plugins.get('workers-api');
  }
}`;

Deno.test('workers range accepts current positional-marker generated output', () => {
  const range = locateWorkersResourceBlock(currentRegisterPlugins);

  assertEquals(currentRegisterPlugins.slice(range.start, range.end), currentWorkersBlock);
});

Deno.test('workers range rejects generated output without a workers resource block', () => {
  const withoutWorkersBlock = `export async function registerPlugins() {
  // --- plugin 0 ---
  {
    const resource = builder.addExecutable('sagas-api', 'deno', workdir, ['run', 'sagas']);
    plugins.set('sagas-api', resource);
  }

  // A reference to workers is not a workers resource block.
  const workers = plugins.get('workers-api');
}`;

  assertThrows(
    () => locateWorkersResourceBlock(withoutWorkersBlock),
    Error,
    'workers-api resource block',
  );
});

Deno.test('workers range rejects a malformed workers block without registration', () => {
  const malformedWorkersBlock = `export async function registerPlugins() {
  // --- plugin 0 ---
  {
    const resource = builder.addExecutable('workers-api', 'deno', workdir, [
      'run', '--config', 'deno.json', '@netscript/plugin-workers/services',
    ]);
  }
}`;

  assertThrows(
    () => locateWorkersResourceBlock(malformedWorkersBlock),
    Error,
    'workers-api resource block',
  );
});

// Coupling guard. prepare-flow-b-fixture.ts still locates the *background* workers block by the
// resource-name comment `  // --- workers ---`, because register-background.mts has no
// `plugins.set(...)` registration anchor to key on semantically. That consumer works only for as
// long as generate-register-background.ts keeps emitting the name form. #1837 made exactly this
// change to the *plugins* generator and silently broke the sibling consumer (#1863); this asserts
// the coupling so the same move against the background generator fails here, loudly and locally,
// instead of surfacing as an opaque runtime E2E failure.
Deno.test('background generator still emits the name-form comment its consumer depends on', () => {
  const output = generateRegisterBackground({
    processors: { workers: fixtures.MINIMAL_BACKGROUND },
    version: '0.0.0',
    denoDefaults: fixtures.MINIMAL_DENO_DEFAULTS,
  });

  assertStringIncludes(
    output,
    '  // --- workers ---',
    'generate-register-background.ts no longer emits the resource-name block comment; ' +
      'prepare-flow-b-fixture.ts locates the background workers block by that exact string ' +
      'and must be migrated to a semantic anchor in the same change (see #1863).',
  );
});
