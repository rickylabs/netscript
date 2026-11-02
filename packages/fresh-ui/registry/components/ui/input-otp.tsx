/**
 * @component InputOTP
 * @layer 2
 * @depends theme-seed
 * @description One native editable input, rendered as grouped visual character slots.
 */
import { Fragment } from 'preact';
import type { JSX, VNode } from 'preact';
import { useState } from 'preact/hooks';
import { cn } from '../../lib/cn.ts';

/** A single input preserves selection, IME, autofill, mobile keyboard and native editing. */
export interface InputOTPProps extends
  Omit<
    JSX.InputHTMLAttributes<HTMLInputElement>,
    'class' | 'size' | 'value' | 'defaultValue' | 'maxLength' | 'children'
  > {
  label: string;
  length?: 4 | 6;
  groups?: 1 | 2;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  state?: 'rest' | 'focus' | 'disabled' | 'invalid';
  class?: string;
}

/** Hydrate inside an island for visual slots and sanitized paste; editing stays native. */
export function InputOTP({
  label,
  length = 6,
  groups = 1,
  value,
  defaultValue = '',
  onValueChange,
  state = 'rest',
  disabled = false,
  class: className,
  onInput,
  onPaste,
  onFocus,
  onBlur,
  onSelect,
  ...props
}: InputOTPProps): VNode {
  const normalize = (input: string) => input.replace(/[^0-9]/g, '').slice(0, length);
  const [local, setLocal] = useState(normalize(defaultValue));
  const [focus, setFocus] = useState(false);
  const [caret, setCaret] = useState(0);
  const code = normalize(value ?? local);
  const isFocused = focus || state === 'focus';
  const unavailable = disabled || state === 'disabled';
  const update = (next: string) => {
    if (value === undefined) setLocal(next);
    onValueChange?.(next);
  };
  return (
    <div
      class={cn('ns-input-otp', className)}
      data-scope='input-otp'
      data-part='root'
      data-length={length}
      data-groups={groups}
      data-state={unavailable
        ? 'disabled'
        : state === 'invalid'
        ? 'invalid'
        : focus
        ? 'focus'
        : state}
    >
      <input
        {...props}
        type='text'
        inputMode='numeric'
        autoComplete='one-time-code'
        aria-label={label}
        aria-invalid={state === 'invalid' || undefined}
        disabled={unavailable}
        value={code}
        maxLength={length}
        pattern={`[0-9]{${length}}`}
        onInput={(event) => {
          onInput?.(event);
          if (event.defaultPrevented) return;
          const next = normalize(event.currentTarget.value);
          event.currentTarget.value = value === undefined ? next : code;
          setCaret(event.currentTarget.selectionStart ?? next.length);
          update(next);
        }}
        onPaste={(event) => {
          onPaste?.(event);
          if (event.defaultPrevented) return;
          const pasted = event.clipboardData?.getData('text');
          if (pasted == null) return;
          event.preventDefault();
          const input = event.currentTarget;
          const start = input.selectionStart ?? code.length, end = input.selectionEnd ?? start;
          const digits = pasted.replace(/[^0-9]/g, '');
          const next = normalize(code.slice(0, start) + digits + code.slice(end));
          const position = Math.min(start + digits.length, length);
          input.value = value === undefined ? next : code;
          input.setSelectionRange(position, position);
          setCaret(position);
          update(next);
        }}
        onFocus={(event) => {
          onFocus?.(event);
          setFocus(true);
          setCaret(event.currentTarget.selectionStart ?? 0);
        }}
        onBlur={(event) => {
          onBlur?.(event);
          setFocus(false);
        }}
        onSelect={(event) => {
          onSelect?.(event);
          setCaret(event.currentTarget.selectionStart ?? 0);
        }}
      />
      <div class='ns-input-otp__visual' aria-hidden='true'>
        {Array.from(
          { length: groups },
          (_, group) => (
            <Fragment key={group}>
              <div data-scope='input-otp' data-part='group'>
                {Array.from({ length: length / groups }, (_, slot) => {
                  const index = group * (length / groups) + slot;
                  return (
                    <span
                      key={index}
                      data-scope='input-otp'
                      data-part='slot'
                      data-content={code[index]
                        ? 'value'
                        : isFocused && caret === index
                        ? 'caret'
                        : 'empty'}
                      data-state={unavailable
                        ? 'disabled'
                        : state === 'invalid'
                        ? 'invalid'
                        : isFocused && Math.min(caret, length - 1) === index
                        ? 'focus'
                        : 'rest'}
                    >
                      {code[index] ?? ''}
                    </span>
                  );
                })}
              </div>
              {group < groups - 1 && <span data-scope='input-otp' data-part='separator'>−</span>}
            </Fragment>
          ),
        )}
      </div>
    </div>
  );
}
