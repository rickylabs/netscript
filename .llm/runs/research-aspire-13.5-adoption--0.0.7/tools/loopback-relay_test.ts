import { assertEquals } from '@std/assert';
import { shouldRelayContainer } from './loopback-relay-logic.ts';

const SINCE = new Date('2026-08-30T20:00:00Z');
const FRESH_CREATED = '2026-08-30T20:05:00.000000000Z';
const STALE_CREATED = '2026-08-30T19:55:00.000000000Z';

Deno.test('shouldRelayContainer: fresh, unpaused container is relayed', () => {
  assertEquals(shouldRelayContainer(FRESH_CREATED, false, SINCE), true);
});

Deno.test('shouldRelayContainer: fresh, paused container is treated as vanished (D-100)', () => {
  assertEquals(shouldRelayContainer(FRESH_CREATED, true, SINCE), false);
});

Deno.test('shouldRelayContainer: fresh container re-arms once unpaused', () => {
  assertEquals(shouldRelayContainer(FRESH_CREATED, true, SINCE), false);
  assertEquals(shouldRelayContainer(FRESH_CREATED, false, SINCE), true);
});

Deno.test('shouldRelayContainer: container created before --since is never relayed, paused or not', () => {
  assertEquals(shouldRelayContainer(STALE_CREATED, false, SINCE), false);
  assertEquals(shouldRelayContainer(STALE_CREATED, true, SINCE), false);
});

Deno.test('shouldRelayContainer: unparseable Created fails closed', () => {
  assertEquals(shouldRelayContainer('not-a-date', false, SINCE), false);
  assertEquals(shouldRelayContainer('', false, SINCE), false);
});
