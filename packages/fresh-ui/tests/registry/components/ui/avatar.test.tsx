import { assert, assertEquals } from '@std/assert';
import { Avatar } from '../../../../registry/components/ui/avatar.tsx';

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

Deno.test('Avatar sets role + aria-label, defaults to md, derives initials', () => {
  const p = vnodeProps(Avatar({ name: 'Sylvain Dupont' }));
  assertEquals(p.role, 'img');
  assertEquals(p['aria-label'], 'Sylvain Dupont');
  const cls = classes(p.class);
  assert(cls.includes('ns-avatar'), 'base class');
  assert(cls.includes('ns-avatar--md'), 'default size');
  assert(!cls.includes('ns-avatar--agent'), 'no agent by default');
  assertEquals((p.children as unknown[])[0], 'SD');
});

Deno.test('Avatar honors explicit initials, agent, size, and presence', () => {
  const p = vnodeProps(
    Avatar({ name: 'VIF Agent', initials: 'AI', agent: true, size: 'lg', presence: 'online' }),
  );
  const cls = classes(p.class);
  assert(cls.includes('ns-avatar--lg'), 'size lg');
  assert(cls.includes('ns-avatar--agent'), 'agent fill');
  const kids = p.children as Array<unknown>;
  assertEquals(kids[0], 'AI');
  const dot = kids[1] as VNodeLike;
  assert(dot && typeof dot === 'object', 'presence dot vnode');
  const dotJson = JSON.stringify(dot);
  assert(dotJson.includes('ns-avatar__presence'), 'presence dot class');
  assert(dotJson.includes('online'), 'presence state value present');
});

Deno.test('Avatar single-word name yields two letters', () => {
  const p = vnodeProps(Avatar({ name: 'Eisberg' }));
  assertEquals((p.children as unknown[])[0], 'EI');
});
