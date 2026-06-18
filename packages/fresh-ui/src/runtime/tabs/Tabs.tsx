import { createContext } from 'preact';
import type { ComponentChildren, JSX, VNode } from 'preact';
import { useContext } from 'preact/hooks';
import { requireFreshUiContext } from '../_internal/context-error.ts';
import type { FreshUiChild } from '../_internal/public-props.ts';
import type {
  TabsContentProps,
  TabsListProps,
  TabsRootProps,
  TabsTriggerProps,
  UseTabsReturn,
} from './tabs.types.ts';
import { useTabs } from './use-tabs.ts';

const TabsContext = createContext<UseTabsReturn | null>(null);

function useTabsContext(partName: string): UseTabsReturn {
  return requireFreshUiContext(useContext(TabsContext), partName, 'Tabs.Root');
}

function withChildren(children: ComponentChildren): ComponentChildren {
  return children;
}

function TabsRoot({ children, ...options }: TabsRootProps): VNode {
  const tabs = useTabs(options);
  return <TabsContext.Provider value={tabs}>{children}</TabsContext.Provider>;
}

function TabsList({ children, ...props }: TabsListProps): VNode {
  const tabs = useTabsContext('Tabs.List');
  return (
    <div {...tabs.getListProps(props as JSX.HTMLAttributes<HTMLDivElement>)}>
      {withChildren(children)}
    </div>
  );
}

function TabsTrigger({ children, value, ...props }: TabsTriggerProps): VNode {
  const tabs = useTabsContext('Tabs.Trigger');
  return (
    <button {...tabs.getTriggerProps(value, props as JSX.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {withChildren(children)}
    </button>
  );
}

function TabsContent({ children, value, ...props }: TabsContentProps): VNode {
  const tabs = useTabsContext('Tabs.Content');
  return (
    <div {...tabs.getContentProps(value, props as JSX.HTMLAttributes<HTMLDivElement>)}>
      {withChildren(children)}
    </div>
  );
}

/** Compound tabs namespace type with root, list, trigger, and content subcomponents. */
export type TabsNamespace = Readonly<{
  Content: (props: TabsContentProps) => FreshUiChild;
  List: (props: TabsListProps) => FreshUiChild;
  Root: (props: TabsRootProps) => FreshUiChild;
  Trigger: (props: TabsTriggerProps) => FreshUiChild;
}>;

/** Compound tabs namespace with root, list, trigger, and content subcomponents. */
export const Tabs: TabsNamespace = {
  Content: TabsContent,
  List: TabsList,
  Root: TabsRoot,
  Trigger: TabsTrigger,
};
