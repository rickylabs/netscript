/**
 * @component Item
 * @layer 2
 * @depends theme-seed
 * @description Presentation row with media, content and native child actions.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

export interface ItemProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'title' | 'size' | 'class'> {
  title: ComponentChildren;
  description?: ComponentChildren;
  media?: ComponentChildren;
  actions?: ComponentChildren;
  header?: ComponentChildren;
  footer?: ComponentChildren;
  chevron?: boolean;
  variant?: 'default' | 'outline' | 'muted';
  size?: 'default' | 'sm' | 'xs';
  class?: string;
}

/** Child links and controls remain native; the row itself is not an action. */
function ItemRoot({
  title,
  description,
  media,
  actions,
  header,
  footer,
  chevron = false,
  variant = 'default',
  size = 'default',
  class: className,
  children,
  ...props
}: ItemProps): VNode {
  return (
    <div
      {...props}
      class={cn('ns-item', className)}
      data-scope='item'
      data-part='root'
      data-variant={variant}
      data-size={size}
    >
      {header != null && <div data-scope='item' data-part='header'>{header}</div>}
      {media != null && <div data-scope='item' data-part='media'>{media}</div>}
      <div data-scope='item' data-part='content'>
        <div data-scope='item' data-part='title'>{title}</div>
        {description != null && <div data-scope='item' data-part='description'>{description}</div>}
        {children}
      </div>
      {actions != null && <div data-scope='item' data-part='actions'>{actions}</div>}
      {chevron && <span aria-hidden='true' data-scope='item' data-part='chevron'>›</span>}
      {footer != null && <div data-scope='item' data-part='footer'>{footer}</div>}
    </div>
  );
}

/** Group rows without changing their native child control semantics. */
function ItemGroup({
  children,
  separators = false,
  class: className,
  ...props
}: Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class'> & {
  separators?: boolean;
  class?: string;
}): VNode {
  return (
    <div {...props} class={cn('ns-item-group', className)} data-separators={String(separators)}>
      {children}
    </div>
  );
}

/** Presentation row with optional grouped separators. */
export const Item: ((props: ItemProps) => VNode) & { Group: typeof ItemGroup } = Object.assign(
  ItemRoot,
  { Group: ItemGroup },
);
