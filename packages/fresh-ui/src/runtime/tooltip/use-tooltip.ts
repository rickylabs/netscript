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
  TooltipArrowElementProps,
  TooltipArrowTipElementProps,
  TooltipContentElementProps,
  TooltipOpenChangeReason,
  TooltipPositionerElementProps,
  TooltipTriggerElementProps,
  UseTooltipOptions,
  UseTooltipReturn,
} from './tooltip.types.ts';

export function getTooltipDataState(open: boolean): 'open' | 'closed' {
  return open ? 'open' : 'closed';
}

export function useTooltip({
  closeDelay = 0,
  defaultOpen = false,
  disabled = false,
  id,
  interactive = false,
  onOpenChange,
  open: controlledOpen,
  openDelay = 0,
  placement = 'top',
}: UseTooltipOptions = {}): UseTooltipReturn {
  const generatedId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const openTimerRef = useRef<number | undefined>(undefined);
  const closeTimerRef = useRef<number | undefined>(undefined);
  const uncontrolledOpen = useSignal(defaultOpen);
  const open = controlledOpen === undefined ? uncontrolledOpen.value : controlledOpen;
  const contentId = id ?? `ns-tooltip-${generatedId}`;
  const anchorName = getPlatformAnchorName('tooltip', contentId);
  const dataState = getTooltipDataState(open);

  const clearTimers = useCallback(() => {
    if (openTimerRef.current !== undefined) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = undefined;
    }

    if (closeTimerRef.current !== undefined) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = undefined;
    }
  }, []);

  const setOpen = useCallback(
    (nextOpen: boolean, reason: TooltipOpenChangeReason = 'programmatic') => {
      if (disabled && nextOpen) {
        return;
      }

      if (controlledOpen === undefined) {
        uncontrolledOpen.value = nextOpen;
      }

      onOpenChange?.(nextOpen, { reason });
    },
    [controlledOpen, disabled, onOpenChange, uncontrolledOpen],
  );

  const scheduleOpen = useCallback(
    (reason: TooltipOpenChangeReason) => {
      clearTimers();

      openTimerRef.current = globalThis.setTimeout(() => {
        setOpen(true, reason);
      }, openDelay);
    },
    [clearTimers, openDelay, setOpen],
  );

  const scheduleClose = useCallback(
    (reason: TooltipOpenChangeReason) => {
      clearTimers();

      closeTimerRef.current = globalThis.setTimeout(() => {
        setOpen(false, reason);
      }, closeDelay);
    },
    [clearTimers, closeDelay, setOpen],
  );

  const getElements = useCallback(() => [triggerRef.current, contentRef.current], []);

  useDismissableLayer({
    closeOnEscape: true,
    closeOnInteractOutside: true,
    enabled: open,
    getElements,
    onDismiss: (reason) => setOpen(false, reason),
  });
  useSyncedPopover(contentRef, open);

  useEffect(() => clearTimers, [clearTimers]);

  const getTriggerProps = useCallback(
    (props: JSX.ButtonHTMLAttributes<HTMLButtonElement> = {}): TooltipTriggerElementProps =>
      ({
        ...props,
        'aria-describedby': open && !disabled ? contentId : props['aria-describedby'],
        'data-expanded': open ? 'true' : 'false',
        'data-part': 'trigger',
        'data-placement': placement,
        'data-scope': 'tooltip',
        'data-state': dataState,
        interestfor: contentId,
        onBlur: composeEventHandlers(props.onBlur, () => scheduleClose('focus')),
        onFocus: composeEventHandlers(props.onFocus, () => scheduleOpen('focus')),
        onMouseEnter: composeEventHandlers(props.onMouseEnter, () => scheduleOpen('pointer')),
        onMouseLeave: composeEventHandlers(props.onMouseLeave, () => scheduleClose('pointer')),
        ref: composeRefs(props.ref, triggerRef),
        style: mergePlatformStyle(props.style, {
          '--ns-floating-anchor-name': anchorName,
          'anchor-name': 'var(--ns-floating-anchor-name)',
        }),
        type: props.type ?? 'button',
      }) as TooltipTriggerElementProps,
    [anchorName, contentId, dataState, disabled, open, placement, scheduleClose, scheduleOpen],
  );

  const getPositionerProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLDivElement> = {}): TooltipPositionerElementProps => ({
      ...props,
      'data-part': 'positioner',
      'data-placement': placement,
      'data-scope': 'tooltip',
      'data-state': dataState,
      style: mergePlatformStyle(props.style, {
        '--ns-floating-anchor-name': anchorName,
        '--ns-floating-position-area': getPositionArea(placement),
      }),
    }),
    [anchorName, dataState, placement],
  );

  const getContentProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLDivElement> = {}): TooltipContentElementProps =>
      ({
        ...props,
        'data-expanded': open ? 'true' : 'false',
        'data-part': 'content',
        'data-placement': placement,
        'data-scope': 'tooltip',
        'data-state': dataState,
        id: props.id ?? contentId,
        onMouseEnter: composeEventHandlers(props.onMouseEnter, () => {
          if (interactive) {
            clearTimers();
            setOpen(true, 'pointer');
          }
        }),
        onMouseLeave: composeEventHandlers(props.onMouseLeave, () => {
          if (interactive) {
            scheduleClose('pointer');
          }
        }),
        onToggle: composeEventHandlers(props.onToggle, () => {
          const nextOpen = isPopoverOpen(contentRef.current);
          if (nextOpen !== open) {
            setOpen(nextOpen, 'programmatic');
          }
        }),
        popover: 'manual',
        ref: composeRefs(props.ref, contentRef),
        role: props.role ?? 'tooltip',
        style: mergePlatformStyle(props.style, {
          '--ns-floating-anchor-name': anchorName,
          '--ns-floating-position-area': getPositionArea(placement),
          'position-anchor': 'var(--ns-floating-anchor-name)',
          'position-area': 'var(--ns-floating-position-area)',
        }),
        tabIndex: interactive ? props.tabIndex ?? 0 : props.tabIndex,
      }) as TooltipContentElementProps,
    [
      anchorName,
      clearTimers,
      contentId,
      dataState,
      interactive,
      open,
      placement,
      scheduleClose,
      setOpen,
    ],
  );

  const getArrowProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLDivElement> = {}): TooltipArrowElementProps => ({
      ...props,
      'data-part': 'arrow',
      'data-placement': placement,
      'data-scope': 'tooltip',
      'data-state': dataState,
    }),
    [dataState, placement],
  );

  const getArrowTipProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLDivElement> = {}): TooltipArrowTipElementProps => ({
      ...props,
      'data-part': 'arrow-tip',
      'data-placement': placement,
      'data-scope': 'tooltip',
      'data-state': dataState,
    }),
    [dataState, placement],
  );

  return {
    getArrowProps,
    getArrowTipProps,
    getContentProps,
    getPositionerProps,
    getTriggerProps,
    ids: {
      content: contentId,
    },
    open,
    placement,
    setOpen,
  };
}
