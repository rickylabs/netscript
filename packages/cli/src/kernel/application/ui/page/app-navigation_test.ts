import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { DenoProcess } from '../../../adapters/runtime/process/deno-process.ts';
import { DenoGeneratedSourceFormatter } from '../../../adapters/runtime/process/deno-generated-source-formatter.ts';
import { readTemplateAsset } from '../../../adapters/templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../../assets/manifest.ts';
import {
  addNavigationEntry,
  navigationLabel,
  removeNavigationEntry,
  renderNavigationEntry,
} from './app-navigation.ts';

const NAVIGATION_SOURCE = await readTemplateAsset(TEMPLATE_KEYS.appNavigation);

Deno.test('navigationLabel title-cases page path segments', () => {
  assertEquals(navigationLabel('notes'), 'Notes');
  assertEquals(navigationLabel('data-screen'), 'Data Screen');
  assertEquals(navigationLabel('team_members'), 'Team Members');
  assertEquals(navigationLabel('_'), '_');
});

Deno.test('add then remove restores the scaffold navigation byte for byte', () => {
  const linked = addNavigationEntry(NAVIGATION_SOURCE, 'notes', 'Notes');
  assert(linked);
  assertStringIncludes(
    linked,
    "{ href: appRoutes['notes'].href(), label: 'Notes', match: 'prefix' }",
  );
  // The other exports (chromelessRoutePrefixes, helpers) are untouched by the insertion.
  assertEquals(
    linked.replace(renderNavigationEntry('notes', 'Notes') + '\n', ''),
    NAVIGATION_SOURCE,
  );
  assertEquals(removeNavigationEntry(linked, 'notes'), NAVIGATION_SOURCE);
});

Deno.test('existing links are recognized in either property or index form', () => {
  const linked = addNavigationEntry(NAVIGATION_SOURCE, 'notes', 'Notes')!;
  assertEquals(addNavigationEntry(linked, 'notes', 'Other label'), linked);
  // `home` is already linked as `appRoutes.home`, so a page registered under that id is not doubled.
  assertEquals(addNavigationEntry(NAVIGATION_SOURCE, 'home', 'Home'), NAVIGATION_SOURCE);
});

Deno.test('remove only touches the named route, including a hand-edited label', () => {
  const linked = addNavigationEntry(
    addNavigationEntry(NAVIGATION_SOURCE, 'notes', 'Notes')!,
    'notes.archive',
    'Archive',
  )!;
  const edited = linked.replace("label: 'Notes'", "label: 'My notes'");
  const removed = removeNavigationEntry(edited, 'notes');
  assert(!removed.includes("appRoutes['notes'].href()"));
  assertStringIncludes(removed, "appRoutes['notes.archive'].href()");
  assertEquals(removeNavigationEntry(NAVIGATION_SOURCE, 'missing'), NAVIGATION_SOURCE);
});

Deno.test('unrecognizable declarations are reported instead of guessed', () => {
  assertEquals(addNavigationEntry('export const links = [\n];\n', 'notes', 'Notes'), undefined);
  // A one-line array must not borrow a later declaration's closing bracket.
  const oneLine = 'export const appNavigation = [];\nexport const other = [\n  1,\n];\n';
  assertEquals(addNavigationEntry(oneLine, 'notes', 'Notes'), undefined);
});

Deno.test('short and wrapped entries are both deno fmt canonical in the scaffold module', async () => {
  const formatter = new DenoGeneratedSourceFormatter(new DenoProcess());
  const longLabel = 'Quarterly operational readiness review for every regional fulfilment team';
  for (const [routeId, label] of [['notes', 'Notes'], ['reports.quarterly', longLabel]]) {
    const linked = addNavigationEntry(NAVIGATION_SOURCE, routeId, label)!;
    assertEquals(await formatter.formatContent('/app/navigation.ts', linked), linked);
  }
  assertStringIncludes(renderNavigationEntry('reports.quarterly', longLabel), '  {\n    href:');
});
