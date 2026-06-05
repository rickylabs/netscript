import type { ComponentChildren, JSX } from 'preact';
import type { MachineDataAttributes } from '../_internal/dom-types.ts';

export type TooltipTriggerElementProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & MachineDataAttributes;
export type TooltipPositionerElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;
export type TooltipContentElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;
export type TooltipArrowElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;
export type TooltipArrowTipElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;

export type TooltipOpenChangeReason = 'pointer' | 'focus' | 'escape-key' | 'interact-outside' | 'programmatic';

export interface TooltipOpenChangeDetails {
  reason: TooltipOpenChangeReason;
}

export interface UseTooltipOptions {
  closeDelay?: number;
  defaultOpen?: boolean;
  disabled?: boolean;
  id?: string;
  interactive?: boolean;
  onOpenChange?: (open: boolean, details: TooltipOpenChangeDetails) => void;
  open?: boolean;
  openDelay?: number;
  placement?: string;
}

export interface UseTooltipReturn {
  getArrowProps: (props?: JSX.HTMLAttributes<HTMLDivElement>) => TooltipArrowElementProps;
  getArrowTipProps: (props?: JSX.HTMLAttributes<HTMLDivElement>) => TooltipArrowTipElementProps;
  getContentProps: (props?: JSX.HTMLAttributes<HTMLDivElement>) => TooltipContentElementProps;
  getPositionerProps: (props?: JSX.HTMLAttributes<HTMLDivElement>) => TooltipPositionerElementProps;
  getTriggerProps: (props?: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => TooltipTriggerElementProps;
  ids: {
    content: string;
  };
  open: boolean;
  placement: string;
  setOpen: (open: boolean, reason?: TooltipOpenChangeReason) => void;
}

export interface TooltipRootProps extends UseTooltipOptions {
  children: ComponentChildren;
}

export interface TooltipTriggerProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  children: ComponentChildren;
  type?: 'button' | 'submit' | 'reset';
}

export interface TooltipPositionerProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children?: ComponentChildren;
}

export interface TooltipContentProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children?: ComponentChildren;
}

export interface TooltipArrowProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children?: ComponentChildren;
}

export interface TooltipArrowTipProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children?: ComponentChildren;
}