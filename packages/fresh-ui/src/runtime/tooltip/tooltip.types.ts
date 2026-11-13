import type { MachineDataAttributes } from '../_internal/dom-types.ts';
import type { FreshUiChildren } from '../_internal/public-props.ts';

/** DOM attributes returned for the tooltip trigger part. */
export type TooltipTriggerElementProps =
  & preact.JSX.ButtonHTMLAttributes<HTMLButtonElement>
  & MachineDataAttributes;
/** DOM attributes returned for the tooltip positioner part. */
export type TooltipPositionerElementProps =
  & preact.JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;
/** DOM attributes returned for the tooltip content part. */
export type TooltipContentElementProps =
  & preact.JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;
/** DOM attributes returned for the tooltip arrow part. */
export type TooltipArrowElementProps =
  & preact.JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;
/** DOM attributes returned for the tooltip arrow tip part. */
export type TooltipArrowTipElementProps =
  & preact.JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;

export type TooltipOpenChangeReason =
  | 'pointer'
  | 'focus'
  | 'escape-key'
  | 'interact-outside'
  | 'programmatic';

export interface TooltipOpenChangeDetails {
  reason: TooltipOpenChangeReason;
}

/** Controlled and initial state for the tooltip hook. */
export interface UseTooltipOptions {
  /** Delay in milliseconds before closing after pointer exit. */
  closeDelay?: number;
  /** Initial open state when open is uncontrolled. */
  defaultOpen?: boolean;
  /** Disables tooltip interaction. */
  disabled?: boolean;
  /** Stable base identifier for accessible part relationships. */
  id?: string;
  /** Whether pointer interaction inside the tooltip keeps it open. */
  interactive?: boolean;
  /** Receives controlled or uncontrolled open-state transitions. */
  onOpenChange?: (
    open: boolean,
    details: {
      reason: 'pointer' | 'focus' | 'escape-key' | 'interact-outside' | 'programmatic';
    },
  ) => void;
  /** Controlled open state. */
  open?: boolean;
  /** Delay in milliseconds before opening after pointer entry. */
  openDelay?: number;
  /** Preferred floating-surface placement. */
  placement?: string;
}

export interface UseTooltipReturn {
  getArrowProps: (props?: preact.JSX.HTMLAttributes<HTMLDivElement>) => TooltipArrowElementProps;
  getArrowTipProps: (
    props?: preact.JSX.HTMLAttributes<HTMLDivElement>,
  ) => TooltipArrowTipElementProps;
  getContentProps: (
    props?: preact.JSX.HTMLAttributes<HTMLDivElement>,
  ) => TooltipContentElementProps;
  getPositionerProps: (
    props?: preact.JSX.HTMLAttributes<HTMLDivElement>,
  ) => TooltipPositionerElementProps;
  getTriggerProps: (
    props?: preact.JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  ) => TooltipTriggerElementProps;
  ids: {
    content: string;
  };
  open: boolean;
  placement: string;
  setOpen: (open: boolean, reason?: TooltipOpenChangeReason) => void;
}

/** Props for the compound tooltip root component. */
export type TooltipRootProps = UseTooltipOptions & {
  children: FreshUiChildren;
};

/** Props for the tooltip trigger component. */
export type TooltipTriggerProps = TooltipTriggerElementProps & {
  children: FreshUiChildren;
  type?: 'button' | 'submit' | 'reset';
};

/** Props for the tooltip positioner component. */
export type TooltipPositionerProps = TooltipPositionerElementProps & {
  children?: FreshUiChildren;
};

/** Props for the tooltip content component. */
export type TooltipContentProps = TooltipContentElementProps & {
  children?: FreshUiChildren;
};

/** Props for the tooltip arrow component. */
export type TooltipArrowProps = TooltipArrowElementProps & {
  children?: FreshUiChildren;
};

/** Props for the tooltip arrow tip component. */
export type TooltipArrowTipProps = TooltipArrowTipElementProps & {
  children?: FreshUiChildren;
};
