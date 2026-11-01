/**
 * @component Card
 * @layer 2
 * @depends theme-seed
 * @description Elevated content surface for dashboard tiles, summaries, and grouped content.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

interface CardSectionProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  children: Renderable;
  class?: string;
  'data-part'?: string;
  'data-scope'?: string;
}

interface CardProps extends CardSectionProps {
  interactive?: boolean;
  variant?: 'default' | 'rule';
  size?: 'md' | 'sm';
  /** Visual snapshot; native child controls remain the keyboard targets. */
  state?: 'rest' | 'hover' | 'focus' | 'selected';
}

interface CardTextProps
  extends Omit<JSX.HTMLAttributes<HTMLParagraphElement>, 'class' | 'children'> {
  'data-scope'?: string;
  children: Renderable;
  class?: string;
}

type CardComponent = ((props: CardProps) => VNode) & {
  Header: (props: CardSectionProps) => VNode;
  Title: (props: CardTextProps) => VNode;
  Description: (props: CardTextProps) => VNode;
  Action: (props: CardSectionProps) => VNode;
  Body: (props: CardSectionProps) => VNode;
  Footer: (props: CardSectionProps) => VNode;
};

function CardRoot(
  {
    children,
    class: className,
    interactive = false,
    variant = 'default',
    size = 'md',
    state = 'rest',
    ...props
  }: CardProps,
): VNode {
  return (
    <div
      {...props}
      class={cn('ns-card', className)}
      data-interactive={interactive ? ('true') : undefined}
      data-variant={variant}
      data-size={size}
      data-state={state}
      data-part={props['data-part'] ?? 'root'}
      data-scope={props['data-scope'] ?? 'card'}
    >
      {children}
    </div>
  );
}

/** Optional native action content; the card adds no click or keyboard handler. */
function CardAction({ children, class: className, ...props }: CardSectionProps): VNode {
  return (
    <div
      {...props}
      class={cn('ns-card__action', className)}
      data-part='action'
      data-scope={props['data-scope'] ?? 'card'}
    >
      {children}
    </div>
  );
}

function CardHeader({ children, class: className, ...props }: CardSectionProps): VNode {
  return (
    <div
      {...props}
      class={cn('ns-card__header', className)}
      data-part='header'
      data-scope={props['data-scope'] ?? 'card'}
    >
      {children}
    </div>
  );
}

function CardTitle({ children, class: className, ...props }: CardTextProps): VNode {
  return (
    <p
      {...props}
      class={cn('ns-card__title', className)}
      data-part='title'
      data-scope={props['data-scope'] ?? 'card'}
    >
      {children}
    </p>
  );
}

function CardDescription({ children, class: className, ...props }: CardTextProps): VNode {
  return (
    <p
      {...props}
      class={cn('ns-card__description', className)}
      data-part='description'
      data-scope={props['data-scope'] ?? 'card'}
    >
      {children}
    </p>
  );
}

function CardBody({ children, class: className, ...props }: CardSectionProps): VNode {
  return (
    <div
      {...props}
      class={cn('ns-card__body', className)}
      data-part='body'
      data-scope={props['data-scope'] ?? 'card'}
    >
      {children}
    </div>
  );
}

function CardFooter({ children, class: className, ...props }: CardSectionProps): VNode {
  return (
    <div
      {...props}
      class={cn('ns-card__footer', className)}
      data-part='footer'
      data-scope={props['data-scope'] ?? 'card'}
    >
      {children}
    </div>
  );
}

/**
 * Card surface with header, body, footer, and text sub-seams.
 */
export const Card: CardComponent = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Action: CardAction,
  Body: CardBody,
  Footer: CardFooter,
});
