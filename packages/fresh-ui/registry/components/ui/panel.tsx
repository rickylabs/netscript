/**
 * @component Panel
 * @layer 2
 * @depends theme-seed
 * @description Dense secondary surface for sidebars, filter rails, and grouped dashboard controls.
 */

import type { ComponentChildren, JSX } from 'preact';
import { cn } from '../../lib/cn.ts';

export type PanelTone = 'default' | 'muted' | 'raised';

export interface PanelProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  children: ComponentChildren;
  class?: string;
  tone?: PanelTone;
}

interface PanelSectionProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  children: ComponentChildren;
  class?: string;
}

interface PanelTextProps extends Omit<JSX.HTMLAttributes<HTMLParagraphElement>, 'class' | 'children'> {
  children: ComponentChildren;
  class?: string;
}

const TONE_CLASSES: Record<PanelTone, string | undefined> = {
  default: undefined,
  muted: 'ns-panel--muted',
  raised: 'ns-panel--raised',
};

function PanelRoot({ children, class: className, tone = 'default', ...props }: PanelProps) {
  return <div {...props} class={cn('ns-panel', TONE_CLASSES[tone], className)}>{children}</div>;
}

export function PanelHeader({ children, class: className, ...props }: PanelSectionProps) {
  return <div {...props} class={cn('ns-panel__header', className)}>{children}</div>;
}

export function PanelTitle({ children, class: className, ...props }: PanelTextProps) {
  return <p {...props} class={cn('ns-panel__title', className)}>{children}</p>;
}

export function PanelDescription({ children, class: className, ...props }: PanelTextProps) {
  return <p {...props} class={cn('ns-panel__description', className)}>{children}</p>;
}

export function PanelBody({ children, class: className, ...props }: PanelSectionProps) {
  return <div {...props} class={cn('ns-panel__body', className)}>{children}</div>;
}

export function PanelFooter({ children, class: className, ...props }: PanelSectionProps) {
  return <div {...props} class={cn('ns-panel__footer', className)}>{children}</div>;
}

export const Panel = Object.assign(PanelRoot, {
  Header: PanelHeader,
  Title: PanelTitle,
  Description: PanelDescription,
  Body: PanelBody,
  Footer: PanelFooter,
});