/**
 * @component ContextMenu
 * @layer 2
 * @depends theme-seed floating-styles menu-items
 * @description Native pointer/keyboard context region over shared ActionMenu content.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { useId, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { ActionMenu } from '@netscript/fresh-ui/interactive';
import { cn } from '../../lib/cn.ts';
import { type MenuEntry, MenuItems } from './menu-items.tsx';

export interface ContextMenuProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class'> {
  label: string;
  items: readonly MenuEntry[];
  children: ComponentChildren;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  class?: string;
}

/** Shift+F10/ContextMenu are native invocation keys; ordinary editing keys keep their behavior. */
export function ContextMenu(
  {
    label,
    items,
    children,
    open,
    defaultOpen = false,
    onOpenChange,
    disabled = false,
    class: className,
    ...props
  }: ContextMenuProps,
): VNode {
  const [local, setLocal] = useState(defaultOpen),
    [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLDivElement>(null), id = useId();
  const unavailable = disabled || items.length === 0, isOpen = !unavailable && (open ?? local);
  const change = (next: boolean) => {
    if (next === isOpen) return;
    if (open === undefined) setLocal(next);
    onOpenChange?.(next);
  };
  const close = () => {
    change(false);
    trigger.current?.focus();
  };
  const invoke = (x: number, y: number) => {
    if (unavailable) return;
    setPoint({ x, y });
    change(true);
  };
  useLayoutEffect(() => {
    if (!isOpen) return;
    const content = root.current?.querySelector<HTMLElement>(
      '[data-scope="context-menu"][data-part="content"]',
    );
    const bounds = content?.getBoundingClientRect(),
      area = trigger.current?.getBoundingClientRect();
    if (!bounds || !area) return;
    const x = Math.max(0, Math.min(point?.x ?? area.left, innerWidth - bounds.width));
    const y = Math.max(0, Math.min(point?.y ?? area.bottom, innerHeight - bounds.height));
    if (x !== point?.x || y !== point?.y) setPoint({ x, y });
  }, [isOpen, point?.x, point?.y]);
  return (
    <div
      {...props}
      ref={root}
      class={cn('ns-context-menu', className)}
      data-scope='context-menu'
      data-part='root'
      data-open={String(isOpen)}
      onContextMenu={(event) => {
        props.onContextMenu?.(event);
        if (
          event.defaultPrevented || !(event.target instanceof Node) ||
          !trigger.current?.contains(event.target)
        ) return;
        if (unavailable) return;
        event.preventDefault();
        invoke(event.clientX, event.clientY);
      }}
      onFocusOut={(event) => {
        props.onFocusOut?.(event);
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        ) change(false);
      }}
    >
      <div
        ref={trigger}
        class='ns-context-menu__trigger'
        role='group'
        aria-label={label}
        aria-haspopup='menu'
        aria-controls={id}
        aria-keyshortcuts='Shift+F10'
        aria-disabled={unavailable || undefined}
        tabIndex={unavailable ? -1 : 0}
        data-scope='context-menu'
        data-part='trigger'
        onKeyDown={(event) => {
          if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
            if (unavailable) return;
            event.preventDefault();
            const bounds = event.currentTarget.getBoundingClientRect();
            invoke(bounds.left, bounds.bottom);
          } else if (isOpen && event.key === 'Escape') {
            event.preventDefault();
            close();
          }
        }}
      >
        {children}
      </div>
      <ActionMenu.Root
        id={id}
        open={isOpen}
        onOpenChange={change}
        placement='none'
        closeOnEscape={false}
        closeOnInteractOutside={false}
      >
        <ActionMenu.Content
          class='ns-menu-items__content ns-context-menu__content'
          data-scope='context-menu'
          data-part='content'
          aria-label={label}
          aria-labelledby=''
          aria-describedby=''
          style={{
            '--ns-floating-fallback-inset': `${point?.y ?? 0}px auto auto ${point?.x ?? 0}px`,
          }}
          onKeyDown={(event) => {
            if (
              !(event.target instanceof Element) ||
              event.target.closest('[role="menu"]') !== event.currentTarget
            ) return;
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              close();
            } else if (event.key === 'Tab') close();
          }}
        >
          <MenuItems items={items} onClose={close} />
        </ActionMenu.Content>
      </ActionMenu.Root>
    </div>
  );
}
