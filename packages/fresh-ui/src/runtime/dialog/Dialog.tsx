import { createContext } from 'preact';
import type { ComponentChildren, JSX, VNode } from 'preact';
import { useContext } from 'preact/hooks';
import { requireFreshUiContext } from '../_internal/context-error.ts';
import type { FreshUiChild } from '../_internal/public-props.ts';
import type {
  DialogCloseProps,
  DialogContentProps,
  DialogDescriptionProps,
  DialogRootProps,
  DialogTitleProps,
  DialogTriggerProps,
  UseDialogReturn,
} from './dialog.types.ts';
import { useDialog } from './use-dialog.ts';

const DialogContext = createContext<UseDialogReturn | null>(null);

function useDialogContext(partName: string): UseDialogReturn {
  return requireFreshUiContext(useContext(DialogContext), partName, 'Dialog.Root');
}

function withChildren(children: ComponentChildren): ComponentChildren {
  return children;
}

function DialogRoot({ children, ...options }: DialogRootProps): VNode {
  const dialog = useDialog(options);
  return <DialogContext.Provider value={dialog}>{children}</DialogContext.Provider>;
}

function DialogTrigger({ children, ...props }: DialogTriggerProps): VNode {
  const dialog = useDialogContext('Dialog.Trigger');
  return (
    <button {...dialog.getTriggerProps(props as JSX.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {withChildren(children)}
    </button>
  );
}

function DialogContent({ children, ...props }: DialogContentProps): VNode {
  const dialog = useDialogContext('Dialog.Content');
  return (
    <dialog {...dialog.getContentProps(props as JSX.HTMLAttributes<HTMLDialogElement>)}>
      {withChildren(children)}
    </dialog>
  );
}

function DialogTitle({ children, ...props }: DialogTitleProps): VNode {
  const dialog = useDialogContext('Dialog.Title');
  return (
    <h2 {...dialog.getTitleProps(props as JSX.HTMLAttributes<HTMLHeadingElement>)}>
      {withChildren(children)}
    </h2>
  );
}

function DialogDescription({ children, ...props }: DialogDescriptionProps): VNode {
  const dialog = useDialogContext('Dialog.Description');
  return (
    <p {...dialog.getDescriptionProps(props as JSX.HTMLAttributes<HTMLParagraphElement>)}>
      {withChildren(children)}
    </p>
  );
}

function DialogClose({ children, ...props }: DialogCloseProps): VNode {
  const dialog = useDialogContext('Dialog.Close');
  return (
    <button {...dialog.getCloseProps(props as JSX.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {withChildren(children)}
    </button>
  );
}

/** Compound dialog namespace type with root and structural subcomponents. */
export type DialogNamespace = Readonly<{
  Close: (props: DialogCloseProps) => FreshUiChild;
  Content: (props: DialogContentProps) => FreshUiChild;
  Description: (props: DialogDescriptionProps) => FreshUiChild;
  Root: (props: DialogRootProps) => FreshUiChild;
  Title: (props: DialogTitleProps) => FreshUiChild;
  Trigger: (props: DialogTriggerProps) => FreshUiChild;
}>;

/** Compound dialog namespace with root and structural subcomponents. */
export const Dialog: DialogNamespace = {
  Close: DialogClose,
  Content: DialogContent,
  Description: DialogDescription,
  Root: DialogRoot,
  Title: DialogTitle,
  Trigger: DialogTrigger,
};
