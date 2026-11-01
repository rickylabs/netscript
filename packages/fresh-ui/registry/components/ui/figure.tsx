/**
 * @component Figure
 * @layer 2
 * @depends theme-seed, cn
 * @description Native figure for caller media and an optional semantic caption.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

/** Caller media owns alternative text, intrinsic ratio and native child controls. */
export interface FigureProps extends Omit<JSX.HTMLAttributes<HTMLElement>, 'class' | 'children'> {
  children: ComponentChildren;
  caption?: ComponentChildren;
  width?: 'prose' | 'wide';
  media?: 'image' | 'diagram';
  class?: string;
}

/** Preserve native figure/caption relationships without a placeholder or an extra tab stop. */
export function Figure(
  { children, caption, width = 'prose', media = 'image', class: className, ...props }: FigureProps,
): VNode {
  return (
    <figure
      {...props}
      class={cn('ns-figure', className)}
      data-scope='figure'
      data-part='root'
      data-width={width}
      data-media={media}
    >
      <div data-scope='figure' data-part='media'>{children}</div>
      {caption != null && <figcaption data-scope='figure' data-part='caption'>{caption}
      </figcaption>}
    </figure>
  );
}
