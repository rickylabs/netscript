import { useCallback, useLayoutEffect, useRef, useState } from 'preact/hooks';

/** The slice of `HTMLDialogElement` the open-state synchronizer drives. */
export interface NativeDialogElement {
  readonly open: boolean;
  close(): void;
  matches(selectors: string): boolean;
  show(): void;
  showModal(): void;
}

/**
 * The `open` attribute to render for a native dialog.
 *
 * A modal dialog must not carry `open` from render: `showModal()` is the only
 * way into the top layer, and the attribute would make the element look
 * already open to the synchronizer. Non-modal dialogs keep the attribute so
 * server-rendered markup is visible before hydration.
 */
export function getNativeDialogOpenAttribute(open: boolean, modal: boolean): true | undefined {
  return open && !modal ? true : undefined;
}

function isModalOpen(element: NativeDialogElement): boolean {
  try {
    return element.matches(':modal');
  } catch {
    return false;
  }
}

function showModal(element: NativeDialogElement): void {
  if (element.open && isModalOpen(element)) {
    return;
  }

  // Repair an element opened non-modally (stale markup or a modal toggle):
  // `showModal()` throws on an already-open dialog.
  if (element.open) {
    element.close();
  }

  try {
    element.showModal();
  } catch {
    // A disconnected dialog cannot enter the top layer; keep it visible.
    if (!element.open) {
      element.show();
    }
  }
}

function show(element: NativeDialogElement): void {
  if (element.open && isModalOpen(element)) {
    element.close();
  }

  if (!element.open) {
    element.show();
  }
}

/** Drive a native `<dialog>` to the requested open/modal state through its own methods. */
export function syncNativeDialog(
  element: NativeDialogElement,
  open: boolean,
  modal: boolean,
): void {
  if (!open) {
    if (element.open) {
      element.close();
    }
    return;
  }

  if (modal) {
    showModal(element);
    return;
  }

  show(element);
}

/**
 * Keep a native `<dialog>` in sync with hook state; returns the ref callback for the element.
 *
 * Synchronizes when `open`/`modal` change and whenever a new element attaches, so
 * content mounted (or remounted) under an already-open root still enters the top
 * layer. Runs as a layout effect, and an attachment re-render is microtask-scheduled,
 * so a modal dialog holds focus in the top layer before the browser paints.
 */
export function useNativeDialogSync(
  open: boolean,
  modal: boolean,
): (element: NativeDialogElement | null) => void {
  const elementRef = useRef<NativeDialogElement | null>(null);
  // Only the identity of the last attached element matters: it re-runs the effect.
  const [attached, setAttached] = useState<NativeDialogElement | null>(null);

  const attach = useCallback((element: NativeDialogElement | null) => {
    elementRef.current = element;

    if (element) {
      setAttached(element);
    }
  }, []);

  useLayoutEffect(() => {
    const element = elementRef.current;

    if (element) {
      syncNativeDialog(element, open, modal);
    }
  }, [attached, modal, open]);

  return attach;
}

/**
 * Whether a native `close` event still describes the element.
 *
 * `close()` queues its event, so a dialog that was closed and reopened in the
 * same task (the modal repair above) reports a stale close once it is open again.
 */
export function isNativeDialogClosed(element: Pick<HTMLDialogElement, 'open'>): boolean {
  return !element.open;
}
