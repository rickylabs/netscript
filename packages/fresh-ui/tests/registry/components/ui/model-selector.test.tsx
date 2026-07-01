import { assert } from '@std/assert';
import { ModelSelector } from '../../../../registry/components/ui/model-selector.tsx';

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

const MODELS = [
  { id: 'opus', label: 'Opus 4.8', provider: 'Anthropic', desc: 'Most capable' },
  { id: 'sonnet', label: 'Sonnet 4.6', provider: 'Anthropic', desc: 'Fast + smart' },
];

Deno.test('ModelSelector renders a details disclosure with the current model', () => {
  const v = ModelSelector({ value: 'sonnet', models: MODELS });
  assert(classes(vnodeProps(v).class).includes('ns-model-selector'), 'base class');
  const json = JSON.stringify(v);
  assert(json.includes('Sonnet 4.6'), 'current label in trigger');
  assert(json.includes('ns-model-selector__menu'), 'menu rendered');
  assert(json.includes('ns-model-opt'), 'options rendered');
  assert(json.includes('Most capable'), 'option desc rendered');
});

Deno.test('ModelSelector marks the selected option active + alignment', () => {
  const v = ModelSelector({ value: 'opus', models: MODELS, align: 'right' });
  assert(vnodeProps(v)['data-align'] === 'right', 'align passed through');
  const json = JSON.stringify(v);
  assert(json.includes('is-active'), 'selected option active');
  assert(json.includes('aria-selected'), 'options expose aria-selected');
});

Deno.test('ModelSelector falls back to the first model when value is unknown', () => {
  const json = JSON.stringify(ModelSelector({ value: 'nope', models: MODELS }));
  assert(json.includes('Opus 4.8'), 'first model shown as current');
});
