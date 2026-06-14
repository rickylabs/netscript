import type { JSX } from 'preact';
import { useSignal } from '@preact/signals';
import { useCallback, useEffect, useId, useRef } from 'preact/hooks';
import { composeEventHandlers } from '../_internal/compose-event-handlers.ts';
import { composeRefs } from '../_internal/compose-refs.ts';
import {
  getPlatformAnchorName,
  getPositionArea,
  isPopoverOpen,
  mergePlatformStyle,
  useSyncedPopover,
} from '../_internal/platform-popover.ts';
import { useDismissableLayer } from '../_internal/use-dismissable-layer.ts';
import type {
  PopoverAnchorElementProps,
  PopoverArrowElementProps,
  PopoverArrowTipElementProps,
  PopoverCloseElementProps,
  PopoverContentElementProps,
  PopoverDescriptionElementProps,
  PopoverOpenChangeReason,
  PopoverPositionerElementProps,
  PopoverTitleElementProps,
  PopoverTriggerElementProps,
  UsePopoverOptions,
  UsePopoverReturn,
} from './popover.types.ts';

export function getPopoverDataState(open: boolean): 'open' | 'closed' {
  return open ? 'open' : 'closed';
}

export function usePopover({
  closeOnEscape = true,
  closeOnInteractOutside = true,
  defaultOpen = false,
  id,
  modal = false,
  onOpenChange,
  open: controlledOpen,
  placement = 'bottom',
}: UsePopoverOptions = {}): UsePopoverReturn {
  const generatedId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const uncontrolledOpen = useSignal(defaultOpen);
  const open = controlledOpen === undefined ? uncontrolledOpen.value : controlledOpen;
  const contentId = id ?? `ns-popover-${generatedId}`;
  const anchorName = getPlatformAnchorName('popover', contentId);
  const titleId = `${contentId}-title`;
  const descriptionId = `${contentId}-description`;
  const dataState = getPopoverDataState(open);

  const setOpen = useCallback(
    (nextOpen: boolean, reason: PopoverOpenChangeReason = 'programmatic') => {
      if (controlledOpen === undefined) {
        uncontrolledOpen.value = nextOpen;
      }

      onOpenChange?.(nextOpen, { reason });
    },
    [controlledOpen, onOpenChange, uncontrolledOpen],
  );

  const getElements = useCallback(() => [triggerRef.current, contentRef.current], []);

  useDismissableLayer({
    closeOnEscape,
    closeOnInteractOutside,
    enabled: open,
    getElements,
    onDismiss: (reason) => setOpen(false, reason),
  });
  useSyncedPopover(contentRef, open);

  useEffect(() => {
    if (!open) {
      return;
    }

    contentRef.current?.focus();
  }, [open]);

  const getTriggerProps = useCallback(
    (props: JSX.ButtonHTMLAttributes<HTMLButtonElement> = {}): PopoverTriggerElementProps =>
      ({
        ...props,
        'aria-controls': contentId,
        'aria-expanded': open,
        'aria-haspopup': 'dialog',
        'data-expanded': open ? 'true' : 'false',
        'data-part': 'trigger',
        'data-placement': placement,
        'data-scope': 'popover',
        'data-state': dataState,
        popovertarget: contentId,
        popovertargetaction: 'toggle',
        onClick: composeEventHandlers(props.onClick, () => setOpen(!open, 'trigger')),
        ref: composeRefs(props.ref, triggerRef),
        style: mergePlatformStyle(props.style, {
          '--ns-floating-anchor-name': anchorName,
          'anchor-name': 'var(--ns-floating-anchor-name)',
        }),
        type: props.type ?? 'button',
      }) as PopoverTriggerElementProps,
    [anchorName, contentId, dataState, open, placement, setOpen],
  );

  const getAnchorProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLDivElement> = {}): PopoverAnchorElementProps =>
      ({
        ...props,
        'data-part': 'anchor',
        'data-placement': placement,
        'data-scope': 'popover',
        'data-state': dataState,
        style: mergePlatformStyle(props.style, {
          '--ns-floating-anchor-name': anchorName,
          'anchor-name': 'var(--ns-floating-anchor-name)',
        }),
      }) as PopoverAnchorElementProps,
    [anchorName, dataState, placement],
  );

  const getPositionerProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLDivElement> = {}): PopoverPositionerElementProps => ({
      ...props,
      'data-part': 'positioner',
      'data-placement': placement,
      'data-scope': 'popover',
      'data-state': dataState,
      style: mergePlatformStyle(props.style, {
        '--ns-floating-anchor-name': anchorName,
        '--ns-floating-position-area': getPositionArea(placement),
      }),
    }),
    [anchorName, dataState, placement],
  );

  const getContentProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLDivElement> = {}): PopoverContentElementProps =>
      ({
        ...props,
        'aria-describedby': props['aria-describedby'] ?? descriptionId,
        'aria-labelledby': props['aria-labelledby'] ?? titleId,
        'aria-modal': modal ? 'true' : undefined,
        'data-expanded': open ? 'true' : 'false',
        'data-part': 'content',
        'data-placement': placement,
        'data-scope': 'popover',
        'data-state': dataState,
        id: props.id ?? contentId,
        onToggle: composeEventHandlers(props.onToggle, () => {
          const nextOpen = isPopoverOpen(contentRef.current);
          if (nextOpen !== open) {
            setOpen(nextOpen, 'programmatic');
          }
        }),
        popover: 'auto',
        ref: composeRefs(props.ref, contentRef),
        role: props.role ?? 'dialog',
        style: mergePlatformStyle(props.style, {
          '--ns-floating-anchor-name': anchorName,
          '--ns-floating-position-area': getPositionArea(placement),
          'position-anchor': 'var(--ns-floating-anchor-name)',
          'position-area': 'var(--ns-floating-position-area)',
        }),
        tabIndex: props.tabIndex ?? -1,
      }) as PopoverContentElementProps,
    [anchorName, contentId, dataState, descriptionId, modal, open, placement, setOpen, titleId],
  );

  const getTitleProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLHeadingElement> = {}): PopoverTitleElementProps => ({
      ...props,
      'data-part': 'title',
      'data-scope': 'popover',
      id: props.id ?? titleId,
    }),
    [titleId],
  );

  const getDescriptionProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLParagraphElement> = {}): PopoverDescriptionElementProps => ({
      ...props,
      'data-part': 'description',
      'data-scope': 'popover',
      id: props.id ?? descriptionId,
    }),
    [descriptionId],
  );

  const getCloseProps = useCallback(
    (props: JSX.ButtonHTMLAttributes<HTMLButtonElement> = {}): PopoverCloseElementProps => ({
      ...props,
      'data-part': 'close',
      'data-scope': 'popover',
      onClick: composeEventHandlers(props.onClick, () => setOpen(false, 'close-button')),
      type: props.type ?? 'button',
    }),
    [setOpen],
  );

  const getArrowProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLDivElement> = {}): PopoverArrowElementProps => ({
      ...props,
      'data-part': 'arrow',
      'data-placement': placement,
      'data-scope': 'popover',
      'data-state': dataState,
    }),
    [dataState, placement],
  );

  const getArrowTipProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLDivElement> = {}): PopoverArrowTipElementProps => ({
      ...props,
      'data-part': 'arrow-tip',
      'data-placement': placement,
      'data-scope': 'popover',
      'data-state': dataState,
    }),
    [dataState, placement],
  );

  return {
    getAnchorProps,
    getArrowProps,
    getArrowTipProps,
    getCloseProps,
    getContentProps,
    getDescriptionProps,
    getPositionerProps,
    getTitleProps,
    getTriggerProps,
    ids: {
      content: contentId,
      description: descriptionId,
      title: titleId,
    },
    modal,
    open,
    placement,
    setOpen,
  };
}
