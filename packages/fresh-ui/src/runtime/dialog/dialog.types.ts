import type { MachineDataAttributes } from '../_internal/dom-types.ts';
import type { FreshUiChildren } from '../_internal/public-props.ts';

/** DOM attributes returned for the dialog trigger part. */
export type DialogTriggerElementProps =
  & preact.JSX.ButtonHTMLAttributes<HTMLButtonElement>
  & MachineDataAttributes;
/** DOM attributes returned for the dialog content part. */
export type DialogContentElementProps =
  & preact.JSX.HTMLAttributes<HTMLDialogElement>
  & MachineDataAttributes
  & {
    open?: boolean;
  };
/** DOM attributes returned for the dialog title part. */
export type DialogTitleElementProps =
  & preact.JSX.HTMLAttributes<HTMLHeadingElement>
  & MachineDataAttributes;
/** DOM attributes returned for the dialog description part. */
export type DialogDescriptionElementProps =
  & preact.JSX.HTMLAttributes<HTMLParagraphElement>
  & MachineDataAttributes;
/** DOM attributes returned for the dialog close part. */
export type DialogCloseElementProps =
  & preact.JSX.ButtonHTMLAttributes<HTMLButtonElement>
  & MachineDataAttributes;

export type DialogOpenChangeReason =
  | 'trigger'
  | 'close-button'
  | 'escape-key'
  | 'interact-outside'
  | 'native-close'
  | 'programmatic';

export interface DialogOpenChangeDetails {
  reason: DialogOpenChangeReason;
}

/** Controlled and initial state for the dialog hook. */
export interface UseDialogOptions {
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
        | 'native-close'
        | 'programmatic';
    },
  ) => void;
  /** Controlled open state. */
  open?: boolean;
}

export interface UseDialogReturn {
  getCloseProps: (
    props?: preact.JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  ) => DialogCloseElementProps;
  getContentProps: (
    props?: preact.JSX.HTMLAttributes<HTMLDialogElement>,
  ) => DialogContentElementProps;
  getDescriptionProps: (
    props?: preact.JSX.HTMLAttributes<HTMLParagraphElement>,
  ) => DialogDescriptionElementProps;
  getTitleProps: (props?: preact.JSX.HTMLAttributes<HTMLHeadingElement>) => DialogTitleElementProps;
  getTriggerProps: (
    props?: preact.JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  ) => DialogTriggerElementProps;
  ids: {
    content: string;
    description: string;
    title: string;
  };
  modal: boolean;
  open: boolean;
  setOpen: (open: boolean, reason?: DialogOpenChangeReason) => void;
}

/** Props for the compound dialog root component. */
export type DialogRootProps = UseDialogOptions & {
  children: FreshUiChildren;
};

/** Props for the dialog trigger component. */
export type DialogTriggerProps = DialogTriggerElementProps & {
  children: FreshUiChildren;
  type?: 'button' | 'submit' | 'reset';
};

/** Props for the dialog content component. */
export type DialogContentProps = DialogContentElementProps & {
  children: FreshUiChildren;
};

/** Props for the dialog title component. */
export type DialogTitleProps = DialogTitleElementProps & {
  children: FreshUiChildren;
};

/** Props for the dialog description component. */
export type DialogDescriptionProps = DialogDescriptionElementProps & {
  children: FreshUiChildren;
};

/** Props for the dialog close component. */
export type DialogCloseProps = DialogCloseElementProps & {
  children: FreshUiChildren;
  type?: 'button' | 'submit' | 'reset';
};
