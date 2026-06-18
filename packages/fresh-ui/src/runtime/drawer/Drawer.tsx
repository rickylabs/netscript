import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';
import { requireFreshUiContext } from '../_internal/context-error.ts';
import type {
  DrawerCloseProps,
  DrawerContentProps,
  DrawerDescriptionProps,
  DrawerRootProps,
  DrawerTitleProps,
  DrawerTriggerProps,
  UseDrawerReturn,
} from './drawer.types.ts';
import { useDrawer } from './use-drawer.ts';

const DrawerContext = createContext<UseDrawerReturn | null>(null);

function useDrawerContext(partName: string): UseDrawerReturn {
  return requireFreshUiContext(useContext(DrawerContext), partName, 'Drawer.Root');
}

function withChildren(children: ComponentChildren): ComponentChildren {
  return children;
}

/** Render the drawer root provider. */
export function DrawerRoot(props: unknown): unknown {
  const { children, ...options } = props as DrawerRootProps;
  const drawer = useDrawer(options);
  return <DrawerContext.Provider value={drawer}>{children}</DrawerContext.Provider>;
}

/** Render the button that opens the drawer. */
export function DrawerTrigger(props: unknown): unknown {
  const { children, ...triggerProps } = props as DrawerTriggerProps;
  const drawer = useDrawerContext('Drawer.Trigger');
  return <button {...drawer.getTriggerProps(triggerProps)}>{withChildren(children)}</button>;
}

/** Render the drawer content element. */
export function DrawerContent(props: unknown): unknown {
  const { children, ...contentProps } = props as DrawerContentProps;
  const drawer = useDrawerContext('Drawer.Content');
  return <dialog {...drawer.getContentProps(contentProps)}>{withChildren(children)}</dialog>;
}

/** Render the drawer title element. */
export function DrawerTitle(props: unknown): unknown {
  const { children, ...titleProps } = props as DrawerTitleProps;
  const drawer = useDrawerContext('Drawer.Title');
  return <h2 {...drawer.getTitleProps(titleProps)}>{withChildren(children)}</h2>;
}

/** Render the drawer description element. */
export function DrawerDescription(props: unknown): unknown {
  const { children, ...descriptionProps } = props as DrawerDescriptionProps;
  const drawer = useDrawerContext('Drawer.Description');
  return <p {...drawer.getDescriptionProps(descriptionProps)}>{withChildren(children)}</p>;
}

/** Render the button that closes the drawer. */
export function DrawerClose(props: unknown): unknown {
  const { children, ...closeProps } = props as DrawerCloseProps;
  const drawer = useDrawerContext('Drawer.Close');
  return <button {...drawer.getCloseProps(closeProps)}>{withChildren(children)}</button>;
}

/** Compound drawer namespace type with root and structural subcomponents. */
export type DrawerNamespace = Readonly<{
  Close: typeof DrawerClose;
  Content: typeof DrawerContent;
  Description: typeof DrawerDescription;
  Root: typeof DrawerRoot;
  Title: typeof DrawerTitle;
  Trigger: typeof DrawerTrigger;
}>;

/** Compound drawer namespace with root and structural subcomponents. */
export const Drawer: DrawerNamespace = {
  Close: DrawerClose,
  Content: DrawerContent,
  Description: DrawerDescription,
  Root: DrawerRoot,
  Title: DrawerTitle,
  Trigger: DrawerTrigger,
};
