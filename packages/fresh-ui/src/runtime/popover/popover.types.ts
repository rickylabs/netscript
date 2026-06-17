import type { ComponentChildren, JSX } from 'preact';
import type { MachineDataAttributes } from '../_internal/dom-types.ts';

export type PopoverTriggerElementProps =
  & JSX.ButtonHTMLAttributes<HTMLButtonElement>
  & MachineDataAttributes;
export type PopoverAnchorElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;
export type PopoverPositionerElementProps =
  & JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;
export type PopoverContentElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;
export type PopoverTitleElementProps =
  & JSX.HTMLAttributes<HTMLHeadingElement>
  & MachineDataAttributes;
export type PopoverDescriptionElementProps =
  & JSX.HTMLAttributes<HTMLParagraphElement>
  & MachineDataAttributes;
export type PopoverCloseElementProps =
  & JSX.ButtonHTMLAttributes<HTMLButtonElement>
  & MachineDataAttributes;
export type PopoverArrowElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;
export type PopoverArrowTipElementProps =
  & JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;

export type PopoverOpenChangeReason =
  | 'trigger'
  | 'close-button'
  | 'escape-key'
  | 'interact-outside'
  | 'programmatic';

export interface PopoverOpenChangeDetails {
  reason: PopoverOpenChangeReason;
}

export interface UsePopoverOptions {
  closeOnEscape?: boolean;
  closeOnInteractOutside?: boolean;
  defaultOpen?: boolean;
  id?: string;
  modal?: boolean;
  onOpenChange?: (open: boolean, details: PopoverOpenChangeDetails) => void;
  open?: boolean;
  placement?: string;
}

export interface UsePopoverReturn {
  getAnchorProps: (props?: JSX.HTMLAttributes<HTMLDivElement>) => PopoverAnchorElementProps;
  getArrowProps: (props?: JSX.HTMLAttributes<HTMLDivElement>) => PopoverArrowElementProps;
  getArrowTipProps: (props?: JSX.HTMLAttributes<HTMLDivElement>) => PopoverArrowTipElementProps;
  getCloseProps: (props?: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => PopoverCloseElementProps;
  getContentProps: (props?: JSX.HTMLAttributes<HTMLDivElement>) => PopoverContentElementProps;
  getDescriptionProps: (
    props?: JSX.HTMLAttributes<HTMLParagraphElement>,
  ) => PopoverDescriptionElementProps;
  getPositionerProps: (props?: JSX.HTMLAttributes<HTMLDivElement>) => PopoverPositionerElementProps;
  getTitleProps: (props?: JSX.HTMLAttributes<HTMLHeadingElement>) => PopoverTitleElementProps;
  getTriggerProps: (
    props?: JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  ) => PopoverTriggerElementProps;
  ids: {
    content: string;
    description: string;
    title: string;
  };
  modal: boolean;
  open: boolean;
  placement: string;
  setOpen: (open: boolean, reason?: PopoverOpenChangeReason) => void;
}

export interface PopoverRootProps extends UsePopoverOptions {
  children: ComponentChildren;
}

export interface PopoverTriggerProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  children: ComponentChildren;
  type?: 'button' | 'submit' | 'reset';
}

export interface PopoverAnchorProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children?: ComponentChildren;
}

export interface PopoverPositionerProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children?: ComponentChildren;
}

export interface PopoverContentProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children?: ComponentChildren;
}

export interface PopoverTitleProps extends JSX.HTMLAttributes<HTMLHeadingElement> {
  children?: ComponentChildren;
}

export interface PopoverDescriptionProps extends JSX.HTMLAttributes<HTMLParagraphElement> {
  children?: ComponentChildren;
}

export interface PopoverCloseProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  children?: ComponentChildren;
  type?: 'button' | 'submit' | 'reset';
}

export interface PopoverArrowProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children?: ComponentChildren;
}

export interface PopoverArrowTipProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children?: ComponentChildren;
}
