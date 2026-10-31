import { assertEquals, assertMatch, assertStringIncludes, assertThrows } from '@std/assert';
import { resolve } from '@std/path';
import { resolve as resolveWindows } from '@std/path/windows';

import {
  configureLocalWorkersBlock,
  configurePublishedWorkersBlock,
  workersServiceSource,
} from '../../../src/application/gates/scaffold/configure-published-workers-block.ts';
import { locateWorkersResourceBlock } from '../../../src/application/gates/scaffold/locate-workers-resource-block.ts';
import { generateRegisterPlugins } from '../../../../src/kernel/templates/aspire/helpers/register/generate-register-plugins.ts';
import {
  MINIMAL_DENO_DEFAULTS,
  MINIMAL_PLUGIN,
} from '../../../../src/kernel/templates/aspire/helpers/tests/generators-test-support.ts';

const dependencyAgeArgument = "'--minimum-dependency-age=0'";

Deno.test('published workers rewrite preserves one existing dependency-age argument', () => {
  const configured = configurePublishedWorkersBlock(
    "['run', '--config', 'deno.json', '--minimum-dependency-age=0', 'services']",
  );

  assertStringIncludes(configured, "'--config', '.netscript-flow-b-deno.json'");
  assertEquals(countOccurrences(configured, dependencyAgeArgument), 1);
});

Deno.test('published workers rewrite adds one missing dependency-age argument', () => {
  const configured = configurePublishedWorkersBlock(
    "['run', '--config', 'deno.json', 'services']",
  );

  assertStringIncludes(configured, "'--config', '.netscript-flow-b-deno.json'");
  assertEquals(countOccurrences(configured, dependencyAgeArgument), 1);
});

Deno.test('published workers rewrite accepts a formatted Deno argument array', () => {
  const configured = configurePublishedWorkersBlock(`[
  'run',
  '--config',
  'deno.json',
  '--minimum-dependency-age=0',
  'services',
]`);

  assertStringIncludes(configured, "'--config',\n  '.netscript-flow-b-deno.json'");
  assertEquals(countOccurrences(configured, dependencyAgeArgument), 1);
});

Deno.test('published workers rewrite adds dependency age to a formatted argument array', () => {
  const configured = configurePublishedWorkersBlock(`[
  'run',
  '--config',
  'deno.json',
  'services',
]`);

  assertStringIncludes(configured, "'--config',\n  '.netscript-flow-b-deno.json'");
  assertEquals(countOccurrences(configured, dependencyAgeArgument), 1);
});

Deno.test('published workers rewrite rejects a block without the Deno config pair', () => {
  assertThrows(
    () => configurePublishedWorkersBlock("['run', 'services']"),
    Error,
    'expected Deno config argument',
  );
});

Deno.test('local workers rewrite accepts formatted real generator output and preserves its source entrypoint', async () => {
  const sourceRoot = resolve('/workspace/source-with-a-long-directory-name');
  const entrypoint = resolve(sourceRoot, workersServiceSource);
  const source = generateRegisterPlugins({
    version: '1.0.0',
    denoDefaults: MINIMAL_DENO_DEFAULTS,
    plugins: {
      'workers-api': { ...MINIMAL_PLUGIN, Entrypoint: entrypoint },
    },
  });
  const formatter = new Deno.Command(Deno.execPath(), {
    args: ['fmt', '--ext=mts', '-'],
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  const input = formatter.stdin.getWriter();
  await input.write(new TextEncoder().encode(source));
  await input.close();
  const formatted = await formatter.output();
  assertEquals(formatted.code, 0, new TextDecoder().decode(formatted.stderr));
  const generated = new TextDecoder().decode(formatted.stdout);
  const range = locateWorkersResourceBlock(generated);
  const block = generated.slice(range.start, range.end);
  assertMatch(block, /'--config',\s*\n\s*'deno\.json'/);

  const configured = configureLocalWorkersBlock(block, sourceRoot);
  assertMatch(configured, /'--config',\s*'\.netscript-flow-b-deno\.json'/);
  assertStringIncludes(configured, entrypoint.replaceAll('\\', '\\\\'));
  assertEquals(countOccurrences(configured, dependencyAgeArgument), 1);
  assertEquals(configureLocalWorkersBlock(configured, sourceRoot), configured);
});

Deno.test('local workers rewrite keeps legacy JSR launch fixtures on the declared local alias', () => {
  const configured = configureLocalWorkersBlock(
    `['run', '--config', 'deno.json', 'jsr:@netscript/plugin-workers@0.0.8/services']`,
    '/workspace',
  );
  assertStringIncludes(configured, "'--config', '.netscript-flow-b-deno.json'");
  assertStringIncludes(configured, "'@netscript/plugin-workers/services'");
  assertEquals(configured.includes('jsr:'), false);
});

Deno.test('local workers rewrite resolves a Windows source root before checking its escaped entrypoint', () => {
  const sourceRoot = 'C:\\workspace';
  const entrypoint = resolveWindows(sourceRoot, workersServiceSource);
  const configured = configureLocalWorkersBlock(
    `["run", "--config", "deno.json", ${JSON.stringify(entrypoint)}]`,
    sourceRoot,
    resolveWindows,
  );
  assertStringIncludes(configured, JSON.stringify(entrypoint));
  assertStringIncludes(configured, "'.netscript-flow-b-deno.json'");
});

Deno.test('local workers rewrite rejects missing config or a different service source', () => {
  const entrypoint = '/workspace/plugins/workers/services/src/main.ts';
  assertThrows(
    () => configureLocalWorkersBlock(`['run', '${entrypoint}']`, '/workspace'),
    Error,
    'expected Deno config argument',
  );
  assertThrows(
    () =>
      configureLocalWorkersBlock(
        "['run', '--config', 'deno.json', '/other/plugins/workers/services/src/main.ts']",
        '/workspace',
      ),
    Error,
    'expected service entrypoint',
  );
});

function countOccurrences(value: string, search: string): number {
  return value.split(search).length - 1;
}
