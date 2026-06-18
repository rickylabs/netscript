import { createContext } from 'preact';
import type { ComponentChildren, JSX, VNode } from 'preact';
import { useContext } from 'preact/hooks';
import { requireFreshUiContext } from '../_internal/context-error.ts';
import type { FreshUiChild } from '../_internal/public-props.ts';
import type {
  SheetCloseProps,
  SheetContentProps,
  SheetDescriptionProps,
  SheetRootProps,
  SheetTitleProps,
  SheetTriggerProps,
  UseSheetReturn,
} from './sheet.types.ts';
import { useSheet } from './use-sheet.ts';

const SheetContext = createContext<UseSheetReturn | null>(null);

function useSheetContext(partName: string): UseSheetReturn {
  return requireFreshUiContext(useContext(SheetContext), partName, 'Sheet.Root');
}

function withChildren(children: ComponentChildren): ComponentChildren {
  return children;
}

function SheetRoot({ children, ...options }: SheetRootProps): VNode {
  const sheet = useSheet(options);
  return <SheetContext.Provider value={sheet}>{children}</SheetContext.Provider>;
}

function SheetTrigger({ children, ...props }: SheetTriggerProps): VNode {
  const sheet = useSheetContext('Sheet.Trigger');
  return (
    <button {...sheet.getTriggerProps(props as JSX.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {withChildren(children)}
    </button>
  );
}

function SheetContent({ children, ...props }: SheetContentProps): VNode {
  const sheet = useSheetContext('Sheet.Content');
  return (
    <dialog {...sheet.getContentProps(props as JSX.HTMLAttributes<HTMLDialogElement>)}>
      {withChildren(children)}
    </dialog>
  );
}

function SheetTitle({ children, ...props }: SheetTitleProps): VNode {
  const sheet = useSheetContext('Sheet.Title');
  return (
    <h2 {...sheet.getTitleProps(props as JSX.HTMLAttributes<HTMLHeadingElement>)}>
      {withChildren(children)}
    </h2>
  );
}

function SheetDescription({ children, ...props }: SheetDescriptionProps): VNode {
  const sheet = useSheetContext('Sheet.Description');
  return (
    <p {...sheet.getDescriptionProps(props as JSX.HTMLAttributes<HTMLParagraphElement>)}>
      {withChildren(children)}
    </p>
  );
}

function SheetClose({ children, ...props }: SheetCloseProps): VNode {
  const sheet = useSheetContext('Sheet.Close');
  return (
    <button {...sheet.getCloseProps(props as JSX.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {withChildren(children)}
    </button>
  );
}

/** Compound sheet namespace type with root and structural subcomponents. */
export type SheetNamespace = Readonly<{
  Close: (props: SheetCloseProps) => FreshUiChild;
  Content: (props: SheetContentProps) => FreshUiChild;
  Description: (props: SheetDescriptionProps) => FreshUiChild;
  Root: (props: SheetRootProps) => FreshUiChild;
  Title: (props: SheetTitleProps) => FreshUiChild;
  Trigger: (props: SheetTriggerProps) => FreshUiChild;
}>;

/** Compound Sheet namespace — side-docked inspection panel. */
export const Sheet: SheetNamespace = {
  Close: SheetClose,
  Content: SheetContent,
  Description: SheetDescription,
  Root: SheetRoot,
  Title: SheetTitle,
  Trigger: SheetTrigger,
};
