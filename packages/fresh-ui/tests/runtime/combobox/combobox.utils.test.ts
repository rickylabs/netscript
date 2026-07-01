import { assertEquals } from '@std/assert';
import {
  getComboboxDataState,
  getNextComboboxIndex,
} from '../../../src/runtime/combobox/combobox.utils.ts';

Deno.test('getComboboxDataState reflects open/closed', () => {
  assertEquals(getComboboxDataState(true), 'open');
  assertEquals(getComboboxDataState(false), 'closed');
});

Deno.test('getNextComboboxIndex returns -1 for an empty list', () => {
  assertEquals(getNextComboboxIndex(1, -1, 0, true), -1);
});

Deno.test('getNextComboboxIndex jumps to first/last', () => {
  assertEquals(getNextComboboxIndex('first', 3, 5, true), 0);
  assertEquals(getNextComboboxIndex('last', 1, 5, true), 4);
});

Deno.test('getNextComboboxIndex enters from the matching end with no current highlight', () => {
  assertEquals(getNextComboboxIndex(1, -1, 3, true), 0);
  assertEquals(getNextComboboxIndex(-1, -1, 3, true), 2);
});

Deno.test('getNextComboboxIndex steps and wraps when loop is on', () => {
  assertEquals(getNextComboboxIndex(1, 1, 3, true), 2);
  assertEquals(getNextComboboxIndex(1, 2, 3, true), 0, 'wraps past the end');
  assertEquals(getNextComboboxIndex(-1, 0, 3, true), 2, 'wraps past the start');
});

Deno.test('getNextComboboxIndex clamps when loop is off', () => {
  assertEquals(getNextComboboxIndex(1, 2, 3, false), 2, 'clamped at the end');
  assertEquals(getNextComboboxIndex(-1, 0, 3, false), 0, 'clamped at the start');
});
