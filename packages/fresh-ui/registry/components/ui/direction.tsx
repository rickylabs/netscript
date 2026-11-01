/**
 * @component Direction
 * @layer 2
 * @description Applies local native direction to the caller's HTML boundary without an extra wrapper.
 */
import {
  cloneElement,
  type ComponentChildren,
  h,
  isValidElement,
  type JSX,
  type Ref,
  type VNode,
} from 'preact';

/** Native container tags supported by the JSX-safe boundary form. */
export type DirectionBoundary =
  | 'div'
  | 'section'
  | 'main'
  | 'article'
  | 'aside'
  | 'nav'
  | 'header'
  | 'footer'
  | 'form'
  | 'span';

const boundaries: readonly DirectionBoundary[] = [
  'div',
  'section',
  'main',
  'article',
  'aside',
  'nav',
  'header',
  'footer',
  'form',
  'span',
];

/** Native boundary inputs; use as for precompiled JSX or supply one cloneable HTML VNode. */
export interface DirectionProps extends Omit<JSX.HTMLAttributes<HTMLElement>, 'dir' | 'children'> {
  /** Render this native boundary directly, supporting ordinary precompiled JSX children. */
  as?: DirectionBoundary;
  /** Native inherited direction; overrides a cloned child's dir and defaults to ltr. */
  dir?: 'ltr' | 'rtl';
  /** Boundary content with as; otherwise exactly one unscoped native HTML VNode. */
  children: ComponentChildren;
  /** Ref to the native boundary, rather than to a Preact component instance. */
  boundaryRef?: Ref<HTMLElement>;
}

/**
 * Apply native direction locally to one caller-owned boundary, with no document mutation.
 * @example
 * ```tsx
 * <Direction as='section' dir='rtl'><input aria-label='Search' /></Direction>
 * ```
 */
export function Direction(
  { as, dir = 'ltr', children, boundaryRef, ...props }: DirectionProps,
): VNode<JSX.HTMLAttributes<HTMLElement>> {
  if ('data-scope' in props || 'data-part' in props) {
    throw new TypeError('Direction requires unscoped boundary props');
  }
  const attributes = {
    ...props,
    dir,
    ...(boundaryRef === undefined ? {} : { ref: boundaryRef }),
    'data-dir': dir,
    'data-scope': 'direction',
    'data-part': 'root',
  };
  if (as !== undefined) {
    if (!boundaries.includes(as)) {
      throw new TypeError('Direction as must name a supported native boundary');
    }
    return h<JSX.HTMLAttributes<HTMLElement>>(as, attributes, children);
  }
  if (!isValidElement(children) || typeof children.type !== 'string') {
    throw new TypeError(
      "Direction requires one native HTML VNode; use as='section' with precompiled JSX",
    );
  }
  if ('data-scope' in children.props || 'data-part' in children.props) {
    throw new TypeError('Direction requires an unscoped boundary; nest components inside it');
  }
  return cloneElement(children, attributes);
}

/** Alias of Direction with the same local, single-boundary native semantics. */
export const DirectionProvider: typeof Direction = Direction;
