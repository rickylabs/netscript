import { assertThrows } from '@std/assert';
import { assertReadyCapabilities } from '../../../src/application/gates/scaffold/probe-app-home.ts';

Deno.test('overview runtime assertion requires both real capability panels to be ready', () => {
  const panel = (id: string, state: string) =>
    `<div data-capability="${id}" data-capability-state="${state}">Connected</div>`;
  assertReadyCapabilities(panel('workers', 'ready') + panel('streams', 'ready'), [
    'workers',
    'streams',
  ]);
  for (const state of ['installed-unwired', 'unavailable', 'empty', 'absent']) {
    assertThrows(() =>
      assertReadyCapabilities(panel('workers', state) + panel('streams', 'ready'), [
        'workers',
        'streams',
      ])
    );
    assertThrows(() =>
      assertReadyCapabilities(panel('workers', 'ready') + panel('streams', state), [
        'workers',
        'streams',
      ])
    );
  }
  assertThrows(() =>
    assertReadyCapabilities(
      '<div data-capability="workers"></div><div data-capability-state="ready"></div>',
      ['workers'],
    )
  );
});
