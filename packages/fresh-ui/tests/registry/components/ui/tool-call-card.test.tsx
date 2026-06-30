import { assert } from '@std/assert';
import { ToolCallCard } from '../../../../registry/components/ui/tool-call-card.tsx';

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

Deno.test('ToolCallCard renders name, status badge, and IO panel', () => {
  const v = ToolCallCard({
    name: 'mcp.legacy_archeo.query',
    args: '{"sql":"SELECT 1"}',
    result: '[{"n":1}]',
    status: 'done',
    defaultOpen: true,
  });
  assert(classes(vnodeProps(v).class).includes('ns-tool-call'), 'base class');
  assert(vnodeProps(v)['data-status'] === 'done', 'status reflected');
  const json = JSON.stringify(v);
  assert(json.includes('mcp.legacy_archeo.query'), 'tool name');
  assert(json.includes('Done'), 'status badge label');
  assert(json.includes('SELECT 1'), 'args rendered');
  assert(json.includes('ns-tool-call__panel'), 'panel rendered');
});

Deno.test('ToolCallCard reflects running vs done status', () => {
  const running = JSON.stringify(ToolCallCard({ name: 'x.y', status: 'running' }));
  assert(running.includes('Running'), 'running badge');
  const done = JSON.stringify(ToolCallCard({ name: 'x.y', status: 'done' }));
  assert(done.includes('Done') && !done.includes('Running'), 'done badge, not running');
});

Deno.test('ToolCallCard error status marks the card', () => {
  const v = ToolCallCard({ name: 'x.y', status: 'error', result: 'boom' });
  assert(vnodeProps(v)['data-status'] === 'error');
  assert(JSON.stringify(v).includes('Error'), 'error badge');
});
