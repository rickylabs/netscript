import { assertEquals } from '@std/assert';
import {
  getNativeDialogOpenAttribute,
  isNativeDialogClosed,
  type NativeDialogElement,
  syncNativeDialog,
} from '../../../src/runtime/_internal/native-dialog.ts';

type DialogCall = 'close' | 'show' | 'showModal';

/** Models the `HTMLDialogElement` open/modal state machine, including its InvalidStateError. */
class FakeDialog implements NativeDialogElement {
  calls: DialogCall[] = [];
  modal: boolean;
  open: boolean;

  constructor(state: { open?: boolean; modal?: boolean } = {}) {
    this.open = state.open ?? false;
    this.modal = state.modal ?? false;
  }

  close(): void {
    this.calls.push('close');
    this.open = false;
    this.modal = false;
  }

  matches(selector: string): boolean {
    return selector === ':modal' && this.modal;
  }

  show(): void {
    this.calls.push('show');
    if (this.open && this.modal) {
      throw new DOMException('modal dialog is open', 'InvalidStateError');
    }
    this.open = true;
  }

  showModal(): void {
    this.calls.push('showModal');
    if (this.open) {
      throw new DOMException('dialog is already open', 'InvalidStateError');
    }
    this.open = true;
    this.modal = true;
  }
}

Deno.test('getNativeDialogOpenAttribute omits open for modal dialogs so showModal() owns them', () => {
  assertEquals(getNativeDialogOpenAttribute(true, true), undefined);
  assertEquals(getNativeDialogOpenAttribute(false, true), undefined);
});

Deno.test('getNativeDialogOpenAttribute renders open for an open non-modal dialog', () => {
  assertEquals(getNativeDialogOpenAttribute(true, false), true);
  assertEquals(getNativeDialogOpenAttribute(false, false), undefined);
});

Deno.test('syncNativeDialog opens a closed modal dialog with showModal()', () => {
  const dialog = new FakeDialog();
  syncNativeDialog(dialog, true, true);
  assertEquals(dialog.calls, ['showModal']);
  assertEquals(dialog.modal, true);
});

Deno.test('syncNativeDialog repairs a non-modally open dialog into the top layer', () => {
  const dialog = new FakeDialog({ open: true });
  syncNativeDialog(dialog, true, true);
  assertEquals(dialog.calls, ['close', 'showModal']);
  assertEquals(dialog.modal, true);
});

Deno.test('syncNativeDialog leaves an already modal dialog untouched', () => {
  const dialog = new FakeDialog({ open: true, modal: true });
  syncNativeDialog(dialog, true, true);
  assertEquals(dialog.calls, []);
});

Deno.test('syncNativeDialog falls back to show() when showModal() is rejected', () => {
  const dialog = new FakeDialog();
  dialog.showModal = () => {
    dialog.calls.push('showModal');
    throw new DOMException('not connected', 'InvalidStateError');
  };
  syncNativeDialog(dialog, true, true);
  assertEquals(dialog.calls, ['showModal', 'show']);
  assertEquals(dialog.open, true);
});

Deno.test('syncNativeDialog opens a non-modal dialog with show()', () => {
  const dialog = new FakeDialog();
  syncNativeDialog(dialog, true, false);
  assertEquals(dialog.calls, ['show']);
  assertEquals(dialog.modal, false);
});

Deno.test('syncNativeDialog keeps a server-rendered non-modal dialog open without errors', () => {
  const dialog = new FakeDialog({ open: true });
  syncNativeDialog(dialog, true, false);
  assertEquals(dialog.calls, []);
  assertEquals(dialog.open, true);
});

Deno.test('syncNativeDialog reopens a modal dialog non-modally when modal is turned off', () => {
  const dialog = new FakeDialog({ open: true, modal: true });
  syncNativeDialog(dialog, true, false);
  assertEquals(dialog.calls, ['close', 'show']);
  assertEquals(dialog.modal, false);
});

Deno.test('syncNativeDialog closes an open dialog with close()', () => {
  for (const modal of [true, false]) {
    const dialog = new FakeDialog({ open: true, modal });
    syncNativeDialog(dialog, false, modal);
    assertEquals(dialog.calls, ['close']);
    assertEquals(dialog.open, false);
  }
});

Deno.test('syncNativeDialog does not close an already closed dialog', () => {
  const dialog = new FakeDialog();
  syncNativeDialog(dialog, false, true);
  assertEquals(dialog.calls, []);
});

Deno.test('isNativeDialogClosed ignores the queued close event of a repaired dialog', () => {
  assertEquals(isNativeDialogClosed({ open: true }), false);
  assertEquals(isNativeDialogClosed({ open: false }), true);
});
