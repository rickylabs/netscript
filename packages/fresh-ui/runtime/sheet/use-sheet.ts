import type { JSX } from 'preact';
import { useSignal } from '@preact/signals';
import { useCallback, useEffect, useId, useRef } from 'preact/hooks';
import { composeEventHandlers } from '../_internal/compose-event-handlers.ts';
import { composeRefs } from '../_internal/compose-refs.ts';
import type {
  SheetCloseElementProps,
  SheetContentElementProps,
  SheetDescriptionElementProps,
  SheetOpenChangeReason,
  SheetSide,
  SheetTitleElementProps,
  SheetTriggerElementProps,
  UseSheetOptions,
  UseSheetReturn,
} from './sheet.types.ts';

export function getSheetDataState(open: boolean): 'open' | 'closed' {
  return open ? 'open' : 'closed';
}

/**
 * Headless Sheet hook — manages open/close state and accessibility for a
 * side-docked panel.  Extends the Dialog pattern with a `side` attribute
 * so CSS can position content as a right panel (desktop) or bottom sheet
 * (mobile).
 */
export function useSheet({
  side = 'right',
  closeOnEscape = true,
  closeOnInteractOutside = true,
  defaultOpen = false,
  id,
  modal = true,
  onOpenChange,
  open: controlledOpen,
}: UseSheetOptions = {}): UseSheetReturn {
  const generatedId = useId();
  const contentRef = useRef<HTMLDialogElement | null>(null);
  const uncontrolledOpen = useSignal(defaultOpen);
  const open = controlledOpen === undefined ? uncontrolledOpen.value : controlledOpen;
  const contentId = id ?? `ns-sheet-${generatedId}`;
  const titleId = `${contentId}-title`;
  const descriptionId = `${contentId}-description`;
  const dataState = getSheetDataState(open);

  const setOpen = useCallback(
    (nextOpen: boolean, reason: SheetOpenChangeReason = 'programmatic') => {
      if (controlledOpen === undefined) {
        uncontrolledOpen.value = nextOpen;
      }

      onOpenChange?.(nextOpen, { reason });
    },
    [controlledOpen, onOpenChange, uncontrolledOpen],
  );

  useEffect(() => {
    const element = contentRef.current;

    if (!element) {
      return;
    }

    if (open) {
      if (modal && typeof element.showModal === 'function') {
        if (!element.open) {
          try {
            element.showModal();
          } catch {
            if (typeof element.show === 'function' && !element.open) {
              element.show();
            }
          }
        }

        return;
      }

      if (typeof element.show === 'function' && !element.open) {
        element.show();
      }

      return;
    }

    if (element.open) {
      element.close();
    }
  }, [modal, open]);

  const getTriggerProps = useCallback(
    (props: JSX.ButtonHTMLAttributes<HTMLButtonElement> = {}): SheetTriggerElementProps => ({
      ...props,
      'aria-controls': contentId,
      'aria-expanded': open,
      'data-part': 'trigger',
      'data-state': dataState,
      onClick: composeEventHandlers(props.onClick, () => setOpen(true, 'trigger')),
      type: props.type ?? 'button',
    }),
    [contentId, dataState, open, setOpen],
  );

  const getContentProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLDialogElement> = {}): SheetContentElementProps => ({
      ...props,
      'aria-describedby': props['aria-describedby'] ?? descriptionId,
      'aria-labelledby': props['aria-labelledby'] ?? titleId,
      'aria-modal': modal ? 'true' : undefined,
      'data-part': 'content',
      'data-side': side,
      'data-state': dataState,
      id: props.id ?? contentId,
      onCancel: composeEventHandlers(
        props.onCancel,
        (event: JSX.TargetedEvent<HTMLDialogElement, Event>) => {
          if (!closeOnEscape) {
            event.preventDefault();
            return;
          }

          setOpen(false, 'escape-key');
        },
      ),
      onClick: composeEventHandlers(
        props.onClick,
        (event: JSX.TargetedMouseEvent<HTMLDialogElement>) => {
          if (!closeOnInteractOutside) {
            return;
          }

          if (event.target === event.currentTarget) {
            setOpen(false, 'interact-outside');
          }
        },
      ),
      onClose: composeEventHandlers(props.onClose, () => setOpen(false, 'native-close')),
      open: open ? true : undefined,
      ref: composeRefs(props.ref, contentRef),
      role: props.role ?? 'dialog',
    }),
    [closeOnEscape, closeOnInteractOutside, contentId, dataState, descriptionId, modal, open, setOpen, side, titleId],
  );

  const getTitleProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLHeadingElement> = {}): SheetTitleElementProps => ({
      ...props,
      'data-part': 'title',
      id: props.id ?? titleId,
    }),
    [titleId],
  );

  const getDescriptionProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLParagraphElement> = {}): SheetDescriptionElementProps => ({
      ...props,
      'data-part': 'description',
      id: props.id ?? descriptionId,
    }),
    [descriptionId],
  );

  const getCloseProps = useCallback(
    (props: JSX.ButtonHTMLAttributes<HTMLButtonElement> = {}): SheetCloseElementProps => ({
      ...props,
      'data-part': 'close',
      onClick: composeEventHandlers(props.onClick, () => setOpen(false, 'close-button')),
      type: props.type ?? 'button',
    }),
    [setOpen],
  );

  return {
    getCloseProps,
    getContentProps,
    getDescriptionProps,
    getTitleProps,
    getTriggerProps,
    ids: {
      content: contentId,
      description: descriptionId,
      title: titleId,
    },
    modal,
    open,
    setOpen,
    side,
  };
}
