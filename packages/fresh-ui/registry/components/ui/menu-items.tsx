/** Shared copied menu content; the public ActionMenu runtime owns native popovers and traversal. */
import type { VNode } from 'preact';
import { useId, useRef, useState } from 'preact/hooks';
import { ActionMenu } from '@netscript/fresh-ui/interactive';

interface MenuEntryBase {
  id: string;
  label: string;
  disabled?: boolean;
  shortcut?: string;
}
/** Choice state and application actions always stay with the caller. */
export type MenuEntry =
  | (MenuEntryBase & { kind?: 'action'; intent?: 'default' | 'destructive'; onSelect?: () => void })
  | (MenuEntryBase & {
    kind: 'checkbox' | 'radio';
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
  })
  | (MenuEntryBase & { kind: 'submenu'; items: readonly MenuEntry[] })
  | { id: string; kind: 'separator' }
  | { id: string; kind: 'label'; label: string };

/** Leaf actions close the whole menu family; choices remain open for further adjustments. */
export function MenuItems(
  { items, onClose }: { items: readonly MenuEntry[]; onClose: () => void },
): VNode {
  return (
    <>
      {items.map((item) =>
        item.kind === 'separator'
          ? <ActionMenu.Separator key={item.id} />
          : item.kind === 'label'
          ? <div key={item.id} class='ns-menu-items__label'>{item.label}</div>
          : item.kind === 'submenu'
          ? <Submenu key={item.id} item={item} onClose={onClose} />
          : (
            <ActionMenu.Item
              key={item.id}
              class='ns-menu-items__item'
              aria-label={item.label}
              disabled={item.disabled}
              role={item.kind === 'checkbox'
                ? 'menuitemcheckbox'
                : item.kind === 'radio'
                ? 'menuitemradio'
                : 'menuitem'}
              aria-checked={item.kind === 'checkbox' || item.kind === 'radio'
                ? item.checked
                : undefined}
              intent={item.kind === 'action' || item.kind === undefined ? item.intent : undefined}
              closeOnSelect={false}
              onClick={() => {
                if (item.kind === 'checkbox' || item.kind === 'radio') {
                  item.onCheckedChange(
                    item.kind === 'radio' || !item.checked,
                  );
                } else {
                  if ('onSelect' in item) item.onSelect?.();
                  onClose();
                }
              }}
            >
              <span class='ns-menu-items__mark' aria-hidden='true'>
                {item.kind === 'checkbox' && item.checked
                  ? '✓'
                  : item.kind === 'radio' && item.checked
                  ? '•'
                  : ''}
              </span>
              <span>{item.label}</span>
              {item.shortcut && <kbd>{item.shortcut}</kbd>}
            </ActionMenu.Item>
          )
      )}
    </>
  );
}

/** A submenu keeps Escape/return at its own level instead of dismissing its ancestors. */
function Submenu(
  { item, onClose }: {
    item: MenuEntryBase & { kind: 'submenu'; items: readonly MenuEntry[] };
    onClose: () => void;
  },
): VNode {
  const [open, setOpen] = useState(false), root = useRef<HTMLSpanElement>(null);
  const id = useId();
  const [placement, setPlacement] = useState('right-start');
  const place = (element: HTMLElement) =>
    setPlacement(getComputedStyle(element).direction === 'rtl' ? 'left-start' : 'right-start');
  const close = () => {
    setOpen(false);
    root.current?.querySelector<HTMLButtonElement>('button')?.focus();
  };
  return (
    <span ref={root} class='ns-menu-items__submenu'>
      <ActionMenu.Root
        open={open}
        onOpenChange={setOpen}
        placement={placement}
        closeOnEscape={false}
        closeOnInteractOutside={false}
      >
        <ActionMenu.Trigger
          id={id}
          class='ns-menu-items__item'
          role='menuitem'
          data-part='item'
          disabled={item.disabled}
          tabIndex={-1}
          onClick={(event) => {
            if (event.currentTarget instanceof HTMLElement) place(event.currentTarget);
          }}
          onKeyDown={(event) => {
            if (
              !(event instanceof KeyboardEvent) || !(event.currentTarget instanceof HTMLElement)
            ) return;
            const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
            if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) {
              event.preventDefault();
              event.stopPropagation();
              place(event.currentTarget);
              setOpen(true);
            }
          }}
        >
          <span class='ns-menu-items__mark' aria-hidden='true' />
          <span>{item.label}</span>
          <span class='ns-menu-items__next' aria-hidden='true'>›</span>
        </ActionMenu.Trigger>
        <ActionMenu.Content
          aria-label={item.label}
          aria-labelledby={id}
          aria-describedby=''
          class='ns-menu-items__content'
          onFocusOut={(event) => {
            if (
              !(event instanceof FocusEvent) || !(event.currentTarget instanceof HTMLElement)
            ) return;
            if (
              !(event.relatedTarget instanceof Node) ||
              !event.currentTarget.contains(event.relatedTarget)
            ) setOpen(false);
          }}
          onKeyDown={(event) => {
            if (!(event.currentTarget instanceof HTMLElement)) return;
            const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
            if (event.key === 'Escape' || event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) {
              event.preventDefault();
              event.stopPropagation();
              close();
            }
          }}
        >
          <MenuItems
            items={item.items}
            onClose={() => {
              setOpen(false);
              onClose();
            }}
          />
        </ActionMenu.Content>
      </ActionMenu.Root>
    </span>
  );
}
