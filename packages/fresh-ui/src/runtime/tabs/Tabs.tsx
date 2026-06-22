import { createContext } from 'preact';
import type { ComponentChildren, VNode } from 'preact';
import { useContext } from 'preact/hooks';
import { requireFreshUiContext } from '../_internal/context-error.ts';
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
  return <div {...tabs.getListProps(props)}>{withChildren(children)}</div>;
}

function TabsTrigger({ children, value, ...props }: TabsTriggerProps): VNode {
  const tabs = useTabsContext('Tabs.Trigger');
  return <button {...tabs.getTriggerProps(value, props)}>{withChildren(children)}</button>;
}

function TabsContent({ children, value, ...props }: TabsContentProps): VNode {
  const tabs = useTabsContext('Tabs.Content');
  return <div {...tabs.getContentProps(value, props)}>{withChildren(children)}</div>;
}

export type TabsNamespace = Readonly<{
  Content: typeof TabsContent;
  List: typeof TabsList;
  Root: typeof TabsRoot;
  Trigger: typeof TabsTrigger;
}>;

/** Compound tabs namespace with root, list, trigger, and content subcomponents. */
export const Tabs: TabsNamespace = {
  Content: TabsContent,
  List: TabsList,
  Root: TabsRoot,
  Trigger: TabsTrigger,
};
