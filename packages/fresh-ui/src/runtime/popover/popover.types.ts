import type { JSX } from 'preact';
import type { MachineDataAttributes } from '../_internal/dom-types.ts';
import type { FreshUiChildren } from '../_internal/public-props.ts';

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
  onOpenChange?: (
    open: boolean,
    details: {
      reason:
        | 'trigger'
        | 'close-button'
        | 'escape-key'
        | 'interact-outside'
        | 'programmatic';
    },
  ) => void;
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

/** Props for the compound popover root component. */
export type PopoverRootProps = UsePopoverOptions & {
  children: FreshUiChildren;
};

/** Props for the popover trigger component. */
export type PopoverTriggerProps = PopoverTriggerElementProps & {
  children: FreshUiChildren;
  type?: 'button' | 'submit' | 'reset';
};

/** Props for the optional popover anchor component. */
export type PopoverAnchorProps = PopoverAnchorElementProps & {
  children?: FreshUiChildren;
};

/** Props for the popover positioner component. */
export type PopoverPositionerProps = PopoverPositionerElementProps & {
  children?: FreshUiChildren;
};

/** Props for the popover content component. */
export type PopoverContentProps = PopoverContentElementProps & {
  children?: FreshUiChildren;
};

/** Props for the popover title component. */
export type PopoverTitleProps = PopoverTitleElementProps & {
  children?: FreshUiChildren;
};

/** Props for the popover description component. */
export type PopoverDescriptionProps = PopoverDescriptionElementProps & {
  children?: FreshUiChildren;
};

/** Props for the popover close component. */
export type PopoverCloseProps = PopoverCloseElementProps & {
  children?: FreshUiChildren;
  type?: 'button' | 'submit' | 'reset';
};

/** Props for the popover arrow component. */
export type PopoverArrowProps = PopoverArrowElementProps & {
  children?: FreshUiChildren;
};

/** Props for the popover arrow tip component. */
export type PopoverArrowTipProps = PopoverArrowTipElementProps & {
  children?: FreshUiChildren;
};
