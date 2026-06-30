/**
 * @component ModelSelector
 * @layer 2
 * @depends theme-seed
 * @description Model/provider picker for the prompt composer. Native-first: a
 * <details> disclosure holds the option list (open/close + Esc are native;
 * an app island may add outside-click-close and auto-close on select).
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

/**
 * A selectable model entry.
 */
export interface ModelOption {
  id: string;
  label: string;
  provider?: string;
  desc?: string;
}

interface ModelSelectorProps
  extends Omit<JSX.HTMLAttributes<HTMLDetailsElement>, 'class' | 'onChange'> {
  /** Selected model id. */
  value: string;
  /** Available models. */
  models: ModelOption[];
  /** Invoked with the chosen model id. */
  onChange?: (id: string) => void;
  /** Menu alignment relative to the trigger. */
  align?: 'left' | 'right';
  class?: string;
}

/**
 * Renders a disclosure-backed model picker.
 */
export function ModelSelector(
  { value, models, onChange, align = 'left', class: className, ...props }: ModelSelectorProps,
): VNode {
  const current = models.find((model) => model.id === value) ?? models[0];

  return (
    <details {...props} class={cn('ns-model-selector', className)} data-align={align}>
      <summary class='ns-model-selector__btn'>
        {current?.provider
          ? <span class='ns-model-selector__provider'>{current.provider}</span>
          : null}
        <span>{current?.label}</span>
      </summary>
      <div class='ns-model-selector__menu' role='listbox'>
        {models.map((model) => {
          const selected = model.id === value;
          return (
            <button
              key={model.id}
              type='button'
              role='option'
              aria-selected={selected ? 'true' : 'false'}
              class={cn('ns-model-opt', selected && 'is-active')}
              onClick={() => onChange?.(model.id)}
            >
              <span class='ns-model-opt__main'>
                <span class='ns-model-opt__label'>{model.label}</span>
                {model.desc ? <span class='ns-model-opt__desc'>{model.desc}</span> : null}
              </span>
              {selected ? <span class='ns-model-opt__check' aria-hidden='true'>✓</span> : null}
            </button>
          );
        })}
      </div>
    </details>
  );
}
