import { assertEquals, assertThrows } from '@std/assert';
import { defineCliE2eSuite } from '../../../src/application/builders/define-cli-e2e-suite.ts';
import { GATE, SCAFFOLD } from '../../../src/domain/cli-surface.ts';

function buildSuite() {
  return defineCliE2eSuite()
    .withWorkspace((workspace) => workspace.withRepoRoot('.').withProjectName('suite-builder-test'))
    .withScaffold((scaffold) => scaffold.withOfficialPluginSuite());
}

Deno.test('defineCliE2eSuite materializes scaffold.plugins with gates', () => {
  const suite = buildSuite().withReporting((reporting) => reporting.withPretty()).build();
  assertEquals(suite.id, SCAFFOLD.PLUGIN);
  assertEquals(suite.defaultOptions.projectName, 'suite-builder-test');
  assertEquals(suite.defaultOptions.format, 'pretty');
  assertEquals(suite.gates.some((gate) => gate.id === GATE.RUNTIME_ASPIRE_START), true);
});

Deno.test('defineCliE2eSuite rejects suites without gates', () => {
  assertThrows(() => defineCliE2eSuite().build(), Error, 'must define at least one gate');
});

Deno.test('defineCliE2eSuite rejects an empty suite id', () => {
  assertThrows(
    () => {
      // @ts-expect-error exercise runtime validation for an invalid JS caller input.
      return buildSuite().withId('').build();
    },
    Error,
    'Suite id is required',
  );
});
