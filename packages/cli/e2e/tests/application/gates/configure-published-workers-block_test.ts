import { assertEquals, assertStringIncludes } from '@std/assert';

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

function countOccurrences(value: string, search: string): number {
  return value.split(search).length - 1;
}
