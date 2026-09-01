import {
  assertEquals,
  assertMatch,
  assertNotMatch,
  assertStringIncludes,
  assertThrows,
} from '@std/assert';

import * as fixtures from '../../../../src/kernel/templates/aspire/helpers/tests/generators-test-support.ts';
import { generateRegisterBackground } from '../../../../src/kernel/templates/aspire/helpers/register/generate-register-background.ts';
import { generateRegisterPlugins } from '../../../../src/kernel/templates/aspire/helpers/register/generate-register-plugins.ts';
import {
  locateWorkersBackgroundBlock,
  locateWorkersResourceBlock,
} from '../../../src/application/gates/scaffold/locate-workers-resource-block.ts';

// These fixtures come from the real generators, not hand-written strings, so the locator is proven
// against the exact emission the E2E fixture consumes. #1863 happened precisely because a
// hand-maintained assumption about generated text drifted from the generator without anyone noticing.

/** Real register-plugins.mts output with workers-api between two sibling plugins. */
function generatePluginsWithWorkersBetweenSiblings(): string {
  return generateRegisterPlugins(
    {
      services: {},
      version: '1.0.0',
      denoDefaults: fixtures.MINIMAL_DENO_DEFAULTS,
      plugins: {
        'streams-api': fixtures.MINIMAL_PLUGIN,
        'workers-api': fixtures.MINIMAL_PLUGIN,
        'sagas-api': fixtures.PLUGIN_WITH_REFS,
      },
    } as unknown as Parameters<typeof generateRegisterPlugins>[0],
  );
}

Deno.test('locates workers-api in real generator output, between sibling plugins', () => {
  const source = generatePluginsWithWorkersBetweenSiblings();

  // The bug: #1837 replaced the resource-name block comment with a positional ordinal.
  assertEquals(source.includes('  // --- workers-api ---'), false);
  assertStringIncludes(source, '  // --- plugin 1 ---');

  const range = locateWorkersResourceBlock(source);
  const block = source.slice(range.start, range.end);

  // The plugins generator emits names via JSON.stringify (double quotes); the background
  // generator emits them single-quoted. The locator is quote-agnostic, and both are covered here.
  assertStringIncludes(block, 'addExecutable("workers-api"');
  assertStringIncludes(block, 'plugins.set("workers-api", resource);');
  // The span must not widen across either neighbour.
  assertEquals(block.split('builder.addExecutable(').length - 1, 1);
  assertEquals(block.split('plugins.set(').length - 1, 1);
  assertEquals(block.includes('streams-api'), false);
  assertEquals(block.includes('sagas-api'), false);
});

Deno.test('locates workers in real register-background output', () => {
  const source = generateRegisterBackground({
    processors: {
      streams: fixtures.MINIMAL_BACKGROUND,
      workers: fixtures.MINIMAL_BACKGROUND,
      triggers: fixtures.MINIMAL_BACKGROUND,
    },
    version: '1.0.0',
    denoDefaults: fixtures.MINIMAL_DENO_DEFAULTS,
  });

  const range = locateWorkersBackgroundBlock(source);
  const block = source.slice(range.start, range.end);

  // Quote-agnostic on purpose: the locator matches (['"])name, and this branch routes user-supplied
  // names through JSON.stringify, so emission is now double-quoted. Asserting a quote style here
  // would couple the test to emission cosmetics -- the #1837 consumer-coupling defect.
  assertMatch(block, /addExecutable\((["'])workers\1/);
  assertMatch(block, /backgroundProcessors\.set\((["'])workers\1/);
  assertEquals(block.split('builder.addExecutable(').length - 1, 1);
  assertEquals(block.split('backgroundProcessors.set(').length - 1, 1);
  assertNotMatch(block, /(["'])streams\1/);
  assertNotMatch(block, /(["'])triggers\1/);
});

// The background generator still emits the resource-name comment `  // --- workers ---`, so on
// *today's* output the old comment-keyed locator and the semantic one agree -- meaning no test built
// from current output can prove the background migration actually happened. This test supplies the
// discriminator directly: strip the name comment from real generator output, exactly the rename
// #1837 applied to the plugins generator, and require the locator to still find the block. The old
// implementation threw on this input; the semantic one does not. Without this, the background
// migration would be asserted only by tests that pass either way.
Deno.test('locates the background workers block even with the name comment removed (#1837 rename)', () => {
  const source = generateRegisterBackground({
    processors: {
      streams: fixtures.MINIMAL_BACKGROUND,
      workers: fixtures.MINIMAL_BACKGROUND,
      triggers: fixtures.MINIMAL_BACKGROUND,
    },
    version: '1.0.0',
    denoDefaults: fixtures.MINIMAL_DENO_DEFAULTS,
  });

  // This branch applies #1837's source-safe rename in the generator itself, so genuine output no
  // longer carries a name-keyed comment and the old string-replace simulation would be a no-op.
  // Assert the real property instead: no name comment is present anywhere in real output, and the
  // locator still finds the block -- which is the discriminator the simulation was standing in for.
  const renamed = source;
  assertEquals(renamed.includes('  // --- workers ---'), false);

  const block = renamed.slice(
    locateWorkersBackgroundBlock(renamed).start,
    locateWorkersBackgroundBlock(renamed).end,
  );

  // Quote-agnostic on purpose: the locator matches (['"])name, and this branch routes user-supplied
  // names through JSON.stringify, so emission is now double-quoted. Asserting a quote style here
  // would couple the test to emission cosmetics -- the #1837 consumer-coupling defect.
  assertMatch(block, /addExecutable\((["'])workers\1/);
  assertMatch(block, /backgroundProcessors\.set\((["'])workers\1/);
  assertNotMatch(block, /(["'])streams\1/);
  assertNotMatch(block, /(["'])triggers\1/);
});

Deno.test('rejects generated output with no workers resource block', () => {
  const source = generateRegisterPlugins(
    {
      services: {},
      version: '1.0.0',
      denoDefaults: fixtures.MINIMAL_DENO_DEFAULTS,
      plugins: { 'sagas-api': fixtures.MINIMAL_PLUGIN },
    } as unknown as Parameters<typeof generateRegisterPlugins>[0],
  );

  assertThrows(
    () => locateWorkersResourceBlock(source),
    Error,
    'found 0',
  );
});

Deno.test('a plugins.get reference is not mistaken for a registration', () => {
  const source = `export async function registerPlugins() {
  // --- plugin 0 ---
  {
    const resource = builder.addExecutable('sagas-api', 'deno', workdir, ['run', 'sagas']);
    plugins.set('sagas-api', resource);
  }

  // --- plugin 0: wire PluginReferences via endpoint env vars ---
  {
    const workers = plugins.get('workers-api');
  }
}`;

  assertThrows(() => locateWorkersResourceBlock(source), Error, 'found 0');
});

Deno.test('rejects a creation with no matching registration', () => {
  const source = `export async function registerPlugins() {
  {
    const resource = builder.addExecutable('workers-api', 'deno', workdir, ['run', 'workers']);
  }
}`;

  assertThrows(
    () => locateWorkersResourceBlock(source),
    Error,
    'registration anchor',
  );
});

Deno.test('rejects ambiguous duplicate creation anchors rather than picking one', () => {
  const source = `export async function registerPlugins() {
  {
    const resource = builder.addExecutable('workers-api', 'deno', workdir, ['run', 'a']);
    plugins.set('workers-api', resource);
  }

  {
    const resource = builder.addExecutable('workers-api', 'deno', workdir, ['run', 'b']);
    plugins.set('workers-api', resource);
  }
}`;

  assertThrows(
    () => locateWorkersResourceBlock(source),
    Error,
    'found 2',
  );
});

Deno.test('rejects a registration bound to a different identifier', () => {
  const source = `export async function registerPlugins() {
  {
    const resource = builder.addExecutable('workers-api', 'deno', workdir, ['run', 'workers']);
    plugins.set('workers-api', somethingElse);
  }
}`;

  assertThrows(
    () => locateWorkersResourceBlock(source),
    Error,
    'registration anchor',
  );
});
