/**
 * @module
 * L0 platform-contract primitives for `@netscript/fresh-ui`.
 *
 * L0 intentionally stays small: prefer Preact intrinsic elements and platform
 * attributes, and use these helpers only where they encapsulate real behavior.
 */

import type { ComponentChildren, JSX } from 'preact';

/**
 * Primitive value that can be rendered by an L0 helper.
 */
export type PrimitiveChild =
  | PrimitiveNode
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined;

/**
 * Renderable content accepted by L0 primitives.
 */
export type PrimitiveChildren = PrimitiveChild | readonly PrimitiveChild[];

/**
 * Structural node returned by element-producing L0 primitives.
 */
export interface PrimitiveNode {
  /**
   * Render target, such as an intrinsic element name or component function.
   */
  type: unknown;
  /**
   * Props attached to the rendered node.
   */
  props: Record<string, unknown>;
  /**
   * Optional render key carried by the rendered node.
   */
  key: unknown;
}

/**
 * Inline style accepted by visually-hidden primitives.
 */
export type VisuallyHiddenStyle =
  | string
  | Record<string, string | number | null | undefined>;

const visuallyHiddenStyle: JSX.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const visuallyHiddenCssText =
  'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0, 0, 0, 0);white-space:nowrap;border:0';

/**
 * Props accepted by {@link VisuallyHidden} and {@link SrOnly}.
 */
export interface VisuallyHiddenProps {
  /**
   * Content rendered inside the visually-hidden span.
   */
  children?: PrimitiveChildren;
  /**
   * Inline style overrides merged after the platform visually-hidden rule.
   */
  style?: VisuallyHiddenStyle;
  /**
   * Additional native attributes forwarded to the rendered span.
   */
  [attribute: string]: unknown;
}

/**
 * Renders content for assistive technology while keeping it visually hidden.
 */
export function VisuallyHidden(
  { children, style, ...props }: VisuallyHiddenProps,
): PrimitiveNode {
  const spanProps = props as JSX.HTMLAttributes<HTMLSpanElement>;

  return (
    <span {...spanProps} style={mergeVisuallyHiddenStyle(style)}>
      {children as ComponentChildren}
    </span>
  ) as PrimitiveNode;
}

/**
 * Alias for {@link VisuallyHidden} using the common screen-reader naming.
 */
export function SrOnly(props: VisuallyHiddenProps): PrimitiveNode {
  return VisuallyHidden(props);
}

/**
 * Props accepted by {@link Show}.
 */
export interface ShowProps<T> {
  /**
   * Truthy values render `children`; false, null, and undefined render `fallback`.
   */
  when: T | false | null | undefined;
  /**
   * Content rendered when `when` is false, null, or undefined.
   */
  fallback?: PrimitiveChildren;
  /**
   * Rendered directly or called with the narrowed truthy value.
   */
  children: PrimitiveChildren | ((value: NonNullable<T>) => PrimitiveChildren);
}

/**
 * Conditionally renders children without introducing an extra DOM wrapper.
 */
export function Show<T>(
  { when, fallback = null, children }: ShowProps<T>,
): PrimitiveChildren {
  if (!when) {
    return fallback;
  }

  if (typeof children === 'function') {
    return children(when as NonNullable<T>);
  }

  return children;
}

function mergeVisuallyHiddenStyle(
  style: VisuallyHiddenStyle | undefined,
): VisuallyHiddenStyle {
  if (typeof style === 'string') {
    return style.length > 0 ? `${visuallyHiddenCssText};${style}` : visuallyHiddenCssText;
  }

  return {
    ...visuallyHiddenStyle,
    ...(style ?? {}),
  };
}
