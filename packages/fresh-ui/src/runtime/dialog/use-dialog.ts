import type { JSX } from 'preact';
import { useSignal } from '@preact/signals';
import { useCallback, useEffect, useId, useRef } from 'preact/hooks';
import { composeEventHandlers } from '../_internal/compose-event-handlers.ts';
import { composeRefs } from '../_internal/compose-refs.ts';
import type {
  DialogCloseElementProps,
  DialogContentElementProps,
  DialogDescriptionElementProps,
  DialogOpenChangeReason,
  DialogTitleElementProps,
  DialogTriggerElementProps,
  UseDialogOptions,
  UseDialogReturn,
} from './dialog.types.ts';

export function getDialogDataState(open: boolean): 'open' | 'closed' {
  return open ? 'open' : 'closed';
}

export function useDialog({
  closeOnEscape = true,
  closeOnInteractOutside = true,
  defaultOpen = false,
  id,
  modal = true,
  onOpenChange,
  open: controlledOpen,
}: UseDialogOptions = {}): UseDialogReturn {
  const generatedId = useId();
  const contentRef = useRef<HTMLDialogElement | null>(null);
  const uncontrolledOpen = useSignal(defaultOpen);
  const open = controlledOpen === undefined ? uncontrolledOpen.value : controlledOpen;
  const contentId = id ?? `ns-dialog-${generatedId}`;
  const titleId = `${contentId}-title`;
  const descriptionId = `${contentId}-description`;
  const dataState = getDialogDataState(open);

  const setOpen = useCallback(
    (nextOpen: boolean, reason: DialogOpenChangeReason = 'programmatic') => {
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
    (props: JSX.ButtonHTMLAttributes<HTMLButtonElement> = {}): DialogTriggerElementProps => ({
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
    (props: JSX.HTMLAttributes<HTMLDialogElement> = {}): DialogContentElementProps => ({
      ...props,
      'aria-describedby': props['aria-describedby'] ?? descriptionId,
      'aria-labelledby': props['aria-labelledby'] ?? titleId,
      'aria-modal': modal ? 'true' : undefined,
      'data-part': 'content',
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
    [
      closeOnEscape,
      closeOnInteractOutside,
      contentId,
      dataState,
      descriptionId,
      modal,
      open,
      setOpen,
      titleId,
    ],
  );

  const getTitleProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLHeadingElement> = {}): DialogTitleElementProps => ({
      ...props,
      'data-part': 'title',
      id: props.id ?? titleId,
    }),
    [titleId],
  );

  const getDescriptionProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLParagraphElement> = {}): DialogDescriptionElementProps => ({
      ...props,
      'data-part': 'description',
      id: props.id ?? descriptionId,
    }),
    [descriptionId],
  );

  const getCloseProps = useCallback(
    (props: JSX.ButtonHTMLAttributes<HTMLButtonElement> = {}): DialogCloseElementProps => ({
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
  };
}
