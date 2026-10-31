/**
 * @component AspectRatio
 * @layer 2
 * @depends theme-seed, cn
 * @description Native CSS ratio frame for caller-owned media and controls.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

/** Closed Figma ratio choices and native frame inputs. */
export interface AspectRatioProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  /** Width-to-height ratio; defaults to 16:9. */
  ratio?: '16:9' | '4:3' | '1:1' | '21:9';
  /** Media content; the caller owns image alternatives and interactive labels. */
  children?: ComponentChildren;
  /** Additional frame classes. */
  class?: string;
}

/**
 * Render a ratio frame without adding a keyboard stop.
 * @example
 * ```tsx
 * <AspectRatio ratio='4:3'><img src='/cover.png' alt='Guide cover' /></AspectRatio>
 * ```
 */
export function AspectRatio(
  { ratio = '16:9', children, class: className, ...props }: AspectRatioProps,
): VNode {
  return (
    <div
      {...props}
      class={cn('ns-aspect-ratio', className)}
      data-scope='aspect-ratio'
      data-part='root'
      data-ratio={ratio}
    >
      <div class='ns-aspect-ratio__media' data-scope='aspect-ratio' data-part='media'>
        {children}
      </div>
    </div>
  );
}
