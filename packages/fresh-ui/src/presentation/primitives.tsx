/**
 * @module
 * L0 platform-contract primitives for `@netscript/fresh-ui`.
 *
 * L0 intentionally stays small: prefer Preact intrinsic elements and platform
 * attributes, and use these helpers only where they encapsulate real behavior.
 */

import { h } from 'preact';
import type { ComponentChildren, JSX } from 'preact';

/**
 * Curated stroke-SVG paths supported by the package-owned icon primitive.
 */
export const ICON_PATHS = {
  check: ['M20 6 9 17l-5-5'],
  'chevron-down': ['M6 9l6 6 6-6'],
  'chevron-left': ['M15 18l-6-6 6-6'],
  'chevron-right': ['M9 18l6-6-6-6'],
  'chevron-up': ['M18 15l-6-6-6 6'],
  copy: [
    'M8 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z',
    'M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2',
  ],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  'external-link': [
    'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
    'M15 3h6v6',
    'M10 14 21 3',
  ],
  info: ['M12 16v-4', 'M12 8h.01', 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  minus: ['M5 12h14'],
  plus: ['M12 5v14', 'M5 12h14'],
  search: ['M21 21l-4.35-4.35', 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z'],
  settings: [
    'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
    'M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06A2 2 0 1 1 7.07 4.23l.06.06A1.7 1.7 0 0 0 9 4.63a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z',
  ],
  trash: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6', 'M10 11v6', 'M14 11v6'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
} as const;

/**
 * Icon names supported by the package-owned stroke SVG primitive.
 */
export type IconName = keyof typeof ICON_PATHS;

/**
 * CSS-compatible icon width and height value.
 */
export type IconSize = number | string;

/**
 * Public SVG attribute value accepted by the icon primitive.
 */
export type IconSvgAttributeValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly string[]
  | ((event: Event) => void);

/**
 * Fresh UI-owned SVG attributes accepted by the icon primitive.
 */
export type IconSvgAttributes = {
  /**
   * CSS class name forwarded to the rendered SVG.
   */
  class?: string;
  /**
   * JSX-compatible CSS class name forwarded to the rendered SVG.
   */
  className?: string;
  /**
   * Element identifier forwarded to the rendered SVG.
   */
  id?: string;
  /**
   * ARIA or semantic role forwarded to the rendered SVG.
   */
  role?: string;
  /**
   * Inline style forwarded to the rendered SVG.
   */
  style?: VisuallyHiddenStyle;
  /**
   * Keyboard tab order forwarded to the rendered SVG.
   */
  tabIndex?: number;
  /**
   * Decorative-state override. Defaults to `true` when no accessible name is present.
   */
  'aria-hidden'?: boolean | 'true' | 'false';
  /**
   * Accessible label forwarded to the rendered SVG.
   */
  'aria-label'?: string;
  /**
   * Accessible label reference forwarded to the rendered SVG.
   */
  'aria-labelledby'?: string;
  /**
   * Data attributes forwarded to the rendered SVG.
   */
  [attribute: `data-${string}`]: IconSvgAttributeValue;
  /**
   * ARIA attributes forwarded to the rendered SVG.
   */
  [attribute: `aria-${string}`]: IconSvgAttributeValue;
  /**
   * Event handlers forwarded to the rendered SVG.
   */
  [attribute: `on${string}`]: IconSvgAttributeValue;
};

/**
 * Props accepted by {@link Icon}.
 */
export type IconProps =
  & Omit<IconSvgAttributes, 'fill' | 'stroke'>
  & {
    /**
     * SVG fill is package-token driven and cannot be caller-overridden.
     */
    fill?: never;
    /**
     * Name of the icon path set to render.
     */
    name: IconName;
    /**
     * SVG width and height. Defaults to `1em`.
     */
    size?: IconSize;
    /**
     * Optional accessible title. Omit for decorative icons.
     */
    title?: string;
    /**
     * SVG stroke is package-token driven and cannot be caller-overridden.
     */
    stroke?: never;
  };

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
 * Renders a token-driven stroke SVG icon.
 */
export function Icon(props: IconProps): PrimitiveNode {
  const rawProps = props as IconProps & { fill?: unknown; stroke?: unknown };
  const {
    name,
    size = '1em',
    title,
    fill: _fill,
    stroke: _stroke,
    role,
    'aria-hidden': ariaHidden,
    ...svgProps
  } = rawProps;
  const hasAccessibleName = title !== undefined || svgProps['aria-label'] !== undefined ||
    svgProps['aria-labelledby'] !== undefined;

  return h(
    'svg',
    {
      ...(svgProps as JSX.SVGAttributes<SVGSVGElement>),
      'aria-hidden': ariaHidden ?? (hasAccessibleName ? undefined : true),
      fill: 'none',
      height: size,
      role: role ?? (hasAccessibleName ? 'img' : undefined),
      stroke: 'currentColor',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': 'var(--ns-icon-stroke-width, 2)',
      viewBox: '0 0 24 24',
      width: size,
      xmlns: 'http://www.w3.org/2000/svg',
    },
    title === undefined ? null : h('title', null, title),
    ...ICON_PATHS[name].map((d) => h('path', { d, key: d })),
  ) as unknown as PrimitiveNode; // quality-allow: Preact h() returns ComponentChild, while this public primitive intentionally excludes bigint from its narrower node contract.
}

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
