import type { ComponentChildren, JSX } from 'preact';
import type { MachineDataAttributes } from '../_internal/dom-types.ts';

export type DialogTriggerElementProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & MachineDataAttributes;
export type DialogContentElementProps = JSX.HTMLAttributes<HTMLDialogElement> & MachineDataAttributes & {
  open?: boolean;
};
export type DialogTitleElementProps = JSX.HTMLAttributes<HTMLHeadingElement> & MachineDataAttributes;
export type DialogDescriptionElementProps = JSX.HTMLAttributes<HTMLParagraphElement> & MachineDataAttributes;
export type DialogCloseElementProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & MachineDataAttributes;

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
  onOpenChange?: (open: boolean, details: DialogOpenChangeDetails) => void;
  open?: boolean;
}

export interface UseDialogReturn {
  getCloseProps: (props?: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => DialogCloseElementProps;
  getContentProps: (props?: JSX.HTMLAttributes<HTMLDialogElement>) => DialogContentElementProps;
  getDescriptionProps: (props?: JSX.HTMLAttributes<HTMLParagraphElement>) => DialogDescriptionElementProps;
  getTitleProps: (props?: JSX.HTMLAttributes<HTMLHeadingElement>) => DialogTitleElementProps;
  getTriggerProps: (props?: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => DialogTriggerElementProps;
  ids: {
    content: string;
    description: string;
    title: string;
  };
  modal: boolean;
  open: boolean;
  setOpen: (open: boolean, reason?: DialogOpenChangeReason) => void;
}

export interface DialogRootProps extends UseDialogOptions {
  children: ComponentChildren;
}

export interface DialogTriggerProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  children: ComponentChildren;
  type?: 'button' | 'submit' | 'reset';
}

export interface DialogContentProps extends JSX.HTMLAttributes<HTMLDialogElement> {
  children: ComponentChildren;
}

export interface DialogTitleProps extends JSX.HTMLAttributes<HTMLHeadingElement> {
  children: ComponentChildren;
}

export interface DialogDescriptionProps extends JSX.HTMLAttributes<HTMLParagraphElement> {
  children: ComponentChildren;
}

export interface DialogCloseProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  children: ComponentChildren;
  type?: 'button' | 'submit' | 'reset';
}