import { createContext } from 'preact';
import type { ComponentChildren, VNode } from 'preact';
import { useContext } from 'preact/hooks';
import { requireFreshUiContext } from '../_internal/context-error.ts';
import type {
  TooltipArrowProps,
  TooltipArrowTipProps,
  TooltipContentProps,
  TooltipPositionerProps,
  TooltipRootProps,
  TooltipTriggerProps,
  UseTooltipReturn,
} from './tooltip.types.ts';
import { useTooltip } from './use-tooltip.ts';

const TooltipContext = createContext<UseTooltipReturn | null>(null);

function useTooltipContext(partName: string): UseTooltipReturn {
  return requireFreshUiContext(useContext(TooltipContext), partName, 'Tooltip.Root');
}

function withChildren(children: ComponentChildren): ComponentChildren {
  return children;
}

function TooltipRoot({ children, ...options }: TooltipRootProps): VNode {
  const tooltip = useTooltip(options);
  return <TooltipContext.Provider value={tooltip}>{children}</TooltipContext.Provider>;
}

function TooltipTrigger({ children, ...props }: TooltipTriggerProps): VNode {
  const tooltip = useTooltipContext('Tooltip.Trigger');
  return <button {...tooltip.getTriggerProps(props)}>{withChildren(children)}</button>;
}

function TooltipPositioner({ children, ...props }: TooltipPositionerProps): VNode {
  const tooltip = useTooltipContext('Tooltip.Positioner');
  return <div {...tooltip.getPositionerProps(props)}>{withChildren(children)}</div>;
}

function TooltipContent({ children, ...props }: TooltipContentProps): VNode {
  const tooltip = useTooltipContext('Tooltip.Content');
  return <div {...tooltip.getContentProps(props)}>{withChildren(children)}</div>;
}

function TooltipArrow({ children, ...props }: TooltipArrowProps): VNode {
  const tooltip = useTooltipContext('Tooltip.Arrow');
  return <div {...tooltip.getArrowProps(props)}>{withChildren(children)}</div>;
}

function TooltipArrowTip({ children, ...props }: TooltipArrowTipProps): VNode {
  const tooltip = useTooltipContext('Tooltip.ArrowTip');
  return <div {...tooltip.getArrowTipProps(props)}>{withChildren(children)}</div>;
}

export type TooltipNamespace = Readonly<{
  Arrow: typeof TooltipArrow;
  ArrowTip: typeof TooltipArrowTip;
  Content: typeof TooltipContent;
  Positioner: typeof TooltipPositioner;
  Root: typeof TooltipRoot;
  Trigger: typeof TooltipTrigger;
}>;

/** Compound tooltip namespace with root and positioning subcomponents. */
export const Tooltip: TooltipNamespace = {
  Arrow: TooltipArrow,
  ArrowTip: TooltipArrowTip,
  Content: TooltipContent,
  Positioner: TooltipPositioner,
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
};
