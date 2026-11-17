import { createContext } from 'preact';
import type { ComponentChildren, JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { requireFreshUiContext } from '../_internal/context-error.ts';
import type {
  AccordionItemContentProps,
  AccordionItemIndicatorProps,
  AccordionItemOptions,
  AccordionItemProps,
  AccordionItemTriggerProps,
  AccordionRootProps,
  UseAccordionReturn,
} from './accordion.types.ts';
import { useAccordion } from './use-accordion.ts';

const AccordionContext = createContext<UseAccordionReturn | null>(null);
const AccordionItemContext = createContext<AccordionItemOptions | null>(null);

function useAccordionContext(partName: string): UseAccordionReturn {
  return requireFreshUiContext(useContext(AccordionContext), partName, 'Accordion.Root');
}

function useAccordionItemContext(partName: string): AccordionItemOptions {
  return requireFreshUiContext(useContext(AccordionItemContext), partName, 'Accordion.Item');
}

function withChildren(children: ComponentChildren): ComponentChildren {
  return children;
}

function AccordionRoot({ children, ...options }: AccordionRootProps): preact.VNode {
  const accordion = useAccordion(options);
  return (
    <AccordionContext.Provider value={accordion}>
      <div {...accordion.getRootProps()}>{children}</div>
    </AccordionContext.Provider>
  );
}

function AccordionItem({ children, disabled, value, ...props }: AccordionItemProps): preact.VNode {
  const accordion = useAccordionContext('Accordion.Item');
  const item = { disabled, value };

  return (
    <AccordionItemContext.Provider value={item}>
      <details {...(accordion.getItemProps(item, props) as JSX.HTMLAttributes<HTMLDetailsElement>)}>
        {withChildren(children)}
      </details>
    </AccordionItemContext.Provider>
  );
}

function AccordionItemTrigger({ children, ...props }: AccordionItemTriggerProps): preact.VNode {
  const accordion = useAccordionContext('Accordion.ItemTrigger');
  const item = useAccordionItemContext('Accordion.ItemTrigger');
  const triggerProps = accordion.getItemTriggerProps(item, props);
  const { onClick, ...summaryProps } = triggerProps;

  return (
    <summary
      {...(summaryProps as JSX.HTMLAttributes<HTMLElement>)}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      role={summaryProps.role ?? 'button'}
    >
      {withChildren(children)}
    </summary>
  );
}

function AccordionItemIndicator({ children, ...props }: AccordionItemIndicatorProps): preact.VNode {
  const accordion = useAccordionContext('Accordion.ItemIndicator');
  const item = useAccordionItemContext('Accordion.ItemIndicator');
  return <div {...accordion.getItemIndicatorProps(item, props)}>{withChildren(children)}</div>;
}

function AccordionItemContent({ children, ...props }: AccordionItemContentProps): preact.VNode {
  const accordion = useAccordionContext('Accordion.ItemContent');
  const item = useAccordionItemContext('Accordion.ItemContent');
  return <div {...accordion.getItemContentProps(item, props)}>{withChildren(children)}</div>;
}

/** Public compound accordion parts and their exact prop/result signatures. */
export type AccordionNamespace = Readonly<{
  Item: (props: AccordionItemProps) => preact.VNode;
  ItemContent: (props: AccordionItemContentProps) => preact.VNode;
  ItemIndicator: (props: AccordionItemIndicatorProps) => preact.VNode;
  ItemTrigger: (props: AccordionItemTriggerProps) => preact.VNode;
  Root: (props: AccordionRootProps) => preact.VNode;
}>;

/** Compound accordion namespace with root and item subcomponents. */
export const Accordion: AccordionNamespace = {
  Item: AccordionItem,
  ItemContent: AccordionItemContent,
  ItemIndicator: AccordionItemIndicator,
  ItemTrigger: AccordionItemTrigger,
  Root: AccordionRoot,
};
