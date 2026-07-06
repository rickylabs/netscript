/**
 * @component PromptInput
 * @layer 2
 * @depends theme-seed
 * @description Chat composer: an auto-grow textarea over a toolbar of toggle
 * pills (deep research / grounding), a ModelSelector, attach/screenshot/voice
 * affordances, and a send button. Presentational <form> — onSubmit reads the
 * field; textarea auto-grow is CSS-native and Enter-to-send is an app-island
 * enhancement.
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

const ICON_ATTACH = 'M12 5v14 M5 12h14';
const ICON_SCREENSHOT =
  'M4 9V6a2 2 0 0 1 2-2h3 M15 4h3a2 2 0 0 1 2 2v3 M20 15v3a2 2 0 0 1-2 2h-3 M9 20H6a2 2 0 0 1-2-2v-3';
const ICON_MIC =
  'M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z M5 11a7 7 0 0 0 14 0 M12 18v3';
const ICON_SEND = 'M12 19V5 M5 12l7-7 7 7';

function IconGlyph({ d }: { d: string }): VNode {
  return (
    <svg
      viewBox='0 0 24 24'
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      stroke-width='2'
      stroke-linecap='round'
      stroke-linejoin='round'
      aria-hidden='true'
    >
      <path d={d} />
    </svg>
  );
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
        <div class='ns-prompt-input__tools'>
          <button type='button' class='ns-iconbtn' aria-label='Attach file'>
            <IconGlyph d={ICON_ATTACH} />
          </button>
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
        </div>
        <div class='ns-prompt-input__actions'>
          <button type='button' class='ns-iconbtn' aria-label='Capture screenshot'>
            <IconGlyph d={ICON_SCREENSHOT} />
          </button>
          <button type='button' class='ns-iconbtn' aria-label='Voice input'>
            <IconGlyph d={ICON_MIC} />
          </button>
          <button type='submit' class='ns-prompt-input__send' aria-label='Send'>
            <IconGlyph d={ICON_SEND} />
          </button>
        </div>
      </div>
      {hint ? <div class='ns-prompt-input__hint'>{hint}</div> : null}
    </form>
  );
}
