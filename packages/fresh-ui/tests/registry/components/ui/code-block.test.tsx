import { assert } from '@std/assert';
import { CodeBlock } from '../../../../registry/components/ui/code-block.tsx';

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

Deno.test('CodeBlock renders chrome with filename, lang, copy, and code', () => {
  const v = CodeBlock({ code: 'const x = 1;', filename: 'gateway.ts', lang: 'ts' });
  assert(classes(vnodeProps(v).class).includes('ns-code'), 'base class');
  const json = JSON.stringify(v);
  assert(json.includes('gateway.ts'), 'filename rendered');
  assert(json.includes('ns-code__lang'), 'lang part rendered');
  assert(json.includes('ns-code__copy'), 'copy affordance rendered');
  assert(json.includes('const x = 1;'), 'code rendered');
});

Deno.test('CodeBlock omits name/lang when not provided but keeps copy', () => {
  const json = JSON.stringify(CodeBlock({ code: 'x' }));
  assert(!json.includes('ns-code__name'), 'no filename part');
  assert(!json.includes('ns-code__lang'), 'no lang part');
  assert(json.includes('ns-code__copy'), 'copy always present');
});
