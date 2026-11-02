/**
 * @component AlertDialog
 * @layer 2
 * @depends theme-seed button
 * @description Native modal confirmation with least-destructive initial focus and explicit actions.
 */
import type { ComponentChildren, VNode } from 'preact';
import { useState } from 'preact/hooks';
import { Dialog } from '@netscript/fresh-ui/interactive';
import { Icon } from '@netscript/fresh-ui/primitives';
import { cn } from '../../lib/cn.ts';
import { Button } from './button.tsx';

export interface AlertDialogProps {
  triggerLabel: string;
  title: ComponentChildren;
  description: ComponentChildren;
  children?: ComponentChildren;
  actionLabel: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  size?: 'sm' | 'md';
  media?: boolean;
  mediaIcon?: ComponentChildren;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAction?: () => void;
  onCancel?: () => void;
  pending?: boolean;
  disabled?: boolean;
  class?: string;
}

/** Root is context-only; the platform owns the modal focus boundary and return. */
export function AlertDialog(
  {
    triggerLabel,
    title,
    description,
    children,
    actionLabel,
    cancelLabel = 'Cancel',
    variant = 'default',
    size = 'md',
    media = true,
    mediaIcon,
    open,
    defaultOpen = false,
    onOpenChange,
    onAction,
    onCancel,
    pending = false,
    disabled = false,
    class: className,
  }: AlertDialogProps,
): VNode {
  const [local, setLocal] = useState(defaultOpen);
  const isOpen = open ?? local;
  const change = (next: boolean) => {
    if (next === isOpen) return;
    if (open === undefined) setLocal(next);
    onOpenChange?.(next);
  };
  const cancel = () => {
    onCancel?.();
    change(false);
  };
  return (
    <Dialog.Root open={isOpen} onOpenChange={change} closeOnInteractOutside={false}>
      <Dialog.Trigger
        disabled={disabled}
        class='ns-btn'
        data-variant='outline'
        data-scope='alert-dialog'
        data-part='trigger'
      >
        {triggerLabel}
      </Dialog.Trigger>
      <Dialog.Content
        role='alertdialog'
        class={cn('ns-alert-dialog', className)}
        data-scope='alert-dialog'
        data-part='content'
        data-variant={variant}
        data-size={size}
        onCancel={(event) => {
          event.preventDefault();
          cancel();
        }}
      >
        <div data-scope='alert-dialog' data-part='header'>
          {media && (
            <span data-scope='alert-dialog' data-part='media' aria-hidden='true'>
              {mediaIcon ?? (
                <Icon name={variant === 'destructive' ? 'alert-triangle' : 'info'} size='1.25em' />
              )}
            </span>
          )}
          <Dialog.Title data-scope='alert-dialog' data-part='title'>{title}</Dialog.Title>
          <Dialog.Description data-scope='alert-dialog' data-part='description'>
            {description}
          </Dialog.Description>
        </div>
        {children && <div data-scope='alert-dialog' data-part='body'>{children}</div>}
        <div data-scope='alert-dialog' data-part='footer'>
          <Dialog.Close
            class='ns-btn'
            data-variant='outline'
            data-scope='alert-dialog'
            data-part='cancel'
            autoFocus
            onClick={onCancel}
          >
            {cancelLabel}
          </Dialog.Close>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'primary'}
            loading={pending}
            data-scope='alert-dialog'
            data-part='action'
            onClick={() => {
              onAction?.();
              change(false);
            }}
          >
            {actionLabel}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
