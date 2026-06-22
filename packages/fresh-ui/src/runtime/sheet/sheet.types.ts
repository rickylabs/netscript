import type { JSX } from 'preact';
import type { MachineDataAttributes } from '../_internal/dom-types.ts';
import type { FreshUiChildren } from '../_internal/public-props.ts';

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

/** Props for the compound sheet root component. */
export type SheetRootProps = UseSheetOptions & {
  children: FreshUiChildren;
};

/** Props for the sheet trigger component. */
export type SheetTriggerProps = SheetTriggerElementProps & {
  children: FreshUiChildren;
  type?: 'button' | 'submit' | 'reset';
};

/** Props for the sheet content component. */
export type SheetContentProps = SheetContentElementProps & {
  children: FreshUiChildren;
};

/** Props for the sheet title component. */
export type SheetTitleProps = SheetTitleElementProps & {
  children: FreshUiChildren;
};

/** Props for the sheet description component. */
export type SheetDescriptionProps = SheetDescriptionElementProps & {
  children: FreshUiChildren;
};

/** Props for the sheet close component. */
export type SheetCloseProps = SheetCloseElementProps & {
  children: FreshUiChildren;
  type?: 'button' | 'submit' | 'reset';
};
