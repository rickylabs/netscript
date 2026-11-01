import { assert, assertEquals } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
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
  assertEquals(p['data-size'], 'md');
  assertEquals(p['data-content'], 'initials');
  assert(render(Avatar({ name: 'Sylvain Dupont' })).includes('>SD</span>'));
});

Deno.test('Avatar honors explicit initials, agent, size, and presence', () => {
  const p = vnodeProps(
    Avatar({ name: 'VIF Agent', initials: 'AI', agent: true, size: 'lg', presence: 'online' }),
  );
  assertEquals(p['data-size'], 'lg');
  assertEquals(p['data-content'], 'agent');
  // Inspect rendered parts: optional image/fallback children need not occupy fixed VNode slots.
  for (const src of [undefined, 'avatar.png']) {
    const html = render(
      Avatar({ name: 'VIF Agent', initials: 'AI', agent: true, presence: 'online', src }),
    );
    assert(html.includes('>AI</span>'), 'explicit initials');
    assert(html.includes('class="ns-avatar__presence"'), 'presence dot class');
    assert(html.includes('data-part="presence"'), 'presence part');
    assert(html.includes('data-presence="online"'), 'presence state');
  }
});

Deno.test('Avatar single-word name yields two letters', () => {
  assert(render(Avatar({ name: 'Eisberg' })).includes('>EI</span>'));
});
