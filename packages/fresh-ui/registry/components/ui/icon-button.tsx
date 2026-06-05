/**
 * @component IconButton
 * @layer 2
 * @depends theme-seed, button
 * @description Compact icon-only action button with accessible labeling.
 */

import type { JSX, VNode } from 'preact';
import { Button, type ButtonVariant } from './button.tsx';
import type { Renderable } from '../../lib/public-types.ts';

interface SharedIconButtonProps {
  class?: string;
  disabled?: boolean;
  icon: Renderable;
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
}

type IconButtonElementType = 'button' | 'submit' | 'reset';

type IconButtonAsButtonProps = SharedIconButtonProps & Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'class' | 'type'
> & {
  type?: IconButtonElementType;
  href?: never;
  clientNav?: never;
};

type IconButtonAsLinkProps = SharedIconButtonProps & Omit<
  JSX.AnchorHTMLAttributes<HTMLAnchorElement>,
  'children' | 'class' | 'href' | 'type'
> & {
  type: 'link';
  href: string;
  clientNav?: boolean;
};

type IconButtonProps = IconButtonAsButtonProps | IconButtonAsLinkProps;

/**
 * Renders an icon-only action control with an accessible label.
 */
export function IconButton({ icon, label, ...props }: IconButtonProps): VNode {
  return (
    <Button {...props} size='icon' icon={icon} aria-label={label} title={props.title ?? label}>
      <span class='sr-only'>{label}</span>
    </Button>
  );
}
