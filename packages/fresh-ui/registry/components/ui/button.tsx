/**
 * @component Button
 * @layer 2
 * @depends theme-seed
 * @description Generic action primitive for forms and navigation.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

interface SharedButtonProps {
  'data-part'?: string;
  'data-scope'?: string;
  'data-size'?: ButtonSize;
  children: Renderable;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  class?: string;
  icon?: Renderable;
  iconPosition?: 'left' | 'right';
}

interface FreshAnchorNavigationAttributes extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  'f-client-nav'?: boolean;
}

/**
 * Visual variants for the shared button primitive.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
/**
 * Size variants for the shared button primitive.
 */
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';
/**
 * Native button `type` values supported by the shared primitive.
 */
export type ButtonElementType = 'button' | 'submit' | 'reset';

type ButtonAsButtonProps =
  & SharedButtonProps
  & Omit<
    JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'class' | 'type'
  >
  & {
    type?: ButtonElementType;
    href?: never;
    clientNav?: never;
  };

type ButtonAsLinkProps =
  & SharedButtonProps
  & Omit<
    JSX.AnchorHTMLAttributes<HTMLAnchorElement>,
    'children' | 'class' | 'href' | 'type'
  >
  & {
    type: 'link';
    href: string;
    clientNav?: boolean;
  };

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

/**
 * Renders a semantic action control as either a button or a link.
 */
export function Button(props: ButtonProps): VNode {
  const {
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    class: className,
    icon,
    iconPosition = 'left',
  } = props;
  const classes = cn('ns-btn', className);
  const leadingIcon = loading
    ? (
      <span
        aria-hidden='true'
        class='ns-spinner'
        data-size='sm'
        data-part='root'
        data-scope='spinner'
      />
    )
    : iconPosition === 'left'
    ? icon
    : undefined;
  const trailingIcon = !loading && iconPosition === 'right' ? icon : undefined;
  const content = (
    <>
      {leadingIcon && (
        <span
          data-part={loading
            ? 'spinner'
            : props['data-scope'] === 'icon-button'
            ? undefined
            : 'icon-start'}
          data-scope={props['data-scope'] ?? 'button'}
          style={{ display: 'contents' }}
        >
          {leadingIcon}
        </span>
      )}
      <span
        data-part={props['data-scope'] === 'icon-button' ? undefined : 'label'}
        data-scope={props['data-scope'] ?? 'button'}
      >
        {children}
      </span>
      {trailingIcon && (
        <span
          data-part='icon-end'
          data-scope={props['data-scope'] ?? 'button'}
          style={{ display: 'contents' }}
        >
          {trailingIcon}
        </span>
      )}
    </>
  );

  if (props.type === 'link') {
    const {
      type: _type,
      children: _children,
      variant: _variant,
      size: _size,
      disabled: _disabled,
      loading: _loading,
      class: _className,
      icon: _icon,
      iconPosition: _iconPosition,
      clientNav = true,
      href,
      ...linkProps
    } = props;
    const freshLinkProps: FreshAnchorNavigationAttributes = {
      ...linkProps,
      'f-client-nav': clientNav,
    };

    return (
      <a
        {...freshLinkProps}
        href={disabled || loading ? undefined : href}
        class={classes}
        data-variant={variant}
        data-size={props['data-size'] ?? size}
        data-state={loading ? 'loading' : disabled ? 'disabled' : 'rest'}
        data-part={props['data-part'] ?? 'root'}
        data-scope={props['data-scope'] ?? 'button'}
        aria-disabled={disabled || loading ? 'true' : undefined}
        aria-busy={loading ? 'true' : undefined}
      >
        {content}
      </a>
    );
  }

  const {
    type = 'button',
    children: _children,
    variant: _variant,
    size: _size,
    disabled: _disabled,
    loading: _loading,
    class: _className,
    href: _href,
    icon: _icon,
    iconPosition: _iconPosition,
    clientNav: _clientNav,
    ...buttonProps
  } = props;

  return (
    <button
      {...buttonProps}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      class={classes}
      data-variant={variant}
      data-size={props['data-size'] ?? size}
      data-state={loading ? 'loading' : disabled ? 'disabled' : 'rest'}
      data-part={props['data-part'] ?? 'root'}
      data-scope={props['data-scope'] ?? 'button'}
    >
      {content}
    </button>
  );
}
