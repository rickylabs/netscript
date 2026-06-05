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

function withChildren(children: ComponentChildren) {
  return children;
}

function PopoverRoot({ children, ...options }: PopoverRootProps): unknown {
  const popover = usePopover(options);
  return <PopoverContext.Provider value={popover}>{children}</PopoverContext.Provider>;
}

function PopoverTrigger({ children, ...props }: PopoverTriggerProps): unknown {
  const popover = usePopoverContext('Popover.Trigger');
  return <button {...popover.getTriggerProps(props)}>{withChildren(children)}</button>;
}

function PopoverAnchor({ children, ...props }: PopoverAnchorProps): unknown {
  const popover = usePopoverContext('Popover.Anchor');
  return <div {...popover.getAnchorProps(props)}>{withChildren(children)}</div>;
}

function PopoverPositioner({ children, ...props }: PopoverPositionerProps): unknown {
  const popover = usePopoverContext('Popover.Positioner');
  return <div {...popover.getPositionerProps(props)}>{withChildren(children)}</div>;
}

function PopoverContent({ children, ...props }: PopoverContentProps): unknown {
  const popover = usePopoverContext('Popover.Content');
  return <div {...popover.getContentProps(props)}>{withChildren(children)}</div>;
}

function PopoverTitle({ children, ...props }: PopoverTitleProps): unknown {
  const popover = usePopoverContext('Popover.Title');
  return <h2 {...popover.getTitleProps(props)}>{withChildren(children)}</h2>;
}

function PopoverDescription({ children, ...props }: PopoverDescriptionProps): unknown {
  const popover = usePopoverContext('Popover.Description');
  return <p {...popover.getDescriptionProps(props)}>{withChildren(children)}</p>;
}

function PopoverClose({ children, ...props }: PopoverCloseProps): unknown {
  const popover = usePopoverContext('Popover.Close');
  return <button {...popover.getCloseProps(props)}>{withChildren(children)}</button>;
}

function PopoverArrow({ children, ...props }: PopoverArrowProps): unknown {
  const popover = usePopoverContext('Popover.Arrow');
  return <div {...popover.getArrowProps(props)}>{withChildren(children)}</div>;
}

function PopoverArrowTip({ children, ...props }: PopoverArrowTipProps): unknown {
  const popover = usePopoverContext('Popover.ArrowTip');
  return <div {...popover.getArrowTipProps(props)}>{withChildren(children)}</div>;
}

/** Compound popover namespace with root and positioning subcomponents. */
export const Popover = {
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
