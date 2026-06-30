/**
 * @component Dropzone
 * @layer 2
 * @depends theme-seed
 * @description File-drop affordance — a dashed drop target with icon, label, and
 * hint. Renders as a <label> so it can wrap a hidden file input (native upload);
 * drag-over state is driven by data-active (the app wires the drag handlers).
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

interface DropzoneProps extends Omit<JSX.HTMLAttributes<HTMLLabelElement>, 'class'> {
  /** Primary call-to-action text. */
  label?: string;
  /** Secondary hint (accepted types, size limits). */
  hint?: string;
  /** Leading glyph or icon node. */
  icon?: Renderable;
  /** Active (drag-over) state. */
  active?: boolean;
  /** Typically a visually-hidden <input type="file">. */
  children?: Renderable;
  class?: string;
}

/**
 * Renders a file drop target.
 */
export function Dropzone(
  {
    label = 'Drop files or click to upload',
    hint,
    icon,
    active,
    class: className,
    children,
    ...props
  }: DropzoneProps,
): VNode {
  return (
    <label {...props} class={cn('ns-dropzone', className)} data-active={active ? '' : undefined}>
      <span class='ns-dropzone__icon' aria-hidden='true'>{icon ?? '↑'}</span>
      <span class='ns-dropzone__label'>{label}</span>
      {hint ? <span class='ns-dropzone__hint'>{hint}</span> : null}
      {children}
    </label>
  );
}
