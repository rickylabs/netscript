/**
 * @component HoverCard
 * @layer 2
 * @depends theme-seed floating-styles avatar
 * @description Focus-preserving profile preview on hover, focus or native button activation.
 */
import type { ComponentChildren, VNode } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Popover } from '@netscript/fresh-ui/interactive';
import { Icon } from '@netscript/fresh-ui/primitives';
import { Avatar } from './avatar.tsx';
import { cn } from '../../lib/cn.ts';

const HOVER_CARD_CLOSE_DELAY = 150;
export interface HoverCardProps {
  triggerLabel: string;
  title: string;
  description: ComponentChildren;
  meta?: ComponentChildren;
  avatar?: ComponentChildren;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeDelay?: number;
  disabled?: boolean;
  class?: string;
}

/** Informational opening preserves focus; Escape affects only an open preview. */
export function HoverCard(
  {
    triggerLabel,
    title,
    description,
    meta,
    avatar,
    placement = 'bottom',
    open,
    defaultOpen = false,
    onOpenChange,
    closeDelay = HOVER_CARD_CLOSE_DELAY,
    disabled = false,
    class: className,
  }: HoverCardProps,
): VNode {
  const [local, setLocal] = useState(defaultOpen), root = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(), blocked = useRef(false);
  const pointerPress = useRef(false);
  const isOpen = !disabled && (open ?? local);
  const clear = () => {
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
  };
  const change = (next: boolean) => {
    if (disabled || next === isOpen) return;
    if (open === undefined) setLocal(next);
    onOpenChange?.(next);
  };
  useEffect(() => () => {
    if (timer.current !== undefined) clearTimeout(timer.current);
  }, []);
  return (
    <span
      ref={root}
      class={cn('ns-hover-card', className)}
      data-scope='hover-card'
      data-part='root'
      data-placement={placement}
      data-state={isOpen ? 'open' : 'rest'}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') return;
        clear();
        if (!blocked.current) change(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'mouse') return;
        pointerPress.current = false;
        clear();
        blocked.current = false;
        timer.current = setTimeout(() => {
          if (!root.current?.contains(document.activeElement)) change(false);
        }, Math.max(0, closeDelay));
      }}
      onFocusIn={clear}
      onFocusOut={(event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          blocked.current = false;
          pointerPress.current = false;
          clear();
          change(false);
        }
      }}
      onKeyDown={(event) => {
        if (isOpen && event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          blocked.current = true;
          clear();
          change(false);
          root.current?.querySelector<HTMLButtonElement>('[data-part="trigger"]')?.focus();
        }
      }}
    >
      <Popover.Root
        open={isOpen}
        onOpenChange={(next) => {
          blocked.current = !next;
          change(next);
        }}
        placement={placement}
        closeOnEscape={false}
        focusOnOpen={false}
      >
        <Popover.Trigger
          class='ns-hover-card__trigger'
          disabled={disabled}
          data-scope='hover-card'
          data-part='trigger'
          onPointerDown={() => {
            pointerPress.current = true;
          }}
          onPointerCancel={() => {
            pointerPress.current = false;
          }}
          onClick={() => {
            pointerPress.current = false;
          }}
          onFocus={() => {
            clear();
            if (!blocked.current && !pointerPress.current) change(true);
          }}
        >
          {triggerLabel}
        </Popover.Trigger>
        <Popover.Content
          role='region'
          class='ns-hover-card__content'
          data-scope='hover-card'
          data-part='content'
        >
          <span data-scope='hover-card' data-part='avatar' aria-hidden='true'>
            {avatar ?? <Avatar name={title} class='ns-hover-card__avatar' />}
          </span>
          <Popover.Title data-scope='hover-card' data-part='title'>{title}</Popover.Title>
          <Popover.Description data-scope='hover-card' data-part='description'>
            {description}
          </Popover.Description>
          {meta && (
            <span data-scope='hover-card' data-part='meta'>
              <Icon name='calendar' />
              {meta}
            </span>
          )}
        </Popover.Content>
      </Popover.Root>
    </span>
  );
}
