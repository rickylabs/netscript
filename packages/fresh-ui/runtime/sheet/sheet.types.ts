import type { ComponentChildren, JSX } from 'preact';
import type { MachineDataAttributes } from '../_internal/dom-types.ts';

// ---------------------------------------------------------------------------
// Element-level prop types (returned by hook getters)
// ---------------------------------------------------------------------------

export type SheetTriggerElementProps =
  & JSX.ButtonHTMLAttributes<HTMLButtonElement>
  & MachineDataAttributes;
export type SheetContentElementProps =
  & JSX.HTMLAttributes<HTMLDialogElement>
  & MachineDataAttributes
  & {
    'data-side'?: SheetSide;
    open?: boolean;
  };
export type SheetTitleElementProps = JSX.HTMLAttributes<HTMLHeadingElement> & MachineDataAttributes;
export type SheetDescriptionElementProps =
  & JSX.HTMLAttributes<HTMLParagraphElement>
  & MachineDataAttributes;
export type SheetCloseElementProps =
  & JSX.ButtonHTMLAttributes<HTMLButtonElement>
  & MachineDataAttributes;

// ---------------------------------------------------------------------------
// Semantic types
// ---------------------------------------------------------------------------

/** Sheet positioning — CSS handles responsive switching. */
export type SheetSide = 'right' | 'bottom';

export type SheetOpenChangeReason =
  | 'trigger'
  | 'close-button'
  | 'escape-key'
  | 'interact-outside'
  | 'native-close'
  | 'programmatic';

export interface SheetOpenChangeDetails {
  reason: SheetOpenChangeReason;
}

// ---------------------------------------------------------------------------
// Hook options and return
// ---------------------------------------------------------------------------

export interface UseSheetOptions {
  /** Which edge to dock. Default: `'right'`. */
  side?: SheetSide;
  closeOnEscape?: boolean;
  closeOnInteractOutside?: boolean;
  defaultOpen?: boolean;
  id?: string;
  modal?: boolean;
  onOpenChange?: (open: boolean, details: SheetOpenChangeDetails) => void;
  open?: boolean;
}

export interface UseSheetReturn {
  getCloseProps: (props?: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => SheetCloseElementProps;
  getContentProps: (props?: JSX.HTMLAttributes<HTMLDialogElement>) => SheetContentElementProps;
  getDescriptionProps: (
    props?: JSX.HTMLAttributes<HTMLParagraphElement>,
  ) => SheetDescriptionElementProps;
  getTitleProps: (props?: JSX.HTMLAttributes<HTMLHeadingElement>) => SheetTitleElementProps;
  getTriggerProps: (
    props?: JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  ) => SheetTriggerElementProps;
  ids: {
    content: string;
    description: string;
    title: string;
  };
  modal: boolean;
  open: boolean;
  setOpen: (open: boolean, reason?: SheetOpenChangeReason) => void;
  side: SheetSide;
}

// ---------------------------------------------------------------------------
// Component-level props
// ---------------------------------------------------------------------------

export interface SheetRootProps extends UseSheetOptions {
  children: ComponentChildren;
}

export interface SheetTriggerProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  children: ComponentChildren;
  type?: 'button' | 'submit' | 'reset';
}

export interface SheetContentProps extends JSX.HTMLAttributes<HTMLDialogElement> {
  children: ComponentChildren;
}

export interface SheetTitleProps extends JSX.HTMLAttributes<HTMLHeadingElement> {
  children: ComponentChildren;
}

export interface SheetDescriptionProps extends JSX.HTMLAttributes<HTMLParagraphElement> {
  children: ComponentChildren;
}

export interface SheetCloseProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  children: ComponentChildren;
  type?: 'button' | 'submit' | 'reset';
}
