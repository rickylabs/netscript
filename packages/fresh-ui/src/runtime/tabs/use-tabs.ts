import type { JSX } from 'preact';
import { useCallback, useId, useRef } from 'preact/hooks';
import { composeEventHandlers } from '../_internal/compose-event-handlers.ts';
import { composeRefs } from '../_internal/compose-refs.ts';
import { useControllableSignal } from '../_internal/use-controllable-signal.ts';
import type {
  TabsActivationMode,
  TabsContentElementProps,
  TabsListElementProps,
  TabsOrientation,
  TabsRootElementProps,
  TabsTriggerElementProps,
  UseTabsOptions,
  UseTabsReturn,
} from './tabs.types.ts';
import { getNextTabsIndex } from './tabs.utils.ts';

function getTabsDataState(selected: boolean): 'active' | 'inactive' {
  return selected ? 'active' : 'inactive';
}

export function useTabs({
  activationMode = 'automatic',
  defaultValue = '',
  id,
  loop = true,
  onValueChange,
  orientation = 'horizontal',
  value,
}: UseTabsOptions = {}): UseTabsReturn {
  const generatedId = useId();
  const rootId = id ?? `ns-tabs-${generatedId}`;
  const [selectedValue, setSelectedValue] = useControllableSignal<string>({
    defaultValue,
    onChange: onValueChange,
    value,
  });
  const triggerOrder = useRef<string[]>([]);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement | null>());

  const registerTrigger = useCallback((tabValue: string, node: HTMLButtonElement | null) => {
    if (node === null) {
      triggerRefs.current.delete(tabValue);
      triggerOrder.current = triggerOrder.current.filter((entry) => entry !== tabValue);
      return;
    }

    triggerRefs.current.set(tabValue, node);

    if (!triggerOrder.current.includes(tabValue)) {
      triggerOrder.current = [...triggerOrder.current, tabValue];
    }
  }, []);

  const focusTriggerAtIndex = useCallback((index: number) => {
    const valueAtIndex = triggerOrder.current[index];
    if (!valueAtIndex) {
      return;
    }

    triggerRefs.current.get(valueAtIndex)?.focus();
  }, []);

  const handleNavigation = useCallback(
    (tabValue: string, key: string, mode: TabsActivationMode, axis: TabsOrientation) => {
      const currentIndex = triggerOrder.current.indexOf(tabValue);
      if (currentIndex < 0) {
        return;
      }

      const nextIndex = getNextTabsIndex(
        key,
        currentIndex,
        triggerOrder.current.length,
        axis,
        loop,
      );
      if (nextIndex < 0 || nextIndex === currentIndex) {
        return;
      }

      const nextValue = triggerOrder.current[nextIndex];
      focusTriggerAtIndex(nextIndex);

      if (mode === 'automatic' && nextValue) {
        setSelectedValue(nextValue);
      }
    },
    [focusTriggerAtIndex, loop, setSelectedValue],
  );

  const getRootProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLDivElement> = {}): TabsRootElementProps => ({
      ...props,
      'data-orientation': orientation,
      'data-part': 'root',
      'data-value': selectedValue || undefined,
      id: props.id ?? rootId,
    }),
    [orientation, rootId, selectedValue],
  );

  const getListProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLDivElement> = {}): TabsListElementProps => ({
      ...props,
      'aria-orientation': orientation,
      'data-orientation': orientation,
      'data-part': 'list',
      role: props.role ?? 'tablist',
    }),
    [orientation],
  );

  const getTriggerProps = useCallback(
    (
      tabValue: string,
      props: JSX.ButtonHTMLAttributes<HTMLButtonElement> = {},
    ): TabsTriggerElementProps => {
      const selected = selectedValue === tabValue;
      const triggerId = `${rootId}-trigger-${tabValue}`;
      const panelId = `${rootId}-panel-${tabValue}`;

      return {
        ...props,
        'aria-controls': panelId,
        'aria-selected': selected,
        'data-orientation': orientation,
        'data-part': 'trigger',
        'data-selected': selected ? 'true' : 'false',
        'data-state': getTabsDataState(selected),
        id: props.id ?? triggerId,
        onClick: composeEventHandlers(props.onClick, () => setSelectedValue(tabValue)),
        onKeyDown: composeEventHandlers(
          props.onKeyDown,
          (event: JSX.TargetedKeyboardEvent<HTMLButtonElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
              if (activationMode === 'manual') {
                event.preventDefault();
                setSelectedValue(tabValue);
              }

              return;
            }

            handleNavigation(tabValue, event.key, activationMode, orientation);

            if (
              ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)
            ) {
              event.preventDefault();
            }
          },
        ),
        ref: composeRefs(
          props.ref,
          (node: HTMLButtonElement | null) => registerTrigger(tabValue, node),
        ),
        role: props.role ?? 'tab',
        tabIndex: selected ? 0 : -1,
        type: props.type ?? 'button',
      };
    },
    [
      activationMode,
      handleNavigation,
      orientation,
      registerTrigger,
      rootId,
      selectedValue,
      setSelectedValue,
    ],
  );

  const getContentProps = useCallback(
    (tabValue: string, props: JSX.HTMLAttributes<HTMLDivElement> = {}): TabsContentElementProps => {
      const selected = selectedValue === tabValue;
      const triggerId = `${rootId}-trigger-${tabValue}`;
      const panelId = `${rootId}-panel-${tabValue}`;

      return {
        ...props,
        'aria-labelledby': triggerId,
        'data-orientation': orientation,
        'data-part': 'content',
        'data-selected': selected ? 'true' : 'false',
        'data-state': getTabsDataState(selected),
        hidden: selected ? undefined : true,
        id: props.id ?? panelId,
        role: props.role ?? 'tabpanel',
        tabIndex: selected ? 0 : -1,
      };
    },
    [orientation, rootId, selectedValue],
  );

  return {
    getContentProps,
    getListProps,
    getRootProps,
    getTriggerProps,
    orientation,
    value: selectedValue,
  };
}
