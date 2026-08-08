import { assert, assertEquals } from '@std/assert';
import { FRESH_UI_REGISTRY_CONTENT } from '../../../../registry.generated.ts';
import {
  PromptInput,
  shouldSubmitPromptKey,
} from '../../../../registry/components/ui/prompt-input.tsx';

interface VNodeLike {
  type: unknown;
  props: Record<string, unknown>;
}

function vnodeProps(value: unknown): Record<string, unknown> {
  assert(value && typeof value === 'object' && 'props' in value, 'expected a vnode');
  return (value as VNodeLike).props;
}

function classes(value: unknown): string[] {
  return typeof value === 'string' ? value.split(' ').filter(Boolean) : [];
}

const MODELS = [{ id: 'opus', label: 'Opus 5', provider: 'Anthropic' }];

Deno.test('PromptInput renders a form with field, capabilities, and send', () => {
  const v = PromptInput({
    placeholder: 'Ask the gateway…',
    models: MODELS,
    model: 'opus',
    onResearchChange: () => undefined,
    onGroundingChange: () => undefined,
  });
  assert(classes(vnodeProps(v).class).includes('ns-prompt-input'), 'base class');
  const json = JSON.stringify(v);
  assert(json.includes('ns-prompt-input__field'), 'textarea field');
  assert(json.includes('Ask the gateway…'), 'placeholder');
  assert(json.includes('Deep research') && json.includes('Grounding'), 'toggle pills');
  assert(json.includes('ns-prompt-input__send'), 'send button');
});

Deno.test('PromptInput wires aria-pressed toggle pills', () => {
  const json = JSON.stringify(PromptInput({
    grounding: true,
    research: false,
    onResearchChange: () => undefined,
    onGroundingChange: () => undefined,
  }));
  assert(json.includes('aria-pressed'), 'pills expose aria-pressed');
  assert(json.includes('Deep research') && json.includes('Grounding'), 'both toggle pills');
});

Deno.test('PromptInput minimal configuration renders no inert toolbar affordances', () => {
  const json = JSON.stringify(PromptInput({}));
  assert(!json.includes('Attach file'));
  assert(!json.includes('Capture screenshot'));
  assert(!json.includes('Voice input'));
  assert(!json.includes('Deep research'));
  assert(!json.includes('Grounding'));
});

Deno.test('PromptInput renders only supplied action capabilities', () => {
  const json = JSON.stringify(PromptInput({ onAttach: () => undefined, onVoice: () => undefined }));
  assert(json.includes('Attach file'));
  assert(json.includes('Voice input'));
  assert(!json.includes('Capture screenshot'));
});

Deno.test('PromptInput mod-enter submits and composition never submits', () => {
  const event = {
    key: 'Enter',
    ctrlKey: true,
    metaKey: false,
    shiftKey: false,
    keyCode: 13,
    isComposing: false,
  };
  assertEquals(shouldSubmitPromptKey(event, 'mod-enter'), true);
  assertEquals(shouldSubmitPromptKey({ ...event, isComposing: true }, 'mod-enter'), false);
  assertEquals(shouldSubmitPromptKey({ ...event, ctrlKey: false }, 'mod-enter'), false);
  assert(
    JSON.stringify(PromptInput({ submitKey: 'mod-enter' })).includes('Control+Enter Meta+Enter'),
  );
});

Deno.test('PromptInput busy state blocks duplicate submit and exposes Stop', () => {
  const form = PromptInput({ busy: true, onStop: () => undefined, onSubmit: () => undefined });
  const json = JSON.stringify(form);
  assert(json.includes('Stop generating'));
  assert(!json.includes('aria-label":"Send"'));
  assert(json.includes('disabled'));
});

Deno.test('PromptInput omits the model picker when no models given', () => {
  const json = JSON.stringify(PromptInput({}));
  assert(!json.includes('ns-model-selector'), 'no picker without models');
  assert(json.includes('ns-prompt-input__field'), 'field still present');
});

Deno.test('PromptInput field CSS auto-grows with the existing height bounds', () => {
  const css = FRESH_UI_REGISTRY_CONTENT['registry/components/ui/prompt-input.css'];
  assert(css.includes('field-sizing: content;'), 'textarea uses CSS-native auto-grow');
  assert(css.includes('min-height: var(--ns-control-h);'), 'one-line minimum remains');
  assert(css.includes('max-height: 12rem;'), 'growth cap remains');
});
