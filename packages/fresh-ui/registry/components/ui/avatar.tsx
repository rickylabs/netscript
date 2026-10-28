/**
 * @component Avatar
 * @layer 2
 * @depends theme-seed
 * @description Identity chip for a person or agent — initials or image, with size,
 * presence, and agent variants.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

/**
 * Avatar diameters, mapped to the --ns-avatar-* sizing tokens.
 */
export type AvatarSize = 'sm' | 'md' | 'lg';

/**
 * Presence states surfaced as the corner dot.
 */
export type AvatarPresence = 'online' | 'away' | 'offline';

interface AvatarProps extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'class'> {
  /** Full name — drives the accessible label and the initials fallback. */
  name: string;
  /** Optional image source; falls back to initials when absent or broken. */
  src?: string;
  /** Override the derived initials. */
  initials?: string;
  /** Diameter token. */
  size?: AvatarSize;
  /** Presence dot; omitted when undefined. */
  presence?: AvatarPresence;
  /** Render as an AI agent (primary fill). */
  agent?: boolean;
  class?: string;
}

/**
 * Derives up to two uppercase initials from a name.
 */
function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Renders an identity chip with an image or initials fallback.
 */
export function Avatar(
  { name, src, initials, size = 'md', presence, agent, class: className, ...props }: AvatarProps,
): VNode {
  return (
    <span
      {...props}
      role='img'
      aria-label={name}
      class={cn('ns-avatar', className)}
      data-size={size}
      data-content={agent ? 'agent' : src ? 'image' : 'initials'}
      data-part='root'
      data-scope='avatar'
    >
      {src ? <img data-part='image' data-scope='avatar' src={src} alt='' /> : (
        <span
          data-part={agent ? 'agent-icon' : 'initials'}
          data-scope='avatar'
          style={{ display: 'contents' }}
        >
          {initials ?? deriveInitials(name)}
        </span>
      )}
      {presence
        ? (
          <span
            class='ns-avatar__presence'
            data-part='presence'
            data-scope='avatar'
            data-presence={presence}
          />
        )
        : null}
    </span>
  );
}
