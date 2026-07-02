import { assert } from '@std/assert';
import { FRESH_UI_REGISTRY_CONTENT } from '../../../../registry.generated.ts';
import { PromptInput } from '../../../../registry/components/ui/prompt-input.tsx';

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

const MODELS = [{ id: 'opus', label: 'Opus 4.8', provider: 'Anthropic' }];

Deno.test('PromptInput renders a form with field, pills, and send', () => {
  const v = PromptInput({ placeholder: 'Ask the gateway…', models: MODELS, model: 'opus' });
  assert(classes(vnodeProps(v).class).includes('ns-prompt-input'), 'base class');
  const json = JSON.stringify(v);
  assert(json.includes('ns-prompt-input__field'), 'textarea field');
  assert(json.includes('Ask the gateway…'), 'placeholder');
  assert(json.includes('Deep research') && json.includes('Grounding'), 'toggle pills');
  assert(json.includes('ns-prompt-input__send'), 'send button');
});

Deno.test('PromptInput wires aria-pressed toggle pills', () => {
  const json = JSON.stringify(PromptInput({ grounding: true, research: false }));
  assert(json.includes('aria-pressed'), 'pills expose aria-pressed');
  assert(json.includes('Deep research') && json.includes('Grounding'), 'both toggle pills');
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
