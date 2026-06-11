import { assertStrictEquals } from '@std/assert';
import { Show, SrOnly, VisuallyHidden } from './primitives.tsx';

interface VNodeLike {
  type: unknown;
  props: Record<string, unknown>;
}

function asVNode(value: unknown): VNodeLike {
  return value as VNodeLike;
}

Deno.test('VisuallyHidden renders a visually hidden span without dropping caller props', () => {
  const element = asVNode(VisuallyHidden({ id: 'label', children: 'Hidden label' }));

  assertStrictEquals(element.type, 'span');
  assertStrictEquals(element.props.id, 'label');
  assertStrictEquals(element.props.children, 'Hidden label');

  const style = element.props.style as Record<string, unknown>;
  assertStrictEquals(style.position, 'absolute');
  assertStrictEquals(style.width, 1);
  assertStrictEquals(style.height, 1);
  assertStrictEquals(style.overflow, 'hidden');
  assertStrictEquals(style.whiteSpace, 'nowrap');
});

Deno.test('SrOnly is an alias for the visually hidden primitive', () => {
  const element = asVNode(SrOnly({ children: 'Screen reader copy' }));

  assertStrictEquals(element.type, 'span');
  assertStrictEquals(element.props.children, 'Screen reader copy');
});

Deno.test('VisuallyHidden can be used as a JSX component', () => {
  const element = asVNode(<VisuallyHidden id='jsx-label'>JSX label</VisuallyHidden>);

  assertStrictEquals(element.type, VisuallyHidden);
  assertStrictEquals(element.props.id, 'jsx-label');
  assertStrictEquals(element.props.children, 'JSX label');
});

Deno.test('Show renders children only when the condition is truthy', () => {
  assertStrictEquals(Show({ when: false, fallback: 'empty', children: 'visible' }), 'empty');
  assertStrictEquals(Show({ when: true, children: 'visible' }), 'visible');
});

Deno.test('Show supports render functions with the truthy value', () => {
  const result = Show({
    when: { count: 3 },
    children: (value) => `count:${value.count}`,
  });

  assertStrictEquals(result, 'count:3');
});
