import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
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

/** Render the tooltip root provider. */
export function TooltipRoot(props: unknown): unknown {
  const { children, ...options } = props as TooltipRootProps;
  const tooltip = useTooltip(options);
  return <TooltipContext.Provider value={tooltip}>{children}</TooltipContext.Provider>;
}

/** Render the button that triggers the tooltip. */
export function TooltipTrigger(props: unknown): unknown {
  const { children, ...triggerProps } = props as TooltipTriggerProps;
  const tooltip = useTooltipContext('Tooltip.Trigger');
  return <button {...tooltip.getTriggerProps(triggerProps)}>{withChildren(children)}</button>;
}

/** Render the tooltip positioning element. */
export function TooltipPositioner(props: unknown): unknown {
  const { children, ...positionerProps } = props as TooltipPositionerProps;
  const tooltip = useTooltipContext('Tooltip.Positioner');
  return <div {...tooltip.getPositionerProps(positionerProps)}>{withChildren(children)}</div>;
}

/** Render the tooltip content element. */
export function TooltipContent(props: unknown): unknown {
  const { children, ...contentProps } = props as TooltipContentProps;
  const tooltip = useTooltipContext('Tooltip.Content');
  return <div {...tooltip.getContentProps(contentProps)}>{withChildren(children)}</div>;
}

/** Render the tooltip arrow element. */
export function TooltipArrow(props: unknown): unknown {
  const { children, ...arrowProps } = props as TooltipArrowProps;
  const tooltip = useTooltipContext('Tooltip.Arrow');
  return <div {...tooltip.getArrowProps(arrowProps)}>{withChildren(children)}</div>;
}

/** Render the tooltip arrow tip element. */
export function TooltipArrowTip(props: unknown): unknown {
  const { children, ...arrowTipProps } = props as TooltipArrowTipProps;
  const tooltip = useTooltipContext('Tooltip.ArrowTip');
  return <div {...tooltip.getArrowTipProps(arrowTipProps)}>{withChildren(children)}</div>;
}

/** Compound tooltip namespace type with root and positioning subcomponents. */
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
