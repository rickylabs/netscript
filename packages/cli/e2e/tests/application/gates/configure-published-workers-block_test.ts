import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';

import { configurePublishedWorkersBlock } from '../../../src/application/gates/scaffold/configure-published-workers-block.ts';

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

function countOccurrences(value: string, search: string): number {
  return value.split(search).length - 1;
}
