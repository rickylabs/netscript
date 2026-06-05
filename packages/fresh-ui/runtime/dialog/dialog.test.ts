import { assertEquals } from '@std/assert';
import { getDialogDataState } from './use-dialog.ts';

Deno.test('getDialogDataState returns open when the dialog is open', () => {
  assertEquals(getDialogDataState(true), 'open', 'Dialog data-state should reflect an open dialog');
});

Deno.test('getDialogDataState returns closed when the dialog is closed', () => {
  assertEquals(
    getDialogDataState(false),
    'closed',
    'Dialog data-state should reflect a closed dialog',
  );
});
