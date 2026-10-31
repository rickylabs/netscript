/**
 * @component ButtonGroup
 * @layer 2
 * @depends theme-seed button
 * @description Joined native actions; Tab order follows the child controls.
 */
import { toChildArray } from 'preact';
import type { ComponentChildren, JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

/** Joined actions retain their native keyboard and form behavior. */
export interface ButtonGroupProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class'> {
  children: ComponentChildren;
  class?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  separator?: boolean;
  text?: boolean;
  textContent?: ComponentChildren;
}

/** Arrange actions without introducing a second focus-navigation model. */
export function ButtonGroup({
  children,
  class: className,
  orientation = 'horizontal',
  size = 'md',
  separator = false,
  text = true,
  textContent,
  ...props
}: ButtonGroupProps): VNode {
  const items = toChildArray(children);
  return (
    <div
      {...props}
      class={cn('ns-button-group', className)}
      role='group'
      data-scope='button-group'
      data-part='root'
      data-orientation={orientation}
      data-size={size}
    >
      {text && textContent != null && (
        <span data-scope='button-group' data-part='text'>{textContent}</span>
      )}
      {items.map((item, index) => (
        <>
          {separator && index > 0 && (
            <span data-scope='button-group' data-part='separator' aria-hidden='true' />
          )}
          {item}
        </>
      ))}
    </div>
  );
}
