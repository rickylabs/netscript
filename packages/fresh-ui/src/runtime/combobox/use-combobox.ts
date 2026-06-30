import type { JSX } from 'preact';
import { useCallback, useId, useRef } from 'preact/hooks';
import { composeEventHandlers } from '../_internal/compose-event-handlers.ts';
import { composeRefs } from '../_internal/compose-refs.ts';
import { useControllableSignal } from '../_internal/use-controllable-signal.ts';
import {
  type ComboboxDirection,
  getComboboxDataState,
  getNextComboboxIndex,
} from './combobox.utils.ts';
import type {
  ComboboxContentElementProps,
  ComboboxInputElementProps,
  ComboboxItemElementProps,
  ComboboxRootElementProps,
  UseComboboxOptions,
  UseComboboxReturn,
} from './combobox.types.ts';

export function useCombobox({
  id,
  value,
  defaultValue = '',
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  inputValue,
  defaultInputValue = '',
  onInputValueChange,
  loop = true,
}: UseComboboxOptions = {}): UseComboboxReturn {
  const generatedId = useId();
  const rootId = id ?? `ns-combobox-${generatedId}`;
  const listId = `${rootId}-list`;
  const inputId = `${rootId}-input`;
  const itemId = (itemValue: string) => `${rootId}-opt-${itemValue}`;

  const [selectedValue, setSelectedValue] = useControllableSignal<string>({
    defaultValue,
    onChange: onValueChange,
    value,
  });
  const [openState, setOpenState] = useControllableSignal<boolean>({
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    value: openProp,
  });
  const [query, setQuery] = useControllableSignal<string>({
    defaultValue: defaultInputValue,
    onChange: onInputValueChange,
    value: inputValue,
  });
  const [highlighted, setHighlighted] = useControllableSignal<string>({ defaultValue: '' });

  const itemOrder = useRef<string[]>([]);
  const itemRefs = useRef(new Map<string, HTMLElement | null>());

  const registerItem = useCallback((itemValue: string, node: HTMLElement | null) => {
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

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    if (!next) setHighlighted('');
  }, [setHighlighted, setOpenState]);

  const moveHighlight = useCallback((direction: ComboboxDirection) => {
    const order = itemOrder.current;
    const nextIndex = getNextComboboxIndex(direction, order.indexOf(highlighted), order.length, loop);
    const nextValue = order[nextIndex];
    if (!nextValue) return;
    setHighlighted(nextValue);
    itemRefs.current.get(nextValue)?.scrollIntoView({ block: 'nearest' });
  }, [highlighted, loop, setHighlighted]);

  const selectValue = useCallback((itemValue: string) => {
    setSelectedValue(itemValue);
    setOpen(false);
  }, [setOpen, setSelectedValue]);

  const getRootProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLDivElement> = {}): ComboboxRootElementProps => ({
      ...props,
      'data-part': 'root',
      'data-state': getComboboxDataState(openState),
      id: props.id ?? rootId,
    }),
    [openState, rootId],
  );

  const getInputProps = useCallback(
    (props: JSX.InputHTMLAttributes<HTMLInputElement> = {}): ComboboxInputElementProps => ({
      ...props,
      role: props.role ?? 'combobox',
      'aria-expanded': openState,
      'aria-controls': listId,
      'aria-autocomplete': 'list',
      'aria-activedescendant': openState && highlighted ? itemId(highlighted) : undefined,
      'data-part': 'input',
      'data-state': getComboboxDataState(openState),
      id: props.id ?? inputId,
      value: props.value ?? query,
      onInput: composeEventHandlers(
        props.onInput,
        (event: JSX.TargetedEvent<HTMLInputElement, Event>) => {
          setQuery(event.currentTarget.value);
          if (!openState) setOpen(true);
        },
      ),
      onKeyDown: composeEventHandlers(
        props.onKeyDown,
        (event: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
          switch (event.key) {
            case 'ArrowDown':
              event.preventDefault();
              if (!openState) setOpen(true);
              else moveHighlight(1);
              break;
            case 'ArrowUp':
              event.preventDefault();
              if (!openState) setOpen(true);
              else moveHighlight(-1);
              break;
            case 'Home':
              if (openState) {
                event.preventDefault();
                moveHighlight('first');
              }
              break;
            case 'End':
              if (openState) {
                event.preventDefault();
                moveHighlight('last');
              }
              break;
            case 'Enter':
              if (openState && highlighted) {
                event.preventDefault();
                selectValue(highlighted);
              }
              break;
            case 'Escape':
              if (openState) {
                event.preventDefault();
                setOpen(false);
              }
              break;
          }
        },
      ),
    }),
    [highlighted, inputId, listId, moveHighlight, openState, query, selectValue, setOpen, setQuery],
  );

  const getContentProps = useCallback(
    (props: JSX.HTMLAttributes<HTMLDivElement> = {}): ComboboxContentElementProps => ({
      ...props,
      role: props.role ?? 'listbox',
      'data-part': 'content',
      'data-state': getComboboxDataState(openState),
      hidden: openState ? undefined : true,
      id: props.id ?? listId,
    }),
    [listId, openState],
  );

  const getItemProps = useCallback(
    (itemValue: string, props: JSX.HTMLAttributes<HTMLDivElement> = {}): ComboboxItemElementProps => {
      const selected = selectedValue === itemValue;
      const isHighlighted = highlighted === itemValue;
      return {
        ...props,
        role: props.role ?? 'option',
        'aria-selected': selected,
        'data-part': 'item',
        'data-highlighted': isHighlighted ? 'true' : undefined,
        'data-selected': selected ? 'true' : 'false',
        'data-state': selected ? 'checked' : 'unchecked',
        id: props.id ?? itemId(itemValue),
        onClick: composeEventHandlers(props.onClick, () => selectValue(itemValue)),
        onPointerMove: composeEventHandlers(props.onPointerMove, () => setHighlighted(itemValue)),
        ref: composeRefs(
          props.ref,
          (node: HTMLElement | null) => registerItem(itemValue, node),
        ),
      };
    },
    [highlighted, registerItem, selectValue, selectedValue, setHighlighted],
  );

  return {
    getRootProps,
    getInputProps,
    getContentProps,
    getItemProps,
    open: openState,
    inputValue: query,
    value: selectedValue,
    highlighted,
    setOpen,
  };
}
