import { createContext } from 'preact';
import type { ComponentChildren, VNode } from 'preact';
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

function PopoverRoot({ children, ...options }: PopoverRootProps): VNode {
  const popover = usePopover(options);
  return <PopoverContext.Provider value={popover}>{children}</PopoverContext.Provider>;
}

function PopoverTrigger({ children, ...props }: PopoverTriggerProps): VNode {
  const popover = usePopoverContext('Popover.Trigger');
  return <button {...popover.getTriggerProps(props)}>{withChildren(children)}</button>;
}

function PopoverAnchor({ children, ...props }: PopoverAnchorProps): VNode {
  const popover = usePopoverContext('Popover.Anchor');
  return <div {...popover.getAnchorProps(props)}>{withChildren(children)}</div>;
}

function PopoverPositioner({ children, ...props }: PopoverPositionerProps): VNode {
  const popover = usePopoverContext('Popover.Positioner');
  return <div {...popover.getPositionerProps(props)}>{withChildren(children)}</div>;
}

function PopoverContent({ children, ...props }: PopoverContentProps): VNode {
  const popover = usePopoverContext('Popover.Content');
  return <div {...popover.getContentProps(props)}>{withChildren(children)}</div>;
}

function PopoverTitle({ children, ...props }: PopoverTitleProps): VNode {
  const popover = usePopoverContext('Popover.Title');
  return <h2 {...popover.getTitleProps(props)}>{withChildren(children)}</h2>;
}

function PopoverDescription({ children, ...props }: PopoverDescriptionProps): VNode {
  const popover = usePopoverContext('Popover.Description');
  return <p {...popover.getDescriptionProps(props)}>{withChildren(children)}</p>;
}

function PopoverClose({ children, ...props }: PopoverCloseProps): VNode {
  const popover = usePopoverContext('Popover.Close');
  return <button {...popover.getCloseProps(props)}>{withChildren(children)}</button>;
}

function PopoverArrow({ children, ...props }: PopoverArrowProps): VNode {
  const popover = usePopoverContext('Popover.Arrow');
  return <div {...popover.getArrowProps(props)}>{withChildren(children)}</div>;
}

function PopoverArrowTip({ children, ...props }: PopoverArrowTipProps): VNode {
  const popover = usePopoverContext('Popover.ArrowTip');
  return <div {...popover.getArrowTipProps(props)}>{withChildren(children)}</div>;
}

/** Compound popover namespace type with root and positioning subcomponents. */
export type PopoverNamespace = Readonly<{
  Anchor: (props: any) => unknown;
  Arrow: (props: any) => unknown;
  ArrowTip: (props: any) => unknown;
  Close: (props: any) => unknown;
  Content: (props: any) => unknown;
  Description: (props: any) => unknown;
  Positioner: (props: any) => unknown;
  Root: (props: any) => unknown;
  Title: (props: any) => unknown;
  Trigger: (props: any) => unknown;
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
