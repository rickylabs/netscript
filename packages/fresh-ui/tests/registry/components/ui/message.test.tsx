import { assert } from '@std/assert';
import { Message, renderInline, TypingIndicator } from '../../../../registry/components/ui/message.tsx';

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

Deno.test('renderInline produces multiple nodes for bold/code/citation markup', () => {
  const nodes = renderInline('Use **gateway** `replay()` per [1] and [2].');
  assert(Array.isArray(nodes) && nodes.length > 1, 'splits into multiple nodes');
  const json = JSON.stringify(nodes);
  assert(json.includes('gateway'), 'bold content');
  assert(json.includes('replay()'), 'code content');
});

Deno.test('Message renders assistant prose with author, model, body, follow-ups, actions', () => {
  const v = Message({
    message: {
      role: 'assistant',
      author: { name: 'VIF Agent', agent: true },
      time: '12:04',
      model: 'opus-4.8',
      body: 'Mapped **PROSCO** to the gateway [1].',
      followups: ['Show lineage', 'Replay job'],
    },
  });
  const cls = classes(vnodeProps(v).class);
  assert(cls.includes('ns-message'), 'base class');
  assert(cls.includes('ns-message--assistant'), 'role modifier');
  const json = JSON.stringify(v);
  assert(json.includes('VIF Agent'), 'author');
  assert(json.includes('opus-4.8'), 'model');
  assert(json.includes('ns-message__body'), 'body');
  assert(json.includes('Show lineage'), 'follow-up chip');
  assert(json.includes('ns-msg-action'), 'hover actions');
});

Deno.test('Message applies user + system role modifiers', () => {
  const user = Message({ message: { role: 'user', author: { name: 'Eric' }, body: 'hi' } });
  assert(classes(vnodeProps(user).class).includes('ns-message--user'), 'user modifier');
  const system = Message({ message: { role: 'system', author: { name: 'sys' }, body: 'joined' } });
  assert(classes(vnodeProps(system).class).includes('ns-message--system'), 'system modifier');
});

Deno.test('TypingIndicator renders the typing seam with a status role', () => {
  const json = JSON.stringify(TypingIndicator());
  assert(json.includes('ns-typing'), 'typing class');
  assert(json.includes('status'), 'status role');
});
