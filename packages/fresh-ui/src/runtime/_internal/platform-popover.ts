import type { JSX } from 'preact';
import { useEffect } from 'preact/hooks';

type PlatformPopoverElement = HTMLElement & {
  hidePopover?: () => void;
  showPopover?: () => void;
};

export function getPlatformAnchorName(scope: string, id: string): string {
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '-');
  return `--ns-${scope}-${safeId}-anchor`;
}

export function getPositionArea(placement: string): string {
  const [side, align] = placement.split('-');

  if (!align || align === 'center') {
    return side;
  }

  return `${side} ${align}`;
}

export function mergePlatformStyle(
  style: unknown,
  declarations: JSX.CSSProperties,
): string | JSX.CSSProperties {
  if (typeof style === 'string') {
    const appended = Object.entries(declarations).map(([name, value]) => `${name}: ${value}`).join(
      '; ',
    );
    return `${style}; ${appended}`;
  }

  return {
    ...(isCssProperties(style) ? style : {}),
    ...declarations,
  };
}

function isCssProperties(value: unknown): value is JSX.CSSProperties {
  return value !== null && typeof value === 'object';
}

export function isPopoverOpen(element: HTMLElement | null): boolean {
  try {
    return element?.matches(':popover-open') ?? false;
  } catch {
    return false;
  }
}

export function useSyncedPopover(
  ref: { current: HTMLElement | null },
  open: boolean,
): void {
  useEffect(() => {
    const element = ref.current as PlatformPopoverElement | null;
    if (!element?.showPopover || !element.hidePopover) {
      return;
    }

    const isOpen = isPopoverOpen(element);

    try {
      if (open && !isOpen) {
        element.showPopover();
      } else if (!open && isOpen) {
        element.hidePopover();
      }
    } catch {
      // The platform throws when a popover is mid-toggle or detached. State remains the source of truth.
    }
  }, [open, ref]);
}
