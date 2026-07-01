import { assertStrictEquals } from '@std/assert';
import { Icon, ICON_PATHS, type IconProps, Show, SrOnly, VisuallyHidden } from '../primitives.tsx';

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

Deno.test('Icon renders a decorative token-driven stroke SVG', () => {
  const element = asVNode(Icon({ name: 'check', size: 20, class: 'ns-icon' }));

  assertStrictEquals(element.type, 'svg');
  assertStrictEquals(element.props.class, 'ns-icon');
  assertStrictEquals(element.props.width, 20);
  assertStrictEquals(element.props.height, 20);
  assertStrictEquals(element.props.fill, 'none');
  assertStrictEquals(element.props.stroke, 'currentColor');
  assertStrictEquals(element.props['stroke-width'], 'var(--ns-icon-stroke-width, 2)');
  assertStrictEquals(element.props['aria-hidden'], true);

  const children = element.props.children as unknown[];
  const path = asVNode(children[1]);
  assertStrictEquals(path.type, 'path');
  assertStrictEquals(path.props.d, ICON_PATHS.check[0]);
});

Deno.test('Icon renders an accessible title when provided', () => {
  const element = asVNode(<Icon name='search' size='1.25rem' title='Search' />);

  assertStrictEquals(element.type, Icon);
  assertStrictEquals(element.props.name, 'search');
  assertStrictEquals(element.props.size, '1.25rem');
  assertStrictEquals(element.props.title, 'Search');

  const rendered = asVNode(Icon(element.props as IconProps));
  assertStrictEquals(rendered.props.role, 'img');
  assertStrictEquals(rendered.props['aria-hidden'], undefined);

  const children = rendered.props.children as unknown[];
  const title = asVNode(children[0]);
  const path = asVNode(children[1]);
  assertStrictEquals(title.type, 'title');
  assertStrictEquals(title.props.children, 'Search');
  assertStrictEquals(path.props.d, ICON_PATHS.search[0]);
});

// @ts-expect-error fill is package-token driven, not caller-overridable.
Icon({ name: 'check', fill: 'red' });

// @ts-expect-error stroke is package-token driven, not caller-overridable.
Icon({ name: 'check', stroke: 'red' });

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
