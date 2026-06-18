import type { JSX } from 'preact';
import type { MachineDataAttributes } from '../_internal/dom-types.ts';
import type { FreshUiChildren, FreshUiElementProps } from '../_internal/public-props.ts';

export type DialogTriggerElementProps =
  & JSX.ButtonHTMLAttributes<HTMLButtonElement>
  & MachineDataAttributes;
export type DialogContentElementProps =
  & JSX.HTMLAttributes<HTMLDialogElement>
  & MachineDataAttributes
  & {
    open?: boolean;
  };
export type DialogTitleElementProps =
  & JSX.HTMLAttributes<HTMLHeadingElement>
  & MachineDataAttributes;
export type DialogDescriptionElementProps =
  & JSX.HTMLAttributes<HTMLParagraphElement>
  & MachineDataAttributes;
export type DialogCloseElementProps =
  & JSX.ButtonHTMLAttributes<HTMLButtonElement>
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

export interface UseDialogOptions {
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
        | 'native-close'
        | 'programmatic';
    },
  ) => void;
  open?: boolean;
}

export interface UseDialogReturn {
  getCloseProps: (props?: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => DialogCloseElementProps;
  getContentProps: (props?: JSX.HTMLAttributes<HTMLDialogElement>) => DialogContentElementProps;
  getDescriptionProps: (
    props?: JSX.HTMLAttributes<HTMLParagraphElement>,
  ) => DialogDescriptionElementProps;
  getTitleProps: (props?: JSX.HTMLAttributes<HTMLHeadingElement>) => DialogTitleElementProps;
  getTriggerProps: (
    props?: JSX.ButtonHTMLAttributes<HTMLButtonElement>,
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
export type DialogRootProps = FreshUiElementProps & {
  children: FreshUiChildren;
  closeOnEscape?: boolean;
  closeOnInteractOutside?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
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
  open?: boolean;
};

/** Props for the dialog trigger component. */
export type DialogTriggerProps = FreshUiElementProps & {
  children: FreshUiChildren;
  type?: 'button' | 'submit' | 'reset';
};

/** Props for the dialog content component. */
export type DialogContentProps = FreshUiElementProps & {
  children: FreshUiChildren;
};

/** Props for the dialog title component. */
export type DialogTitleProps = FreshUiElementProps & {
  children: FreshUiChildren;
};

/** Props for the dialog description component. */
export type DialogDescriptionProps = FreshUiElementProps & {
  children: FreshUiChildren;
};

/** Props for the dialog close component. */
export type DialogCloseProps = FreshUiElementProps & {
  children: FreshUiChildren;
  type?: 'button' | 'submit' | 'reset';
};
