/**
 * @component PromptInput
 * @layer 2
 * @depends theme-seed
 * @description Chat composer: an auto-grow textarea over a toolbar of toggle
 * pills (deep research / grounding), a ModelSelector, attach/screenshot/voice
 * affordances, and a send button. Presentational <form> — onSubmit reads the
 * field; Enter-to-send + textarea auto-grow are app-island enhancements.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import { type ModelOption, ModelSelector } from './model-selector.tsx';

/**
 * Submit metadata passed alongside the prompt text.
 */
export interface PromptSubmitMeta {
  grounding: boolean;
  research: boolean;
  model: string;
}

interface PromptInputProps extends Omit<JSX.HTMLAttributes<HTMLFormElement>, 'class' | 'onSubmit'> {
  placeholder?: string;
  onSubmit?: (text: string, meta: PromptSubmitMeta) => void;
  models?: ModelOption[];
  model?: string;
  onModelChange?: (id: string) => void;
  grounding?: boolean;
  onGroundingChange?: (next: boolean) => void;
  research?: boolean;
  onResearchChange?: (next: boolean) => void;
  hint?: string;
  compact?: boolean;
  class?: string;
}

/**
 * Renders the chat composer shell.
 */
export function PromptInput(
  {
    placeholder = 'Ask anything…',
    onSubmit,
    models,
    model = '',
    onModelChange,
    grounding = false,
    onGroundingChange,
    research = false,
    onResearchChange,
    hint,
    compact,
    class: className,
    ...props
  }: PromptInputProps,
): VNode {
  function handleSubmit(event: JSX.TargetedEvent<HTMLFormElement, Event>) {
    event.preventDefault();
    const field = event.currentTarget.elements.namedItem('prompt') as HTMLTextAreaElement | null;
    const text = field?.value.trim() ?? '';
    if (text) onSubmit?.(text, { grounding, research, model });
  }

  return (
    <form
      {...props}
      class={cn('ns-prompt-input', className)}
      data-compact={compact ? '' : undefined}
      onSubmit={handleSubmit}
    >
      <textarea
        name='prompt'
        rows={1}
        class='ns-prompt-input__field'
        placeholder={placeholder}
      />
      <div class='ns-prompt-input__bar'>
        <button
          type='button'
          class='ns-pill'
          aria-pressed={research ? 'true' : 'false'}
          onClick={() => onResearchChange?.(!research)}
        >
          Deep research
        </button>
        <button
          type='button'
          class='ns-pill'
          aria-pressed={grounding ? 'true' : 'false'}
          onClick={() => onGroundingChange?.(!grounding)}
        >
          Grounding
        </button>
        {models && models.length
          ? <ModelSelector value={model} models={models} onChange={onModelChange} align='left' />
          : null}
        <span class='ns-prompt-input__spacer' />
        <button type='button' class='ns-iconbtn' aria-label='Attach file'>+</button>
        <button type='button' class='ns-iconbtn' aria-label='Capture screenshot'>▢</button>
        <button type='button' class='ns-iconbtn' aria-label='Voice input'>◎</button>
        <button type='submit' class='ns-prompt-input__send' aria-label='Send'>↑</button>
      </div>
      {hint ? <div class='ns-prompt-input__hint'>{hint}</div> : null}
    </form>
  );
}
