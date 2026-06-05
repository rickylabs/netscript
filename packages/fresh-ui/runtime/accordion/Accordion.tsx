import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
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

function withChildren(children: ComponentChildren) {
  return children;
}

function AccordionRoot({ children, ...options }: AccordionRootProps): unknown {
  const accordion = useAccordion(options);
  return <AccordionContext.Provider value={accordion}>{children}</AccordionContext.Provider>;
}

function AccordionItem({ children, disabled, value, ...props }: AccordionItemProps): unknown {
  const accordion = useAccordionContext('Accordion.Item');
  const item = { disabled, value };

  return (
    <AccordionItemContext.Provider value={item}>
      <div {...accordion.getItemProps(item, props)}>{withChildren(children)}</div>
    </AccordionItemContext.Provider>
  );
}

function AccordionItemTrigger({ children, ...props }: AccordionItemTriggerProps): unknown {
  const accordion = useAccordionContext('Accordion.ItemTrigger');
  const item = useAccordionItemContext('Accordion.ItemTrigger');
  return <button {...accordion.getItemTriggerProps(item, props)}>{withChildren(children)}</button>;
}

function AccordionItemIndicator({ children, ...props }: AccordionItemIndicatorProps): unknown {
  const accordion = useAccordionContext('Accordion.ItemIndicator');
  const item = useAccordionItemContext('Accordion.ItemIndicator');
  return <div {...accordion.getItemIndicatorProps(item, props)}>{withChildren(children)}</div>;
}

function AccordionItemContent({ children, ...props }: AccordionItemContentProps): unknown {
  const accordion = useAccordionContext('Accordion.ItemContent');
  const item = useAccordionItemContext('Accordion.ItemContent');
  return <div {...accordion.getItemContentProps(item, props)}>{withChildren(children)}</div>;
}

/** Compound accordion namespace with root and item subcomponents. */
export const Accordion = {
  Item: AccordionItem,
  ItemContent: AccordionItemContent,
  ItemIndicator: AccordionItemIndicator,
  ItemTrigger: AccordionItemTrigger,
  Root: AccordionRoot,
};
