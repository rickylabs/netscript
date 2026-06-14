import { createContext } from 'preact';
import type { ComponentChildren, JSX, VNode } from 'preact';
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

function AccordionRoot({ children, ...options }: AccordionRootProps): VNode {
  const accordion = useAccordion(options);
  return (
    <AccordionContext.Provider value={accordion}>
      <div {...accordion.getRootProps()}>{children}</div>
    </AccordionContext.Provider>
  );
}

function AccordionItem({ children, disabled, value, ...props }: AccordionItemProps): VNode {
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

function AccordionItemTrigger({ children, ...props }: AccordionItemTriggerProps): VNode {
  const accordion = useAccordionContext('Accordion.ItemTrigger');
  const item = useAccordionItemContext('Accordion.ItemTrigger');
  const triggerProps = accordion.getItemTriggerProps(item, props);
  const { disabled, onClick, type: _type, ...summaryProps } = triggerProps;

  return (
    <summary
      {...(summaryProps as JSX.HTMLAttributes<HTMLElement>)}
      aria-disabled={disabled ? 'true' : summaryProps['aria-disabled']}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event as unknown as JSX.TargetedMouseEvent<HTMLButtonElement>);
      }}
      role={summaryProps.role ?? 'button'}
    >
      {withChildren(children)}
    </summary>
  );
}

function AccordionItemIndicator({ children, ...props }: AccordionItemIndicatorProps): VNode {
  const accordion = useAccordionContext('Accordion.ItemIndicator');
  const item = useAccordionItemContext('Accordion.ItemIndicator');
  return <div {...accordion.getItemIndicatorProps(item, props)}>{withChildren(children)}</div>;
}

function AccordionItemContent({ children, ...props }: AccordionItemContentProps): VNode {
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
