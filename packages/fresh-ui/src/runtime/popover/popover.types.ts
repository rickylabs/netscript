import type { MachineDataAttributes } from '../_internal/dom-types.ts';
import type { FreshUiChildren } from '../_internal/public-props.ts';

/** DOM attributes returned for the popover trigger part. */
export type PopoverTriggerElementProps =
  & preact.JSX.ButtonHTMLAttributes<HTMLButtonElement>
  & MachineDataAttributes;
/** DOM attributes returned for the popover anchor part. */
export type PopoverAnchorElementProps =
  & preact.JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;
/** DOM attributes returned for the popover positioner part. */
export type PopoverPositionerElementProps =
  & preact.JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;
/** DOM attributes returned for the popover content part. */
export type PopoverContentElementProps =
  & preact.JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;
/** DOM attributes returned for the popover title part. */
export type PopoverTitleElementProps =
  & preact.JSX.HTMLAttributes<HTMLHeadingElement>
  & MachineDataAttributes;
/** DOM attributes returned for the popover description part. */
export type PopoverDescriptionElementProps =
  & preact.JSX.HTMLAttributes<HTMLParagraphElement>
  & MachineDataAttributes;
/** DOM attributes returned for the popover close part. */
export type PopoverCloseElementProps =
  & preact.JSX.ButtonHTMLAttributes<HTMLButtonElement>
  & MachineDataAttributes;
/** DOM attributes returned for the popover arrow part. */
export type PopoverArrowElementProps =
  & preact.JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;
/** DOM attributes returned for the popover arrow tip part. */
export type PopoverArrowTipElementProps =
  & preact.JSX.HTMLAttributes<HTMLDivElement>
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

/** Controlled and initial state for the popover hook. */
export interface UsePopoverOptions {
  /** Preserve trigger focus for informational hover previews when false. Defaults to true. */
  focusOnOpen?: boolean;
  /** Whether Escape dismisses an open surface. */
  closeOnEscape?: boolean;
  /** Whether outside pointer or focus interaction dismisses the surface. */
  closeOnInteractOutside?: boolean;
  /** Initial open state when open is uncontrolled. */
  defaultOpen?: boolean;
  /** Stable base identifier for accessible part relationships. */
  id?: string;
  /** Whether the surface traps focus and makes surrounding content inert. */
  modal?: boolean;
  /** Receives open-state changes and their transition details. */
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
  /** Controlled open state. */
  open?: boolean;
  /** Preferred floating-surface placement. */
  placement?: string;
}

export interface UsePopoverReturn {
  getAnchorProps: (props?: preact.JSX.HTMLAttributes<HTMLDivElement>) => PopoverAnchorElementProps;
  getArrowProps: (props?: preact.JSX.HTMLAttributes<HTMLDivElement>) => PopoverArrowElementProps;
  getArrowTipProps: (
    props?: preact.JSX.HTMLAttributes<HTMLDivElement>,
  ) => PopoverArrowTipElementProps;
  getCloseProps: (
    props?: preact.JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  ) => PopoverCloseElementProps;
  getContentProps: (
    props?: preact.JSX.HTMLAttributes<HTMLDivElement>,
  ) => PopoverContentElementProps;
  getDescriptionProps: (
    props?: preact.JSX.HTMLAttributes<HTMLParagraphElement>,
  ) => PopoverDescriptionElementProps;
  getPositionerProps: (
    props?: preact.JSX.HTMLAttributes<HTMLDivElement>,
  ) => PopoverPositionerElementProps;
  getTitleProps: (
    props?: preact.JSX.HTMLAttributes<HTMLHeadingElement>,
  ) => PopoverTitleElementProps;
  getTriggerProps: (
    props?: preact.JSX.ButtonHTMLAttributes<HTMLButtonElement>,
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
