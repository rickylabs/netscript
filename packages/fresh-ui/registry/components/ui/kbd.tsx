/**
 * @component Kbd
 * @layer 2
 * @depends theme-seed
 * @description Native noninteractive keyboard notation and grouped shortcuts.
 */
import { toChildArray } from 'preact';
import type { ComponentChildren, JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

export interface KbdProps extends Omit<JSX.HTMLAttributes<HTMLElement>, 'size' | 'class'> {
  children: ComponentChildren;
  size?: 'sm' | 'md';
  variant?: 'default' | 'inverse';
  class?: string;
}

function Key(
  { children, size = 'md', variant = 'default', class: className, ...props }: KbdProps,
): VNode {
  return (
    <kbd
      {...props}
      class={cn('ns-keycap', className)}
      data-scope='kbd'
      data-part='root'
      data-size={size}
      data-variant={variant}
    >
      <span data-scope='kbd' data-part='label'>{children}</span>
    </kbd>
  );
}

/** Separators are decorative; callers supply each key's accessible text. */
function KeyGroup(
  { children, separator = true, class: className, ...props }: Omit<KbdProps, 'size' | 'variant'> & {
    separator?: boolean;
  },
): VNode {
  return (
    <span {...props} class={cn('ns-keycap-group', className)}>
      {toChildArray(children).map((key, index) => (
        <span class='ns-keycap-group__key' key={index}>
          {index > 0 && separator && (
            <span aria-hidden='true' class='ns-keycap-group__separator'>+</span>
          )}
          {key}
        </span>
      ))}
    </span>
  );
}

/** Native key notation; Group is optional and adds no focus targets. */
export const Kbd: ((props: KbdProps) => VNode) & { Group: typeof KeyGroup } = Object.assign(Key, {
  Group: KeyGroup,
});
