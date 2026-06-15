import { useSignal } from '@preact/signals';
import { useCallback } from 'preact/hooks';

export interface UseControllableSignalOptions<T> {
  defaultValue: T;
  onChange?: (nextValue: T) => void;
  value?: T;
}

export function useControllableSignal<T>(
  { defaultValue, onChange, value }: UseControllableSignalOptions<T>,
): readonly [T, (nextValue: T) => void] {
  const uncontrolledValue = useSignal(defaultValue);
  const currentValue = value === undefined ? uncontrolledValue.value : value;

  const setValue = useCallback(
    (nextValue: T): void => {
      if (value === undefined) {
        uncontrolledValue.value = nextValue;
      }

      onChange?.(nextValue);
    },
    [onChange, uncontrolledValue, value],
  );

  return [currentValue, setValue] as const;
}
