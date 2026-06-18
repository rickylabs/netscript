import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';
import { requireFreshUiContext } from '../_internal/context-error.ts';
import type {
  PopoverAnchorProps,
  PopoverArrowProps,
  PopoverArrowTipProps,
  PopoverCloseProps,
  PopoverContentProps,
  PopoverDescriptionProps,
  PopoverPositionerProps,
  PopoverRootProps,
  PopoverTitleProps,
  PopoverTriggerProps,
  UsePopoverReturn,
} from './popover.types.ts';
import { usePopover } from './use-popover.ts';

const PopoverContext = createContext<UsePopoverReturn | null>(null);

function usePopoverContext(partName: string): UsePopoverReturn {
  return requireFreshUiContext(useContext(PopoverContext), partName, 'Popover.Root');
}

function withChildren(children: ComponentChildren): ComponentChildren {
  return children;
}

/** Render the popover root provider. */
export function PopoverRoot(props: unknown): unknown {
  const { children, ...options } = props as PopoverRootProps;
  const popover = usePopover(options);
  return <PopoverContext.Provider value={popover}>{children}</PopoverContext.Provider>;
}

/** Render the button that toggles the popover. */
export function PopoverTrigger(props: unknown): unknown {
  const { children, ...triggerProps } = props as PopoverTriggerProps;
  const popover = usePopoverContext('Popover.Trigger');
  return <button {...popover.getTriggerProps(triggerProps)}>{withChildren(children)}</button>;
}

/** Render the popover anchor element. */
export function PopoverAnchor(props: unknown): unknown {
  const { children, ...anchorProps } = props as PopoverAnchorProps;
  const popover = usePopoverContext('Popover.Anchor');
  return <div {...popover.getAnchorProps(anchorProps)}>{withChildren(children)}</div>;
}

/** Render the popover positioning element. */
export function PopoverPositioner(props: unknown): unknown {
  const { children, ...positionerProps } = props as PopoverPositionerProps;
  const popover = usePopoverContext('Popover.Positioner');
  return <div {...popover.getPositionerProps(positionerProps)}>{withChildren(children)}</div>;
}

/** Render the popover content element. */
export function PopoverContent(props: unknown): unknown {
  const { children, ...contentProps } = props as PopoverContentProps;
  const popover = usePopoverContext('Popover.Content');
  return <div {...popover.getContentProps(contentProps)}>{withChildren(children)}</div>;
}

/** Render the popover title element. */
export function PopoverTitle(props: unknown): unknown {
  const { children, ...titleProps } = props as PopoverTitleProps;
  const popover = usePopoverContext('Popover.Title');
  return <h2 {...popover.getTitleProps(titleProps)}>{withChildren(children)}</h2>;
}

/** Render the popover description element. */
export function PopoverDescription(props: unknown): unknown {
  const { children, ...descriptionProps } = props as PopoverDescriptionProps;
  const popover = usePopoverContext('Popover.Description');
  return <p {...popover.getDescriptionProps(descriptionProps)}>{withChildren(children)}</p>;
}

/** Render the button that closes the popover. */
export function PopoverClose(props: unknown): unknown {
  const { children, ...closeProps } = props as PopoverCloseProps;
  const popover = usePopoverContext('Popover.Close');
  return <button {...popover.getCloseProps(closeProps)}>{withChildren(children)}</button>;
}

/** Render the popover arrow element. */
export function PopoverArrow(props: unknown): unknown {
  const { children, ...arrowProps } = props as PopoverArrowProps;
  const popover = usePopoverContext('Popover.Arrow');
  return <div {...popover.getArrowProps(arrowProps)}>{withChildren(children)}</div>;
}

/** Render the popover arrow tip element. */
export function PopoverArrowTip(props: unknown): unknown {
  const { children, ...arrowTipProps } = props as PopoverArrowTipProps;
  const popover = usePopoverContext('Popover.ArrowTip');
  return <div {...popover.getArrowTipProps(arrowTipProps)}>{withChildren(children)}</div>;
}

/** Compound popover namespace type with root and positioning subcomponents. */
export type PopoverNamespace = Readonly<{
  Anchor: typeof PopoverAnchor;
  Arrow: typeof PopoverArrow;
  ArrowTip: typeof PopoverArrowTip;
  Close: typeof PopoverClose;
  Content: typeof PopoverContent;
  Description: typeof PopoverDescription;
  Positioner: typeof PopoverPositioner;
  Root: typeof PopoverRoot;
  Title: typeof PopoverTitle;
  Trigger: typeof PopoverTrigger;
}>;

/** Compound popover namespace with root and positioning subcomponents. */
export const Popover: PopoverNamespace = {
  Anchor: PopoverAnchor,
  Arrow: PopoverArrow,
  ArrowTip: PopoverArrowTip,
  Close: PopoverClose,
  Content: PopoverContent,
  Description: PopoverDescription,
  Positioner: PopoverPositioner,
  Root: PopoverRoot,
  Title: PopoverTitle,
  Trigger: PopoverTrigger,
};
