import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import {
  generateChildHealthPage,
  readChildHealthDocumentation,
  renderChildHealthPage,
} from './generate-child-health-docs.ts';

Deno.test('child vocabulary page matches the exported type and operational JSDoc', async () => {
  const documentation = await readChildHealthDocumentation();
  const page = await generateChildHealthPage();
  assertEquals(
    await Deno.readTextFile('docs/site/orchestration-runtime/child-health.md'),
    page,
  );
  for (const state of documentation.states) assertStringIncludes(page, `- \`${state}\`:`);
  for (const field of ['registryReady', 'dependencyReady', 'restartCount', 'lastFatalError']) {
    assertStringIncludes(page, field);
  }
  assertStringIncludes(page, '3 restarts within 60 seconds');
});

Deno.test('vocabulary generation rejects an undocumented new state or missing public symbol', async () => {
  const documentation = await readChildHealthDocumentation();
  assertThrows(
    () =>
      renderChildHealthPage({ ...documentation, states: [...documentation.states, 'new-state'] }),
    Error,
    'descriptions must match every exported union member',
  );
  assertThrows(
    () =>
      renderChildHealthPage({
        ...documentation,
        entries: documentation.entries.filter((entry) => entry.symbol !== 'ChildHealthSnapshot'),
      }),
    Error,
    'Missing child health documentation',
  );
});
