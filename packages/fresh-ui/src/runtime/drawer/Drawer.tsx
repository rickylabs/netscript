import { createContext } from 'preact';
import type { ComponentChildren, JSX, VNode } from 'preact';
import { useContext } from 'preact/hooks';
import { requireFreshUiContext } from '../_internal/context-error.ts';
import type { FreshUiChild } from '../_internal/public-props.ts';
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
  return (
    <button {...drawer.getTriggerProps(props as JSX.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {withChildren(children)}
    </button>
  );
}

function DrawerContent({ children, ...props }: DrawerContentProps): VNode {
  const drawer = useDrawerContext('Drawer.Content');
  return (
    <dialog {...drawer.getContentProps(props as JSX.HTMLAttributes<HTMLDialogElement>)}>
      {withChildren(children)}
    </dialog>
  );
}

function DrawerTitle({ children, ...props }: DrawerTitleProps): VNode {
  const drawer = useDrawerContext('Drawer.Title');
  return (
    <h2 {...drawer.getTitleProps(props as JSX.HTMLAttributes<HTMLHeadingElement>)}>
      {withChildren(children)}
    </h2>
  );
}

function DrawerDescription({ children, ...props }: DrawerDescriptionProps): VNode {
  const drawer = useDrawerContext('Drawer.Description');
  return (
    <p {...drawer.getDescriptionProps(props as JSX.HTMLAttributes<HTMLParagraphElement>)}>
      {withChildren(children)}
    </p>
  );
}

function DrawerClose({ children, ...props }: DrawerCloseProps): VNode {
  const drawer = useDrawerContext('Drawer.Close');
  return (
    <button {...drawer.getCloseProps(props as JSX.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {withChildren(children)}
    </button>
  );
}

/** Compound drawer namespace type with root and structural subcomponents. */
export type DrawerNamespace = Readonly<{
  Close: (props: DrawerCloseProps) => FreshUiChild;
  Content: (props: DrawerContentProps) => FreshUiChild;
  Description: (props: DrawerDescriptionProps) => FreshUiChild;
  Root: (props: DrawerRootProps) => FreshUiChild;
  Title: (props: DrawerTitleProps) => FreshUiChild;
  Trigger: (props: DrawerTriggerProps) => FreshUiChild;
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
