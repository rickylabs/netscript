import type { Ref } from 'preact';

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (!ref) {
    return;
  }

  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  ref.current = value;
}

export function composeRefs<T>(...refs: Array<Ref<T> | undefined>): (value: T | null) => void {
  return (value: T | null) => {
    for (const ref of refs) {
      assignRef(ref, value);
    }
  };
}