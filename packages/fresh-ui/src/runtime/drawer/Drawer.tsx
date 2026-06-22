import { createContext } from 'preact';
import type { ComponentChildren, VNode } from 'preact';
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

function DrawerRoot({ children, ...options }: DrawerRootProps): VNode {
  const drawer = useDrawer(options);
  return <DrawerContext.Provider value={drawer}>{children}</DrawerContext.Provider>;
}

function DrawerTrigger({ children, ...props }: DrawerTriggerProps): VNode {
  const drawer = useDrawerContext('Drawer.Trigger');
  return <button {...drawer.getTriggerProps(props)}>{withChildren(children)}</button>;
}

function DrawerContent({ children, ...props }: DrawerContentProps): VNode {
  const drawer = useDrawerContext('Drawer.Content');
  return <dialog {...drawer.getContentProps(props)}>{withChildren(children)}</dialog>;
}

function DrawerTitle({ children, ...props }: DrawerTitleProps): VNode {
  const drawer = useDrawerContext('Drawer.Title');
  return <h2 {...drawer.getTitleProps(props)}>{withChildren(children)}</h2>;
}

function DrawerDescription({ children, ...props }: DrawerDescriptionProps): VNode {
  const drawer = useDrawerContext('Drawer.Description');
  return <p {...drawer.getDescriptionProps(props)}>{withChildren(children)}</p>;
}

function DrawerClose({ children, ...props }: DrawerCloseProps): VNode {
  const drawer = useDrawerContext('Drawer.Close');
  return <button {...drawer.getCloseProps(props)}>{withChildren(children)}</button>;
}

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
