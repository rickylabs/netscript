import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';
import { requireFreshUiContext } from '../_internal/context-error.ts';
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

/** Render the sheet root provider. */
export function SheetRoot(props: unknown): unknown {
  const { children, ...options } = props as SheetRootProps;
  const sheet = useSheet(options);
  return <SheetContext.Provider value={sheet}>{children}</SheetContext.Provider>;
}

/** Render the button that opens the sheet. */
export function SheetTrigger(props: unknown): unknown {
  const { children, ...triggerProps } = props as SheetTriggerProps;
  const sheet = useSheetContext('Sheet.Trigger');
  return <button {...sheet.getTriggerProps(triggerProps)}>{withChildren(children)}</button>;
}

/** Render the sheet content element. */
export function SheetContent(props: unknown): unknown {
  const { children, ...contentProps } = props as SheetContentProps;
  const sheet = useSheetContext('Sheet.Content');
  return <dialog {...sheet.getContentProps(contentProps)}>{withChildren(children)}</dialog>;
}

/** Render the sheet title element. */
export function SheetTitle(props: unknown): unknown {
  const { children, ...titleProps } = props as SheetTitleProps;
  const sheet = useSheetContext('Sheet.Title');
  return <h2 {...sheet.getTitleProps(titleProps)}>{withChildren(children)}</h2>;
}

/** Render the sheet description element. */
export function SheetDescription(props: unknown): unknown {
  const { children, ...descriptionProps } = props as SheetDescriptionProps;
  const sheet = useSheetContext('Sheet.Description');
  return <p {...sheet.getDescriptionProps(descriptionProps)}>{withChildren(children)}</p>;
}

/** Render the button that closes the sheet. */
export function SheetClose(props: unknown): unknown {
  const { children, ...closeProps } = props as SheetCloseProps;
  const sheet = useSheetContext('Sheet.Close');
  return <button {...sheet.getCloseProps(closeProps)}>{withChildren(children)}</button>;
}

/** Compound sheet namespace type with root and structural subcomponents. */
export type SheetNamespace = Readonly<{
  Close: typeof SheetClose;
  Content: typeof SheetContent;
  Description: typeof SheetDescription;
  Root: typeof SheetRoot;
  Title: typeof SheetTitle;
  Trigger: typeof SheetTrigger;
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
