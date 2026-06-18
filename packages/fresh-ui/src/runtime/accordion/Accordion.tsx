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

/** Render the accordion root provider and container. */
export function AccordionRoot(props: unknown): unknown {
  const { children, ...options } = props as AccordionRootProps;
  const accordion = useAccordion(options);
  return (
    <AccordionContext.Provider value={accordion}>
      <div {...accordion.getRootProps()}>{children}</div>
    </AccordionContext.Provider>
  );
}

/** Render an accordion item bound to a value. */
export function AccordionItem(props: unknown): unknown {
  const { children, disabled, value, ...itemProps } = props as AccordionItemProps;
  const accordion = useAccordionContext('Accordion.Item');
  const item = { disabled, value };

  return (
    <AccordionItemContext.Provider value={item}>
      <details
        {...(accordion.getItemProps(item, itemProps) as JSX.HTMLAttributes<HTMLDetailsElement>)}
      >
        {withChildren(children)}
      </details>
    </AccordionItemContext.Provider>
  );
}

/** Render the trigger for the current accordion item. */
export function AccordionItemTrigger(props: unknown): unknown {
  const { children, ...triggerOptions } = props as AccordionItemTriggerProps;
  const accordion = useAccordionContext('Accordion.ItemTrigger');
  const item = useAccordionItemContext('Accordion.ItemTrigger');
  const triggerProps = accordion.getItemTriggerProps(item, triggerOptions);
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

/** Render the indicator for the current accordion item. */
export function AccordionItemIndicator(props: unknown): unknown {
  const { children, ...indicatorProps } = props as AccordionItemIndicatorProps;
  const accordion = useAccordionContext('Accordion.ItemIndicator');
  const item = useAccordionItemContext('Accordion.ItemIndicator');
  return <div {...accordion.getItemIndicatorProps(item, indicatorProps)}>{withChildren(children)}</div>;
}

/** Render the content panel for the current accordion item. */
export function AccordionItemContent(props: unknown): unknown {
  const { children, ...contentProps } = props as AccordionItemContentProps;
  const accordion = useAccordionContext('Accordion.ItemContent');
  const item = useAccordionItemContext('Accordion.ItemContent');
  return <div {...accordion.getItemContentProps(item, contentProps)}>{withChildren(children)}</div>;
}

/** Compound accordion namespace type with root and item subcomponents. */
export type AccordionNamespace = Readonly<{
  Item: typeof AccordionItem;
  ItemContent: typeof AccordionItemContent;
  ItemIndicator: typeof AccordionItemIndicator;
  ItemTrigger: typeof AccordionItemTrigger;
  Root: typeof AccordionRoot;
}>;

/** Compound accordion namespace with root and item subcomponents. */
export const Accordion: AccordionNamespace = {
  Item: AccordionItem,
  ItemContent: AccordionItemContent,
  ItemIndicator: AccordionItemIndicator,
  ItemTrigger: AccordionItemTrigger,
  Root: AccordionRoot,
};
