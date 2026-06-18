import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
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

/** Render the tabs root provider. */
export function TabsRoot(props: unknown): unknown {
  const { children, ...options } = props as TabsRootProps;
  const tabs = useTabs(options);
  return <TabsContext.Provider value={tabs}>{children}</TabsContext.Provider>;
}

/** Render the tabs list element. */
export function TabsList(props: unknown): unknown {
  const { children, ...listProps } = props as TabsListProps;
  const tabs = useTabsContext('Tabs.List');
  return <div {...tabs.getListProps(listProps)}>{withChildren(children)}</div>;
}

/** Render a tabs trigger for a value. */
export function TabsTrigger(props: unknown): unknown {
  const { children, value, ...triggerProps } = props as TabsTriggerProps;
  const tabs = useTabsContext('Tabs.Trigger');
  return <button {...tabs.getTriggerProps(value, triggerProps)}>{withChildren(children)}</button>;
}

/** Render a tabs content panel for a value. */
export function TabsContent(props: unknown): unknown {
  const { children, value, ...contentProps } = props as TabsContentProps;
  const tabs = useTabsContext('Tabs.Content');
  return <div {...tabs.getContentProps(value, contentProps)}>{withChildren(children)}</div>;
}

/** Compound tabs namespace type with root, list, trigger, and content subcomponents. */
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
