/**
 * Cross-renderer primitives. Screens are written once against these; the boot
 * file picks the renderer:
 *
 * - `gpuix`: native GPUI elements through gpuix-preact (`div`, `input`), style
 *   objects passed through as-is (numbers are px, hover is painted natively).
 * - `dom`: the same tree as HTML for the webview baseline. Style objects are
 *   translated to CSS (borders, line heights, hover state), because GPUIX
 *   styling is not CSS.
 *
 * This file is the honest size of the "views must move" cost: the screens above
 * it are shared, the leaves are not.
 */
import { type ComponentChildren, h, type JSX } from 'preact';
import { useState } from 'preact/hooks';
import { FONT, LINE, RADIUS, SIZE, tokens } from './theme.ts';

export type Style = Record<string, unknown>;
export type Platform = 'gpuix' | 'dom';

let platform: Platform = 'gpuix';

/** Select the renderer once, before the first render. */
export function setPlatform(next: Platform): void {
  platform = next;
}

export function currentPlatform(): Platform {
  return platform;
}

// ---- style translation (DOM only) ------------------------------------------

const SIDES = ['Top', 'Right', 'Bottom', 'Left'] as const;

function toCss(style: Style): Style {
  const css: Style = { boxSizing: 'border-box' };
  for (const [key, value] of Object.entries(style)) {
    if (key === 'hover' || key === 'active' || key === 'focusVisible' || key === 'keyboardFocusDim') {
      continue;
    }
    if (key === 'lineHeight' && typeof value === 'number') css.lineHeight = `${value}px`;
    else if (key === 'fontWeight' && typeof value === 'number') css.fontWeight = String(value);
    else if ((key === 'overflow' || key === 'overflowY' || key === 'overflowX') && value === 'scroll') {
      css[key] = 'auto';
    } else if (key === 'textOverflow') {
      css.textOverflow = 'ellipsis';
      css.overflow = 'hidden';
    } else css[key] = value;
  }
  // GPUIX borders are solid when they have a width; CSS needs the style and
  // explicit zero widths for the other sides.
  const anyBorder = 'borderWidth' in style || SIDES.some((side) => `border${side}Width` in style);
  if (anyBorder) {
    css.borderStyle = style.borderStyle ?? 'solid';
    for (const side of SIDES) {
      const key = `border${side}Width`;
      if (!(key in style)) css[key] = style.borderWidth ?? 0;
    }
  }
  return css;
}

// ---- Box ---------------------------------------------------------------------

export interface BoxProps {
  style?: Style;
  hover?: Style;
  active?: Style;
  onClick?: () => void;
  testId?: string;
  children?: ComponentChildren;
}

/** A flex/block container. The only structural primitive. */
export function Box({ style = {}, hover, active, onClick, testId, children }: BoxProps): JSX.Element {
  if (platform === 'gpuix') {
    const props: Record<string, unknown> = { style: { ...style, ...(hover ? { hover } : {}), ...(active ? { active } : {}) } };
    if (onClick) props.onClick = () => onClick();
    if (testId) props.testId = testId;
    return h('div', props, children);
  }
  return h(DomBox, { style, hover, active, onClick, testId }, children);
}

function DomBox({ style = {}, hover, active, onClick, testId, children }: BoxProps): JSX.Element {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const merged = { ...style, ...(hovered && hover ? hover : {}), ...(pressed && active ? active : {}) };
  const props: Record<string, unknown> = { style: toCss(merged) };
  if (hover) {
    props.onMouseEnter = () => setHovered(true);
    props.onMouseLeave = () => {
      setHovered(false);
      setPressed(false);
    };
  }
  if (active) {
    props.onMouseDown = () => setPressed(true);
    props.onMouseUp = () => setPressed(false);
  }
  if (onClick) props.onClick = () => onClick();
  if (testId) props['data-testid'] = testId;
  return h('div', props, children);
}

export const row: Style = { display: 'flex', flexDirection: 'row', alignItems: 'center' };
export const col: Style = { display: 'flex', flexDirection: 'column' };

// ---- Text ---------------------------------------------------------------------

export interface TextProps {
  size?: keyof typeof SIZE;
  weight?: 400 | 500 | 600;
  tone?: 'default' | 'muted' | 'subtle' | 'success' | 'warning' | 'info' | 'danger' | 'inkText';
  mono?: boolean;
  truncate?: boolean;
  style?: Style;
  children?: ComponentChildren;
}

/**
 * GPUI has no inline formatting context: `{a} · {b}` is three text nodes, and
 * GPUIX lays each one out as its own block. Join primitive runs into one string
 * so mixed JSX text reads as one line, as it does in HTML.
 */
function joinTextRuns(children: ComponentChildren): ComponentChildren {
  const parts: string[] = [];
  const walk = (value: ComponentChildren): boolean => {
    if (value === null || value === undefined || value === false || value === true) return true;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
      parts.push(String(value));
      return true;
    }
    if (Array.isArray(value)) return value.every(walk);
    return false;
  };
  return walk(children) ? parts.join('') : children;
}

export function Text({ size = 'md', weight = 400, tone = 'default', mono = false, truncate = false, style, children }: TextProps): JSX.Element {
  const t = tokens();
  const color = tone === 'default' ? t.text : tone === 'muted' ? t.textMuted : tone === 'subtle' ? t.textSubtle : tone === 'inkText' ? t.inkText : t[tone];
  const fontSize = SIZE[size];
  const lineHeight = fontSize >= 26 ? LINE.xl : fontSize >= 15 ? LINE.lg : fontSize >= 13 ? LINE.md : LINE.sm;
  return h(Box, {
    style: {
      fontFamily: mono ? FONT.mono : FONT.sans,
      fontSize,
      lineHeight,
      fontWeight: weight,
      color,
      ...(truncate ? { whiteSpace: 'nowrap', textOverflow: 'ellipsis', minWidth: 0 } : {}),
      ...style,
    },
  }, joinTextRuns(children));
}

// ---- Button ---------------------------------------------------------------------

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  disabled?: boolean;
  testId?: string;
}

export function Button({ label, onPress, variant = 'outline', disabled = false, testId }: ButtonProps): JSX.Element {
  const t = tokens();
  const base: Style = {
    ...row,
    justifyContent: 'center',
    height: 28,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: RADIUS,
    borderWidth: 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    fontFamily: FONT.sans,
    fontSize: SIZE.md,
    fontWeight: 500,
    lineHeight: LINE.md,
  };
  const look: Style = variant === 'primary'
    ? { backgroundColor: t.ink, borderColor: t.ink, color: t.inkText }
    : variant === 'outline'
    ? { backgroundColor: t.bg, borderColor: t.borderStrong, color: t.text }
    : { backgroundColor: 'transparent', borderColor: 'transparent', color: t.text };
  return h(Box, {
    style: { ...base, ...look },
    hover: disabled ? undefined : { backgroundColor: variant === 'primary' ? t.textMuted : t.hover },
    active: disabled ? undefined : { backgroundColor: variant === 'primary' ? t.text : t.pressed },
    onClick: disabled ? undefined : onPress,
    testId,
  }, label);
}

// ---- TextInput ---------------------------------------------------------------------

export interface TextInputProps {
  value: string;
  onValue: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
  style?: Style;
  testId?: string;
}

export function TextInput({ value, onValue, placeholder, mono = false, style = {}, testId }: TextInputProps): JSX.Element {
  const t = tokens();
  const look: Style = {
    height: 30,
    paddingLeft: 8,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: t.borderStrong,
    borderRadius: RADIUS,
    backgroundColor: t.bg,
    color: t.text,
    fontFamily: mono ? FONT.mono : FONT.sans,
    fontSize: SIZE.md,
    ...style,
  };
  if (platform === 'gpuix') {
    return h('input', {
      value,
      placeholder,
      testId,
      style: { ...look, focusVisible: { borderColor: t.ink } },
      onChange: (event: { value?: string }) => onValue(event.value ?? ''),
    });
  }
  return h('input', {
    value,
    placeholder,
    'data-testid': testId,
    style: toCss({ ...look, outline: 'none' }),
    onInput: (event: Event) => onValue((event.currentTarget as HTMLInputElement).value),
  });
}

// ---- small composites ---------------------------------------------------------------------

export function Divider({ vertical = false }: { vertical?: boolean }): JSX.Element {
  const t = tokens();
  return h(Box, { style: vertical ? { width: 1, alignSelf: 'stretch', backgroundColor: t.border } : { height: 1, backgroundColor: t.border } });
}

export function Spacer(): JSX.Element {
  return h(Box, { style: { flexGrow: 1 } });
}

export function Badge({ label, tone = 'muted' }: { label: string; tone?: 'muted' | 'success' | 'warning' | 'info' | 'danger' }): JSX.Element {
  const t = tokens();
  const color = tone === 'muted' ? t.textMuted : t[tone];
  return h(Box, {
    style: {
      ...row,
      height: 20,
      paddingLeft: 6,
      paddingRight: 6,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: RADIUS,
      color,
      fontFamily: FONT.mono,
      fontSize: SIZE.xs,
      lineHeight: LINE.sm,
      flexShrink: 0,
    },
  }, label);
}

export function Progress({ value, tone = 'ink' }: { value: number; tone?: 'ink' | 'success' | 'danger' }): JSX.Element {
  const t = tokens();
  const fill = tone === 'ink' ? t.chart : t[tone];
  const pct = Math.max(0, Math.min(100, value));
  return h(Box, { style: { height: 4, backgroundColor: t.surfaceMuted, borderRadius: 1, flexGrow: 1 } },
    h(Box, { style: { height: 4, width: `${pct}%`, backgroundColor: fill, borderRadius: 1 } }));
}

/** Vertical scroller. GPUIX paints a native thumb when `scrollbarColor` is set. */
export function Scroll({ style = {}, children }: { style?: Style; children?: ComponentChildren }): JSX.Element {
  const t = tokens();
  return h(Box, { style: { ...col, overflowY: 'scroll', minHeight: 0, flexGrow: 1, scrollbarColor: t.borderStrong, ...style } }, children);
}
