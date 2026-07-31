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

import type { ComponentChildren, JSX, VNode } from 'preact';
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

/** Keyboard policies supported by PromptInput submission. */
export const PROMPT_SUBMIT_KEYS = ['none', 'enter', 'mod-enter'] as const;

/** Keyboard policy used to submit the prompt textarea. */
export type PromptSubmitKey = typeof PROMPT_SUBMIT_KEYS[number];

/** Minimal keyboard state used to evaluate a PromptInput submit policy. */
export interface PromptSubmitKeyEvent {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly isComposing: boolean;
  readonly keyCode: number;
}

/** Returns whether a keyboard event should submit under the configured policy. */
export function shouldSubmitPromptKey(
  event: PromptSubmitKeyEvent,
  policy: PromptSubmitKey,
): boolean {
  if (event.isComposing || event.keyCode === 229) return false;
  return policy === 'enter'
    ? event.key === 'Enter' && !event.shiftKey
    : policy === 'mod-enter'
    ? event.key === 'Enter' && (event.ctrlKey || event.metaKey)
    : false;
}

const ICON_ATTACH = 'M12 5v14 M5 12h14';
const ICON_SCREENSHOT =
  'M4 9V6a2 2 0 0 1 2-2h3 M15 4h3a2 2 0 0 1 2 2v3 M20 15v3a2 2 0 0 1-2 2h-3 M9 20H6a2 2 0 0 1-2-2v-3';
const ICON_MIC =
  'M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z M5 11a7 7 0 0 0 14 0 M12 18v3';
const ICON_SEND = 'M12 19V5 M5 12l7-7 7 7';
const ICON_STOP = 'M7 7h10v10H7z';

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

export interface PromptInputProps
  extends Omit<JSX.HTMLAttributes<HTMLFormElement>, 'class' | 'onSubmit'> {
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
  onAttach?: () => void;
  onScreenshot?: () => void;
  onVoice?: () => void;
  leadingActions?: ComponentChildren;
  trailingActions?: ComponentChildren;
  busy?: boolean;
  onStop?: () => void;
  sendDisabled?: boolean;
  submitKey?: PromptSubmitKey;
}

/**
 * Renders the chat composer shell. Action affordances are capability-gated; after re-adding this
 * vendored registry component, supply callbacks or slots for every action that should appear.
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
    onAttach,
    onScreenshot,
    onVoice,
    leadingActions,
    trailingActions,
    busy = false,
    onStop,
    sendDisabled = false,
    submitKey = 'none',
    class: className,
    ...props
  }: PromptInputProps,
): VNode {
  function handleSubmit(event: JSX.TargetedEvent<HTMLFormElement, Event>) {
    event.preventDefault();
    const field = event.currentTarget.elements.namedItem('prompt') as HTMLTextAreaElement | null;
    const text = field?.value.trim() ?? '';
    if (!busy && !sendDisabled && text) onSubmit?.(text, { grounding, research, model });
  }

  function handleKeyDown(event: JSX.TargetedKeyboardEvent<HTMLTextAreaElement>): void {
    if (busy || sendDisabled || !shouldSubmitPromptKey(event, submitKey)) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
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
        aria-keyshortcuts={submitKey === 'enter'
          ? 'Enter'
          : submitKey === 'mod-enter'
          ? 'Control+Enter Meta+Enter'
          : undefined}
        disabled={busy}
        onKeyDown={handleKeyDown}
      />
      <div class='ns-prompt-input__bar'>
        <div class='ns-prompt-input__tools'>
          {leadingActions}
          {onAttach
            ? (
              <button type='button' class='ns-iconbtn' aria-label='Attach file' onClick={onAttach}>
                <IconGlyph d={ICON_ATTACH} />
              </button>
            )
            : null}
          {onResearchChange
            ? (
              <button
                type='button'
                class='ns-pill'
                aria-pressed={research ? 'true' : 'false'}
                onClick={() => onResearchChange?.(!research)}
              >
                Deep research
              </button>
            )
            : null}
          {onGroundingChange
            ? (
              <button
                type='button'
                class='ns-pill'
                aria-pressed={grounding ? 'true' : 'false'}
                onClick={() => onGroundingChange?.(!grounding)}
              >
                Grounding
              </button>
            )
            : null}
          {models && models.length
            ? <ModelSelector value={model} models={models} onChange={onModelChange} align='left' />
            : null}
        </div>
        <div class='ns-prompt-input__actions'>
          {onScreenshot
            ? (
              <button
                type='button'
                class='ns-iconbtn'
                aria-label='Capture screenshot'
                onClick={onScreenshot}
              >
                <IconGlyph d={ICON_SCREENSHOT} />
              </button>
            )
            : null}
          {onVoice
            ? (
              <button type='button' class='ns-iconbtn' aria-label='Voice input' onClick={onVoice}>
                <IconGlyph d={ICON_MIC} />
              </button>
            )
            : null}
          {trailingActions}
          {busy && onStop
            ? (
              <button
                type='button'
                class='ns-prompt-input__send'
                aria-label='Stop generating'
                onClick={onStop}
              >
                <IconGlyph d={ICON_STOP} />
              </button>
            )
            : (
              <button
                type='submit'
                class='ns-prompt-input__send'
                aria-label='Send'
                disabled={busy || sendDisabled}
              >
                <IconGlyph d={ICON_SEND} />
              </button>
            )}
        </div>
      </div>
      {hint ? <div class='ns-prompt-input__hint'>{hint}</div> : null}
    </form>
  );
}
