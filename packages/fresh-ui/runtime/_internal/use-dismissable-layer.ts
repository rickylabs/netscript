import { useEffect } from 'preact/hooks';

export type DismissableLayerReason = 'escape-key' | 'interact-outside';

export interface UseDismissableLayerOptions {
  closeOnEscape?: boolean;
  closeOnInteractOutside?: boolean;
  enabled: boolean;
  getElements: () => Array<HTMLElement | null>;
  onDismiss: (reason: DismissableLayerReason) => void;
}

function isWithinElements(target: EventTarget | null, elements: Array<HTMLElement | null>): boolean {
  if (!(target instanceof Node)) {
    return false;
  }

  return elements.some((element) => element?.contains(target));
}

export function useDismissableLayer({
  closeOnEscape = true,
  closeOnInteractOutside = true,
  enabled,
  getElements,
  onDismiss,
}: UseDismissableLayerOptions): void {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!closeOnEscape || event.key !== 'Escape') {
        return;
      }

      onDismiss('escape-key');
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!closeOnInteractOutside) {
        return;
      }

      if (!isWithinElements(event.target, getElements())) {
        onDismiss('interact-outside');
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!closeOnInteractOutside) {
        return;
      }

      if (!isWithinElements(event.target, getElements())) {
        onDismiss('interact-outside');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [closeOnEscape, closeOnInteractOutside, enabled, getElements, onDismiss]);
}