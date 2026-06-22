import type { JSX } from 'preact';
import type { MachineDataAttributes } from '../_internal/dom-types.ts';
import type { FreshUiChildren } from '../_internal/public-props.ts';

export type TooltipTriggerElementProps =
  & JSX.ButtonHTMLAttributes<HTMLButtonElement>
  & MachineDataAttributes;
export type TooltipPositionerElementProps =
  & JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;
export type TooltipContentElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;
export type TooltipArrowElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;
export type TooltipArrowTipElementProps =
  & JSX.HTMLAttributes<HTMLDivElement>
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

export interface UseTooltipOptions {
  closeDelay?: number;
  defaultOpen?: boolean;
  disabled?: boolean;
  id?: string;
  interactive?: boolean;
  onOpenChange?: (
    open: boolean,
    details: {
      reason: 'pointer' | 'focus' | 'escape-key' | 'interact-outside' | 'programmatic';
    },
  ) => void;
  open?: boolean;
  openDelay?: number;
  placement?: string;
}

export interface UseTooltipReturn {
  getArrowProps: (props?: JSX.HTMLAttributes<HTMLDivElement>) => TooltipArrowElementProps;
  getArrowTipProps: (props?: JSX.HTMLAttributes<HTMLDivElement>) => TooltipArrowTipElementProps;
  getContentProps: (props?: JSX.HTMLAttributes<HTMLDivElement>) => TooltipContentElementProps;
  getPositionerProps: (props?: JSX.HTMLAttributes<HTMLDivElement>) => TooltipPositionerElementProps;
  getTriggerProps: (
    props?: JSX.ButtonHTMLAttributes<HTMLButtonElement>,
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
