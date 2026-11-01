/**
 * @component Questionnaire
 * @layer 2
 * @depends theme-seed, cn
 * @description Native answer form with caller-owned validation and progression.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { useId, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { cn } from '../../lib/cn.ts';

/** Host-owned presentation, not an internal wizard state machine. */
export type QuestionnaireStep = 'question' | 'freeform' | 'complete';
/** Decorative shortcut text adds no keyboard handler. */
export interface QuestionnaireOption {
  value: string;
  label: ComponentChildren;
  shortcut?: ComponentChildren;
  disabled?: boolean;
}
/** Native form attributes include caller onSubmit, onReset, action and method. */
export interface QuestionnaireProps extends
  Omit<
    JSX.HTMLAttributes<HTMLFormElement>,
    'class' | 'title' | 'value' | 'defaultValue' | 'onReset'
  > {
  title: ComponentChildren;
  description?: ComponentChildren;
  error?: ComponentChildren;
  progress?: ComponentChildren;
  actions?: ComponentChildren;
  options?: readonly QuestionnaireOption[];
  step?: QuestionnaireStep;
  multiple?: boolean;
  name?: string;
  disabled?: boolean;
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: readonly string[]) => void;
  text?: string;
  defaultText?: string;
  onTextChange?: (text: string) => void;
  placeholder?: string;
  onReset?: JSX.GenericEventHandler<HTMLFormElement>;
  class?: string;
}
const DEFAULT_FIELD_NAME = 'answer';
const DEFAULT_TEXT_ROWS = 3;

/** A real form works before hydration; hosts own action buttons and business effects. */
export function Questionnaire({
  title,
  description,
  error,
  progress,
  actions,
  options = [],
  step = 'question',
  multiple = false,
  name = DEFAULT_FIELD_NAME,
  disabled = false,
  value,
  defaultValue = [],
  onValueChange,
  text,
  defaultText = '',
  onTextChange,
  placeholder,
  onReset,
  children,
  class: className,
  ...props
}: QuestionnaireProps): VNode {
  const seen = new Set<string>();
  for (const option of options) {
    if (!option.value.trim() || seen.has(option.value)) {
      throw new TypeError('Questionnaire option values must be unique and nonempty');
    }
    seen.add(option.value);
  }
  const id = useId();
  const [local, setLocal] = useState<readonly string[]>(defaultValue);
  const [localText, setLocalText] = useState(defaultText);
  const defaults = useRef({ value: [...defaultValue], text: defaultText });
  const form = useRef<HTMLFormElement>(null);
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const field = useRef<HTMLTextAreaElement>(null);
  const mounted = useRef(false);
  const chosen = value ?? local;
  const accepted = multiple ? chosen : chosen.slice(0, 1);
  const acceptedText = text ?? localText;
  const current = useRef({
    accepted,
    acceptedText,
    controlled: value !== undefined,
    controlledText: text !== undefined,
  });
  current.current = {
    accepted,
    acceptedText,
    controlled: value !== undefined,
    controlledText: text !== undefined,
  };
  const restore = (values: readonly string[], nextText: string) => {
    for (const [key, input] of inputs.current) input.checked = values.includes(key);
    if (field.current) field.current.value = nextText;
  };
  useLayoutEffect(() => {
    // Reset reads native defaults, and can run after queued event microtasks.
    const resetValues = value !== undefined
      ? accepted
      : multiple
      ? defaults.current.value
      : defaults.current.value.slice(0, 1);
    for (const [key, input] of inputs.current) input.defaultChecked = resetValues.includes(key);
    if (field.current) {
      field.current.defaultValue = text !== undefined ? acceptedText : defaults.current.text;
    }
    // Defaults can change pristine controls; accepted current state is assigned last.
    restore(accepted, acceptedText);
  });
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const describedBy =
    [description != null ? id + '-description' : '', error != null ? id + '-error' : ''].filter(
      Boolean,
    ).join(' ') || undefined;
  return (
    <form
      {...props}
      ref={form}
      class={cn('ns-questionnaire', className)}
      data-scope='questionnaire'
      data-part='root'
      data-step={step}
      aria-labelledby={id + '-title'}
      onReset={(event) => {
        onReset?.(event);
        if (event.defaultPrevented) return;
        queueMicrotask(() => {
          if (!mounted.current || !form.current?.isConnected) return;
          const now = current.current;
          const resetValues = now.controlled
            ? now.accepted
            : (multiple ? defaults.current.value : defaults.current.value.slice(0, 1));
          const resetText = now.controlledText ? now.acceptedText : defaults.current.text;
          restore(resetValues, resetText);
          if (!now.controlled) setLocal(defaults.current.value);
          if (!now.controlledText) setLocalText(defaults.current.text);
        });
      }}
    >
      {progress != null && <div data-scope='questionnaire' data-part='progress'>{progress}</div>}
      <fieldset data-scope='questionnaire' data-part='item' disabled={disabled}>
        <legend id={id + '-title'} data-scope='questionnaire' data-part='title'>{title}</legend>
        {description != null && (
          <div id={id + '-description'} data-scope='questionnaire' data-part='description'>
            {description}
          </div>
        )}
        {step === 'question' && (
          <div data-scope='questionnaire' data-part='choices' data-multiple={String(multiple)}>
            {options.map((option) => {
              const checked = accepted.includes(option.value);
              const unavailable = disabled || option.disabled;
              return (
                <label
                  key={option.value}
                  data-scope='questionnaire'
                  data-part='choice'
                  data-multiple={String(multiple)}
                  data-state={unavailable ? 'disabled' : checked ? 'selected' : 'rest'}
                >
                  <input
                    ref={(node) => {
                      if (node) inputs.current.set(option.value, node);
                      else inputs.current.delete(option.value);
                    }}
                    type={multiple ? 'checkbox' : 'radio'}
                    name={name}
                    value={option.value}
                    checked={checked}
                    disabled={unavailable}
                    aria-describedby={describedBy}
                    aria-invalid={error != null ? 'true' : undefined}
                    data-scope='questionnaire'
                    data-part='input'
                    onChange={(event) => {
                      const next = multiple
                        ? (event.currentTarget.checked
                          ? [...new Set([...accepted, option.value])]
                          : accepted.filter((v) =>
                            v !== option.value
                          ))
                        : [option.value];
                      if (value !== undefined) {
                        restore(accepted, acceptedText);
                      } else setLocal(next);
                      onValueChange?.(next);
                    }}
                  />
                  {option.shortcut != null && (
                    <kbd data-scope='questionnaire' data-part='shortcut' aria-hidden='true'>
                      {option.shortcut}
                    </kbd>
                  )}
                  <span data-scope='questionnaire' data-part='label'>{option.label}</span>
                  <span data-scope='questionnaire' data-part='indicator' aria-hidden='true' />
                </label>
              );
            })}
          </div>
        )}
        {step === 'freeform' && (
          <textarea
            ref={field}
            name={name}
            value={acceptedText}
            rows={DEFAULT_TEXT_ROWS}
            placeholder={placeholder}
            aria-labelledby={id + '-title'}
            aria-describedby={describedBy}
            aria-invalid={error != null ? 'true' : undefined}
            data-scope='questionnaire'
            data-part='input'
            onInput={(event) => {
              const next = event.currentTarget.value;
              if (text !== undefined) event.currentTarget.value = acceptedText;
              else setLocalText(next);
              onTextChange?.(next);
            }}
          />
        )}
        {error != null && (
          <div id={id + '-error'} data-scope='questionnaire' data-part='error'>{error}</div>
        )}
      </fieldset>
      {children != null && <div data-scope='questionnaire' data-part='content'>{children}</div>}
      {actions != null && <div data-scope='questionnaire' data-part='actions'>{actions}</div>}
    </form>
  );
}
