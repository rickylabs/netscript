import type { JSX } from 'preact';
import { useSignal } from '@preact/signals';
import { useCallback, useId, useRef } from 'preact/hooks';
import { getNextCollectionIndex } from '../_internal/collection-navigation.ts';
import { composeEventHandlers } from '../_internal/compose-event-handlers.ts';
import { composeRefs } from '../_internal/compose-refs.ts';
import { useControllableSignal } from '../_internal/use-controllable-signal.ts';
import type {
  AccordionItemContentElementProps,
  AccordionItemElementProps,
  AccordionItemIndicatorElementProps,
  AccordionItemOptions,
  AccordionItemState,
  AccordionItemTriggerElementProps,
  AccordionOrientation,
  AccordionRootElementProps,
  UseAccordionOptions,
  UseAccordionReturn,
} from './accordion.types.ts';

export function getAccordionDataState(expanded: boolean): 'open' | 'closed' {
  return expanded ? 'open' : 'closed';
}

export function useAccordion({
  collapsible = false,
  defaultValue = [],
  disabled = false,
  id,
  multiple = false,
  onFocusChange,
  onValueChange,
  orientation = 'vertical',
  value,
}: UseAccordionOptions = {}): UseAccordionReturn {
  const generatedId = useId();
  const rootId = id ?? `ns-accordion-${generatedId}`;
  const focusedValueSignal = useSignal<string | null>(null);
  const [expandedValues, setExpandedValues] = useControllableSignal<string[]>({
    defaultValue,
    onChange: (nextValue) => onValueChange?.({ value: nextValue }),
    value,
  });
  const itemOrder = useRef<string[]>([]);
  const itemRefs = useRef(new Map<string, HTMLElement | null>());
  const itemDisabledState = useRef(new Map<string, boolean>());
  const focusedValue = focusedValueSignal.value;

  const registerItemTrigger = useCallback((itemValue: string, node: HTMLElement | null) => {
    if (node === null) {
      itemRefs.current.delete(itemValue);
      itemOrder.current = itemOrder.current.filter((entry) => entry !== itemValue);
      return;
    }

    itemRefs.current.set(itemValue, node);

    if (!itemOrder.current.includes(itemValue)) {
      itemOrder.current = [...itemOrder.current, itemValue];
    }
  }, []);

  const setFocusedValue = useCallback(
    (nextValue: string | null) => {
      if (focusedValueSignal.value === nextValue) {
        return;
      }

      focusedValueSignal.value = nextValue;
      onFocusChange?.({ value: nextValue });
    },
    [focusedValueSignal, onFocusChange],
  );

  const getItemState = useCallback(
    (
      { disabled: itemDisabled = false, value: itemValue }: AccordionItemOptions,
    ): AccordionItemState => {
      const state = {
        disabled: disabled || itemDisabled,
        expanded: expandedValues.includes(itemValue),
        focused: focusedValue === itemValue,
      } satisfies AccordionItemState;

      itemDisabledState.current.set(itemValue, state.disabled);

      return state;
    },
    [disabled, expandedValues, focusedValue],
  );

  const toggleItem = useCallback(
    (item: AccordionItemOptions) => {
      const state = getItemState(item);

      if (state.disabled) {
        return;
      }

      if (state.expanded) {
        if (!collapsible && expandedValues.length <= 1) {
          return;
        }

        setExpandedValues(expandedValues.filter((entry) => entry !== item.value));
        return;
      }

      if (multiple) {
        setExpandedValues([...expandedValues, item.value]);
        return;
      }

      setExpandedValues([item.value]);
    },
    [collapsible, expandedValues, getItemState, multiple, setExpandedValues],
  );

  const focusItem = useCallback(
    (itemValue: string) => {
      itemRefs.current.get(itemValue)?.focus();
      setFocusedValue(itemValue);
    },
    [setFocusedValue],
  );

  const handleNavigation = useCallback(
    (item: AccordionItemOptions, key: string, axis: AccordionOrientation) => {
      const state = getItemState(item);

      if (state.disabled) {
        return;
      }

      const enabledValues = itemOrder.current.filter((entry) =>
        !itemDisabledState.current.get(entry)
      );
      const currentIndex = enabledValues.indexOf(item.value);
      const nextIndex = getNextCollectionIndex(key, currentIndex, enabledValues.length, axis, true);

      if (nextIndex < 0 || nextIndex === currentIndex) {
        return;
      }

      const nextValue = enabledValues[nextIndex];
      if (!nextValue) {
        return;
      }

      focusItem(nextValue);
    },
    [focusItem, getItemState],
  );

  const getRootProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLDivElement> = {}): AccordionRootElementProps => ({
      ...props,
      'data-orientation': orientation,
      'data-part': 'root',
      'data-scope': 'accordion',
      id: props.id ?? rootId,
    }),
    [orientation, rootId],
  );

  const getItemProps = useCallback(
    (
      item: AccordionItemOptions,
      props: JSX.HTMLAttributes<HTMLDivElement> = {},
    ): AccordionItemElementProps => {
      const state = getItemState(item);

      return {
        ...props,
        'data-disabled': state.disabled ? 'true' : undefined,
        'data-focus': state.focused ? 'true' : undefined,
        'data-orientation': orientation,
        'data-part': 'item',
        'data-scope': 'accordion',
        'data-state': getAccordionDataState(state.expanded),
        'data-value': item.value,
        name: multiple ? undefined : rootId,
        open: state.expanded ? true : undefined,
      } as AccordionItemElementProps;
    },
    [getItemState, multiple, orientation, rootId],
  );

  const getItemTriggerProps = useCallback(
    (
      item: AccordionItemOptions,
      props: JSX.HTMLAttributes<HTMLElement> = {},
    ): AccordionItemTriggerElementProps => {
      const state = getItemState(item);
      const triggerId = `${rootId}-trigger-${item.value}`;
      const contentId = `${rootId}-content-${item.value}`;

      return {
        ...props,
        'aria-controls': contentId,
        'aria-expanded': state.expanded,
        'data-controls': contentId,
        'data-disabled': state.disabled ? 'true' : undefined,
        'data-focus': state.focused ? 'true' : undefined,
        'data-orientation': orientation,
        'data-part': 'item-trigger',
        'data-scope': 'accordion',
        'data-state': getAccordionDataState(state.expanded),
        'aria-disabled': state.disabled ? 'true' : props['aria-disabled'],
        id: props.id ?? triggerId,
        onBlur: composeEventHandlers(props.onBlur, () => setFocusedValue(null)),
        onClick: composeEventHandlers(props.onClick, () => toggleItem(item)),
        onFocus: composeEventHandlers(props.onFocus, () => setFocusedValue(item.value)),
        onKeyDown: composeEventHandlers(
          props.onKeyDown,
          (event: JSX.TargetedKeyboardEvent<HTMLElement>) => {
            const supportedKeys = [
              'ArrowLeft',
              'ArrowRight',
              'ArrowUp',
              'ArrowDown',
              'Home',
              'End',
            ];

            if (!supportedKeys.includes(event.key)) {
              return;
            }

            event.preventDefault();
            handleNavigation(item, event.key, orientation);
          },
        ),
        ref: composeRefs(
          props.ref,
          (node: HTMLElement | null) => registerItemTrigger(item.value, node),
        ),
      };
    },
    [
      getItemState,
      handleNavigation,
      orientation,
      registerItemTrigger,
      rootId,
      setFocusedValue,
      toggleItem,
    ],
  );

  const getItemIndicatorProps = useCallback(
    (
      item: AccordionItemOptions,
      props: JSX.HTMLAttributes<HTMLDivElement> = {},
    ): AccordionItemIndicatorElementProps => {
      const state = getItemState(item);

      return {
        ...props,
        'data-disabled': state.disabled ? 'true' : undefined,
        'data-focus': state.focused ? 'true' : undefined,
        'data-orientation': orientation,
        'data-part': 'item-indicator',
        'data-scope': 'accordion',
        'data-state': getAccordionDataState(state.expanded),
      };
    },
    [getItemState, orientation],
  );

  const getItemContentProps = useCallback(
    (
      item: AccordionItemOptions,
      props: JSX.HTMLAttributes<HTMLDivElement> = {},
    ): AccordionItemContentElementProps => {
      const state = getItemState(item);
      const triggerId = `${rootId}-trigger-${item.value}`;
      const contentId = `${rootId}-content-${item.value}`;

      return {
        ...props,
        'aria-labelledby': triggerId,
        'data-disabled': state.disabled ? 'true' : undefined,
        'data-focus': state.focused ? 'true' : undefined,
        'data-orientation': orientation,
        'data-part': 'item-content',
        'data-scope': 'accordion',
        'data-state': getAccordionDataState(state.expanded),
        hidden: state.expanded ? props.hidden : true,
        id: props.id ?? contentId,
        role: props.role ?? 'region',
        tabIndex: state.expanded ? props.tabIndex ?? 0 : -1,
      };
    },
    [getItemState, orientation, rootId],
  );

  return {
    focusedValue,
    getItemContentProps,
    getItemIndicatorProps,
    getItemProps,
    getItemState,
    getItemTriggerProps,
    getRootProps,
    orientation,
    value: expandedValues,
  };
}
