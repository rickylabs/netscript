import { assert } from '@std/assert';
import { Search } from '../../../../registry/components/ui/search.tsx';

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

Deno.test('Search renders a button styled as an input with placeholder and ⌘K hint', () => {
  const v = Search({ placeholder: 'Search the gateway…', shortcut: '⌘K' });
  assert(classes(vnodeProps(v).class).includes('ns-search'), 'base class');
  assert(vnodeProps(v).type === 'button', 'native button element');
  const json = JSON.stringify(v);
  assert(json.includes('ns-search__icon'), 'search icon');
  assert(json.includes('Search the gateway…'), 'placeholder label');
  assert(json.includes('ns-kbd') && json.includes('⌘K'), 'kbd hint');
});

Deno.test('Search omits the kbd hint when shortcut is empty', () => {
  const json = JSON.stringify(Search({ shortcut: '' }));
  assert(!json.includes('ns-kbd'), 'no kbd without shortcut');
  assert(json.includes('ns-search__label'), 'label still present');
});

Deno.test('Search accepts a custom class merged via cn()', () => {
  const v = Search({ class: 'w-64' });
  const list = classes(vnodeProps(v).class);
  assert(list.includes('ns-search') && list.includes('w-64'), 'merged classes');
});
