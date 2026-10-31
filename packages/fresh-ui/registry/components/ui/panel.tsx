/**
 * @component Panel
 * @layer 2
 * @depends theme-seed
 * @description Dense secondary surface for sidebars, filter rails, and grouped dashboard controls.
 */

import type { ComponentChildren, JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

export type PanelTone = 'default' | 'muted' | 'raised';

export interface PanelProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  children: ComponentChildren;
  class?: string;
  tone?: PanelTone;
  /** Canonical visual axis; tone is a compatibility alias. */
  variant?: PanelTone;
}

interface PanelSectionProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  children: ComponentChildren;
  class?: string;
}

interface PanelTextProps
  extends Omit<JSX.HTMLAttributes<HTMLParagraphElement>, 'class' | 'children'> {
  children: ComponentChildren;
  class?: string;
}

function PanelRoot(
  { children, class: className, tone = 'default', variant, ...props }: PanelProps,
): VNode {
  return (
    <div
      {...props}
      class={cn('ns-panel', className)}
      data-variant={variant ?? tone}
      data-part='root'
      data-scope='panel'
    >
      {children}
    </div>
  );
}

export function PanelHeader({ children, class: className, ...props }: PanelSectionProps): VNode {
  return (
    <div
      {...props}
      class={cn('ns-panel__header', className)}
      data-part='header'
      data-scope='panel'
    >
      {children}
    </div>
  );
}

export function PanelTitle({ children, class: className, ...props }: PanelTextProps): VNode {
  return (
    <p {...props} class={cn('ns-panel__title', className)} data-part='title' data-scope='panel'>
      {children}
    </p>
  );
}

export function PanelDescription({ children, class: className, ...props }: PanelTextProps): VNode {
  return (
    <p
      {...props}
      class={cn('ns-panel__description', className)}
      data-part='description'
      data-scope='panel'
    >
      {children}
    </p>
  );
}

export function PanelBody({ children, class: className, ...props }: PanelSectionProps): VNode {
  return (
    <div {...props} class={cn('ns-panel__body', className)} data-part='body' data-scope='panel'>
      {children}
    </div>
  );
}

export function PanelFooter({ children, class: className, ...props }: PanelSectionProps): VNode {
  return (
    <div
      {...props}
      class={cn('ns-panel__footer', className)}
      data-part='footer'
      data-scope='panel'
    >
      {children}
    </div>
  );
}

type PanelNamespace =
  & typeof PanelRoot
  & Readonly<{
    Header: typeof PanelHeader;
    Title: typeof PanelTitle;
    Description: typeof PanelDescription;
    Body: typeof PanelBody;
    Footer: typeof PanelFooter;
  }>;

export const Panel: PanelNamespace = Object.assign(PanelRoot, {
  Header: PanelHeader,
  Title: PanelTitle,
  Description: PanelDescription,
  Body: PanelBody,
  Footer: PanelFooter,
});
