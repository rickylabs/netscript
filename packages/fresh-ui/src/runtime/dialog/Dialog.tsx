import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';
import { requireFreshUiContext } from '../_internal/context-error.ts';
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

/** Render the dialog root provider. */
export function DialogRoot(props: unknown): unknown {
  const { children, ...options } = props as DialogRootProps;
  const dialog = useDialog(options);
  return <DialogContext.Provider value={dialog}>{children}</DialogContext.Provider>;
}

/** Render the button that opens the dialog. */
export function DialogTrigger(props: unknown): unknown {
  const { children, ...triggerProps } = props as DialogTriggerProps;
  const dialog = useDialogContext('Dialog.Trigger');
  return <button {...dialog.getTriggerProps(triggerProps)}>{withChildren(children)}</button>;
}

/** Render the dialog content element. */
export function DialogContent(props: unknown): unknown {
  const { children, ...contentProps } = props as DialogContentProps;
  const dialog = useDialogContext('Dialog.Content');
  return <dialog {...dialog.getContentProps(contentProps)}>{withChildren(children)}</dialog>;
}

/** Render the dialog title element. */
export function DialogTitle(props: unknown): unknown {
  const { children, ...titleProps } = props as DialogTitleProps;
  const dialog = useDialogContext('Dialog.Title');
  return <h2 {...dialog.getTitleProps(titleProps)}>{withChildren(children)}</h2>;
}

/** Render the dialog description element. */
export function DialogDescription(props: unknown): unknown {
  const { children, ...descriptionProps } = props as DialogDescriptionProps;
  const dialog = useDialogContext('Dialog.Description');
  return <p {...dialog.getDescriptionProps(descriptionProps)}>{withChildren(children)}</p>;
}

/** Render the button that closes the dialog. */
export function DialogClose(props: unknown): unknown {
  const { children, ...closeProps } = props as DialogCloseProps;
  const dialog = useDialogContext('Dialog.Close');
  return <button {...dialog.getCloseProps(closeProps)}>{withChildren(children)}</button>;
}

/** Compound dialog namespace type with root and structural subcomponents. */
export type DialogNamespace = Readonly<{
  Close: typeof DialogClose;
  Content: typeof DialogContent;
  Description: typeof DialogDescription;
  Root: typeof DialogRoot;
  Title: typeof DialogTitle;
  Trigger: typeof DialogTrigger;
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
