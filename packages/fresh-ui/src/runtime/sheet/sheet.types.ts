import type { MachineDataAttributes } from '../_internal/dom-types.ts';
import type { FreshUiChildren } from '../_internal/public-props.ts';

// ---------------------------------------------------------------------------
// Element-level prop types (returned by hook getters)
// ---------------------------------------------------------------------------

/** DOM attributes returned for the sheet trigger part. */
export type SheetTriggerElementProps =
  & preact.JSX.ButtonHTMLAttributes<HTMLButtonElement>
  & MachineDataAttributes;
/** DOM attributes returned for the sheet content part. */
export type SheetContentElementProps =
  & preact.JSX.HTMLAttributes<HTMLDialogElement>
  & MachineDataAttributes
  & {
    'data-side'?: SheetSide;
    open?: boolean;
  };
/** DOM attributes returned for the sheet title part. */
export type SheetTitleElementProps =
  & preact.JSX.HTMLAttributes<HTMLHeadingElement>
  & MachineDataAttributes;
/** DOM attributes returned for the sheet description part. */
export type SheetDescriptionElementProps =
  & preact.JSX.HTMLAttributes<HTMLParagraphElement>
  & MachineDataAttributes;
/** DOM attributes returned for the sheet close part. */
export type SheetCloseElementProps =
  & preact.JSX.ButtonHTMLAttributes<HTMLButtonElement>
  & MachineDataAttributes;

// ---------------------------------------------------------------------------
// Semantic types
// ---------------------------------------------------------------------------

/** Sheet positioning — CSS handles responsive switching. */
export type SheetSide = 'right' | 'bottom';

/** Causes reported when a sheet requests an open-state transition. */
export type SheetOpenChangeReason =
  | 'trigger'
  | 'close-button'
  | 'escape-key'
  | 'interact-outside'
  | 'native-close'
  | 'programmatic';

/** Metadata describing a sheet open-state transition. */
export interface SheetOpenChangeDetails {
  /** Interaction or application request that caused the transition. */
  reason: SheetOpenChangeReason;
}

// ---------------------------------------------------------------------------
// Hook options and return
// ---------------------------------------------------------------------------

/** Controlled and initial state for the sheet hook. */
export interface UseSheetOptions {
  /** Which edge to dock. Default: `'right'`. */
  side?: SheetSide;
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
  onOpenChange?: (open: boolean, details: SheetOpenChangeDetails) => void;
  /** Controlled open state. */
  open?: boolean;
}

export interface UseSheetReturn {
  getCloseProps: (
    props?: preact.JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  ) => SheetCloseElementProps;
  getContentProps: (
    props?: preact.JSX.HTMLAttributes<HTMLDialogElement>,
  ) => SheetContentElementProps;
  getDescriptionProps: (
    props?: preact.JSX.HTMLAttributes<HTMLParagraphElement>,
  ) => SheetDescriptionElementProps;
  getTitleProps: (props?: preact.JSX.HTMLAttributes<HTMLHeadingElement>) => SheetTitleElementProps;
  getTriggerProps: (
    props?: preact.JSX.ButtonHTMLAttributes<HTMLButtonElement>,
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
