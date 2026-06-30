import { assert } from '@std/assert';
import { Dropzone } from '../../../../registry/components/ui/dropzone.tsx';

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

Deno.test('Dropzone renders a label target with default copy + icon', () => {
  const v = Dropzone({});
  assert(classes(vnodeProps(v).class).includes('ns-dropzone'), 'base class');
  const json = JSON.stringify(v);
  assert(json.includes('ns-dropzone__icon'), 'icon');
  assert(json.includes('ns-dropzone__label'), 'label');
  assert(json.includes('Drop files or click to upload'), 'default label');
});

Deno.test('Dropzone shows hint + active state and keeps children (file input)', () => {
  const v = Dropzone({ hint: 'PDF, max 20MB', active: true });
  assert(vnodeProps(v)['data-active'] === '', 'active reflected');
  const json = JSON.stringify(v);
  assert(json.includes('ns-dropzone__hint'), 'hint part');
  assert(json.includes('PDF, max 20MB'), 'hint text');
});
