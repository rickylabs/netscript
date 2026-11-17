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

function PopoverRoot({ children, ...options }: PopoverRootProps): preact.VNode {
  const popover = usePopover(options);
  return <PopoverContext.Provider value={popover}>{children}</PopoverContext.Provider>;
}

function PopoverTrigger({ children, ...props }: PopoverTriggerProps): preact.VNode {
  const popover = usePopoverContext('Popover.Trigger');
  return <button {...popover.getTriggerProps(props)}>{withChildren(children)}</button>;
}

function PopoverAnchor({ children, ...props }: PopoverAnchorProps): preact.VNode {
  const popover = usePopoverContext('Popover.Anchor');
  return <div {...popover.getAnchorProps(props)}>{withChildren(children)}</div>;
}

function PopoverPositioner({ children, ...props }: PopoverPositionerProps): preact.VNode {
  const popover = usePopoverContext('Popover.Positioner');
  return <div {...popover.getPositionerProps(props)}>{withChildren(children)}</div>;
}

function PopoverContent({ children, ...props }: PopoverContentProps): preact.VNode {
  const popover = usePopoverContext('Popover.Content');
  return <div {...popover.getContentProps(props)}>{withChildren(children)}</div>;
}

function PopoverTitle({ children, ...props }: PopoverTitleProps): preact.VNode {
  const popover = usePopoverContext('Popover.Title');
  return <h2 {...popover.getTitleProps(props)}>{withChildren(children)}</h2>;
}

function PopoverDescription({ children, ...props }: PopoverDescriptionProps): preact.VNode {
  const popover = usePopoverContext('Popover.Description');
  return <p {...popover.getDescriptionProps(props)}>{withChildren(children)}</p>;
}

function PopoverClose({ children, ...props }: PopoverCloseProps): preact.VNode {
  const popover = usePopoverContext('Popover.Close');
  return <button {...popover.getCloseProps(props)}>{withChildren(children)}</button>;
}

function PopoverArrow({ children, ...props }: PopoverArrowProps): preact.VNode {
  const popover = usePopoverContext('Popover.Arrow');
  return <div {...popover.getArrowProps(props)}>{withChildren(children)}</div>;
}

function PopoverArrowTip({ children, ...props }: PopoverArrowTipProps): preact.VNode {
  const popover = usePopoverContext('Popover.ArrowTip');
  return <div {...popover.getArrowTipProps(props)}>{withChildren(children)}</div>;
}

/** Public compound popover parts and their exact prop/result signatures. */
export type PopoverNamespace = Readonly<{
  Anchor: (props: PopoverAnchorProps) => preact.VNode;
  Arrow: (props: PopoverArrowProps) => preact.VNode;
  ArrowTip: (props: PopoverArrowTipProps) => preact.VNode;
  Close: (props: PopoverCloseProps) => preact.VNode;
  Content: (props: PopoverContentProps) => preact.VNode;
  Description: (props: PopoverDescriptionProps) => preact.VNode;
  Positioner: (props: PopoverPositionerProps) => preact.VNode;
  Root: (props: PopoverRootProps) => preact.VNode;
  Title: (props: PopoverTitleProps) => preact.VNode;
  Trigger: (props: PopoverTriggerProps) => preact.VNode;
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
