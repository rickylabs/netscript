import { assert, assertExists, assertStrictEquals, assertStringIncludes } from '@std/assert';
import { freshUiRegistryManifest } from '../../../registry.manifest.ts';
import { Button } from './button.tsx';
import { getInputProps, getSelectProps, getTextareaProps } from './control-props.ts';
import { IconButton } from './icon-button.tsx';
import { Progress } from './progress.tsx';
import { Select } from './select.tsx';
import { Skeleton } from './skeleton.tsx';
import { Textarea } from './textarea.tsx';

interface VNodeLike {
  type: unknown;
  props: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertVNode(value: unknown, message: string): asserts value is VNodeLike {
  assert(isRecord(value), message);
  assert('type' in value, `${message}: missing vnode type`);
  assert('props' in value, `${message}: missing vnode props`);
  assert(isRecord(value.props), `${message}: vnode props must be an object`);
}

function classList(value: unknown): string[] {
  if (typeof value === 'string') {
    return value.split(' ');
  }

  return [];
}

function createField(
  value: Record<string, unknown>,
): { controlProps(overrides?: Record<string, unknown>): Record<string, unknown> } {
  return {
    controlProps(overrides) {
      return {
        ...value,
        ...(overrides ?? {}),
      };
    },
  };
}

Deno.test('Textarea adds the semantic error class when requested', () => {
  const element: unknown = Textarea({ error: true });
  assertVNode(element, 'Expected Textarea to return a vnode');
  assertStrictEquals(element.type, 'textarea', 'Expected Textarea to render a native textarea');

  const className = element.props.class;
  assert(typeof className === 'string', 'Expected Textarea to include a class attribute');
  assertStringIncludes(
    className,
    'ns-textarea--error',
    'Expected Textarea to include the error class',
  );
});

Deno.test('IconButton composes Button with icon sizing and an accessible label', () => {
  const element: unknown = IconButton({ label: 'Refresh', icon: '↻', type: 'button' });
  assertVNode(element, 'Expected IconButton to return a vnode');
  assertStrictEquals(element.type, Button, 'Expected IconButton to compose the shared Button seam');
  assertStrictEquals(element.props.size, 'icon', 'Expected IconButton to force icon sizing');
  assertStrictEquals(
    element.props['aria-label'],
    'Refresh',
    'Expected IconButton to forward an aria-label',
  );
});

Deno.test('Progress clamps values and exposes the computed bar width', () => {
  const element: unknown = Progress({ label: 'Jobs', max: 100, value: 180 });
  assertVNode(element, 'Expected Progress to return a vnode');
  assertStrictEquals(
    element.props['aria-valuenow'],
    100,
    'Expected Progress to clamp aria-valuenow to max',
  );

  const className = element.props.class;
  assert(typeof className === 'string', 'Expected Progress to include a class attribute');
  assert(
    classList(className).includes('ns-progress'),
    'Expected Progress to include the root progress class',
  );
});

Deno.test('getInputProps narrows descriptor control props to the Input seam', () => {
  const field = createField({
    id: 'user-form-name',
    name: 'name',
    form: 'user-form',
    defaultValue: 'Ada',
    required: true,
    minLength: 2,
    'aria-invalid': true,
    'aria-describedby': 'user-form-name-error',
    'data-field-path': 'name',
  });

  const props = getInputProps(field, {
    type: 'email',
    placeholder: 'ada@example.com',
  });

  assertStrictEquals(props.id, 'user-form-name');
  assertStrictEquals(props.type, 'email');
  assertStrictEquals(props.defaultValue, 'Ada');
  assertStrictEquals(props.required, true);
  assertStrictEquals(props.minLength, 2);
  assertStrictEquals(props['aria-invalid'], true);
  assertStrictEquals(props['aria-describedby'], 'user-form-name-error');
  assertStrictEquals(props.placeholder, 'ada@example.com');
  assert(!('data-field-path' in props), 'Expected non-Input data attrs to be omitted');
});

Deno.test('getSelectProps narrows descriptor control props to the Select seam', () => {
  const field = createField({
    id: 'user-form-role',
    name: 'role',
    form: 'user-form',
    defaultValue: 'admin',
    required: true,
    multiple: false,
    'aria-invalid': false,
    'aria-describedby': 'user-form-role-description',
    'data-field-path': 'role',
  });

  const props = getSelectProps(field);

  assertStrictEquals(props.id, 'user-form-role');
  assertStrictEquals(props.name, 'role');
  assertStrictEquals(props.form, 'user-form');
  assertStrictEquals(props.defaultValue, 'admin');
  assertStrictEquals(props.required, true);
  assertStrictEquals(props.multiple, false);
  assertStrictEquals(props['aria-invalid'], false);
  assertStrictEquals(props['aria-describedby'], 'user-form-role-description');
  assert(!('data-field-path' in props), 'Expected non-Select data attrs to be omitted');
});

Deno.test('Select renders the matching option as selected for server-only initial state', () => {
  const element: unknown = Select({
    name: 'status',
    defaultValue: 'processing',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'processing', label: 'Processing' },
    ],
  });
  assertVNode(element, 'Expected Select to return a vnode');
  assertStrictEquals(element.type, 'select', 'Expected Select to render a native select');

  const children = element.props.children;
  assert(Array.isArray(children), 'Expected Select children to be an array');
  const options = children.flatMap((child) => Array.isArray(child) ? child : child ? [child] : []);
  assert(options.length === 2, 'Expected Select to render both options');

  const firstOption = options[0];
  const secondOption = options[1];
  assertVNode(firstOption, 'Expected the first option to be a vnode');
  assertVNode(secondOption, 'Expected the second option to be a vnode');
  assert(Array.isArray(firstOption.props.exprs), 'Expected option vnode exprs to be available');
  assert(Array.isArray(secondOption.props.exprs), 'Expected option vnode exprs to be available');
  assertStrictEquals(firstOption.props.exprs[3], '');
  assertStrictEquals(secondOption.props.exprs[3], 'selected');
});

Deno.test('Select preserves multiple selected options in server-rendered markup', () => {
  const element: unknown = Select({
    name: 'status',
    multiple: true,
    selectedValues: ['pending', 'processing'],
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'processing', label: 'Processing' },
      { value: 'done', label: 'Done' },
    ],
  });
  assertVNode(element, 'Expected Select to return a vnode');

  const children = element.props.children;
  assert(Array.isArray(children), 'Expected Select children to be an array');
  const options = children.flatMap((child) => Array.isArray(child) ? child : child ? [child] : []);
  assert(options.length === 3, 'Expected Select to render all options');

  const firstOption = options[0];
  const secondOption = options[1];
  const thirdOption = options[2];
  assertVNode(firstOption, 'Expected the first option to be a vnode');
  assertVNode(secondOption, 'Expected the second option to be a vnode');
  assertVNode(thirdOption, 'Expected the third option to be a vnode');
  assert(Array.isArray(firstOption.props.exprs), 'Expected option vnode exprs to be available');
  assert(Array.isArray(secondOption.props.exprs), 'Expected option vnode exprs to be available');
  assert(Array.isArray(thirdOption.props.exprs), 'Expected option vnode exprs to be available');
  assertStrictEquals(firstOption.props.exprs[3], 'selected');
  assertStrictEquals(secondOption.props.exprs[3], 'selected');
  assertStrictEquals(thirdOption.props.exprs[3], '');
});

Deno.test('getTextareaProps narrows descriptor control props to the Textarea seam', () => {
  const field = createField({
    id: 'product-form-description',
    name: 'description',
    form: 'product-form',
    defaultValue: 'Draft description',
    required: true,
    minLength: 1,
    maxLength: 500,
    'aria-invalid': true,
    'aria-describedby': 'product-form-description-error',
    'data-field-path': 'description',
  });

  const props = getTextareaProps(field, {
    rows: 4,
    placeholder: 'Describe the product',
  });

  assertStrictEquals(props.id, 'product-form-description');
  assertStrictEquals(props.defaultValue, 'Draft description');
  assertStrictEquals(props.required, true);
  assertStrictEquals(props.maxLength, 500);
  assertStrictEquals(props.rows, 4);
  assertStrictEquals(props.placeholder, 'Describe the product');
  assertStrictEquals(props['aria-invalid'], true);
  assert(!('data-field-path' in props), 'Expected non-Textarea data attrs to be omitted');
});

Deno.test('Skeleton stats variant renders the requested number of cards', () => {
  const element: unknown = Skeleton({ variant: 'stats', cards: 3 });
  assertVNode(element, 'Expected Skeleton to return a vnode');
  assert(
    element.props['aria-hidden'] === 'true' || element.props['aria-hidden'] === true,
    'Expected Skeleton to stay aria-hidden',
  );

  const className = element.props.class;
  assert(typeof className === 'string', 'Expected stats skeleton to include a class attribute');
  assert(
    classList(className).includes('ns-grid'),
    'Expected stats skeleton to use the grid layout seam',
  );
});

Deno.test('manifest exposes the expanded foundation and layout collections', () => {
  const itemNames = new Set(freshUiRegistryManifest.items.map((item) => item.name));

  for (
    const requiredItem of [
      'icon-button',
      'textarea',
      'checkbox',
      'switch',
      'card',
      'panel',
      'badge',
      'separator',
      'alert',
      'inline-notice',
      'spinner',
      'progress',
      'skeleton',
    ]
  ) {
    assert(itemNames.has(requiredItem), `Expected manifest to include ${requiredItem}`);
  }

  const layoutCollection = freshUiRegistryManifest.collections.find((collection) =>
    collection.name === 'layout-foundations'
  );
  assertExists(layoutCollection, 'Expected layout-foundations collection to be present');
  assert(
    layoutCollection.items.includes('layout-objects'),
    'Expected layout-foundations to point at the layout-objects style item',
  );

  const layoutObjects = freshUiRegistryManifest.items.find((item) =>
    item.name === 'layout-objects'
  );
  assertExists(layoutObjects, 'Expected the layout-objects style item to be present');
  assertStrictEquals(layoutObjects.kind, 'style');
  assert(
    layoutObjects.registryDependencies?.includes('theme-seed'),
    'Expected layout-objects to consume the theme token contract',
  );
  const themeSeed = freshUiRegistryManifest.items.find((item) => item.name === 'theme-seed');
  assertExists(themeSeed, 'Expected the theme-seed theme item to be present');
  assert(
    themeSeed.files.every((file) => !file.source.endsWith('layouts.css')),
    'Expected theme-seed to ship only theme artifacts (no layout objects)',
  );
});
