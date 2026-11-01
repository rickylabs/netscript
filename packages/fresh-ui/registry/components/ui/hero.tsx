/**
 * @component Hero
 * @layer 2
 * @depends theme-seed, cn
 * @description CSS-responsive Docs introduction with caller-owned actions and aside content.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

/** Useful SSR; omission of breakpoint measures this block's own width through CSS. */
export interface HeroProps
  extends Omit<JSX.HTMLAttributes<HTMLElement>, 'class' | 'title' | 'children'> {
  layout?: 'split' | 'centered';
  breakpoint?: 'desktop' | 'mobile';
  eyebrow?: ComponentChildren;
  title: ComponentChildren;
  /** Native heading rank only; typography always follows the presentation breakpoint. */
  headingLevel?: '1' | '2' | '3' | '4' | '5' | '6';
  children?: ComponentChildren;
  actions?: ComponentChildren;
  aside?: ComponentChildren;
  /** Caller file-path chips follow the main aside content. */
  paths?: ComponentChildren;
  class?: string;
}

/** The same native controls and content remain in document order at every width. */
export function Hero(
  {
    layout = 'split',
    breakpoint,
    eyebrow,
    title,
    headingLevel = '1',
    children,
    actions,
    aside,
    paths,
    class: className,
    ...props
  }: HeroProps,
): VNode {
  const Title: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' = `h${headingLevel}`;
  return (
    <section
      {...props}
      class={cn('ns-hero', className)}
      data-scope='hero'
      data-part='root'
      data-layout={layout}
      data-breakpoint={breakpoint}
    >
      <div data-scope='hero' data-part='layout'>
        <div data-scope='hero' data-part='display'>
          {eyebrow != null && <div data-scope='hero' data-part='eyebrow'>{eyebrow}</div>}
          <Title data-scope='hero' data-part='title'>{title}</Title>
          {children != null && <div data-scope='hero' data-part='lede'>{children}</div>}
          {actions != null && <div data-scope='hero' data-part='actions'>{actions}</div>}
        </div>
        {(aside != null || paths != null) && (
          <div data-scope='hero' data-part='aside'>
            {aside}
            {paths != null && <div data-scope='hero' data-part='path-stack'>{paths}</div>}
          </div>
        )}
      </div>
    </section>
  );
}
