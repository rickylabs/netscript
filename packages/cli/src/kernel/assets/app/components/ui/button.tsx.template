import { cn } from '@netscript/fresh-ui';
import type { ComponentChildren, JSX, VNode } from 'preact';

interface SharedButtonProps {
  children: ComponentChildren;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  class?: string;
  icon?: ComponentChildren;
  iconPosition?: 'left' | 'right';
}

interface FreshAnchorNavigationAttributes extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  'f-client-nav'?: boolean;
}

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';
export type ButtonElementType = 'button' | 'submit' | 'reset';

type ButtonAsButtonProps =
  & SharedButtonProps
  & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'class' | 'type'>
  & {
    type?: ButtonElementType;
    href?: never;
    clientNav?: never;
  };

type ButtonAsLinkProps =
  & SharedButtonProps
  & Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'class' | 'href' | 'type'>
  & {
    type: 'link';
    href: string;
    clientNav?: boolean;
  };

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'ns-btn--primary',
  secondary: 'ns-btn--secondary',
  outline: 'ns-btn--outline',
  ghost: 'ns-btn--ghost',
  destructive: 'ns-btn--destructive',
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string | undefined> = {
  sm: 'ns-btn--sm',
  md: undefined,
  lg: 'ns-btn--lg',
  icon: 'ns-btn--icon',
};

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
  const classes = cn('ns-btn', VARIANT_CLASSES[variant], SIZE_CLASSES[size], className);
  const leadingIcon = loading
    ? <span aria-hidden='true' class='ns-spinner ns-spinner--sm' />
    : iconPosition === 'left'
    ? icon
    : undefined;
  const trailingIcon = !loading && iconPosition === 'right' ? icon : undefined;
  const content = (
    <>
      {leadingIcon}
      <span>{children}</span>
      {trailingIcon}
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
        aria-disabled={disabled || loading ? 'true' : undefined}
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
      class={classes}
    >
      {content}
    </button>
  );
}
